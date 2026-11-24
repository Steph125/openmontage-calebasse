// Concept A — « Le chantier du Green Friday » (12 s). See art-direction.md + scenes.md.
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import {
  C, FONT, FLOOR_Y, H, SCREEN, W, Studio, Ladder, Worker, LOOKS, STAND, Pole, PhoneShell, StatusBar, SiteHeader, STATUS_H, stageTransform, Hero, ProductCard, EndCard,
  Product, Pt, Rig, Pose, reach, swing, tipFor, lerpPt, quad, prog, clamp, mix, easeInOut, easeOut, easeIn, backOut, onTwos, rad, deg,
} from "./shared";

export type SceneAProps = { products: Product[] };

// ---------------------------------------------------------------- banner geometry
const B0 = 220;
const B1 = 860;
const BTOP = 470;
const RELEASE_L = 200;
const RELEASE_R = 203;
const GRAV = 4.4;
const LAND_Y = FLOOR_Y - 104;

// the roller stroke through BLACK (−7°)
const S0: Pt = { x: 285, y: 837 };
const S1: Pt = { x: 795, y: 775 };
const S_LEN = Math.hypot(S1.x - S0.x, S1.y - S0.y);
const S_ANG = Math.atan2(S1.y - S0.y, S1.x - S0.x);
// GREEN lettering origin (left baseline), rotated −7° like the page
const G0: Pt = { x: 285, y: 710 };
const G_ANG = rad(-7);
const G_W = 446;
const gWorld = (lx: number, ly: number): Pt => ({
  x: G0.x + lx * Math.cos(G_ANG) - ly * Math.sin(G_ANG),
  y: G0.y + lx * Math.sin(G_ANG) + ly * Math.cos(G_ANG),
});

const cornerY = (f: number, release: number) => {
  const lift = 10 * easeInOut(prog(f, 186, 199));
  if (f < release) return BTOP - lift;
  const t = f - release;
  return Math.min(BTOP - 10 + 0.5 * GRAV * t * t, LAND_Y);
};

// ---------------------------------------------------------------- characters
const RIG_ROLLER = { x: 330, y: 1745, s: 1.2 };
const RIG_BRUSH = { x: 760, y: 1745, s: 1.2 };
const RIG_LL: Rig = { x: 185, y: 716, s: 1, facing: 1, lean: 0 };
const RIG_LR: Rig = { x: 895, y: 716, s: 1, facing: -1, lean: 0 };
const DRAG_START = 284;
const DRAG_END = 322;
const dragX = (f: number) => 1050 * easeIn(prog(f, DRAG_START, DRAG_END));

const walkLegs = (ph: number): Pick<Pose, "legB" | "legF"> => ({
  legB: swing(24 * Math.sin(ph), -18 * Math.max(0, Math.cos(ph))),
  legF: swing(-24 * Math.sin(ph), -18 * Math.max(0, -Math.cos(ph))),
});

/** Roller worker: pole grip a, roller contact point, lean, bob. */
const rollerState = (wf: number) => {
  const staffA: Pt = { x: RIG_ROLLER.x + 48, y: RIG_ROLLER.y - 7 };
  const staffC: Pt = { x: RIG_ROLLER.x + 48, y: RIG_ROLLER.y - 470 };
  const paintA: Pt = { x: RIG_ROLLER.x + 30, y: RIG_ROLLER.y - 150 };
  let a = staffA;
  let c = staffC;
  let lean = 0;
  let bob = 0;
  let paint = 0;
  let mode: "staff" | "paint" = "staff";
  if (wf < 16) {
    // anticipation: crouch, roller dips back
    const u = easeInOut(prog(wf, 0, 16));
    lean = 16 * u;
    bob = 8 * u;
    c = { x: staffC.x - 40 * u, y: staffC.y + 60 * u };
  } else if (wf < 42) {
    const u = easeInOut(prog(wf, 16, 42));
    mode = "paint";
    a = lerpPt(staffA, paintA, u);
    c = quad({ x: staffC.x - 40, y: staffC.y + 60 }, { x: 120, y: 1130 }, S0, u);
    lean = mix(16, -8, u);
    bob = mix(8, 0, u);
  } else if (wf < 94) {
    const u = easeInOut(prog(wf, 42, 94));
    mode = "paint";
    a = paintA;
    c = lerpPt(S0, S1, u);
    paint = u;
    lean = -8 + 4 * Math.sin(u * Math.PI);
    bob = -2 * Math.sin(u * Math.PI * 3);
  } else if (wf < 122) {
    const u = easeInOut(prog(wf, 94, 122));
    mode = "paint";
    a = lerpPt(paintA, staffA, u);
    c = quad(S1, { x: 640, y: 1150 }, staffC, u);
    paint = 1;
    lean = mix(-8, 0, u);
  } else {
    paint = 1;
    bob = 1.5 * Math.sin(wf * 0.18);
  }
  if (wf >= 94) paint = 1;
  return { a, c, lean, bob, paint, mode };
};

