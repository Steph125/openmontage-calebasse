// Calebasse · Green Friday — shared, project-local building blocks (hand-authored for this piece).
// Engine idioms only: bundled fonts via FontFace + delayRender, <Img> + staticFile, pure functions of frame.
import React from "react";
import { Img, cancelRender, continueRender, delayRender, staticFile } from "remotion";

// ------------------------------------------------------------------ palette (page --gf-* tokens)
export const C = {
  cream: "#F7F5EE",
  sand: "#F2E9D4",
  floor: "#ECE6D6",
  forest: "#0D3B2E",
  forest2: "#0A2C22",
  green: "#1F6B4A",
  lime: "#C9EC7A",
  limeDeep: "#A9D25A",
  coral: "#BF4E39",
  ink: "#14271F",
  mute: "#4F6357",
  line: "#E2E8DF",
  onDark: "#D3E3D8",
  black: "#0E0F0E",
  alu: "#BAC4BE",
  aluDark: "#8E9A93",
};

// ------------------------------------------------------------------ fonts (bundled Poppins, no network)
export const FONT = "PoppinsGF";
let fontsRequested = false;
const requestFonts = () => {
  if (fontsRequested || typeof FontFace === "undefined") return;
  fontsRequested = true;
  // Deferred to a microtask so the delayRender handles survive Remotion's own module init.
  queueMicrotask(() => {
    for (const w of ["400", "500", "600", "700", "800"]) {
      const handle = delayRender(`Poppins ${w}`);
      const face = new FontFace(FONT, `url(${staticFile(`fonts/Poppins-${w}.woff2`)}) format('woff2')`, {
        weight: w,
        style: "normal",
      });
      face
        .load()
        .then(() => {
          document.fonts.add(face);
          continueRender(handle);
        })
        .catch((err) => cancelRender(new Error(`Poppins ${w} failed to load: ${err}`)));
    }
  });
};
requestFonts();

// ------------------------------------------------------------------ math helpers
export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const mix = (a: number, b: number, t: number) => a + (b - a) * t;
export const prog = (f: number, a: number, b: number) => clamp((f - a) / (b - a));
export const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
export const easeIn = (t: number) => t * t * t;
export const backOut = (t: number, k = 1.9) => 1 + (k + 1) * Math.pow(t - 1, 3) + k * Math.pow(t - 1, 2);
export const deg = (r: number) => (r * 180) / Math.PI;
export const rad = (d: number) => (d * Math.PI) / 180;
export type Pt = { x: number; y: number };
export const lerpPt = (a: Pt, b: Pt, t: number): Pt => ({ x: mix(a.x, b.x, t), y: mix(a.y, b.y, t) });
export const quad = (a: Pt, c: Pt, b: Pt, t: number): Pt => ({
  x: (1 - t) * (1 - t) * a.x + 2 * (1 - t) * t * c.x + t * t * b.x,
  y: (1 - t) * (1 - t) * a.y + 2 * (1 - t) * t * c.y + t * t * b.y,
});
/** Characters animate "on twos" (15 fps steps) for a stop-motion, miniature feel. */
export const onTwos = (frame: number) => Math.floor(frame / 2) * 2;

// ------------------------------------------------------------------ stage geometry (1080 × 1920)
export const W = 1080;
export const H = 1920;
export const FLOOR_Y = 1606;
export const PHONE = { x: 240, y: 360, w: 600, h: 1232, r: 92, bezel: 18 };
export const SCREEN = {
  x: PHONE.x + PHONE.bezel,
  y: PHONE.y + PHONE.bezel,
  w: PHONE.w - PHONE.bezel * 2,
  h: PHONE.h - PHONE.bezel * 2,
  r: 74,
};

