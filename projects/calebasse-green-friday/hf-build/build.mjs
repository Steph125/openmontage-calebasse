// Calebasse · Green Friday — HyperFrames builds (A and C).
// Same art direction, beats and timings as the Remotion compositions (SceneA.tsx / SceneC.tsx).
// Characters are posed on twos and written as timeline sets; everything else is native GSAP tweening.
// Usage: node build.mjs   → writes ../hf-a/index.html and ../hf-c/index.html (+ copies assets)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PROJ = path.resolve(HERE, "..");
const PRODUCTS = JSON.parse(fs.readFileSync(path.join(PROJ, "artifacts", "products.json"), "utf-8")).products;

// ------------------------------------------------------------------ palette & geometry (mirror of shared.tsx)
const C = {
  cream: "#F7F5EE", sand: "#F2E9D4", floor: "#ECE6D6", forest: "#0D3B2E", forest2: "#0A2C22", green: "#1F6B4A",
  lime: "#C9EC7A", limeDeep: "#A9D25A", coral: "#BF4E39", ink: "#14271F", mute: "#4F6357", line: "#E2E8DF",
  onDark: "#D3E3D8", black: "#0E0F0E", alu: "#BAC4BE", aluDark: "#8E9A93",
};
const FONT = "PoppinsGF";
const W = 1080, H = 1920, FPS = 30;
const FLOOR_Y = 1606;
const PHONE = { x: 240, y: 360, w: 600, h: 1232, r: 92, bezel: 18 };
const SCREEN = { x: 258, y: 378, w: 564, h: 1196, r: 74 };
const STAGE = { s: 0.92, ty: -20 };
const stageX = (x) => W / 2 + (x - W / 2) * STAGE.s;
const stageY = (y) => y * STAGE.s + STAGE.ty;
const STATUS_H = 128;

// ------------------------------------------------------------------ delivery formats
// The 9:16 master IS the design frame (1080×1920, output of `stage`). Every other format shows a window of
// that frame, scaled uniformly (never stretched): `k` = scale, `top` = first frame row shown. Only the end
// card is re-laid out (a compact lockup under the floor, or a brand panel beside the stage for landscape).
// Where the window is narrower than the canvas, actors that walk in/out wait further off-stage so they are
// never seen standing in the margins; their stride cadence is scaled by the same ratio so feet don't skate.
const MASTER = { key: "1080x1920", master: true, w: W, h: H, offL: -160, offR: W + 160, drag: 1050, cadC: 1, cadA: 1 };
const FORMAT_SPECS = [
  { key: "1080x1350", w: 1080, h: 1350, k: 0.95, top: 277, end: "lockup", u: 1.12, res: "portrait" },
  { key: "1080x1080", w: 1080, h: 1080, k: 0.75, top: 279, end: "lockup", u: 1, res: "square" },
  { key: "1200x628", w: 1200, h: 628, k: 0.459, top: 272, end: "panel", res: "landscape" },
];
const TILE_REACH = 133, PEEK = 18.4; // half carried tile + margin (stage px); in-frame peek of the master (frame px)
const fxInv = (fx) => W / 2 + (fx - W / 2) / STAGE.s; // frame x → stage x
const resolveFormat = (spec) => {
  const ox = spec.end === "panel" ? spec.w - W * spec.k : (spec.w - W * spec.k) / 2;
  const oy = -spec.top * spec.k;
  const visL = spec.end === "panel" ? ox : 0; // the landscape panel hides everything left of the frame
  const offL = Math.min(-160, Math.floor(fxInv((visL - ox) / spec.k + PEEK) - TILE_REACH));
  const offR = Math.max(W + 160, Math.ceil(fxInv((spec.w - ox) / spec.k - PEEK) + TILE_REACH));
  const drag = Math.max(1050, Math.ceil(fxInv((spec.w - ox) / spec.k + 4) - 140)); // pile's left edge clears the canvas
  const cadC = Math.max((405 - offL) / 565, (offR - 675) / 565);
  return { ...spec, ox, oy, offL, offR, drag, cadC, cadA: drag / 1050 };
};
const FORMATS = [MASTER, ...FORMAT_SPECS.map(resolveFormat)];

// ------------------------------------------------------------------ math
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const mix = (a, b, t) => a + (b - a) * t;
const prog = (f, a, b) => clamp((f - a) / (b - a));
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOut = (t) => 1 - Math.pow(1 - t, 3);
const easeIn = (t) => t * t * t;
const deg = (r) => (r * 180) / Math.PI;
const rad = (d) => (d * Math.PI) / 180;
const lerpPt = (a, b, t) => ({ x: mix(a.x, b.x, t), y: mix(a.y, b.y, t) });
const quad = (a, c, b, t) => ({
  x: (1 - t) * (1 - t) * a.x + 2 * (1 - t) * t * c.x + t * t * b.x,
  y: (1 - t) * (1 - t) * a.y + 2 * (1 - t) * t * c.y + t * t * b.y,
});
const r1 = (v) => Math.round(v * 10) / 10;
const sec = (f) => Math.round((f / FPS) * 10000) / 10000;

// ------------------------------------------------------------------ rig / IK (mirror of shared.tsx)
const SH = { B: { x: -9, y: -198 }, F: { x: 13, y: -198 } };
const HIP = { B: { x: -8, y: -112 }, F: { x: 10, y: -112 } };
const ARM = [54, 52];
const LEG = [58, 56];
const LEAN_PIVOT = { x: 0, y: -112 };
const rotAround = (p, c, a) => {
  const s = Math.sin(a), co = Math.cos(a);
  return { x: c.x + (p.x - c.x) * co - (p.y - c.y) * s, y: c.y + (p.x - c.x) * s + (p.y - c.y) * co };
};
const ik = (j, t, l1, l2, bend) => {
  let dx = t.x - j.x, dy = t.y - j.y;
  let d = Math.hypot(dx, dy);
  const maxD = l1 + l2 - 0.5;
  if (d > maxD) { dx *= maxD / d; dy *= maxD / d; d = maxD; }
  d = Math.max(d, Math.abs(l1 - l2) + 1);
  const phi = Math.atan2(dy, dx);
  const a = Math.acos(clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1));
  const th1 = phi - bend * a;
  const ex = j.x + l1 * Math.cos(th1), ey = j.y + l1 * Math.sin(th1);
  const th2 = Math.atan2(j.y + dy - ey, j.x + dx - ex);
  return { r1: deg(th1 - Math.PI / 2), r2: deg(th2 - th1) };
};
const toLocal = (rig, p, inTorso) => {
  let q = { x: ((p.x - rig.x) / rig.s) * rig.facing, y: (p.y - rig.y) / rig.s - (rig.bob ?? 0) };
  if (inTorso) q = rotAround(q, LEAN_PIVOT, -rad(rig.lean));
  return q;
};
const reach = (rig, side, p, bend = 1) => ik(SH[side], toLocal(rig, p, true), ARM[0], ARM[1], bend);
const swing = (f1, f2 = 0) => ({ r1: -f1, r2: -f2 });
const STAND = { legB: { r1: 4, r2: -2 }, legF: { r1: -4, r2: 2 } };
const walkLegs = (ph) => ({
  legB: swing(24 * Math.sin(ph), -18 * Math.max(0, Math.cos(ph))),
  legF: swing(-24 * Math.sin(ph), -18 * Math.max(0, -Math.cos(ph))),
});
const tipFor = (a, contact, head) => {
  const dx = contact.x - a.x, dy = contact.y - a.y;
  const d = Math.hypot(dx, dy) || 1;
  const k = head === "roller" ? 40 : 48;
  return { x: contact.x - (dx / d) * k, y: contact.y - (dy / d) * k };
};

