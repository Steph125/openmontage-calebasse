// Calebasse — Racine de ginseng, « l'allée » (13 s). Reference grammar: an endless corridor of identical
// containers, one continuous forward move, focus settling on the hero, rising mist, single sage-green hue.
import React from "react";
import { AbsoluteFill, Img, OffthreadVideo, staticFile, useCurrentFrame } from "remotion";
import { BRUSH, Grain, H, SANS, Sweep, Vignette, W, clamp, inOut, inOutSine, mix, out3, out5, prog, settle } from "./kit";

const JAR = "img/jar_ginseng.png";
const JAR_RATIO = 400 / 408;
const FOV = 1100;
const CX = 540;
const CY = 880;
const FLOOR = 430; // world y of the floor (below the eye)
const JAR_W = 450; // world width of a jar
const HERO_Z = 8600;

type Jar = { x: number; z: number; hero?: boolean };
const JARS: Jar[] = (() => {
  const out: Jar[] = [];
  for (let z = 700; z <= 8800; z += 470) {
    out.push({ x: -440, z }, { x: 440, z }, { x: -920, z: z + 235 }, { x: 920, z: z + 235 });
  }
  out.push({ x: 0, z: HERO_Z, hero: true });
  return out;
})();

const camZ = (f: number) => mix(0, HERO_Z - 1100, inOut(prog(f, 0, 232))) + mix(0, 300, inOut(prog(f, 262, 312)));
const camY = (f: number) => mix(0, 130, inOut(prog(f, 262, 312)));
const focusZ = (f: number) => mix(2300, 1100, inOut(prog(f, 120, 240))) - mix(0, 300, inOut(prog(f, 262, 312)));

const Corridor: React.FC<{ f: number }> = ({ f }) => {
  const cz = camZ(f);
  const cy = camY(f);
  const fz = focusZ(f);
  const sway = Math.sin(f * 0.035) * 14;
  const items = JARS.map((j) => ({ ...j, Z: j.z - cz })).filter((j) => j.Z > 90).sort((a, b) => b.Z - a.Z);
  return (
    <>
      {items.map((j, i) => {
        const s = FOV / j.Z;
        const w = JAR_W * s;
        const h = w * JAR_RATIO;
        const x = CX + (j.x + sway * (j.hero ? 0 : 1)) * s;
        const yb = CY + (FLOOR - cy) * s;
        const blur = clamp((Math.abs(j.Z - fz) / fz) * 13, 0, 30);
        const haze = clamp((j.Z - 2500) / 6000, 0, 0.75); // atmospheric perspective
        const fadeNear = clamp((j.Z - 90) / 160);
        return (
          <React.Fragment key={i}>
            <Img src={staticFile(JAR)} style={{ position: "absolute", left: x - w / 2, top: yb, width: w, transform: "scaleY(-1)", transformOrigin: "50% 0%", opacity: 0.2 * fadeNear,
              filter: `blur(${blur + 3}px)`, WebkitMaskImage: "linear-gradient(to top, black 0%, transparent 50%)", maskImage: "linear-gradient(to top, black 0%, transparent 50%)" }} />
            <Img src={staticFile(JAR)} style={{ position: "absolute", left: x - w / 2, top: yb - h, width: w, opacity: fadeNear,
              filter: `blur(${blur}px) brightness(${1 - haze * 0.25}) saturate(${1 - haze * 0.5})` }} />
            {haze > 0.02 && (
              <div style={{ position: "absolute", left: x - w / 2, top: yb - h, width: w, height: h, background: "#9DB7A3", opacity: haze * 0.55, filter: `blur(${blur + 2}px)`,
                WebkitMaskImage: `url(${staticFile(JAR)})`, maskImage: `url(${staticFile(JAR)})`, WebkitMaskSize: "100% 100%", maskSize: "100% 100%" }} />
            )}
          </React.Fragment>
        );
      })}
    </>
  );
};