/** The whole set is shown at 92 % and lifted 20 px so the end card clears Instagram's bottom UI. */
export const STAGE = { s: 0.92, ty: -20 };
export const stageX = (x: number) => W / 2 + (x - W / 2) * STAGE.s;
export const stageY = (y: number) => y * STAGE.s + STAGE.ty;
export const stageTransform = `translate(${(W / 2) * (1 - STAGE.s)}px, ${STAGE.ty}px) scale(${STAGE.s})`;

// ------------------------------------------------------------------ background
export const Studio: React.FC = () => (
  <>
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: `radial-gradient(120% 70% at 50% 38%, #FBFAF5 0%, ${C.cream} 55%, #EFEBDF 100%)`,
      }}
    />
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: stageY(FLOOR_Y) - 40,
        bottom: 0,
        background: `linear-gradient(180deg, rgba(236,230,214,0) 0px, ${C.floor} 60px, #E6DFCC 100%)`,
      }}
    />
    {/* contact shadow under the phone */}
    <div
      style={{
        position: "absolute",
        left: stageX(PHONE.x - 40),
        width: (PHONE.w + 80) * STAGE.s,
        top: stageY(FLOOR_Y) - 22,
        height: 48,
        borderRadius: "50%",
        background: "radial-gradient(closest-side, rgba(20,39,31,0.30), rgba(20,39,31,0))",
      }}
    />
  </>
);

// ------------------------------------------------------------------ ladder (aluminium, leaning on the phone)
export const ladderRails = (side: 1 | -1) => {
  // left ladder in canvas coords; mirrored for the right side
  const m = (x: number) => (side === 1 ? x : W - x);
  return {
    a0: { x: m(70), y: 1652 },
    a1: { x: m(178), y: 430 },
    b0: { x: m(150), y: 1652 },
    b1: { x: m(237), y: 430 },
  };
};
export const Ladder: React.FC<{ side: 1 | -1 }> = ({ side }) => {
  const { a0, a1, b0, b1 } = ladderRails(side);
  const rungs: React.ReactNode[] = [];
  for (let k = 1; k <= 11; k++) {
    const y = 1652 - k * 104;
    const t = (1652 - y) / (1652 - 430);
    const xa = mix(a0.x, a1.x, t);
    const xb = mix(b0.x, b1.x, t);
    rungs.push(<line key={k} x1={xa} y1={y} x2={xb} y2={y} stroke={C.aluDark} strokeWidth={9} strokeLinecap="round" />);
    rungs.push(<line key={`h${k}`} x1={xa} y1={y - 2} x2={xb} y2={y - 2} stroke="#DCE3DE" strokeWidth={3} strokeLinecap="round" />);
  }
  return (
    <g>
      <ellipse cx={(a0.x + b0.x) / 2} cy={1656} rx={70} ry={9} fill="rgba(20,39,31,0.18)" />
      {rungs}
      {[
        [a0, a1],
        [b0, b1],
      ].map(([p, q], i) => (
        <g key={i}>
          <line x1={p.x} y1={p.y} x2={q.x} y2={q.y} stroke={C.aluDark} strokeWidth={15} strokeLinecap="round" />
          <line x1={p.x - 2} y1={p.y} x2={q.x - 2} y2={q.y} stroke={C.alu} strokeWidth={9} strokeLinecap="round" />
          <line x1={p.x - 4} y1={p.y} x2={q.x - 4} y2={q.y} stroke="#E6ECE8" strokeWidth={2.5} strokeLinecap="round" />
          <rect x={p.x - 12} y={p.y - 8} width={24} height={14} rx={5} fill={C.ink} />
        </g>
      ))}
    </g>
  );
};

// ------------------------------------------------------------------ workers (flat vector, IK-posed)
export type Limb = { r1: number; r2: number };
export type Pose = { lean: number; head: number; armB: Limb; armF: Limb; legB: Limb; legF: Limb; bob?: number };
export type Look = { skin: string; suit: string; hat: "cap" | "beanie"; extra: "none" | "mustache" | "ponytail" | "beard" };
export type Rig = { x: number; y: number; s: number; facing: 1 | -1; lean: number; bob?: number };