// ------------------------------------------------------------------ markup helpers
const css = (o) => Object.entries(o).map(([k, v]) => `${k.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase())}:${typeof v === "number" && !/opacity|weight|lineheight|zindex|flex/i.test(k) ? v + "px" : v}`).join(";");
const shade = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgb(${Math.round(((n >> 16) & 255) * 0.78)},${Math.round(((n >> 8) & 255) * 0.78)},${Math.round((n & 255) * 0.78)})`;
};
const LOOKS = {
  ladderL: { skin: "#F0C6A2", suit: C.forest, hat: "cap", extra: "mustache" },
  ladderR: { skin: "#8D5A3B", suit: C.forest, hat: "beanie", extra: "none" },
  roller: { skin: "#C98E68", suit: C.green, hat: "cap", extra: "beard" },
  brush: { skin: "#E7B48F", suit: C.green, hat: "beanie", extra: "ponytail" },
};

const segSvg = (id, w, l, fill, inner) =>
  `<g id="${id}"><rect x="${-w / 2}" y="${-w / 4}" width="${w}" height="${l + w / 2}" rx="${w / 2}" fill="${fill}"/>${inner}</g>`;
const armSvg = (p, at, look, front) =>
  `<g transform="translate(${at.x} ${at.y})">` +
  segSvg(`${p}1`, 19, ARM[0], front ? C.sand : "#E4D9BF",
    `<g transform="translate(0 ${ARM[0]})">` + segSvg(`${p}2`, 16, ARM[1] - 8, look.skin, `<circle cx="0" cy="${ARM[1] - 4}" r="10.5" fill="${front ? C.lime : C.limeDeep}"/>`) + `</g>`) +
  `</g>`;
const legSvg = (p, at, look, front) => {
  const col = front ? look.suit : shade(look.suit);
  return `<g transform="translate(${at.x} ${at.y})">` +
    segSvg(`${p}1`, 25, LEG[0], col,
      `<g transform="translate(0 ${LEG[0]})">` + segSvg(`${p}2`, 23, LEG[1] - 6, col,
        `<g transform="translate(0 ${LEG[1] - 4})"><g id="${p}3"><rect x="-12" y="-6" width="36" height="16" rx="7" fill="${C.ink}"/></g></g>`) + `</g>`) +
    `</g>`;
};
const headSvg = (id, look) => {
  let s = `<g id="${id}" transform="translate(2 -236)">`;
  if (look.extra === "ponytail") s += `<path d="M-26 -6 C -48 2 -50 26 -36 40 C -34 22 -28 10 -18 4 Z" fill="#3A2A20"/>`;
  s += `<circle cx="0" cy="0" r="30" fill="${look.skin}"/><circle cx="-24" cy="3" r="7" fill="${look.skin}"/>`;
  s += `<circle cx="10" cy="-2" r="3.6" fill="${C.ink}"/><circle cx="22" cy="-2" r="3.6" fill="${C.ink}"/>`;
  s += `<path d="M10 12 Q 17 18 24 11" stroke="${C.ink}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
  s += `<circle cx="4" cy="9" r="5" fill="#E9A08A" opacity="0.45"/>`;
  if (look.extra === "mustache") s += `<path d="M8 8 Q 17 3 27 8 Q 20 12 8 8 Z" fill="#3A2A20"/>`;
  if (look.extra === "beard") s += `<path d="M-14 8 Q -10 34 12 32 Q 28 30 30 10 Q 22 24 8 22 Q -6 22 -14 8 Z" fill="#2E241D"/>`;
  if (look.hat === "cap") {
    s += `<path d="M-31 -6 C -30 -36 -10 -44 4 -44 C 22 -44 32 -32 31 -8 Z" fill="${C.lime}"/>`;
    s += `<path d="M2 -12 L 50 -10 C 52 -4 46 -1 38 -2 L 0 -4 Z" fill="${C.forest}"/><rect x="-31" y="-12" width="62" height="7" rx="3" fill="${C.forest}"/>`;
  } else {
    s += `<path d="M-32 -2 C -32 -40 -6 -46 4 -46 C 24 -46 34 -32 32 -2 Z" fill="${C.lime}"/>`;
    s += `<rect x="-33" y="-10" width="66" height="12" rx="6" fill="${C.limeDeep}"/><circle cx="0" cy="-48" r="7" fill="${C.limeDeep}"/>`;
  }
  return s + `</g>`;
};
const torsoSvg = (look) => {
  const d = shade(look.suit);
  return `<rect x="-27" y="-214" width="56" height="44" rx="20" fill="${C.sand}"/>` +
    `<rect x="-29" y="-196" width="60" height="94" rx="18" fill="${look.suit}"/>` +
    `<rect x="-17" y="-202" width="36" height="40" rx="8" fill="${d}"/>` +
    `<rect x="-10" y="-192" width="22" height="14" rx="4" fill="${C.lime}" opacity="0.9"/>` +
    `<line x1="-14" y1="-214" x2="-12" y2="-196" stroke="${d}" stroke-width="7" stroke-linecap="round"/>` +
    `<line x1="16" y1="-214" x2="14" y2="-196" stroke="${d}" stroke-width="7" stroke-linecap="round"/>` +
    `<rect x="-29" y="-122" width="60" height="14" rx="5" fill="${d}"/>`;
};
/** Worker markup with stable ids; `mid` is markup drawn between the body and the front arm (world coords). */
const workerSvg = (id, look, s, shadow, mid = "") =>
  (shadow ? `<ellipse id="${id}-sh" cx="0" cy="0" rx="${44 * s}" ry="${9 * s}" fill="rgba(20,39,31,0.22)"/>` : "") +
  `<g id="${id}-a">` + legSvg(`${id}-lB`, HIP.B, look, false) +
  `<g id="${id}-t">` + armSvg(`${id}-aB`, SH.B, look, false) + torsoSvg(look) + headSvg(`${id}-h`, look) + `</g>` +
  legSvg(`${id}-lF`, HIP.F, look, true) + `</g>` +
  mid +
  `<g id="${id}-b"><g id="${id}-t2">` + armSvg(`${id}-aF`, SH.F, look, true) + `</g></g>`;
const poleSvg = (id, head) =>
  `<g id="${id}"><line id="${id}-l1" x1="0" y1="0" x2="0" y2="0" stroke="#C9A876" stroke-width="9" stroke-linecap="round"/>` +
  `<line id="${id}-l2" x1="0" y1="0" x2="0" y2="0" stroke="#E2C99C" stroke-width="3" stroke-linecap="round"/>` +
  `<g id="${id}-hd">` +
  (head === "roller"
    ? `<line x1="0" y1="0" x2="0" y2="-28" stroke="${C.aluDark}" stroke-width="5" stroke-linecap="round"/><rect x="-23" y="-54" width="46" height="28" rx="12" fill="${C.lime}"/><rect x="-19" y="-51" width="38" height="7" rx="3.5" fill="#FFFFFF" opacity="0.4"/>`
    : `<rect x="-9" y="-20" width="18" height="20" rx="3" fill="${C.alu}"/><path d="M-11 -20 L 11 -20 L 8 -48 Q 0 -56 -8 -48 Z" fill="${C.forest}"/><path d="M-7 -40 Q 0 -60 7 -40 Q 0 -46 -7 -40 Z" fill="${C.lime}"/>`) +
  `</g></g>`;

/** Per-step attribute values for one worker. */
const workerAttrs = (id, rig, pose, shadow) => {
  const out = {};
  const bobY = (pose.bob ?? 0) * rig.s;
  const root = `translate(${r1(rig.x)} ${r1(rig.y + bobY)}) scale(${rig.facing * rig.s} ${rig.s})`;
  out[`${id}-a`] = { transform: root };
  out[`${id}-b`] = { transform: root };
  out[`${id}-t`] = { transform: `rotate(${r1(pose.lean)} 0 -112)` };
  out[`${id}-t2`] = { transform: `rotate(${r1(pose.lean)} 0 -112)` };
  out[`${id}-h`] = { transform: `translate(2 -236) rotate(${r1(pose.head)})` };
  for (const [k, limb] of [["aB", pose.armB], ["aF", pose.armF]]) {
    out[`${id}-${k}1`] = { transform: `rotate(${r1(limb.r1)})` };
    out[`${id}-${k}2`] = { transform: `rotate(${r1(limb.r2)})` };
  }
  for (const [k, limb] of [["lB", pose.legB], ["lF", pose.legF]]) {
    out[`${id}-${k}1`] = { transform: `rotate(${r1(limb.r1)})` };
    out[`${id}-${k}2`] = { transform: `rotate(${r1(limb.r2)})` };
    out[`${id}-${k}3`] = { transform: `rotate(${r1(-limb.r1 - limb.r2)})` };
  }
  if (shadow) out[`${id}-sh`] = { cx: r1(rig.x), cy: r1(rig.y + 8 * rig.s) };
  return out;
};
const poleAttrs = (id, a, b) => {
  const ang = deg(Math.atan2(b.y - a.y, b.x - a.x));
  const L = { x1: r1(a.x), y1: r1(a.y), x2: r1(b.x), y2: r1(b.y) };
  return { [`${id}-l1`]: L, [`${id}-l2`]: L, [`${id}-hd`]: { transform: `translate(${r1(b.x)} ${r1(b.y)}) rotate(${r1(ang + 90)})` } };
};

/** Collects sets on twos, dropping unchanged values. */
class Track {
  constructor() { this.last = {}; this.sets = []; }
  push(f, attrs, kind = "attr") {
    for (const [id, v] of Object.entries(attrs)) {
      const key = kind + ":" + id;
      const sv = JSON.stringify(v);
      if (this.last[key] === sv) continue;
      this.last[key] = sv;
      this.sets.push([sec(f), id, kind === "attr" ? 0 : 1, v]);
    }
  }
}

// ------------------------------------------------------------------ static set pieces
const ladderSvg = (side) => {
  const m = (x) => (side === 1 ? x : W - x);
  const a0 = { x: m(70), y: 1652 }, a1 = { x: m(178), y: 430 }, b0 = { x: m(150), y: 1652 }, b1 = { x: m(237), y: 430 };
  let s = `<ellipse cx="${(a0.x + b0.x) / 2}" cy="1656" rx="70" ry="9" fill="rgba(20,39,31,0.18)"/>`;
  for (let k = 1; k <= 11; k++) {
    const y = 1652 - k * 104, t = (1652 - y) / (1652 - 430);
    const xa = mix(a0.x, a1.x, t), xb = mix(b0.x, b1.x, t);
    s += `<line x1="${r1(xa)}" y1="${y}" x2="${r1(xb)}" y2="${y}" stroke="${C.aluDark}" stroke-width="9" stroke-linecap="round"/>`;
    s += `<line x1="${r1(xa)}" y1="${y - 2}" x2="${r1(xb)}" y2="${y - 2}" stroke="#DCE3DE" stroke-width="3" stroke-linecap="round"/>`;
  }
  for (const [p, q] of [[a0, a1], [b0, b1]]) {
    s += `<line x1="${p.x}" y1="${p.y}" x2="${q.x}" y2="${q.y}" stroke="${C.aluDark}" stroke-width="15" stroke-linecap="round"/>`;
    s += `<line x1="${p.x - 2}" y1="${p.y}" x2="${q.x - 2}" y2="${q.y}" stroke="${C.alu}" stroke-width="9" stroke-linecap="round"/>`;
    s += `<line x1="${p.x - 4}" y1="${p.y}" x2="${q.x - 4}" y2="${q.y}" stroke="#E6ECE8" stroke-width="2.5" stroke-linecap="round"/>`;
    s += `<rect x="${p.x - 12}" y="${p.y - 8}" width="24" height="14" rx="5" fill="${C.ink}"/>`;
  }
  return s;
};