export const Scene: React.FC = () => {
  const f = useCurrentFrame();
  const corridor = f < 318;
  const macro = f >= 318 && f < 352;
  const end = f >= 352;
  const zh = out5(prog(f, 268, 292)) * (1 - out3(prog(f, 306, 318)));
  return (
    <AbsoluteFill style={{ background: "#1B2E24" }}>
      {/* sage studio: bright vanishing point, darker floor */}
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, #355446 0%, #6F8F79 38%, #A9C2AE 46%, #4C6B58 54%, #1E3428 100%)" }} />
      <div style={{ position: "absolute", left: CX - 420, top: CY - 380, width: 840, height: 760, borderRadius: "50%", background: "radial-gradient(closest-side, rgba(236,246,232,0.85), rgba(236,246,232,0))" }} />
      {corridor && <Corridor f={f} />}
      {macro && (() => {
        const l = f - 318;
        return (
          <>
            <div style={{ position: "absolute", inset: 0, background: "radial-gradient(80% 60% at 50% 45%, #A9C2AE 0%, #4C6B58 60%, #1E3428 100%)" }} />
            <Img src={staticFile("img/bowl_ginseng.png")} style={{ position: "absolute", width: 860, left: 330, top: 520, transform: `scale(${mix(1.02, 1.12, l / 34)}) rotate(${mix(-4, 3, l / 34)}deg)`, filter: "drop-shadow(0 30px 40px rgba(0,0,0,0.35))" }} />
            <div style={{ position: "absolute", left: 90, right: 0, top: 1330, textAlign: "left", fontFamily: SANS, color: "#F4F7F1", opacity: out3(prog(l, 4, 18)) }}>
              <div style={{ fontWeight: 300, fontSize: 40, letterSpacing: "0.08em" }}>Tranches de racine</div>
            </div>
          </>
        );
      })()}
      {end && (() => {
        const l = f - 352;
        const up = settle(l, 0.24, 0.18);
        const t = out3(prog(l, 6, 22));
        return (
          <>
            <div style={{ position: "absolute", inset: 0, background: "radial-gradient(75% 55% at 50% 42%, #B7CDB9 0%, #5E7E69 55%, #1E3428 100%)" }} />
            <Img src={staticFile(JAR)} style={{ position: "absolute", width: 500, left: 540 - 250, top: 640 + (1 - up) * 60, filter: "drop-shadow(0 36px 40px rgba(0,0,0,0.35))" }} />
            <Img src={staticFile(JAR)} style={{ position: "absolute", width: 500, left: 540 - 250, top: 640 + 490 + (1 - up) * 60, transform: "scaleY(-1)", transformOrigin: "50% 0%", opacity: 0.18, filter: "blur(4px)",
              WebkitMaskImage: "linear-gradient(to top, black 0%, transparent 45%)", maskImage: "linear-gradient(to top, black 0%, transparent 45%)" }} />
            <div style={{ position: "absolute", left: 0, right: 0, top: 220, display: "flex", justifyContent: "center", opacity: t }}>
              <Img src={staticFile("brand/logo_ivory.svg")} style={{ height: 60 }} />
            </div>
            <div style={{ position: "absolute", left: 0, right: 0, top: 1330, textAlign: "center", fontFamily: SANS, color: "#F4F7F1", opacity: t, transform: `translateY(${(1 - t) * 24}px)` }}>
              <div style={{ fontWeight: 700, fontSize: 68, letterSpacing: "-0.02em" }}>Racine de ginseng</div>
              <div style={{ fontWeight: 300, fontSize: 40, marginTop: 6 }}>« Le roi des herbes »</div>
              <div style={{ fontWeight: 500, fontSize: 26, letterSpacing: "0.18em", textTransform: "uppercase", marginTop: 18, color: "#D6E6CF" }}>Ren shen · calebasse.com</div>
            </div>
          </>
        );
      })()}
      {/* rising warm mist (real smoke footage, screen-blended) */}
      <div style={{ position: "absolute", inset: 0, mixBlendMode: "screen", opacity: end ? 0.22 : 0.34 }}>
        <OffthreadVideo src={staticFile("video/smoke.mp4")} muted style={{ position: "absolute", width: 1920 * 1.9, height: 1080 * 1.9, left: 540 - 960 * 1.9, top: 1920 - 1080 * 1.9 + 120, transform: "rotate(-90deg)", transformOrigin: "50% 50%", filter: "sepia(0.35) brightness(1.1)" }} />
      </div>
      {corridor && f >= 232 && <Sweep t={prog(f, 236, 266)} opacity={0.22} />}
      {/* brush signature on the close-up */}
      {zh > 0 && (
        <div style={{ position: "absolute", left: 0, right: 0, top: 230, textAlign: "center", fontFamily: BRUSH, fontSize: 260, color: "rgba(244,247,241,0.9)", opacity: zh, transform: `translateY(${(1 - zh) * 40}px)`, textShadow: "0 10px 40px rgba(0,0,0,0.25)" }}>
          人参
        </div>
      )}
      <Vignette strength={0.42} color="10,25,18" />
      <Grain f={f} id="gi" opacity={0.06} />
    </AbsoluteFill>
  );
};