const SH = { B: { x: -9, y: -198 }, F: { x: 13, y: -198 } };
const HIP = { B: { x: -8, y: -112 }, F: { x: 10, y: -112 } };
const ARM = [54, 52];
const LEG = [58, 56];
const LEAN_PIVOT = { x: 0, y: -112 };

const rotAround = (p: Pt, c: Pt, a: number): Pt => {
  const s = Math.sin(a);
  const co = Math.cos(a);
  return { x: c.x + (p.x - c.x) * co - (p.y - c.y) * s, y: c.y + (p.x - c.x) * s + (p.y - c.y) * co };
};

const ik = (j: Pt, t: Pt, l1: number, l2: number, bend: 1 | -1): Limb => {
  let dx = t.x - j.x;
  let dy = t.y - j.y;
  let d = Math.hypot(dx, dy);
  const maxD = l1 + l2 - 0.5;
  if (d > maxD) {
    dx *= maxD / d;
    dy *= maxD / d;
    d = maxD;
  }
  d = Math.max(d, Math.abs(l1 - l2) + 1);
  const phi = Math.atan2(dy, dx);
  const a = Math.acos(clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1));
  const th1 = phi - bend * a;
  const ex = j.x + l1 * Math.cos(th1);
  const ey = j.y + l1 * Math.sin(th1);
  const th2 = Math.atan2(j.y + dy - ey, j.x + dx - ex);
  return { r1: deg(th1 - Math.PI / 2), r2: deg(th2 - th1) };
};

/** World target → worker-local (right-facing, unscaled) coordinates. */
const toLocal = (rig: Rig, p: Pt, inTorso: boolean): Pt => {
  let q = { x: ((p.x - rig.x) / rig.s) * rig.facing, y: (p.y - rig.y) / rig.s - (rig.bob ?? 0) };
  if (inTorso) q = rotAround(q, LEAN_PIVOT, -rad(rig.lean));
  return q;
};
/** Arm reaching a world point (hand centre). bend 1 = elbow down/back. */
export const reach = (rig: Rig, side: "B" | "F", p: Pt, bend: 1 | -1 = 1): Limb =>
  ik(SH[side], toLocal(rig, p, true), ARM[0], ARM[1], bend);
/** Leg reaching a world point (ankle). bend -1 = knee forward. */
export const step = (rig: Rig, side: "B" | "F", p: Pt, bend: 1 | -1 = -1): Limb =>
  ik(HIP[side], toLocal(rig, { x: p.x, y: p.y }, false), LEG[0], LEG[1], bend);
/** Simple forward-swing angles (degrees, positive = toward facing direction). */
export const swing = (f1: number, f2 = 0): Limb => ({ r1: -f1, r2: -f2 });

const Seg: React.FC<{ w: number; l: number; fill: string; children?: React.ReactNode; r: number }> = ({ w, l, fill, r, children }) => (
  <g transform={`rotate(${r})`}>
    <rect x={-w / 2} y={-w / 4} width={w} height={l + w / 2} rx={w / 2} fill={fill} />
    {children}
  </g>
);

const Arm: React.FC<{ at: Pt; limb: Limb; look: Look; front: boolean }> = ({ at, limb, look, front }) => (
  <g transform={`translate(${at.x} ${at.y})`}>
    <Seg w={19} l={ARM[0]} fill={front ? C.sand : "#E4D9BF"} r={limb.r1}>
      <g transform={`translate(0 ${ARM[0]})`}>
        <Seg w={16} l={ARM[1] - 8} fill={look.skin} r={limb.r2}>
          <circle cx={0} cy={ARM[1] - 4} r={10.5} fill={front ? C.lime : C.limeDeep} />
        </Seg>
      </g>
    </Seg>
  </g>
);