/** Brush worker: letters GREEN above BLACK. */
const brushState = (wf: number) => {
  const staffA: Pt = { x: RIG_BRUSH.x - 48, y: RIG_BRUSH.y - 7 };
  const staffC: Pt = { x: RIG_BRUSH.x - 48, y: RIG_BRUSH.y - 480 };
  const paintA: Pt = { x: RIG_BRUSH.x - 28, y: RIG_BRUSH.y - 150 };
  let a = staffA;
  let c = staffC;
  let lean = 0;
  let reveal = -20;
  let mode: "staff" | "paint" = "staff";
  const letterW = G_W / 5;
  if (wf < 96) {
    lean = 0;
  } else if (wf < 120) {
    const u = easeInOut(prog(wf, 96, 120));
    mode = "paint";
    a = lerpPt(staffA, paintA, u);
    c = quad(staffC, { x: 980, y: 980 }, gWorld(0, -44), u);
    lean = mix(0, -10, u);
  } else if (wf < 166) {
    const u = prog(wf, 120, 166);
    mode = "paint";
    a = paintA;
    const lx = u * G_W;
    const wig = 26 * Math.sin((lx / letterW) * Math.PI * 2);
    c = gWorld(lx, -44 + wig);
    reveal = lx + 6;
    lean = -10 + 3 * Math.sin(u * 20);
  } else if (wf < 190) {
    const u = easeInOut(prog(wf, 166, 190));
    mode = "paint";
    a = lerpPt(paintA, staffA, u);
    c = quad(gWorld(G_W, -44), { x: 1000, y: 1000 }, staffC, u);
    reveal = G_W + 40;
    lean = mix(-10, 0, u);
  } else {
    reveal = G_W + 40;
  }
  return { a, c, lean, reveal, mode };
};

// ---------------------------------------------------------------- pile path
const pilePath = (cx: number, hw: number, h: number) => {
  const y = FLOOR_Y + 10;
  return [
    `M ${cx - hw} ${y}`,
    `C ${cx - hw + 8} ${y - h * 0.9} ${cx - hw * 0.62} ${y - h * 1.05} ${cx - hw * 0.34} ${y - h * 0.82}`,
    `C ${cx - hw * 0.16} ${y - h * 0.62} ${cx - hw * 0.06} ${y - h * 1.12} ${cx + hw * 0.2} ${y - h * 0.98}`,
    `C ${cx + hw * 0.42} ${y - h * 0.86} ${cx + hw * 0.6} ${y - h * 1.02} ${cx + hw * 0.8} ${y - h * 0.62}`,
    `C ${cx + hw * 0.95} ${y - h * 0.34} ${cx + hw} ${y - 6} ${cx + hw} ${y}`,
    "Z",
  ].join(" ");
};

