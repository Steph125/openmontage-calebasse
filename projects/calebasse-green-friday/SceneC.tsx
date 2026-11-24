// Concept C — « Les ouvriers remplissent la vitrine » (15 s). See art-direction.md + scenes.md.
import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import {
  C, FONT, H, SCREEN, W, Studio, Ladder, Worker, LOOKS, STAND, PhoneShell, StatusBar, STATUS_H, stageTransform, Eyebrow, EndCard,
  Product, Pt, Rig, Pose, reach, swing, prog, clamp, mix, easeInOut, easeOut, backOut, onTwos, quad,
} from "./shared";

export type SceneCProps = { products: Product[] };

// ---------------------------------------------------------------- page layout (screen coords)
const HERO_H = 232;
const GRID_TOP = STATUS_H + HERO_H + 12;
const TILE_W = 254;
const TILE_H = 262;
const COL_PITCH = 270;
const ROW_PITCH = 274;
const PAD_X = 20;
const slotScreen = (col: number, row: number) => ({ x: PAD_X + col * COL_PITCH, y: GRID_TOP + row * ROW_PITCH });
/** Slot centre in stage coordinates. */
const slotCentre = (col: number, row: number): Pt => {
  const s = slotScreen(col, row);
  return { x: SCREEN.x + s.x + TILE_W / 2, y: SCREEN.y + s.y + TILE_H / 2 };
};

// ---------------------------------------------------------------- choreography
const GY = 1745; // ground workers' feet
const GS = 1.2;
const CARRY_Y = 1268; // tile centre while carried above the head
const OFF_L = -160;
const OFF_R = W + 160;

type Act = "off" | "walk" | "carry" | "toss" | "stand" | "look" | "hi5";
type Seg = { a: number; b: number; x0: number; x1: number; act: Act; face?: 1 | -1; tile?: number };

type TileJob = { pid: number; col: number; row: number; worker: "L" | "R"; carry: number; toss: number; snap: number };
const JOBS: TileJob[] = [
  { pid: 0, col: 0, row: 2, worker: "L", carry: 30, toss: 54, snap: 64 },
  { pid: 1, col: 1, row: 2, worker: "R", carry: 60, toss: 80, snap: 90 },
  { pid: 2, col: 0, row: 1, worker: "L", carry: 96, toss: 114, snap: 124 },
  { pid: 3, col: 1, row: 1, worker: "R", carry: 126, toss: 144, snap: 154 },
  { pid: 4, col: 0, row: 0, worker: "L", carry: 156, toss: 174, snap: 188 },
  { pid: 5, col: 1, row: 0, worker: "R", carry: 190, toss: 208, snap: 222 },
];

const buildSegs = (side: "L" | "R"): Seg[] => {
  const off = side === "L" ? OFF_L : OFF_R;
  const inward: 1 | -1 = side === "L" ? 1 : -1;
  const segs: Seg[] = [];
  let t = 0;
  for (const j of JOBS.filter((x) => x.worker === side)) {
    const spot = slotCentre(j.col, j.row).x;
    if (j.carry > t) segs.push({ a: t, b: j.carry, x0: off, x1: off, act: "off", face: inward });
    segs.push({ a: j.carry, b: j.toss, x0: off, x1: spot, act: "carry", face: inward, tile: j.pid });
    segs.push({ a: j.toss, b: j.snap + 4, x0: spot, x1: spot, act: "toss", face: inward, tile: j.pid });
    segs.push({ a: j.snap + 4, b: j.snap + 22, x0: spot, x1: off, act: "walk", face: (-inward) as 1 | -1 });
    t = j.snap + 22;
  }
  const look = side === "L" ? 360 : 720;
  const meet = side === "L" ? 468 : 612;
  segs.push({ a: t, b: 250, x0: off, x1: off, act: "off", face: inward });
  segs.push({ a: 250, b: 270, x0: off, x1: look, act: "walk", face: inward });
  segs.push({ a: 270, b: 330, x0: look, x1: look, act: "look", face: inward });
  segs.push({ a: 330, b: 342, x0: look, x1: meet, act: "walk", face: inward });
  segs.push({ a: 342, b: 362, x0: meet, x1: meet, act: "hi5", face: inward });
  segs.push({ a: 362, b: 392, x0: meet, x1: off, act: "walk", face: (-inward) as 1 | -1 });
  segs.push({ a: 392, b: 99999, x0: off, x1: off, act: "off", face: inward });
  return segs;
};
const SEGS = { L: buildSegs("L"), R: buildSegs("R") };
const segAt = (segs: Seg[], f: number) => segs.find((s) => f >= s.a && f < s.b) ?? segs[segs.length - 1];
const xAt = (s: Seg, f: number) => mix(s.x0, s.x1, s.act === "walk" || s.act === "carry" ? easeInOut(prog(f, s.a, s.b)) : 1);