const Leg: React.FC<{ at: Pt; limb: Limb; look: Look; front: boolean }> = ({ at, limb, look, front }) => (
  <g transform={`translate(${at.x} ${at.y})`}>
    <Seg w={25} l={LEG[0]} fill={front ? look.suit : shade(look.suit)} r={limb.r1}>
      <g transform={`translate(0 ${LEG[0]})`}>
        <Seg w={23} l={LEG[1] - 6} fill={front ? look.suit : shade(look.suit)} r={limb.r2}>
          <g transform={`translate(0 ${LEG[1] - 4}) rotate(${-limb.r1 - limb.r2})`}>
            <rect x={-12} y={-6} width={36} height={16} rx={7} fill={C.ink} />
          </g>
        </Seg>
      </g>
    </Seg>
  </g>
);

const shade = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.round(((n >> 16) & 255) * 0.78);
  const g = Math.round(((n >> 8) & 255) * 0.78);
  const b = Math.round((n & 255) * 0.78);
  return `rgb(${r},${g},${b})`;
};

const Head: React.FC<{ look: Look; tilt: number }> = ({ look, tilt }) => (
  <g transform={`translate(2 -236) rotate(${tilt})`}>
    {look.extra === "ponytail" && <path d="M-26 -6 C -48 2 -50 26 -36 40 C -34 22 -28 10 -18 4 Z" fill="#3A2A20" />}
    <circle cx={0} cy={0} r={30} fill={look.skin} />
    <circle cx={-24} cy={3} r={7} fill={look.skin} />
    <circle cx={10} cy={-2} r={3.6} fill={C.ink} />
    <circle cx={22} cy={-2} r={3.6} fill={C.ink} />
    <path d="M10 12 Q 17 18 24 11" stroke={C.ink} strokeWidth={3} fill="none" strokeLinecap="round" />
    <circle cx={4} cy={9} r={5} fill="#E9A08A" opacity={0.45} />
    {look.extra === "mustache" && <path d="M8 8 Q 17 3 27 8 Q 20 12 8 8 Z" fill="#3A2A20" />}
    {look.extra === "beard" && <path d="M-14 8 Q -10 34 12 32 Q 28 30 30 10 Q 22 24 8 22 Q -6 22 -14 8 Z" fill="#2E241D" />}
    {look.hat === "cap" ? (
      <g>
        <path d="M-31 -6 C -30 -36 -10 -44 4 -44 C 22 -44 32 -32 31 -8 Z" fill={C.lime} />
        <path d="M2 -12 L 50 -10 C 52 -4 46 -1 38 -2 L 0 -4 Z" fill={C.forest} />
        <rect x={-31} y={-12} width={62} height={7} rx={3} fill={C.forest} />
      </g>
    ) : (
      <g>
        <path d="M-32 -2 C -32 -40 -6 -46 4 -46 C 24 -46 34 -32 32 -2 Z" fill={C.lime} />
        <rect x={-33} y={-10} width={66} height={12} rx={6} fill={C.limeDeep} />
        <circle cx={0} cy={-48} r={7} fill={C.limeDeep} />
      </g>
    )}
  </g>
);

const Torso: React.FC<{ look: Look }> = ({ look }) => (
  <g>
    <rect x={-27} y={-214} width={56} height={44} rx={20} fill={C.sand} />
    <rect x={-29} y={-196} width={60} height={94} rx={18} fill={look.suit} />
    <rect x={-17} y={-202} width={36} height={40} rx={8} fill={shade(look.suit)} />
    <rect x={-10} y={-192} width={22} height={14} rx={4} fill={C.lime} opacity={0.9} />
    <line x1={-14} y1={-214} x2={-12} y2={-196} stroke={shade(look.suit)} strokeWidth={7} strokeLinecap="round" />
    <line x1={16} y1={-214} x2={14} y2={-196} stroke={shade(look.suit)} strokeWidth={7} strokeLinecap="round" />
    <rect x={-29} y={-122} width={60} height={14} rx={5} fill={shade(look.suit)} />
  </g>
);