const studioHtml = () =>
  `<div style="${css({ position: "absolute", inset: 0, background: `radial-gradient(120% 70% at 50% 38%, #FBFAF5 0%, ${C.cream} 55%, #EFEBDF 100%)` })}"></div>` +
  `<div style="${css({ position: "absolute", left: 0, right: 0, top: stageY(FLOOR_Y) - 40, bottom: 0, background: `linear-gradient(180deg, rgba(236,230,214,0) 0px, ${C.floor} 60px, #E6DFCC 100%)` })}"></div>` +
  `<div style="${css({ position: "absolute", left: stageX(PHONE.x - 40), width: (PHONE.w + 80) * STAGE.s, top: stageY(FLOOR_Y) - 22, height: 48, borderRadius: "50%", background: "radial-gradient(closest-side, rgba(20,39,31,0.30), rgba(20,39,31,0))" })}"></div>`;

/** Same studio, widened left/right so it fills canvases wider than the scaled frame (geometry in px = identical look). */
const studioWideHtml = () =>
  `<div style="${css({ position: "absolute", left: -2000, top: 0, width: W + 4000, height: H, background: `radial-gradient(${W * 1.2}px ${H * 0.7}px at ${2000 + W / 2}px ${r1(H * 0.38)}px, #FBFAF5 0%, ${C.cream} 55%, #EFEBDF 100%)` })}"></div>` +
  `<div style="${css({ position: "absolute", left: -2000, width: W + 4000, top: stageY(FLOOR_Y) - 40, height: H - (stageY(FLOOR_Y) - 40), background: `linear-gradient(180deg, rgba(236,230,214,0) 0px, ${C.floor} 60px, #E6DFCC 100%)` })}"></div>` +
  `<div style="${css({ position: "absolute", left: stageX(PHONE.x - 40), width: (PHONE.w + 80) * STAGE.s, top: stageY(FLOOR_Y) - 22, height: 48, borderRadius: "50%", background: "radial-gradient(closest-side, rgba(20,39,31,0.30), rgba(20,39,31,0))" })}"></div>`;

const phoneShell = (screenInner, glareId) =>
  `<div style="${css({ position: "absolute", left: PHONE.x, top: PHONE.y, width: PHONE.w, height: PHONE.h, borderRadius: PHONE.r, background: `linear-gradient(135deg, #2A3B33 0%, ${C.ink} 35%, #0B1511 100%)`, boxShadow: "inset 0 0 0 3px #3B4C44, inset 0 0 0 7px #0B1511, 0 30px 60px rgba(20,39,31,0.18)" })}"></div>` +
  [[-6, 300, 120], [-6, 450, 80], [PHONE.w, 340, 160]].map(([dx, dy, h]) => `<div style="${css({ position: "absolute", left: PHONE.x + dx, top: PHONE.y + dy, width: 7, height: h, borderRadius: 4, background: "#26352E" })}"></div>`).join("") +
  `<div style="${css({ position: "absolute", left: SCREEN.x, top: SCREEN.y, width: SCREEN.w, height: SCREEN.h, borderRadius: SCREEN.r, overflow: "hidden", background: "#FFFFFF" })}">` +
  screenInner +
  `<div style="${css({ position: "absolute", left: SCREEN.w / 2 - 78, top: 16, width: 156, height: 42, borderRadius: 21, background: "#060A08" })}"></div>` +
  `<div id="${glareId}" style="${css({ position: "absolute", top: 0, left: -700, width: 520, height: SCREEN.h, background: "linear-gradient(115deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.38) 50%, rgba(255,255,255,0) 100%)" })}"></div>` +
  `</div>`;

const statusBar = () =>
  `<div data-layout-ignore style="${css({ position: "absolute", left: 0, top: 0, width: SCREEN.w, height: STATUS_H, background: "#FFFFFF" })}">` +
  `<div style="${css({ height: 66, display: "flex", alignItems: "flex-end", justifyContent: "space-between", padding: "0 40px 8px", fontFamily: FONT, fontWeight: 600, fontSize: 22, color: C.ink, boxSizing: "border-box" })}"><span>9:41</span>` +
  `<span style="display:flex;gap:8px;align-items:center"><span style="width:26px;height:14px;display:inline-flex;gap:3px;align-items:flex-end">` +
  [5, 8, 11, 14].map((h) => `<span style="width:4px;height:${h}px;background:${C.ink};border-radius:1px"></span>`).join("") +
  `</span><span style="width:34px;height:16px;border:2px solid ${C.ink};border-radius:5px;display:inline-block;position:relative"><span style="position:absolute;left:2px;top:2px;width:22px;height:8px;background:${C.ink};border-radius:2px"></span></span></span></div>` +
  `<div style="padding:6px 22px 10px"><div style="${css({ height: 46, borderRadius: 23, background: "#EEF1EC", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, fontFamily: FONT, fontWeight: 500, fontSize: 19, color: C.ink })}">` +
  `<svg width="14" height="17" viewBox="0 0 14 17"><rect x="1" y="7" width="12" height="9" rx="2" fill="${C.ink}"/><path d="M4 7 V5 a3 3 0 0 1 6 0 V7" stroke="${C.ink}" stroke-width="2" fill="none"/></svg>calebasse.com</div></div></div>`;

/** "BLACK FRIDAY" eyebrow, lime strike through BLACK, GREEN stamped above at −7°. */
const eyebrow = (idp, size, strikeOn, greenOn) =>
  `<div style="${css({ display: "flex", alignItems: "center", gap: size * 0.7, fontFamily: FONT, fontWeight: 600, fontSize: size, letterSpacing: "0.18em", color: C.lime, textTransform: "uppercase" })}">` +
  `<span style="${css({ width: size * 0.55, height: size * 0.55, borderRadius: "50%", background: C.lime, display: "inline-block" })}"></span><span>` +
  `<span style="position:relative;display:inline-block;color:rgba(255,255,255,0.82)">Black` +
  `<span id="${idp}-strike" style="${css({ position: "absolute", display: "block", left: -3, right: -3, top: "50%", height: Math.max(3, size * 0.22), borderRadius: 2, background: C.lime, ...(strikeOn ? { transform: "rotate(-7deg)" } : {}), transformOrigin: "left center" })}"></span>` +
  `<span id="${idp}-green" style="${css({ position: "absolute", display: "block", left: -2, bottom: "100%", marginBottom: 1, fontSize: "1.55em", fontWeight: 800, letterSpacing: "0.12em", color: C.lime, whiteSpace: "nowrap", ...(greenOn ? { transform: "rotate(-7deg)" } : {}), transformOrigin: "left bottom" })}">Green</span>` +
  `</span> Friday</span></div>`;

const endCard = () =>
  `<div style="${css({ position: "absolute", left: 0, right: 0, top: stageY(FLOOR_Y) + 40, display: "flex", flexDirection: "column", alignItems: "center", fontFamily: FONT })}">` +
  `<div id="ec-logo" style="opacity:0"><img src="brand/logo_color.svg" style="height:66px;display:block"/></div>` +
  `<div id="ec-title" style="${css({ opacity: 0, marginTop: 18, fontWeight: 700, fontSize: 40, color: C.forest, letterSpacing: "-0.01em" })}">Green Friday <span style="color:${C.green};font-weight:600">· du 20 au 30 novembre</span></div>` +
  `<div id="ec-url" style="${css({ opacity: 0, marginTop: 6, fontWeight: 600, fontSize: 30, color: C.green })}">calebasse.com</div>` +
  `<div id="ec-fine" style="${css({ opacity: 0, marginTop: 16, fontWeight: 400, fontSize: 19, color: C.mute })}">*Jusqu’à -70 % sur une sélection de matériel MTC, dans la limite des stocks.</div></div>`;

/** Feed formats (4:5, 1:1): compact lockup under the ladder feet — logo | title + dates·url, fine print below. */
const LADDER_FOOT_FY = 1513; // frame y of the ladder-foot shadows
const lockupCard = (F) => {
  const u = F.u, z0 = F.k * (LADDER_FOOT_FY - F.top);
  return `<div style="${css({ position: "absolute", left: 0, top: r1(z0), width: F.w, height: r1(F.h - z0), display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: FONT })}">` +
    `<div style="${css({ display: "flex", alignItems: "center" })}">` +
    `<div id="ec-logo" style="${css({ opacity: 0, display: "flex", alignItems: "center", gap: r1(26 * u) })}"><img src="brand/logo_color.svg" style="height:${r1(44 * u)}px;display:block"/>` +
    `<span style="${css({ display: "block", width: 2, height: r1(58 * u), background: "rgba(13,59,46,0.22)", marginRight: r1(26 * u) })}"></span></div>` +
    `<div style="${css({ display: "flex", flexDirection: "column", alignItems: "flex-start" })}">` +
    `<div id="ec-title" style="${css({ opacity: 0, fontWeight: 700, fontSize: r1(32 * u), lineHeight: 1.15, color: C.forest, letterSpacing: "-0.01em", whiteSpace: "nowrap" })}">Green Friday</div>` +
    `<div id="ec-url" style="${css({ opacity: 0, marginTop: r1(4 * u), fontWeight: 600, fontSize: r1(21 * u), lineHeight: 1.25, color: C.green, whiteSpace: "nowrap" })}">du 20 au 30 novembre · calebasse.com</div>` +
    `</div></div>` +
    `<div id="ec-fine" style="${css({ opacity: 0, marginTop: r1(12 * u), fontWeight: 400, fontSize: r1(16 * u), color: C.mute, whiteSpace: "nowrap" })}">*Jusqu’à -70 % sur une sélection de matériel MTC, dans la limite des stocks.</div></div>`;
};

/** Landscape: forest brand panel left of the stage (also the wing actors enter from). Logo holds centred,
 *  then rises as the end-card copy arrives. PANEL_LOGO_DY = (stack height − logo height) / 2. */
const PANEL_LOGO_DY = 146;
const panelCard = (F) =>
  `<div id="panel" style="${css({ position: "absolute", left: 0, top: 0, width: r1(F.ox), height: F.h, background: C.forest, overflow: "hidden", fontFamily: FONT })}">` +
  `<div style="${css({ position: "absolute", right: "-28%", top: "-55%", width: "85%", aspectRatio: "1 / 1", borderRadius: "50%", background: "radial-gradient(closest-side, rgba(201,236,122,0.16), rgba(201,236,122,0))" })}"></div>` +
  `<div style="${css({ position: "absolute", left: 0, top: 0, width: r1(F.ox), height: F.h, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" })}">` +
  `<div id="pl-logo"><img src="brand/logo_ivory.svg" style="height:54px;display:block"/></div>` +
  `<div id="ec-title" style="${css({ opacity: 0, marginTop: 34, fontWeight: 800, fontSize: 68, lineHeight: 1, color: C.lime, letterSpacing: "-0.02em", whiteSpace: "nowrap" })}">Green Friday</div>` +
  `<div id="ec-date" style="${css({ opacity: 0, marginTop: 14, fontWeight: 600, fontSize: 30, lineHeight: 1.2, color: "#FFFFFF", whiteSpace: "nowrap" })}">du 20 au 30 novembre</div>` +
  `<div id="ec-url" style="${css({ opacity: 0, marginTop: 22, padding: "10px 26px", borderRadius: 999, background: C.lime, color: C.forest, fontWeight: 700, fontSize: 24, lineHeight: 1.2 })}">calebasse.com</div>` +
  `<div id="ec-fine" style="${css({ opacity: 0, marginTop: 26, maxWidth: 500, fontWeight: 400, fontSize: 15, lineHeight: 1.45, color: C.onDark })}">*Jusqu’à -70 % sur une sélection de matériel MTC, dans la limite des stocks.</div>` +
  `</div></div>`;

/** End-card tweens from frame f0 (master + lockup share the master's timing exactly). */
const endTweens = (F, f0) => {
  if (F.end === "panel")
    return [
      `tl.fromTo("#pl-logo", { opacity: 0, y: ${PANEL_LOGO_DY} }, { opacity: 1, y: ${PANEL_LOGO_DY}, duration: 0.6, ease: "power2.out" }, 0.15);`,
      `tl.fromTo("#pl-logo", { y: ${PANEL_LOGO_DY} }, { y: 0, duration: 0.7, ease: "power3.inOut", immediateRender: false }, ${sec(f0 - 4)});`,
      ...["ec-title", "ec-date", "ec-url", "ec-fine"].map((id, i) => `tl.fromTo("#${id}", { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.5, ease: "power3.out", immediateRender: false }, ${sec(f0 + [3, 5, 7, 10][i])});`),
    ].join("\n      ");
  return ["ec-logo", "ec-title", "ec-url", "ec-fine"].map((id, i) => `tl.fromTo("#${id}", { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.5, ease: "power3.out", immediateRender: false }, ${sec(f0 + [0, 5, 5, 10][i])});`).join("\n      ");
};

const productCard = (p, idp) =>
  `<div style="${css({ width: 254, background: "#FFFFFF", borderRadius: 20, boxShadow: "0 6px 18px rgba(13,59,46,0.10)", overflow: "hidden", fontFamily: FONT })}">` +
  `<div style="position:relative;width:254px;height:228.6px;background:#FFFFFF"><img src="${p.image}" style="width:100%;height:100%;object-fit:cover;display:block"/>` +
  `<div id="${idp}-pill" style="${css({ position: "absolute", left: 12, top: 12, padding: "5px 12px", borderRadius: 999, background: C.coral, color: "#FFFFFF", fontWeight: 600, fontSize: 19, transformOrigin: "left top" })}">${p.pill}</div></div>` +
  `<div style="padding:10px 14px 16px"><div style="${css({ fontWeight: 600, fontSize: 20, lineHeight: 1.2, color: C.ink, height: 48, overflow: "hidden" })}">${p.name}</div>` +
  `<div style="${css({ fontWeight: 400, fontSize: 15, color: C.mute, marginTop: 2 })}">${p.sub}</div>` +
  `<div style="display:flex;align-items:baseline;gap:10px;margin-top:8px"><span style="position:relative;font-size:16px;color:#5E6B64;font-weight:500">${p.before}` +
  `<span id="${idp}-strike" style="position:absolute;display:block;left:-2px;right:-2px;top:54%;height:2.5px;background:#5E6B64;transform-origin:left center"></span></span>` +
  `<span style="font-size:25px;color:${C.green};font-weight:700">${p.now}</span></div></div></div>`;

const tileHtml = (p, idp, showPill) =>
  `<div style="${css({ width: 254, height: 262, background: "#FFFFFF", borderRadius: 20, boxShadow: "0 6px 18px rgba(13,59,46,0.12)", overflow: "hidden", fontFamily: FONT })}">` +
  `<div style="position:relative;height:152px;background:#FFFFFF"><img src="${p.image}" style="width:100%;height:100%;object-fit:contain;display:block"/>` +
  `<div ${idp ? `id="${idp}-pill"` : ""} style="${css({ position: "absolute", left: 12, top: 12, padding: "5px 12px", borderRadius: 999, background: C.coral, color: "#FFFFFF", fontWeight: 600, fontSize: 19, ...(idp ? {} : { transform: `scale(${showPill ? 1 : 0})` }), transformOrigin: "left top" })}">${p.pill}</div></div>` +
  `<div style="padding:8px 14px 0"><div style="${css({ fontWeight: 600, fontSize: 18, lineHeight: 1.22, color: C.ink, height: 44, overflow: "hidden" })}">${p.name}</div>` +
  `<div style="display:flex;align-items:baseline;gap:10px;margin-top:8px"><span style="position:relative;font-size:16px;color:#5E6B64;font-weight:500">${p.before}` +
  `<span ${idp ? `id="${idp}-strike"` : ""} style="position:absolute;display:block;left:-2px;right:-2px;top:54%;height:2.5px;background:#5E6B64;${idp ? "" : "transform:scaleX(0);"}transform-origin:left center"></span></span>` +
  `<span style="font-size:26px;color:${C.green};font-weight:700">${p.now}</span></div></div></div>`;

const page = ({ id, duration, stage, after = "", script }) => `<!doctype html>
<html lang="fr" data-resolution="portrait">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1080, height=1920" />
    <title>Calebasse · Green Friday (${id})</title>
    <script src="gsap.min.js"></script>
    <style>
${[400, 500, 600, 700, 800].map((w) => `      @font-face { font-family: ${FONT}; src: url("fonts/Poppins-${w}.woff2") format("woff2"); font-weight: ${w}; font-style: normal; font-display: block; }`).join("\n")}
      html, body { margin: 0; width: 1080px; height: 1920px; overflow: hidden; background: ${C.cream}; }
      #root { position: relative; width: 1080px; height: 1920px; overflow: hidden; }
      #scene { position: absolute; left: 0; top: 0; width: 1080px; height: 1920px; overflow: hidden; }
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="${id}" data-start="0" data-duration="${duration}" data-width="1080" data-height="1920">
      <div id="scene" class="clip" data-start="0" data-duration="${duration}" data-track-index="0">
        ${studioHtml()}
        <div id="stage" style="${css({ position: "absolute", left: 0, top: 0, width: W, height: H, transform: `translate(${(W / 2) * (1 - STAGE.s)}px, ${STAGE.ty}px) scale(${STAGE.s})`, transformOrigin: "0 0" })}">
${stage}
        </div>
        ${after}
      </div>
    </div>
    <script>
${script}
    </script>
  </body>
</html>
`;

// Struck reference prices: #5E6B64 passes AA at master size, but scaled down (k ≤ 0.95) antialiasing drops the
// measured ratio to ~4.35:1, so the scaled formats use a slightly deeper grey.
const PRICE_GREY_SCALED = "#525E58";
/** Non-master formats: the 9:16 frame (studio widened + stage) placed by a static transform, end card re-laid out. */
const pageFmt = (F, { id, duration, stage, script }) => `<!doctype html>
<html lang="fr" data-resolution="${F.res}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=${F.w}, height=${F.h}" />
    <title>Calebasse · Green Friday (${id})</title>
    <script src="gsap.min.js"></script>
    <style>
${[400, 500, 600, 700, 800].map((w) => `      @font-face { font-family: ${FONT}; src: url("fonts/Poppins-${w}.woff2") format("woff2"); font-weight: ${w}; font-style: normal; font-display: block; }`).join("\n")}
      html, body { margin: 0; width: ${F.w}px; height: ${F.h}px; overflow: hidden; background: ${C.cream}; }
      #root { position: relative; width: ${F.w}px; height: ${F.h}px; overflow: hidden; }
      #scene { position: absolute; left: 0; top: 0; width: ${F.w}px; height: ${F.h}px; overflow: hidden; }
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="${id}" data-start="0" data-duration="${duration}" data-width="${F.w}" data-height="${F.h}">
      <div id="scene" class="clip" data-start="0" data-duration="${duration}" data-track-index="0">
        <div id="frame" style="${css({ position: "absolute", left: 0, top: 0, width: W, height: H, transform: `translate(${r1(F.ox)}px, ${r1(F.oy)}px) scale(${F.k})`, transformOrigin: "0 0" })}">
          ${studioWideHtml()}
          <div id="stage" style="${css({ position: "absolute", left: 0, top: 0, width: W, height: H, transform: `translate(${(W / 2) * (1 - STAGE.s)}px, ${STAGE.ty}px) scale(${STAGE.s})`, transformOrigin: "0 0" })}">
${stage.replaceAll("#5E6B64", PRICE_GREY_SCALED)}
          </div>
        </div>
        ${F.end === "panel" ? panelCard(F) : lockupCard(F)}
      </div>
    </div>
    <script>
${script}
    </script>
  </body>
</html>
`;

/** Timeline script: replays the per-step sets, then the native GSAP tweens. */
const timelineScript = (compId, sets, tweens) => `      window.__timelines = window.__timelines || {};
      const SETS = ${JSON.stringify(sets)};
      const tl = gsap.timeline({ paused: true });
      const byId = {};
      for (const [t, id, kind, v] of SETS) {
        const el = byId[id] || (byId[id] = document.getElementById(id));
        if (!el) continue;
        tl.set(el, kind === 0 ? { attr: v } : v, t);
      }
${tweens}
      window.__timelines["${compId}"] = tl;
      tl.seek(0);`;

// ====================================================================== SCENE A
const buildA = (F) => {
  const DUR = 360;
  const B0 = 220, B1 = 860, BTOP = 470, RELEASE_L = 200, RELEASE_R = 203, GRAV = 4.4, LAND_Y = FLOOR_Y - 104;
  const S0 = { x: 285, y: 837 }, S1 = { x: 795, y: 775 };
  const S_LEN = Math.hypot(S1.x - S0.x, S1.y - S0.y), S_ANG = Math.atan2(S1.y - S0.y, S1.x - S0.x);
  const G0 = { x: 285, y: 710 }, G_ANG = rad(-7), G_W = 446;
  const gWorld = (lx, ly) => ({ x: G0.x + lx * Math.cos(G_ANG) - ly * Math.sin(G_ANG), y: G0.y + lx * Math.sin(G_ANG) + ly * Math.cos(G_ANG) });
  const cornerY = (f, release) => {
    const lift = 10 * easeInOut(prog(f, 186, 199));
    if (f < release) return BTOP - lift;
    const t = f - release;
    return Math.min(BTOP - 10 + 0.5 * GRAV * t * t, LAND_Y);
  };
  const RIG_ROLLER = { x: 330, y: 1745, s: 1.2 }, RIG_BRUSH = { x: 760, y: 1745, s: 1.2 };
  const RIG_LL = { x: 185, y: 716, s: 1, facing: 1, lean: 0 }, RIG_LR = { x: 895, y: 716, s: 1, facing: -1, lean: 0 };
  const DRAG_START = 284, DRAG_END = 322;
  const dragX = (f) => F.drag * easeIn(prog(f, DRAG_START, DRAG_END));
  const rollerState = (wf) => {
    const staffA = { x: RIG_ROLLER.x + 48, y: RIG_ROLLER.y - 7 }, staffC = { x: RIG_ROLLER.x + 48, y: RIG_ROLLER.y - 470 }, paintA = { x: RIG_ROLLER.x + 30, y: RIG_ROLLER.y - 150 };
    let a = staffA, c = staffC, lean = 0, bob = 0, mode = "staff";
    if (wf < 16) { const u = easeInOut(prog(wf, 0, 16)); lean = 16 * u; bob = 8 * u; c = { x: staffC.x - 40 * u, y: staffC.y + 60 * u }; }
    else if (wf < 42) { const u = easeInOut(prog(wf, 16, 42)); mode = "paint"; a = lerpPt(staffA, paintA, u); c = quad({ x: staffC.x - 40, y: staffC.y + 60 }, { x: 120, y: 1130 }, S0, u); lean = mix(16, -8, u); bob = mix(8, 0, u); }
    else if (wf < 94) { const u = easeInOut(prog(wf, 42, 94)); mode = "paint"; a = paintA; c = lerpPt(S0, S1, u); lean = -8 + 4 * Math.sin(u * Math.PI); bob = -2 * Math.sin(u * Math.PI * 3); }
    else if (wf < 122) { const u = easeInOut(prog(wf, 94, 122)); mode = "paint"; a = lerpPt(paintA, staffA, u); c = quad(S1, { x: 640, y: 1150 }, staffC, u); lean = mix(-8, 0, u); }
    else { bob = 1.5 * Math.sin(wf * 0.18); }
    return { a, c, lean, bob, mode };
  };
  const brushState = (wf) => {
    const staffA = { x: RIG_BRUSH.x - 48, y: RIG_BRUSH.y - 7 }, staffC = { x: RIG_BRUSH.x - 48, y: RIG_BRUSH.y - 480 }, paintA = { x: RIG_BRUSH.x - 28, y: RIG_BRUSH.y - 150 };
    let a = staffA, c = staffC, lean = 0, mode = "staff";
    const letterW = G_W / 5;
    if (wf < 96) { lean = 0; }
    else if (wf < 120) { const u = easeInOut(prog(wf, 96, 120)); mode = "paint"; a = lerpPt(staffA, paintA, u); c = quad(staffC, { x: 980, y: 980 }, gWorld(0, -44), u); lean = mix(0, -10, u); }
    else if (wf < 166) { const u = prog(wf, 120, 166); mode = "paint"; a = paintA; const lx = u * G_W; c = gWorld(lx, -44 + 26 * Math.sin((lx / letterW) * Math.PI * 2)); lean = -10 + 3 * Math.sin(u * 20); }
    else if (wf < 190) { const u = easeInOut(prog(wf, 166, 190)); mode = "paint"; a = lerpPt(paintA, staffA, u); c = quad(gWorld(G_W, -44), { x: 1000, y: 1000 }, staffC, u); lean = mix(-10, 0, u); }
    return { a, c, lean, mode };
  };

  const track = new Track();
  const landFrame = RELEASE_R + Math.ceil(Math.sqrt((2 * (LAND_Y - BTOP + 10)) / GRAV));
  for (let wf = 0; wf < DUR; wf += 2) {
    const f = wf;
    const yL = cornerY(f, RELEASE_L), yR = cornerY(f, RELEASE_R);
    const amount = clamp((yL + yR) / 2 - BTOP, 0, 2000);
    const pileH = 16 + 92 * (1 - Math.exp(-amount / 420));
    const squash = f >= landFrame ? 1 - 0.16 * Math.exp(-(f - landFrame) / 5) * Math.cos((f - landFrame) * 0.7) : 1;
    const dx = dragX(f);
    const R = rollerState(wf), Bs = brushState(wf);
    const dragging = f >= DRAG_START - 8;
    const dragU = prog(wf, DRAG_START - 8, DRAG_START);
    const rollerRig = { ...RIG_ROLLER, facing: 1, lean: dragging ? mix(R.lean, 20, dragU) : R.lean, bob: R.bob, x: RIG_ROLLER.x + dx };
    const brushRig = { ...RIG_BRUSH, facing: dragging ? 1 : -1, lean: dragging ? mix(Bs.lean, 20, dragU) : Bs.lean, x: RIG_BRUSH.x + dx };
    const poleFor = (st, head, rig) => {
      let a = st.a, c = st.c;
      if (dragging) { a = { x: rig.x + 48 * rig.facing, y: rig.y - 7 - 30 * dragU }; c = { x: rig.x + 48 * rig.facing, y: rig.y - 470 - 30 * dragU }; }
      return { a, b: tipFor(a, c, head) };
    };
    const rp = poleFor(R, "roller", rollerRig), bp = poleFor(Bs, "brush", brushRig);
    const groundPose = (rig, pole, mode) => {
      const legs = dragging && f >= DRAG_START ? walkLegs(wf * 0.55 * F.cadA) : STAND;
      if (dragging) return { lean: rig.lean, head: 0, armF: reach(rig, "F", lerpPt(pole.a, pole.b, 0.3), 1), armB: reach(rig, "B", { x: rig.x - 34 * rig.facing, y: FLOOR_Y - pileH * squash * 0.7 }, 1), ...legs, bob: rig.bob };
      if (mode === "paint") return { lean: rig.lean, head: -8, armB: reach(rig, "B", lerpPt(pole.a, pole.b, 0.03), 1), armF: reach(rig, "F", lerpPt(pole.a, pole.b, 0.19), 1), ...legs, bob: rig.bob };
      return { lean: rig.lean, head: 0, armF: reach(rig, "F", lerpPt(pole.a, pole.b, 0.3), 1), armB: swing(-8, -20), ...legs, bob: rig.bob };
    };
    const nod = f >= 176 && f < 198 ? 10 * Math.sin(prog(f, 176, 198) * Math.PI * 2) : 0;
    const ladderPose = (rig, corner, rel, rail) => {
      const back = f >= rel ? easeOut(prog(f, rel, rel + 12)) : 0;
      const r2 = { ...rig, lean: -9 * back };
      let armF;
      if (f < rel) armF = reach(r2, "F", corner, 1);
      else if (f >= 326) armF = reach(r2, "F", { x: rig.x + rig.facing * (28 + 22 * Math.sin((wf - 326) * 0.45)), y: rig.y - 330 }, -1);
      else armF = reach(r2, "F", { x: rig.x + rig.facing * 40, y: rig.y - 150 }, 1);
      return { rig: r2, pose: { lean: r2.lean, head: nod * rig.facing + (f >= rel ? -6 : 0), armF, armB: reach(r2, "B", rail, 1), ...STAND } };
    };
    const ll = ladderPose(RIG_LL, { x: B0, y: yL }, RELEASE_L, { x: 162, y: 634 });
    const lr = ladderPose(RIG_LR, { x: B1, y: yR }, RELEASE_R, { x: W - 162, y: 634 });
    track.push(f, workerAttrs("wll", ll.rig, ll.pose, false));
    track.push(f, workerAttrs("wlr", lr.rig, lr.pose, false));
    const rPose = groundPose(rollerRig, rp, dragging ? "staff" : R.mode);
    const bPose = groundPose(brushRig, bp, dragging ? "staff" : Bs.mode);
    track.push(f, workerAttrs("wro", { ...rollerRig, lean: rPose.lean }, rPose, true));
    track.push(f, workerAttrs("wbr", { ...brushRig, lean: bPose.lean }, bPose, true));
    track.push(f, poleAttrs("pro", rp.a, rp.b));
    track.push(f, poleAttrs("pbr", bp.a, bp.b));
  }

  // ---- banner + paint markup (moves as one group; clipped at the floor)
  const PILE_HW = 400, PILE_H = 108;
  const y0 = FLOOR_Y + 10, cx = 540, hw = PILE_HW, h = PILE_H;
  const pileD = `M ${cx - hw} ${y0} C ${cx - hw + 8} ${y0 - h * 0.9} ${cx - hw * 0.62} ${y0 - h * 1.05} ${cx - hw * 0.34} ${y0 - h * 0.82} C ${cx - hw * 0.16} ${y0 - h * 0.62} ${cx - hw * 0.06} ${y0 - h * 1.12} ${cx + hw * 0.2} ${y0 - h * 0.98} C ${cx + hw * 0.42} ${y0 - h * 0.86} ${cx + hw * 0.6} ${y0 - h * 1.02} ${cx + hw * 0.8} ${y0 - h * 0.62} C ${cx + hw * 0.95} ${y0 - h * 0.34} ${cx + hw} ${y0 - 6} ${cx + hw} ${y0} Z`;
  const fold = (k, side) => {
    const s = side === 1 ? 1 : -1, x0 = side === 1 ? B0 : B1;
    return `<path d="M ${x0 + s * (10 + k * 18)} ${BTOP + 8} Q ${x0 + s * (70 + k * 40)} ${BTOP + 160 + k * 60} ${x0 + s * (40 + k * 70)} ${BTOP + 340 + k * 80}" stroke="#262926" stroke-width="5" fill="none" opacity="0.7"/>`;
  };
  const sagTop = `M ${B0} ${BTOP} Q 540 ${BTOP + 26} ${B1} ${BTOP} L ${B1} ${BTOP + 1400} L ${B0} ${BTOP + 1400} Z`;
  const drip = (xd, k) => {
    const px = S0.x + xd * Math.cos(S_ANG) - 16 * Math.sin(S_ANG), py = S0.y + xd * Math.sin(S_ANG) + 16 * Math.cos(S_ANG);
    return `<g id="drip${k}" transform="translate(${r1(px)} ${r1(py)})"><g id="drip${k}-s"><rect x="-4.5" y="0" width="9" height="${k ? 35 : 46}" rx="4.5" fill="${C.lime}"/><circle cx="0" cy="${k ? 37 : 48}" r="7" fill="${C.lime}"/></g></g>`;
  };
  const bannerSvg =
    `<defs><linearGradient id="fabric" x1="${B0}" x2="${B1}" y1="0" y2="0" gradientUnits="userSpaceOnUse">` +
    [["0", "#0B0C0B"], ["0.14", "#171917"], ["0.3", "#0C0D0C"], ["0.52", "#151715"], ["0.7", "#0B0C0B"], ["0.86", "#181A18"], ["1", "#0C0D0C"]].map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join("") +
    `</linearGradient><clipPath id="hangClip" clipPathUnits="userSpaceOnUse"><rect id="hangClipRect" x="0" y="0" width="${W}" height="${FLOOR_Y - 16 * 0.55}"/></clipPath>` +
    `<clipPath id="greenClip" clipPathUnits="userSpaceOnUse"><rect id="greenClipRect" x="-30" y="-150" width="10" height="200"/></clipPath></defs>` +
    `<g id="hang" clip-path="url(#hangClip)"><g id="banner"><g id="bannerSway">` +
    `<path d="${sagTop}" fill="url(#fabric)"/>` + [0, 1, 2].map((k) => fold(k, 1) + fold(k, -1)).join("") +
    `<text x="540" y="860" text-anchor="middle" font-family="${FONT}" font-weight="800" font-size="150" letter-spacing="-6" fill="#FFFFFF">BLACK</text>` +
    `<text x="540" y="1028" text-anchor="middle" font-family="${FONT}" font-weight="800" font-size="150" letter-spacing="-6" fill="#FFFFFF">FRIDAY</text>` +
    `<g transform="translate(${S0.x} ${S0.y}) rotate(${r1(deg(S_ANG))})"><g id="stroke">` +
    `<path d="M 0 -19 L ${r1(S_LEN)} -19 Q ${r1(S_LEN + 12)} 0 ${r1(S_LEN)} 19 L 0 19 Q -12 0 0 -19 Z" fill="${C.lime}"/>` +
    [-11, -2, 9].map((yy, k) => `<line x1="8" y1="${yy}" x2="${r1(S_LEN - 8)}" y2="${yy + (k - 1) * 1.5}" stroke="${k === 1 ? "#E3F7AE" : "#B4DB62"}" stroke-width="2.5" opacity="0.6"/>`).join("") +
    `</g></g>` + drip(150, 0) + drip(392, 1) +
    `<g transform="translate(${G0.x} ${G0.y}) rotate(-7)"><g id="greenWord"><text x="0" y="0" font-family="${FONT}" font-weight="800" font-size="120" letter-spacing="7" fill="${C.lime}" stroke="${C.lime}" stroke-width="2" clip-path="url(#greenClip)">GREEN</text></g></g>` +
    `</g></g></g>` +
    `<g id="pileDrag"><g id="pile"><path d="${pileD}" fill="${C.black}"/>` +
    `<path d="M ${540 - hw * 0.6} ${FLOOR_Y - h * 0.2} Q ${540 - hw * 0.3} ${FLOOR_Y - h * 0.75} ${540 - hw * 0.05} ${FLOOR_Y - h * 0.35}" stroke="#2A2D2A" stroke-width="6" fill="none"/>` +
    `<path d="M ${540 + hw * 0.08} ${FLOOR_Y - h * 0.5} Q ${540 + hw * 0.35} ${FLOOR_Y - h * 0.9} ${540 + hw * 0.62} ${FLOOR_Y - h * 0.3}" stroke="#2A2D2A" stroke-width="6" fill="none"/>` +
    `<path d="M ${540 - hw * 0.2} ${FLOOR_Y + 2} Q 540 ${FLOOR_Y - h * 0.3} ${540 + hw * 0.3} ${FLOOR_Y + 2}" stroke="#232523" stroke-width="5" fill="none"/>` +
    `<path id="pileFleck" d="M ${540 - hw * 0.42} ${FLOOR_Y - h * 0.55} Q ${540 - hw * 0.3} ${FLOOR_Y - h * 0.62} ${540 - hw * 0.12} ${FLOOR_Y - h * 0.52}" stroke="${C.lime}" stroke-width="9" stroke-linecap="round" fill="none" opacity="0"/></g></g>`;

  const pageA =
    `<div id="pageA" style="${css({ position: "absolute", left: 0, top: 0, width: SCREEN.w, paddingTop: STATUS_H, background: "#FFFFFF", opacity: 0 })}">` +
    `<div style="height:7px;background:#AACB55"></div><div style="${css({ height: 82, display: "flex", alignItems: "center", justifyContent: "center", borderBottom: `1px solid ${C.line}` })}"><img src="brand/logo_inline.svg" style="height:40px;display:block"/></div>` +
    `<div id="heroBlockA" style="${css({ position: "relative", overflow: "hidden", background: C.forest, padding: "84px 34px 40px", fontFamily: FONT })}">` +
    `<div style="${css({ position: "absolute", right: "-30%", top: "-40%", width: "90%", aspectRatio: "1 / 1", borderRadius: "50%", background: "radial-gradient(closest-side, rgba(201,236,122,0.18), rgba(201,236,122,0))" })}"></div>` +
    eyebrow("heroA", 19, true, true) +
    `<div style="${css({ color: "#FFFFFF", fontWeight: 600, fontSize: 44, marginTop: 16, lineHeight: 1 })}">Jusqu’à</div>` +
    `<div style="${css({ color: C.lime, fontWeight: 800, fontSize: 150, letterSpacing: "-0.045em", lineHeight: 0.92 })}">-70 %</div>` +
    `<div style="display:flex;align-items:center;gap:12px;margin-top:14px;flex-wrap:wrap"><span style="color:${C.onDark};font-size:21px;font-weight:500">sur une sélection*</span>` +
    `<span style="${css({ background: C.lime, color: C.forest, fontWeight: 700, fontSize: 19, padding: "6px 16px", borderRadius: 999 })}">Du 20 au 30 novembre</span></div></div>` +
    `<div style="${css({ padding: "26px 20px 12px", fontFamily: FONT, display: "flex", alignItems: "baseline", gap: 12 })}"><span style="font-weight:700;font-size:30px;color:${C.forest}">Nos incontournables</span><span style="font-size:17px;color:${C.mute}">Bons plans</span></div>` +
    `<div style="display:grid;grid-template-columns:254px 254px;gap:16px;padding:4px 20px 22px">` + PRODUCTS.slice(0, 4).map((p, i) => productCard(p, `pa${i}`)).join("") + `</div>` +
    `<div style="padding:0 20px 60px"><div style="${css({ height: 64, borderRadius: 14, background: C.forest, color: "#FFFFFF", fontFamily: FONT, fontWeight: 600, fontSize: 22, display: "flex", alignItems: "center", justifyContent: "center" })}">Voir toutes les offres</div></div></div>` +
    statusBar();

  const stage =
    `<svg width="${W}" height="${H}" style="position:absolute;left:0;top:0">${ladderSvg(1)}${ladderSvg(-1)}</svg>` +
    phoneShell(pageA, "glareA") +
    `<svg width="${W}" height="${H}" style="position:absolute;left:0;top:0">` + bannerSvg +
    workerSvg("wll", LOOKS.ladderL, 1, false) + workerSvg("wlr", LOOKS.ladderR, 1, false) +
    workerSvg("wro", LOOKS.roller, 1.2, true, poleSvg("pro", "roller")) + workerSvg("wbr", LOOKS.brush, 1.2, true, poleSvg("pbr", "brush")) +
    `</svg>`;

  const fallDur = Math.sqrt((2 * (LAND_Y - BTOP + 10)) / GRAV); // frames
  const t = (f) => sec(f);
  const tweens = `
      // initial states for SVG groups (GSAP owns their transform attribute)
      gsap.set("#stroke", { scaleX: 0, transformOrigin: "0% 50%" });
      gsap.set(["#drip0-s", "#drip1-s"], { scaleY: 0, transformOrigin: "50% 0%" });
      gsap.set("#pile", { scaleX: 0.825, scaleY: 0.148, svgOrigin: "540 ${FLOOR_Y}" });
      // banner breathing, anticipation lift, gravity fall (power1.in = t²), tilt from the staggered release
      tl.to("#bannerSway", { rotation: 0.35, svgOrigin: "540 ${BTOP}", duration: 0.9, ease: "sine.inOut", yoyo: true, repeat: 5 }, 0);
      tl.to("#banner", { y: -10, duration: ${t(13)}, ease: "power2.inOut" }, ${t(186)});
      tl.to("#banner", { y: ${LAND_Y - BTOP}, duration: ${t(fallDur + 1.5)}, ease: "power1.in" }, ${t(RELEASE_L)});
      tl.to("#banner", { rotation: -2.2, svgOrigin: "540 ${BTOP}", duration: ${t(6)}, ease: "power1.out" }, ${t(RELEASE_L)});
      tl.to("#banner", { rotation: 0, svgOrigin: "540 ${BTOP}", duration: ${t(14)}, ease: "power1.in" }, ${t(RELEASE_L + 6)});
      tl.to("#hangClipRect", { attr: { height: ${r1(FLOOR_Y - PILE_H * 0.55)} }, duration: ${t(fallDur)}, ease: "power1.in" }, ${t(RELEASE_L)});
      tl.to("#pile", { scaleX: 1, scaleY: 0.84, duration: ${t(fallDur + 1.5)}, ease: "power1.in" }, ${t(RELEASE_L)});
      tl.to("#pile", { scaleY: 1, duration: 0.6, ease: "elastic.out(1, 0.32)" }, ${t(landFrame)});
      tl.set("#hang", { opacity: 0 }, ${t(landFrame + 1)});
      tl.set("#pileFleck", { opacity: 0.9 }, ${t(landFrame)});
      tl.to("#pileDrag", { x: ${F.drag}, duration: ${t(DRAG_END - DRAG_START)}, ease: "power2.in" }, ${t(DRAG_START)});
      // paint: roller stroke, drips, brush lettering, pop
      tl.to("#stroke", { scaleX: 1, duration: ${t(52)}, ease: "power2.inOut" }, ${t(42)});
      tl.to("#drip0-s", { scaleY: 1, duration: ${t(28)}, ease: "power2.out" }, ${t(64)});
      tl.to("#drip1-s", { scaleY: 1, duration: ${t(30)}, ease: "power2.out" }, ${t(86)});
      tl.fromTo("#greenClipRect", { attr: { width: 36 } }, { attr: { width: 482 }, duration: ${t(46)}, ease: "none", immediateRender: false }, ${t(120)});
      tl.set("#greenClipRect", { attr: { width: 520 } }, ${t(166)});
      tl.to("#greenWord", { scale: 1.08, transformOrigin: "50% 50%", duration: ${t(6)}, ease: "power2.out", yoyo: true, repeat: 1 }, ${t(166)});
      // phone: glare, scroll, pills, struck reference prices
      tl.fromTo("#glareA", { x: 0 }, { x: 1500, duration: ${t(34)}, ease: "power1.inOut", immediateRender: false }, ${t(228)});
      tl.set("#pageA", { opacity: 1 }, ${t(RELEASE_L)});
      tl.to("#heroBlockA", { opacity: 0, duration: ${t(8)}, ease: "power1.out" }, ${t(292)});
      tl.to("#pageA", { y: -470, duration: ${t(50)}, ease: "power2.inOut" }, ${t(250)});
      ${[0, 1, 2, 3].map((i) => `tl.fromTo("#pa${i}-pill", { scale: 0 }, { scale: 1, duration: ${t(14)}, ease: "back.out(2)" }, ${t(256 + i * 6)});
      tl.fromTo("#pa${i}-strike", { scaleX: 0 }, { scaleX: 1, duration: ${t(14)}, ease: "power2.out" }, ${t(268 + i * 6)});`).join("\n      ")}
      // end card
      ${endTweens(F, 324)}`;
  if (F.master) return page({ id: "gf-a", duration: DUR / FPS, stage, after: endCard(), script: timelineScript("gf-a", track.sets, tweens) });
  const id = `gf-a-${F.key}`;
  return pageFmt(F, { id, duration: DUR / FPS, stage, script: timelineScript(id, track.sets, tweens) });
};

// ====================================================================== SCENE C
const buildC = (F) => {
  const DUR = 450;
  const HERO_H = 232, GRID_TOP = STATUS_H + HERO_H + 12, TILE_W = 254, TILE_H = 262, COL_PITCH = 270, ROW_PITCH = 274, PAD_X = 20;
  const slotScreen = (col, row) => ({ x: PAD_X + col * COL_PITCH, y: GRID_TOP + row * ROW_PITCH });
  const slotCentre = (col, row) => { const s = slotScreen(col, row); return { x: SCREEN.x + s.x + TILE_W / 2, y: SCREEN.y + s.y + TILE_H / 2 }; };
  const GY = 1745, GS = 1.2, CARRY_Y = 1268, OFF_L = F.offL, OFF_R = F.offR;
  const JOBS = [
    { pid: 0, col: 0, row: 2, worker: "L", carry: 30, toss: 54, snap: 64 },
    { pid: 1, col: 1, row: 2, worker: "R", carry: 60, toss: 80, snap: 90 },
    { pid: 2, col: 0, row: 1, worker: "L", carry: 96, toss: 114, snap: 124 },
    { pid: 3, col: 1, row: 1, worker: "R", carry: 126, toss: 144, snap: 154 },
    { pid: 4, col: 0, row: 0, worker: "L", carry: 156, toss: 174, snap: 188 },
    { pid: 5, col: 1, row: 0, worker: "R", carry: 190, toss: 208, snap: 222 },
  ];
  const buildSegs = (side) => {
    const off = side === "L" ? OFF_L : OFF_R, inward = side === "L" ? 1 : -1;
    const segs = [];
    let tt = 0;
    for (const j of JOBS.filter((x) => x.worker === side)) {
      const spot = slotCentre(j.col, j.row).x;
      if (j.carry > tt) segs.push({ a: tt, b: j.carry, x0: off, x1: off, act: "off", face: inward });
      segs.push({ a: j.carry, b: j.toss, x0: off, x1: spot, act: "carry", face: inward, tile: j.pid });
      segs.push({ a: j.toss, b: j.snap + 4, x0: spot, x1: spot, act: "toss", face: inward, tile: j.pid });
      segs.push({ a: j.snap + 4, b: j.snap + 22, x0: spot, x1: off, act: "walk", face: -inward });
      tt = j.snap + 22;
    }
    const look = side === "L" ? 360 : 720, meet = side === "L" ? 468 : 612;
    segs.push({ a: tt, b: 250, x0: off, x1: off, act: "off", face: inward });
    segs.push({ a: 250, b: 270, x0: off, x1: look, act: "walk", face: inward });
    segs.push({ a: 270, b: 330, x0: look, x1: look, act: "look", face: inward });
    segs.push({ a: 330, b: 342, x0: look, x1: meet, act: "walk", face: inward });
    segs.push({ a: 342, b: 362, x0: meet, x1: meet, act: "hi5", face: inward });
    segs.push({ a: 362, b: 392, x0: meet, x1: off, act: "walk", face: -inward });
    segs.push({ a: 392, b: 99999, x0: off, x1: off, act: "off", face: inward });
    return segs;
  };
  const SEGS = { L: buildSegs("L"), R: buildSegs("R") };
  const segAt = (segs, f) => segs.find((s) => f >= s.a && f < s.b) ?? segs[segs.length - 1];
  const xAt = (s, f) => mix(s.x0, s.x1, s.act === "walk" || s.act === "carry" ? easeInOut(prog(f, s.a, s.b)) : 1);
  const tileFlight = (j, f, carrierX, bob) => {
    if (f < j.carry || f >= j.snap) return null;
    if (f < j.toss) return { p: { x: carrierX, y: CARRY_Y + bob }, rot: 2 * Math.sin(f * 0.6), scale: 1.05 };
    const dip = 8 * Math.sin(Math.PI * prog(f, j.toss, j.toss + 5));
    const u = easeOut(prog(f, j.toss + 3, j.snap));
    const from = { x: slotCentre(j.col, j.row).x, y: CARRY_Y + dip }, to = slotCentre(j.col, j.row);
    const ctrl = { x: from.x, y: Math.min(from.y, to.y) - (j.row === 0 ? 170 : j.row === 1 ? 90 : 30) };
    return { p: quad(from, ctrl, to, u), rot: (1 - u) * (j.row === 0 ? -10 : -4), scale: mix(1.05, 1, u) };
  };

  const track = new Track();
  const RIG_LL = { x: 185, y: 716, s: 1, facing: 1, lean: 0 }, RIG_LR = { x: 895, y: 716, s: 1, facing: -1, lean: 0 };
  for (let wf = 0; wf < DUR; wf += 2) {
    const f = wf;
    const ground = (side) => {
      const s = segAt(SEGS[side], wf);
      const x = xAt(s, wf);
      const moving = s.act === "walk" || s.act === "carry";
      const ph = wf * 0.6 * F.cadC;
      const bob = moving ? -3 * Math.abs(Math.sin(ph)) : 0;
      const face = s.face ?? 1;
      const rig = { x, y: GY, s: GS, facing: face, lean: 0, bob };
      const legs = moving ? walkLegs(ph) : STAND;
      let pose = { lean: 0, head: 0, armB: swing(-6, -14), armF: swing(6, -12), ...legs, bob };
      const job = s.tile !== undefined ? JOBS.find((j) => j.pid === s.tile) : undefined;
      if (s.act === "carry" && job) {
        pose = { ...pose, armB: reach(rig, "B", { x: x - 58 * face, y: CARRY_Y + TILE_H / 2 + 10 + bob }, -1), armF: reach(rig, "F", { x: x + 58 * face, y: CARRY_Y + TILE_H / 2 + 10 + bob }, -1) };
      } else if (s.act === "toss" && job) {
        const fl = tileFlight(job, wf, x, 0);
        const up = prog(wf, job.toss + 3, job.toss + 8);
        const handY = fl ? fl.p.y + TILE_H / 2 : CARRY_Y + TILE_H / 2 - 40;
        const hy = mix(CARRY_Y + TILE_H / 2 + 18, Math.max(handY, CARRY_Y - 40), up);
        const y = mix(hy, GY - 330, prog(wf, job.toss + 10, job.snap + 4));
        pose = { ...pose, lean: -6 * up, head: -10, armB: reach(rig, "B", { x: x - 48 * face, y }, -1), armF: reach(rig, "F", { x: x + 48 * face, y }, -1), bob: 6 * Math.sin(Math.PI * prog(wf, job.toss, job.toss + 6)) };
      } else if (s.act === "look") {
        pose = { ...pose, head: -16 + 4 * Math.sin(wf * 0.2) };
      } else if (s.act === "hi5") {
        const lift = Math.sin(Math.PI * clamp(prog(wf, 342, 362) * 1.4));
        pose = { ...pose, head: -6, armF: reach(rig, "F", { x: mix(x + 30 * face, 540, lift), y: mix(GY - 160, GY - 330, lift) }, -1) };
      }
      return { rig: { ...rig, lean: pose.lean, bob: pose.bob }, pose, x };
    };
    const gL = ground("L"), gR = ground("R");
    track.push(f, workerAttrs("wgl", gL.rig, gL.pose, true));
    track.push(f, workerAttrs("wgr", gR.rig, gR.pose, true));
    for (const j of JOBS) {
      const cx = j.worker === "L" ? gL.x : gR.x;
      const bob = (j.worker === "L" ? gL.pose.bob : gR.pose.bob) ?? 0;
      const fl = tileFlight(j, wf, cx, bob * GS);
      track.push(f, { [`fly${j.pid}`]: fl ? { x: r1(fl.p.x - TILE_W / 2), y: r1(fl.p.y - TILE_H / 2), rotation: r1(fl.rot), scale: Math.round(fl.scale * 1000) / 1000, opacity: 1 } : { opacity: 0 } }, "css");
    }
    // ladder workers
    const nod = f >= 286 && f < 306 ? 10 * Math.sin(prog(f, 286, 306) * Math.PI * 2) : 0;
    const tapAt = (t0) => (f >= t0 && f < t0 + 8 ? Math.sin(Math.PI * clamp((f - t0) / 8)) : 0);
    const llHand = (() => {
      const rest = { x: 238, y: 620 };
      const ti = Math.max(tapAt(8), tapAt(18));
      if (ti > 0) return { x: mix(rest.x, 272, ti), y: mix(rest.y, 820, ti) };
      const t5 = tapAt(JOBS[4].snap + 2);
      if (t5 > 0) return { x: mix(rest.x, 300, t5), y: mix(rest.y, 820, t5) };
      if (f >= 404) return { x: RIG_LL.x + 30 + 20 * Math.sin((wf - 404) * 0.45), y: RIG_LL.y - 330 };
      return rest;
    })();
    const wiping = f >= 330 && f < 384;
    const lrHand = (() => {
      const rest = { x: W - 238, y: 620 };
      const t6 = tapAt(JOBS[5].snap + 2);
      if (t6 > 0) return { x: mix(rest.x, 780, t6), y: mix(rest.y, 820, t6) };
      if (wiping) { const a = (wf - 330) * 0.35; return { x: 800 + 26 * Math.cos(a), y: 760 + 60 * Math.sin(a) + 60 * prog(f, 330, 384) }; }
      if (f >= 404) return { x: RIG_LR.x - 30 - 20 * Math.sin((wf - 404) * 0.45), y: RIG_LR.y - 330 };
      return rest;
    })();
    const lp = (rig, hand, rail) => ({ lean: 0, head: nod * rig.facing + (f >= 270 && f < 330 ? 8 : 0), armF: reach(rig, "F", hand, f >= 404 ? -1 : 1), armB: reach(rig, "B", rail, 1), ...STAND });
    track.push(f, workerAttrs("wll", RIG_LL, lp(RIG_LL, llHand, { x: 162, y: 634 }), false));
    track.push(f, workerAttrs("wlr", RIG_LR, lp(RIG_LR, lrHand, { x: W - 162, y: 634 }), false));
    track.push(f, { cloth: wiping ? { x: r1(lrHand.x - 22), y: r1(lrHand.y - 18), transform: `rotate(${r1(12 * Math.sin(wf * 0.35))} ${r1(lrHand.x)} ${r1(lrHand.y)})`, opacity: 1 } : { opacity: 0 } });
  }

  const heroBand =
    `<div style="${css({ position: "absolute", left: 0, top: STATUS_H, width: SCREEN.w, height: HERO_H, background: C.forest, overflow: "hidden", fontFamily: FONT, padding: "66px 30px 0", boxSizing: "border-box" })}">` +
    `<div style="${css({ position: "absolute", right: "-25%", top: "-60%", width: "80%", aspectRatio: "1 / 1", borderRadius: "50%", background: "radial-gradient(closest-side, rgba(201,236,122,0.18), rgba(201,236,122,0))" })}"></div>` +
    eyebrow("heroC", 22, false, false) +
    `<div style="display:flex;align-items:baseline;gap:14px;margin-top:2px"><span style="color:#FFFFFF;font-weight:600;font-size:30px">Jusqu’à</span><span style="color:${C.lime};font-weight:800;font-size:84px;letter-spacing:-0.045em;line-height:1">-70 %</span></div>` +
    `<div style="display:flex;align-items:center;gap:12px"><span style="color:${C.onDark};font-size:18px;font-weight:500">sur une sélection*</span>` +
    `<span style="${css({ background: C.lime, color: C.forest, fontWeight: 700, fontSize: 17, padding: "5px 14px", borderRadius: 999 })}">Du 20 au 30 novembre</span></div></div>`;
  const slots = JOBS.map((j) => {
    const s = slotScreen(j.col, j.row);
    const p = PRODUCTS[j.pid];
    return `<div style="position:absolute;left:${s.x}px;top:${s.y}px;width:${TILE_W}px;height:${TILE_H}px">` +
      `<div id="slot${j.pid}" style="${css({ position: "absolute", left: 0, top: 0, width: TILE_W, height: TILE_H, borderRadius: 20, border: `3px dashed ${C.line}`, background: "#F6F8F3", display: "flex", alignItems: "center", justifyContent: "center", boxSizing: "border-box" })}">` +
      `<div class="plus" style="${css({ width: 54, height: 54, borderRadius: 27, background: C.lime, opacity: 0.55, display: "flex", alignItems: "center", justifyContent: "center", color: C.forest, fontFamily: FONT, fontWeight: 700, fontSize: 36 })}">+</div></div>` +
      `<div id="tile${j.pid}" style="position:absolute;left:0;top:0;opacity:0">${tileHtml(p, `tc${j.pid}`, false)}</div></div>`;
  }).join("");
  const flying = JOBS.map((j) => `<div id="fly${j.pid}" style="position:absolute;left:0;top:0;opacity:0;filter:drop-shadow(0 14px 18px rgba(13,59,46,0.22))">${tileHtml(PRODUCTS[j.pid], null, false)}</div>`).join("");

  const stage =
    `<svg width="${W}" height="${H}" style="position:absolute;left:0;top:0">${ladderSvg(1)}${ladderSvg(-1)}</svg>` +
    phoneShell(`<div style="position:absolute;inset:0;background:#FFFFFF"></div>` + heroBand + slots + statusBar(), "glareC") +
    `<svg width="${W}" height="${H}" style="position:absolute;left:0;top:0">` +
    workerSvg("wll", LOOKS.ladderL, 1, false) +
    workerSvg("wlr", LOOKS.ladderR, 1, false, `<rect id="cloth" x="0" y="0" width="44" height="36" rx="8" fill="${C.lime}" opacity="0"/>`) +
    workerSvg("wgl", LOOKS.roller, 1.2, true) + workerSvg("wgr", LOOKS.brush, 1.2, true) +
    `</svg>` + flying;

  const t = (f) => sec(f);
  const tweens = `
      // empty slots breathe until filled
      tl.to(".plus", { opacity: 0.9, duration: 0.42, ease: "sine.inOut", yoyo: true, repeat: 16 }, 0);
      // each tile snaps into its slot with an elastic settle; pill pops; reference price gets struck
      ${JOBS.map((j) => `tl.set("#slot${j.pid}", { opacity: 0 }, ${t(j.snap)});
      tl.set("#tile${j.pid}", { opacity: 1 }, ${t(j.snap)});
      tl.fromTo("#tile${j.pid}", { scale: 1.07 }, { scale: 1, duration: 0.55, ease: "elastic.out(1, 0.45)", immediateRender: false }, ${t(j.snap)});
      tl.fromTo("#tc${j.pid}-pill", { scale: 0 }, { scale: 1, duration: ${t(12)}, ease: "back.out(2.2)", immediateRender: false }, ${t(j.snap + 3)});
      tl.fromTo("#tc${j.pid}-strike", { scaleX: 0 }, { scaleX: 1, duration: ${t(12)}, ease: "power2.out" }, ${t(j.snap + 10)});`).join("\n      ")}
      // signature echo in the hero: BLACK struck, GREEN stamped
      tl.fromTo("#heroC-strike", { rotation: -7, scaleX: 0 }, { scaleX: 1, rotation: -7, duration: ${t(14)}, ease: "power3.out" }, ${t(272)});
      tl.fromTo("#heroC-green", { rotation: -7, scale: 0 }, { scale: 1, rotation: -7, duration: ${t(14)}, ease: "back.out(2.4)" }, ${t(284)});
      // polish + end card
      tl.fromTo("#glareC", { x: 0 }, { x: 1500, duration: ${t(42)}, ease: "power1.inOut", immediateRender: false }, ${t(334)});
      ${endTweens(F, 394)}`;
  if (F.master) return page({ id: "gf-c", duration: DUR / FPS, stage, after: endCard(), script: timelineScript("gf-c", track.sets, tweens) });
  const id = `gf-c-${F.key}`;
  return pageFmt(F, { id, duration: DUR / FPS, stage, script: timelineScript(id, track.sets, tweens) });
};

// ------------------------------------------------------------------ write projects (+ assets copied as plain files)
const copyAssets = (dir) => {
  for (const sub of ["fonts", "products", "brand"]) {
    const src = path.join(PROJ, "public", sub), dst = path.join(dir, sub);
    fs.mkdirSync(dst, { recursive: true });
    for (const f of fs.readdirSync(src)) fs.writeFileSync(path.join(dst, f), fs.readFileSync(path.join(src, f)));
  }
  fs.writeFileSync(path.join(dir, "gsap.min.js"), fs.readFileSync(path.join(HERE, "gsap.min.js")));
};
// hf-a / hf-c = 9:16 masters (unchanged); hf-a-<W>x<H> / hf-c-<W>x<H> = the other delivery formats.
const only = process.argv[2]; // optional: build a single format key
for (const F of FORMATS.filter((x) => !only || x.key === only)) {
  if (!F.master) console.log(F.key, JSON.stringify({ k: F.k, ox: r1(F.ox), oy: r1(F.oy), offL: F.offL, offR: F.offR, drag: F.drag, cadC: r1(F.cadC * 100) / 100, cadA: r1(F.cadA * 100) / 100 }));
  for (const [base, build] of [["hf-a", buildA], ["hf-c", buildC]]) {
    const name = F.master ? base : `${base}-${F.key}`, html = build(F);
    const dir = path.join(PROJ, name);
    fs.mkdirSync(dir, { recursive: true });
    copyAssets(dir);
    fs.writeFileSync(path.join(dir, "index.html"), html);
    console.log(name, "index.html", (html.length / 1024).toFixed(0), "KB");
  }
}