/** Tile centre (stage coords) for a job while it is outside the page; null once snapped / before carry. */
const tileFlight = (j: TileJob, f: number, carrierX: number, bob: number): { p: Pt; rot: number; scale: number } | null => {
  if (f < j.carry || f >= j.snap) return null;
  if (f < j.toss) return { p: { x: carrierX, y: CARRY_Y + bob }, rot: 2 * Math.sin(f * 0.6), scale: 1.05 };
  const dip = 8 * Math.sin(Math.PI * prog(f, j.toss, j.toss + 5));
  const u = easeOut(prog(f, j.toss + 3, j.snap));
  const from = { x: slotCentre(j.col, j.row).x, y: CARRY_Y + dip };
  const to = slotCentre(j.col, j.row);
  const ctrl = { x: from.x, y: Math.min(from.y, to.y) - (j.row === 0 ? 170 : j.row === 1 ? 90 : 30) };
  return { p: quad(from, ctrl, to, u), rot: (1 - u) * (j.row === 0 ? -10 : -4), scale: mix(1.05, 1, u) };
};

// ---------------------------------------------------------------- page pieces
const Tile: React.FC<{ p: Product; pill: number; strike: number }> = ({ p, pill, strike }) => (
  <div style={{ width: TILE_W, height: TILE_H, background: "#FFFFFF", borderRadius: 20, boxShadow: "0 6px 18px rgba(13,59,46,0.12)", overflow: "hidden", fontFamily: FONT }}>
    <div style={{ position: "relative", height: 152, background: "#FFFFFF" }}>
      <Img src={staticFile(p.image)} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
      <div style={{ position: "absolute", left: 12, top: 12, padding: "5px 12px", borderRadius: 999, background: C.coral, color: "#FFFFFF", fontWeight: 600, fontSize: 19, transform: `scale(${pill})`, transformOrigin: "left top" }}>
        {p.pill}
      </div>
    </div>
    <div style={{ padding: "8px 14px 0" }}>
      <div style={{ fontWeight: 600, fontSize: 18, lineHeight: 1.22, color: C.ink, height: 44, overflow: "hidden" }}>{p.name}</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginTop: 8 }}>
        <span style={{ position: "relative", fontSize: 16, color: "#5E6B64", fontWeight: 500 }}>
          {p.before}
          <span style={{ position: "absolute", left: -2, right: -2, top: "54%", height: 2.5, background: "#5E6B64", transform: `scaleX(${strike})`, transformOrigin: "left center" }} />
        </span>
        <span style={{ fontSize: 26, color: C.green, fontWeight: 700 }}>{p.now}</span>
      </div>
    </div>
  </div>
);