export const Worker: React.FC<{ rig: Rig; pose: Pose; look: Look; mid?: React.ReactNode; shadow?: boolean }> = ({ rig, pose, look, mid, shadow = true }) => {
  const tf = `translate(${rig.x} ${rig.y + (pose.bob ?? 0) * rig.s}) scale(${rig.facing * rig.s} ${rig.s})`;
  const torsoTf = `rotate(${pose.lean} ${LEAN_PIVOT.x} ${LEAN_PIVOT.y})`;
  return (
    <g>
      {shadow && <ellipse cx={rig.x} cy={rig.y + 8 * rig.s} rx={44 * rig.s} ry={9 * rig.s} fill="rgba(20,39,31,0.22)" />}
      <g transform={tf}>
        <Leg at={HIP.B} limb={pose.legB} look={look} front={false} />
        <g transform={torsoTf}>
          <Arm at={SH.B} limb={pose.armB} look={look} front={false} />
          <Torso look={look} />
          <Head look={look} tilt={pose.head} />
        </g>
        <Leg at={HIP.F} limb={pose.legF} look={look} front />
      </g>
      {mid}
      <g transform={tf}>
        <g transform={torsoTf}>
          <Arm at={SH.F} limb={pose.armF} look={look} front />
        </g>
      </g>
    </g>
  );
};

export const LOOKS: Record<string, Look> = {
  ladderL: { skin: "#F0C6A2", suit: C.forest, hat: "cap", extra: "mustache" },
  ladderR: { skin: "#8D5A3B", suit: C.forest, hat: "beanie", extra: "none" },
  roller: { skin: "#C98E68", suit: C.green, hat: "cap", extra: "beard" },
  brush: { skin: "#E7B48F", suit: C.green, hat: "beanie", extra: "ponytail" },
};

/** Standing legs (feet under hips, slight stance). */
export const STAND: Pick<Pose, "legB" | "legF"> = { legB: { r1: 4, r2: -2 }, legF: { r1: -4, r2: 2 } };

// ------------------------------------------------------------------ tools
/** Distance from the pole tip `b` to the centre of the tool's contact area. */
export const TOOL_REACH = { roller: 40, brush: 48 };
/** Pole tip that puts the tool's contact centre exactly on `contact`, given the grip end `a`. */
export const tipFor = (a: Pt, contact: Pt, head: "roller" | "brush"): Pt => {
  const dx = contact.x - a.x;
  const dy = contact.y - a.y;
  const d = Math.hypot(dx, dy) || 1;
  const k = TOOL_REACH[head];
  return { x: contact.x - (dx / d) * k, y: contact.y - (dy / d) * k };
};
export const Pole: React.FC<{ a: Pt; b: Pt; head: "roller" | "brush"; wet?: number }> = ({ a, b, head, wet = 1 }) => {
  const ang = deg(Math.atan2(b.y - a.y, b.x - a.x));
  return (
    <g>
      <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#C9A876" strokeWidth={9} strokeLinecap="round" />
      <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#E2C99C" strokeWidth={3} strokeLinecap="round" />
      <g transform={`translate(${b.x} ${b.y}) rotate(${ang + 90})`}>
        {head === "roller" ? (
          <g>
            <line x1={0} y1={0} x2={0} y2={-28} stroke={C.aluDark} strokeWidth={5} strokeLinecap="round" />
            <rect x={-23} y={-54} width={46} height={28} rx={12} fill={wet > 0.5 ? C.lime : "#E8F4C8"} />
            <rect x={-19} y={-51} width={38} height={7} rx={3.5} fill="#FFFFFF" opacity={0.4} />
          </g>
        ) : (
          <g>
            <rect x={-9} y={-20} width={18} height={20} rx={3} fill={C.alu} />
            <path d="M-11 -20 L 11 -20 L 8 -48 Q 0 -56 -8 -48 Z" fill={C.forest} />
            <path d="M-7 -40 Q 0 -60 7 -40 Q 0 -46 -7 -40 Z" fill={C.lime} opacity={wet} />
          </g>
        )}
      </g>
    </g>
  );
};