export const SceneA: React.FC<SceneAProps> = ({ products }) => {
  const f = useCurrentFrame();
  const wf = onTwos(f);

  // ---- banner
  const yL = cornerY(f, RELEASE_L);
  const yR = cornerY(f, RELEASE_R);
  const falling = f >= RELEASE_L;
  const amount = clamp((yL + yR) / 2 - BTOP, 0, 2000);
  const pileH = 16 + 92 * (1 - Math.exp(-amount / 420));
  const landed = yL >= LAND_Y && yR >= LAND_Y;
  const landFrame = RELEASE_R + Math.ceil(Math.sqrt((2 * (LAND_Y - BTOP + 10)) / GRAV));
  const squash = f >= landFrame ? 1 - 0.16 * Math.exp(-(f - landFrame) / 5) * Math.cos((f - landFrame) * 0.7) : 1;
  const pileHW = 330 + 70 * (1 - Math.exp(-amount / 500));
  const dx = dragX(f);
  const sag = (26 + 3 * Math.sin(f * 0.12)) * (falling ? clamp(1 - amount / 300) : 1);
  const hangBottom = FLOOR_Y - pileH * 0.55;
  const dy = (yL + yR) / 2 - BTOP;
  const tilt = deg(Math.atan2(yR - yL, B1 - B0));
  const hangPath = `M ${B0} ${yL} Q ${(B0 + B1) / 2} ${(yL + yR) / 2 + sag} ${B1} ${yR} L ${B1} ${hangBottom} L ${B0} ${hangBottom} Z`;

  // ---- tools / paint
  const R = rollerState(wf);
  const Bs = brushState(wf);
  const dripT = [prog(wf, 64, 92), prog(wf, 86, 116)];
  const greenPop = 1 + 0.08 * Math.sin(Math.PI * prog(f, 166, 178));

  // ---- workers
  const dragging = f >= DRAG_START - 8;
  const dragU = prog(wf, DRAG_START - 8, DRAG_START);
  const walkPh = wf * 0.55;

  const rollerRig: Rig = { ...RIG_ROLLER, facing: 1, lean: dragging ? mix(R.lean, 20, dragU) : R.lean, bob: R.bob, x: RIG_ROLLER.x + dx };
  const brushFacing: 1 | -1 = dragging ? 1 : -1;
  const brushRig: Rig = { ...RIG_BRUSH, facing: brushFacing, lean: dragging ? mix(Bs.lean, 20, dragU) : Bs.lean, x: RIG_BRUSH.x + dx };

  const poleFor = (st: { a: Pt; c: Pt; mode: string }, head: "roller" | "brush", rig: Rig) => {
    let a = st.a;
    let c = st.c;
    if (dragging) {
      // carry the pole upright in the front hand while walking off
      a = { x: rig.x + 48 * rig.facing, y: rig.y - 7 - 30 * dragU };
      c = { x: rig.x + 48 * rig.facing, y: rig.y - 470 - 30 * dragU };
    } else if (dx) {
      a = { x: a.x + dx, y: a.y };
      c = { x: c.x + dx, y: c.y };
    }
    const b = tipFor(a, c, head);
    return { a, b, c };
  };
  const rp = poleFor(R, "roller", rollerRig);
  const bp = poleFor(Bs, "brush", brushRig);

  const pileGrab = (rig: Rig): Pt => ({ x: rig.x - 34 * rig.facing, y: FLOOR_Y - pileH * squash * 0.7 });

  const groundPose = (rig: Rig, pole: { a: Pt; b: Pt }, mode: string): Pose => {
    const legs = dragging && f >= DRAG_START ? walkLegs(walkPh) : STAND;
    if (dragging) {
      return {
        lean: rig.lean,
        head: 0,
        armF: reach(rig, "F", lerpPt(pole.a, pole.b, 0.3), 1),
        armB: reach(rig, "B", pileGrab(rig), 1),
        ...legs,
        bob: rig.bob,
      };
    }
    if (mode === "paint") {
      return {
        lean: rig.lean,
        head: -8,
        armB: reach(rig, "B", lerpPt(pole.a, pole.b, 0.03), 1),
        armF: reach(rig, "F", lerpPt(pole.a, pole.b, 0.19), 1),
        ...legs,
        bob: rig.bob,
      };
    }
    return {
      lean: rig.lean,
      head: 0,
      armF: reach(rig, "F", lerpPt(pole.a, pole.b, 0.3), 1),
      armB: swing(-8, -20),
      ...legs,
      bob: rig.bob,
    };
  };

  // ladder workers
  const nod = f >= 176 && f < 198 ? 10 * Math.sin(prog(f, 176, 198) * Math.PI * 2) : 0;
  const released = (rel: number) => f >= rel;
  const ladderPose = (rig: Rig, corner: Pt, rel: number, railHand: Pt): Pose => {
    const back = released(rel) ? easeOut(prog(f, rel, rel + 12)) : 0;
    const r2: Rig = { ...rig, lean: -9 * back };
    const waving = f >= 326;
    const wave = Math.sin((wf - 326) * 0.45);
    let armF;
    if (!released(rel)) armF = reach(r2, "F", corner, 1);
    else if (waving) armF = reach(r2, "F", { x: rig.x + rig.facing * (28 + 22 * wave), y: rig.y - 330 }, -1);
    else armF = reach(r2, "F", { x: rig.x + rig.facing * 40, y: rig.y - 150 }, 1);
    return { lean: r2.lean, head: nod * rig.facing + (released(rel) ? -6 : 0), armF, armB: reach(r2, "B", railHand, 1), ...STAND };
  };

  // ---- page
  const scroll = 470 * easeInOut(prog(f, 250, 300));
  const pillT = products.slice(0, 4).map((_, i) => clamp(backOut(prog(f, 256 + i * 6, 270 + i * 6)), 0, 1.2));
  const strikeT = products.slice(0, 4).map((_, i) => easeOut(prog(f, 268 + i * 6, 282 + i * 6)));

  const llRig = { ...RIG_LL, lean: released(RELEASE_L) ? -9 * easeOut(prog(f, RELEASE_L, RELEASE_L + 12)) : 0 };
  const lrRig = { ...RIG_LR, lean: released(RELEASE_R) ? -9 * easeOut(prog(f, RELEASE_R, RELEASE_R + 12)) : 0 };

  return (
    <AbsoluteFill style={{ background: C.cream }}>
      <Studio />
      <div style={{ position: "absolute", left: 0, top: 0, width: W, height: H, transform: stageTransform, transformOrigin: "0 0" }}>
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        <Ladder side={1} />
        <Ladder side={-1} />
      </svg>

      <PhoneShell glare={prog(f, 228, 262)}>
        <div style={{ position: "absolute", left: 0, top: 0, width: SCREEN.w, paddingTop: STATUS_H, transform: `translateY(${-scroll}px)`, background: "#FFFFFF" }}>
          <SiteHeader />
          <Hero />
          <div style={{ padding: "26px 20px 12px", fontFamily: FONT, display: "flex", alignItems: "baseline", gap: 12 }}>
            <span style={{ fontWeight: 700, fontSize: 30, color: C.forest }}>Nos incontournables</span>
            <span style={{ fontSize: 17, color: C.mute }}>Bons plans</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "254px 254px", gap: 16, padding: "4px 20px 22px" }}>
            {products.slice(0, 4).map((p, i) => (
              <ProductCard key={p.id} p={p} w={254} pill={pillT[i]} strike={strikeT[i]} />
            ))}
          </div>
          <div style={{ padding: "0 20px 60px" }}>
            <div style={{ height: 64, borderRadius: 14, background: C.forest, color: "#FFFFFF", fontFamily: FONT, fontWeight: 600, fontSize: 22, display: "flex", alignItems: "center", justifyContent: "center" }}>
              Voir toutes les offres
            </div>
          </div>
        </div>
        <StatusBar />
      </PhoneShell>

      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <linearGradient id="fabric" x1={B0} x2={B1} y1="0" y2="0" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#0B0C0B" />
            <stop offset="0.14" stopColor="#171917" />
            <stop offset="0.3" stopColor="#0C0D0C" />
            <stop offset="0.52" stopColor="#151715" />
            <stop offset="0.7" stopColor="#0B0C0B" />
            <stop offset="0.86" stopColor="#181A18" />
            <stop offset="1" stopColor="#0C0D0C" />
          </linearGradient>
          <clipPath id="hangA" clipPathUnits="userSpaceOnUse">
            <path d={hangPath} />
          </clipPath>
          <clipPath id="greenReveal" clipPathUnits="userSpaceOnUse">
            <rect x={-30} y={-150} width={Math.max(0, Bs.reveal + 30)} height={200} />
          </clipPath>
        </defs>

        {/* hanging banner */}
        {!landed && (
          <g clipPath="url(#hangA)">
            <rect x={B0 - 20} y={0} width={B1 - B0 + 40} height={H} fill="url(#fabric)" />
            <g transform={`translate(0 ${dy}) rotate(${tilt} ${(B0 + B1) / 2} ${BTOP})`}>
              {[0, 1, 2].map((k) => (
                <path key={`fl${k}`} d={`M ${B0 + 10 + k * 18} ${BTOP + 8} Q ${B0 + 70 + k * 40} ${BTOP + 160 + k * 60} ${B0 + 40 + k * 70} ${BTOP + 340 + k * 80}`} stroke="#262926" strokeWidth={5} fill="none" opacity={0.7} />
              ))}
              {[0, 1, 2].map((k) => (
                <path key={`fr${k}`} d={`M ${B1 - 10 - k * 18} ${BTOP + 8} Q ${B1 - 70 - k * 40} ${BTOP + 160 + k * 60} ${B1 - 40 - k * 70} ${BTOP + 340 + k * 80}`} stroke="#262926" strokeWidth={5} fill="none" opacity={0.7} />
              ))}
              <text x={540} y={860} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={150} letterSpacing={-6} fill="#FFFFFF">
                BLACK
              </text>
              <text x={540} y={1028} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={150} letterSpacing={-6} fill="#FFFFFF">
                FRIDAY
              </text>
              {/* roller stroke */}
              <g transform={`translate(${S0.x} ${S0.y}) rotate(${deg(S_ANG)})`}>
                {R.paint > 0 && (
                  <>
                    <path d={`M 0 -19 L ${S_LEN * R.paint} -19 Q ${S_LEN * R.paint + 12} 0 ${S_LEN * R.paint} 19 L 0 19 Q -12 0 0 -19 Z`} fill={C.lime} />
                    {[-11, -2, 9].map((yy, k) => (
                      <line key={k} x1={8} y1={yy} x2={Math.max(8, S_LEN * R.paint - 8)} y2={yy + (k - 1) * 1.5} stroke={k === 1 ? "#E3F7AE" : "#B4DB62"} strokeWidth={2.5} opacity={0.6} />
                    ))}
                  </>
                )}
              </g>
              {/* drips */}
              {[150, 392].map((xd, k) => {
                const t = dripT[k];
                if (t <= 0) return null;
                const px = S0.x + xd * Math.cos(S_ANG) - 16 * Math.sin(S_ANG);
                const py = S0.y + xd * Math.sin(S_ANG) + 16 * Math.cos(S_ANG);
                const len = 46 * easeOut(t) * (k ? 0.75 : 1);
                return (
                  <g key={k}>
                    <line x1={px} y1={py} x2={px} y2={py + len} stroke={C.lime} strokeWidth={9} strokeLinecap="round" />
                    <circle cx={px} cy={py + len + 2} r={7} fill={C.lime} />
                  </g>
                );
              })}
              {/* GREEN lettering */}
              <g transform={`translate(${G0.x} ${G0.y}) rotate(-7) scale(${greenPop})`}>
                <text x={0} y={0} fontFamily={FONT} fontWeight={800} fontSize={120} letterSpacing={7} fill={C.lime} stroke={C.lime} strokeWidth={2} clipPath="url(#greenReveal)">
                  GREEN
                </text>
              </g>
            </g>
          </g>
        )}

        {/* pile on the floor */}
        <g transform={`translate(${dx} 0) translate(0 ${FLOOR_Y}) scale(1 ${squash}) translate(0 ${-FLOOR_Y})`}>
          <path d={pilePath(540, pileHW, pileH)} fill={C.black} />
          {pileH > 40 && (
            <>
              <path d={`M ${540 - pileHW * 0.6} ${FLOOR_Y - pileH * 0.2} Q ${540 - pileHW * 0.3} ${FLOOR_Y - pileH * 0.75} ${540 - pileHW * 0.05} ${FLOOR_Y - pileH * 0.35}`} stroke="#2A2D2A" strokeWidth={6} fill="none" />
              <path d={`M ${540 + pileHW * 0.08} ${FLOOR_Y - pileH * 0.5} Q ${540 + pileHW * 0.35} ${FLOOR_Y - pileH * 0.9} ${540 + pileHW * 0.62} ${FLOOR_Y - pileH * 0.3}`} stroke="#2A2D2A" strokeWidth={6} fill="none" />
              <path d={`M ${540 - pileHW * 0.2} ${FLOOR_Y + 2} Q ${540} ${FLOOR_Y - pileH * 0.3} ${540 + pileHW * 0.3} ${FLOOR_Y + 2}`} stroke="#232523" strokeWidth={5} fill="none" />
              <path d={`M ${540 - pileHW * 0.42} ${FLOOR_Y - pileH * 0.55} Q ${540 - pileHW * 0.3} ${FLOOR_Y - pileH * 0.62} ${540 - pileHW * 0.12} ${FLOOR_Y - pileH * 0.52}`} stroke={C.lime} strokeWidth={9} strokeLinecap="round" fill="none" opacity={landed ? 0.9 : 0} />
            </>
          )}
        </g>

        {/* ladder workers */}
        <Worker rig={llRig} look={LOOKS.ladderL} shadow={false} pose={ladderPose(RIG_LL, { x: B0, y: yL }, RELEASE_L, { x: 162, y: 634 })} />
        <Worker rig={lrRig} look={LOOKS.ladderR} shadow={false} pose={ladderPose(RIG_LR, { x: B1, y: yR }, RELEASE_R, { x: W - 162, y: 634 })} />

        {/* ground workers with their poles */}
        <Worker rig={rollerRig} look={LOOKS.roller} pose={groundPose(rollerRig, rp, dragging ? "staff" : R.mode)} mid={<Pole a={rp.a} b={rp.b} head="roller" />} />
        <Worker rig={brushRig} look={LOOKS.brush} pose={groundPose(brushRig, bp, dragging ? "staff" : Bs.mode)} mid={<Pole a={bp.a} b={bp.b} head="brush" />} />
      </svg>
      </div>

      <EndCard t={prog(f, 324, 350)} />
    </AbsoluteFill>
  );
};