const EmptySlot: React.FC<{ pulse: number }> = ({ pulse }) => (
  <div
    style={{
      width: TILE_W,
      height: TILE_H,
      borderRadius: 20,
      border: `3px dashed ${C.line}`,
      background: "#F6F8F3",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    <div style={{ width: 54, height: 54, borderRadius: 27, background: C.lime, opacity: 0.55 + 0.35 * pulse, display: "flex", alignItems: "center", justifyContent: "center", color: C.forest, fontFamily: FONT, fontWeight: 700, fontSize: 36 }}>+</div>
  </div>
);

const HeroBand: React.FC<{ strike: number; green: number }> = ({ strike, green }) => (
  <div style={{ position: "absolute", left: 0, top: STATUS_H, width: SCREEN.w, height: HERO_H, background: C.forest, overflow: "hidden", fontFamily: FONT, padding: "66px 30px 0", boxSizing: "border-box" }}>
    <div style={{ position: "absolute", right: "-25%", top: "-60%", width: "80%", aspectRatio: "1 / 1", borderRadius: "50%", background: "radial-gradient(closest-side, rgba(201,236,122,0.18), rgba(201,236,122,0))" }} />
    <Eyebrow size={22} strike={strike} green={green} />
    <div style={{ display: "flex", alignItems: "baseline", gap: 14, marginTop: 2 }}>
      <span style={{ color: "#FFFFFF", fontWeight: 600, fontSize: 30 }}>Jusqu’à</span>
      <span style={{ color: C.lime, fontWeight: 800, fontSize: 84, letterSpacing: "-0.045em", lineHeight: 1 }}>-70 %</span>
    </div>
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <span style={{ color: C.onDark, fontSize: 18, fontWeight: 500 }}>sur une sélection*</span>
      <span style={{ background: C.lime, color: C.forest, fontWeight: 700, fontSize: 17, padding: "5px 14px", borderRadius: 999 }}>Du 20 au 30 novembre</span>
    </div>
  </div>
);

// ---------------------------------------------------------------- scene
export const SceneC: React.FC<SceneCProps> = ({ products }) => {
  const f = useCurrentFrame();
  const wf = onTwos(f);

  // ground workers
  const ground = (side: "L" | "R") => {
    const s = segAt(SEGS[side], wf);
    const x = xAt(s, wf);
    const moving = s.act === "walk" || s.act === "carry";
    const ph = wf * 0.6;
    const bob = moving ? -3 * Math.abs(Math.sin(ph)) : 0;
    const face: 1 | -1 = s.face ?? 1;
    const rig: Rig = { x, y: GY, s: GS, facing: face, lean: 0, bob };
    const legs = moving
      ? { legB: swing(24 * Math.sin(ph), -18 * Math.max(0, Math.cos(ph))), legF: swing(-24 * Math.sin(ph), -18 * Math.max(0, -Math.cos(ph))) }
      : STAND;
    let pose: Pose = { lean: 0, head: 0, armB: swing(-6, -14), armF: swing(6, -12), ...legs, bob };
    const job = s.tile !== undefined ? JOBS.find((j) => j.pid === s.tile) : undefined;
    if (s.act === "carry" && job) {
      pose = { ...pose, armB: reach(rig, "B", { x: x - 58 * face, y: CARRY_Y + TILE_H / 2 + 10 + bob }, -1), armF: reach(rig, "F", { x: x + 58 * face, y: CARRY_Y + TILE_H / 2 + 10 + bob }, -1) };
    } else if (s.act === "toss" && job) {
      const fl = tileFlight(job, wf, x, 0);
      const up = prog(wf, job.toss + 3, job.toss + 8);
      const handY = fl ? fl.p.y + TILE_H / 2 : CARRY_Y + TILE_H / 2 - 40;
      const hy = mix(CARRY_Y + TILE_H / 2 + 18, Math.max(handY, CARRY_Y - 40), up);
      const lower = prog(wf, job.toss + 10, job.snap + 4);
      const y = mix(hy, GY - 330, lower);
      pose = { ...pose, lean: -6 * up, head: -10, armB: reach(rig, "B", { x: x - 48 * face, y }, -1), armF: reach(rig, "F", { x: x + 48 * face, y }, -1), bob: 6 * Math.sin(Math.PI * prog(wf, job.toss, job.toss + 6)) };
    } else if (s.act === "look") {
      pose = { ...pose, head: -16 + 4 * Math.sin(wf * 0.2) };
    } else if (s.act === "hi5") {
      const u = prog(wf, 342, 362);
      const lift = Math.sin(Math.PI * clamp(u * 1.4));
      pose = { ...pose, head: -6, armF: reach(rig, "F", { x: mix(x + 30 * face, 540, lift), y: mix(GY - 160, GY - 330, lift) }, -1) };
    }
    return { rig: { ...rig, lean: pose.lean, bob: pose.bob }, pose, x };
  };
  const gL = ground("L");
  const gR = ground("R");
  const carrierX = (j: TileJob) => (j.worker === "L" ? gL.x : gR.x);
  const carrierBob = (j: TileJob) => (j.worker === "L" ? gL.pose.bob ?? 0 : gR.pose.bob ?? 0);

  // ladder workers
  const RIG_LL: Rig = { x: 185, y: 716, s: 1, facing: 1, lean: 0 };
  const RIG_LR: Rig = { x: 895, y: 716, s: 1, facing: -1, lean: 0 };
  const nod = f >= 286 && f < 306 ? 10 * Math.sin(prog(f, 286, 306) * Math.PI * 2) : 0;
  const tapAt = (t0: number) => Math.sin(Math.PI * clamp((f - t0) / 8)) * (f >= t0 && f < t0 + 8 ? 1 : 0);
  const llHand: Pt = (() => {
    const rest = { x: 238, y: 620 };
    const tapIntro = Math.max(tapAt(8), tapAt(18));
    if (tapIntro > 0) return { x: mix(rest.x, 272, tapIntro), y: mix(rest.y, 820, tapIntro) };
    const t5 = tapAt(JOBS[4].snap + 2);
    if (t5 > 0) return { x: mix(rest.x, 300, t5), y: mix(rest.y, 820, t5) };
    if (f >= 404) return { x: RIG_LL.x + 30 + 20 * Math.sin((wf - 404) * 0.45), y: RIG_LL.y - 330 };
    return rest;
  })();
  const wiping = f >= 330 && f < 384;
  const lrHand: Pt = (() => {
    const rest = { x: W - 238, y: 620 };
    const t6 = tapAt(JOBS[5].snap + 2);
    if (t6 > 0) return { x: mix(rest.x, 780, t6), y: mix(rest.y, 820, t6) };
    if (wiping) {
      const a = (wf - 330) * 0.35;
      return { x: 800 + 26 * Math.cos(a), y: 760 + 60 * Math.sin(a) + 60 * prog(f, 330, 384) };
    }
    if (f >= 404) return { x: RIG_LR.x - 30 - 20 * Math.sin((wf - 404) * 0.45), y: RIG_LR.y - 330 };
    return rest;
  })();
  const ladderPose = (rig: Rig, hand: Pt, rail: Pt): Pose => ({
    lean: 0,
    head: nod * rig.facing + (f >= 270 && f < 330 ? 8 : 0),
    armF: reach(rig, "F", hand, f >= 404 ? -1 : 1),
    armB: reach(rig, "B", rail, 1),
    ...STAND,
  });

  // page state
  const heroStrike = easeOut(prog(f, 272, 286));
  const heroGreen = clamp(backOut(prog(f, 284, 298)), 0, 1.2);
  const pulse = 0.5 + 0.5 * Math.sin(f * 0.25);

  return (
    <AbsoluteFill style={{ background: C.cream }}>
      <Studio />
      <div style={{ position: "absolute", left: 0, top: 0, width: W, height: H, transform: stageTransform, transformOrigin: "0 0" }}>
        <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
          <Ladder side={1} />
          <Ladder side={-1} />
        </svg>

        <PhoneShell glare={prog(f, 334, 376)}>
          <div style={{ position: "absolute", inset: 0, background: "#FFFFFF" }} />
          <HeroBand strike={heroStrike} green={heroGreen} />
          {JOBS.map((j) => {
            const s = slotScreen(j.col, j.row);
            const p = products[j.pid];
            const snapped = f >= j.snap;
            const k = f - j.snap;
            const sq = snapped ? 1 + 0.07 * Math.exp(-k / 4) * Math.cos(k * 0.9) : 1;
            return (
              <div key={j.pid} style={{ position: "absolute", left: s.x, top: s.y, transform: `scale(${sq})` }}>
                {snapped && p ? (
                  <Tile p={p} pill={clamp(backOut(prog(f, j.snap + 3, j.snap + 15)), 0, 1.2)} strike={easeOut(prog(f, j.snap + 10, j.snap + 22))} />
                ) : (
                  <EmptySlot pulse={pulse} />
                )}
              </div>
            );
          })}
          <StatusBar />
        </PhoneShell>

        <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
          <Worker rig={RIG_LL} look={LOOKS.ladderL} shadow={false} pose={ladderPose(RIG_LL, llHand, { x: 162, y: 634 })} />
          <Worker
            rig={RIG_LR}
            look={LOOKS.ladderR}
            shadow={false}
            pose={ladderPose(RIG_LR, lrHand, { x: W - 162, y: 634 })}
            mid={wiping ? <rect x={lrHand.x - 22} y={lrHand.y - 18} width={44} height={36} rx={8} fill={C.lime} transform={`rotate(${12 * Math.sin(wf * 0.35)} ${lrHand.x} ${lrHand.y})`} /> : undefined}
          />
          <Worker rig={gL.rig} look={LOOKS.roller} pose={gL.pose} />
          <Worker rig={gR.rig} look={LOOKS.brush} pose={gR.pose} />
        </svg>

        {/* tiles in flight (in front of the crew) */}
        {JOBS.map((j) => {
          const fl = tileFlight(j, wf, carrierX(j), carrierBob(j) * GS);
          const p = products[j.pid];
          if (!fl || !p) return null;
          return (
            <div
              key={`fly${j.pid}`}
              style={{
                position: "absolute",
                left: fl.p.x - TILE_W / 2,
                top: fl.p.y - TILE_H / 2,
                transform: `rotate(${fl.rot}deg) scale(${fl.scale})`,
                filter: "drop-shadow(0 14px 18px rgba(13,59,46,0.22))",
              }}
            >
              <Tile p={p} pill={0} strike={0} />
            </div>
          );
        })}
      </div>

      <EndCard t={prog(f, 394, 420)} />
    </AbsoluteFill>
  );
};