// ------------------------------------------------------------------ phone shell
export const PhoneShell: React.FC<{ children: React.ReactNode; glare?: number }> = ({ children, glare = -1 }) => (
  <>
    <div
      style={{
        position: "absolute",
        left: PHONE.x,
        top: PHONE.y,
        width: PHONE.w,
        height: PHONE.h,
        borderRadius: PHONE.r,
        background: `linear-gradient(135deg, #2A3B33 0%, ${C.ink} 35%, #0B1511 100%)`,
        boxShadow: "inset 0 0 0 3px #3B4C44, inset 0 0 0 7px #0B1511, 0 30px 60px rgba(20,39,31,0.18)",
      }}
    />
    {[
      [-6, 300, 120],
      [-6, 450, 80],
      [PHONE.w, 340, 160],
    ].map(([dx, dy, h], i) => (
      <div key={i} style={{ position: "absolute", left: PHONE.x + dx, top: PHONE.y + dy, width: 7, height: h, borderRadius: 4, background: "#26352E" }} />
    ))}
    <div
      style={{
        position: "absolute",
        left: SCREEN.x,
        top: SCREEN.y,
        width: SCREEN.w,
        height: SCREEN.h,
        borderRadius: SCREEN.r,
        overflow: "hidden",
        background: "#FFFFFF",
      }}
    >
      {children}
      <div
        style={{
          position: "absolute",
          left: SCREEN.w / 2 - 78,
          top: 16,
          width: 156,
          height: 42,
          borderRadius: 21,
          background: "#060A08",
        }}
      />
      {glare >= 0 && glare <= 1 && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `linear-gradient(115deg, rgba(255,255,255,0) ${mix(-40, 110, glare) - 12}%, rgba(255,255,255,0.38) ${mix(-40, 110, glare)}%, rgba(255,255,255,0) ${mix(-40, 110, glare) + 12}%)`,
          }}
        />
      )}
    </div>
  </>
);

// ------------------------------------------------------------------ page inside the phone (mirrors the landing page)
export type Product = { id: string; image: string; name: string; sub: string; pill: string; before: string; now: string };

/** "BLACK FRIDAY" eyebrow with the page's lime strike through BLACK and GREEN stamped above at −7°. */
export const Eyebrow: React.FC<{ size: number; strike: number; green: number }> = ({ size, strike, green }) => (
  <div style={{ display: "flex", alignItems: "center", gap: size * 0.7, fontFamily: FONT, fontWeight: 600, fontSize: size, letterSpacing: "0.18em", color: C.lime, textTransform: "uppercase" }}>
    <span style={{ width: size * 0.55, height: size * 0.55, borderRadius: "50%", background: C.lime, display: "inline-block" }} />
    <span>
      <span style={{ position: "relative", display: "inline-block", color: "rgba(255,255,255,0.82)" }}>
        Black
        <span
          style={{
            position: "absolute",
            left: -3,
            right: -3,
            top: "50%",
            height: Math.max(3, size * 0.22),
            borderRadius: 2,
            background: C.lime,
            transform: `rotate(-7deg) scaleX(${strike})`,
            transformOrigin: "left center",
          }}
        />
        <span
          style={{
            position: "absolute",
            left: -2,
            bottom: "100%",
            marginBottom: 1,
            fontSize: "1.55em",
            fontWeight: 800,
            letterSpacing: "0.12em",
            color: C.lime,
            whiteSpace: "nowrap",
            transform: `rotate(-7deg) scale(${green})`,
            transformOrigin: "left bottom",
            opacity: green > 0 ? 1 : 0,
          }}
        >
          Green
        </span>
      </span>{" "}
      Friday
    </span>
  </div>
);

export const ProductCard: React.FC<{ p: Product; w: number; pill: number; strike: number; compact?: boolean }> = ({ p, w, pill, strike, compact }) => {
  const k = w / 254;
  return (
    <div style={{ width: w, background: "#FFFFFF", borderRadius: 20 * k, boxShadow: "0 6px 18px rgba(13,59,46,0.10)", overflow: "hidden", fontFamily: FONT }}>
      <div style={{ position: "relative", width: w, height: w * 0.9, background: "#FFFFFF" }}>
        <Img src={staticFile(p.image)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        <div
          style={{
            position: "absolute",
            left: 12 * k,
            top: 12 * k,
            padding: `${5 * k}px ${12 * k}px`,
            borderRadius: 999,
            background: C.coral,
            color: "#FFFFFF",
            fontWeight: 600,
            fontSize: 19 * k,
            transform: `scale(${pill})`,
            transformOrigin: "left top",
          }}
        >
          {p.pill}
        </div>
      </div>
      <div style={{ padding: `${10 * k}px ${14 * k}px ${16 * k}px` }}>
        <div style={{ fontWeight: 600, fontSize: (compact ? 18 : 20) * k, lineHeight: 1.2, color: C.ink, height: (compact ? 44 : 48) * k, overflow: "hidden" }}>{p.name}</div>
        {!compact && <div style={{ fontWeight: 400, fontSize: 15 * k, color: C.mute, marginTop: 2 * k }}>{p.sub}</div>}
        <div style={{ display: "flex", alignItems: "baseline", gap: 10 * k, marginTop: 8 * k }}>
          <span style={{ position: "relative", fontSize: 16 * k, color: "#5E6B64", fontWeight: 500 }}>
            {p.before}
            <span style={{ position: "absolute", left: -2, right: -2, top: "54%", height: 2.5 * k, background: "#5E6B64", transform: `scaleX(${strike})`, transformOrigin: "left center" }} />
          </span>
          <span style={{ fontSize: 25 * k, color: C.green, fontWeight: 700 }}>{p.now}</span>
        </div>
      </div>
    </div>
  );
};

export const STATUS_H = 128;
export const StatusBar: React.FC = () => (
  <div style={{ position: "absolute", left: 0, top: 0, width: SCREEN.w, height: STATUS_H, background: "#FFFFFF" }}>
    <div style={{ height: 66, display: "flex", alignItems: "flex-end", justifyContent: "space-between", padding: "0 40px 8px", fontFamily: FONT, fontWeight: 600, fontSize: 22, color: C.ink }}>
      <span>9:41</span>
      <span style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <span style={{ width: 26, height: 14, display: "inline-flex", gap: 3, alignItems: "flex-end" }}>
          {[5, 8, 11, 14].map((h) => (
            <span key={h} style={{ width: 4, height: h, background: C.ink, borderRadius: 1 }} />
          ))}
        </span>
        <span style={{ width: 34, height: 16, border: `2px solid ${C.ink}`, borderRadius: 5, display: "inline-block", position: "relative" }}>
          <span style={{ position: "absolute", left: 2, top: 2, width: 22, height: 8, background: C.ink, borderRadius: 2 }} />
        </span>
      </span>
    </div>
    <div style={{ padding: "6px 22px 10px" }}>
      <div style={{ height: 46, borderRadius: 23, background: "#EEF1EC", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, fontFamily: FONT, fontWeight: 500, fontSize: 19, color: C.ink }}>
        <svg width="14" height="17" viewBox="0 0 14 17">
          <rect x="1" y="7" width="12" height="9" rx="2" fill={C.ink} />
          <path d="M4 7 V5 a3 3 0 0 1 6 0 V7" stroke={C.ink} strokeWidth="2" fill="none" />
        </svg>
        calebasse.com
      </div>
    </div>
  </div>
);
export const SiteHeader: React.FC = () => (
  <>
    <div style={{ height: 7, background: "#AACB55" }} />
    <div style={{ height: 82, display: "flex", alignItems: "center", justifyContent: "center", borderBottom: `1px solid ${C.line}` }}>
      <Img src={staticFile("brand/logo_inline.svg")} style={{ height: 40 }} />
    </div>
  </>
);

export const Hero: React.FC<{ compact?: boolean; strike?: number; green?: number }> = ({ compact, strike = 1, green = 1 }) => (
  <div style={{ position: "relative", overflow: "hidden", background: C.forest, padding: compact ? "70px 30px 26px" : "84px 34px 40px", fontFamily: FONT }}>
    <div
      style={{
        position: "absolute",
        right: "-30%",
        top: "-40%",
        width: "90%",
        aspectRatio: "1 / 1",
        borderRadius: "50%",
        background: "radial-gradient(closest-side, rgba(201,236,122,0.18), rgba(201,236,122,0))",
      }}
    />
    <Eyebrow size={compact ? 17 : 19} strike={strike} green={green} />
    {compact ? (
      <div style={{ display: "flex", alignItems: "baseline", gap: 16, marginTop: 10 }}>
        <span style={{ color: "#FFFFFF", fontWeight: 600, fontSize: 34 }}>Jusqu’à</span>
        <span style={{ color: C.lime, fontWeight: 800, fontSize: 112, letterSpacing: "-0.045em", lineHeight: 0.95 }}>-70 %</span>
      </div>
    ) : (
      <>
        <div style={{ color: "#FFFFFF", fontWeight: 600, fontSize: 44, marginTop: 16, lineHeight: 1 }}>Jusqu’à</div>
        <div style={{ color: C.lime, fontWeight: 800, fontSize: 150, letterSpacing: "-0.045em", lineHeight: 0.92 }}>-70 %</div>
      </>
    )}
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: compact ? 8 : 14, flexWrap: "wrap" }}>
      <span style={{ color: C.onDark, fontSize: compact ? 18 : 21, fontWeight: 500 }}>sur une sélection*</span>
      <span style={{ background: C.lime, color: C.forest, fontWeight: 700, fontSize: compact ? 17 : 19, padding: "6px 16px", borderRadius: 999 }}>Du 20 au 30 novembre</span>
    </div>
  </div>
);

// ------------------------------------------------------------------ end card (below the phone)
export const EndCard: React.FC<{ t: number }> = ({ t }) => {
  const a = easeOut(clamp(t * 1.6));
  const b = easeOut(clamp(t * 1.6 - 0.25));
  const c = easeOut(clamp(t * 1.6 - 0.5));
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: stageY(FLOOR_Y) + 40, display: "flex", flexDirection: "column", alignItems: "center", fontFamily: FONT }}>
      <div style={{ opacity: a, transform: `translateY(${(1 - a) * 24}px)` }}>
        <Img src={staticFile("brand/logo_color.svg")} style={{ height: 66 }} />
      </div>
      <div style={{ opacity: b, transform: `translateY(${(1 - b) * 24}px)`, marginTop: 18, fontWeight: 700, fontSize: 40, color: C.forest, letterSpacing: "-0.01em" }}>
        Green Friday <span style={{ color: C.green, fontWeight: 600 }}>· du 20 au 30 novembre</span>
      </div>
      <div style={{ opacity: b, transform: `translateY(${(1 - b) * 24}px)`, marginTop: 6, fontWeight: 600, fontSize: 30, color: C.green }}>calebasse.com</div>
      <div style={{ opacity: c, marginTop: 16, fontWeight: 400, fontSize: 19, color: C.mute }}>*Jusqu’à -70 % sur une sélection de matériel MTC, dans la limite des stocks.</div>
    </div>
  );
};
