// Calebasse — Poudre de perle, « la source » (16 s). Reference grammar: the vessel in light filtered by plants,
// levitation beaded with water, a splash, a mossy island standing in water, a sober brand card.
// Story: freshwater pearls — water is the origin of the product.
import React from "react";
import { AbsoluteFill, Img, OffthreadVideo, Sequence, staticFile, useCurrentFrame } from "remotion";
import { BRUSH, Cut, Grain, H, Reflect, SANS, Sweep, Vignette, W, clamp, inOut, mix, out3, out5, prog, rng, settle } from "./kit";

const JAR = "img/jar_perle.png";
const JAR_RATIO = 472 / 400;
const FOREST = "#0D3B2E";
const MIST = "#DCE7E0";

const Pearl: React.FC<{ x: number; y: number; r: number; rot?: number }> = ({ x, y, r, rot = 0 }) => (
  <svg width={r * 2.4} height={r * 2.4} viewBox="-60 -60 120 120" style={{ position: "absolute", left: x - r * 1.2, top: y - r * 1.2, overflow: "visible", filter: "drop-shadow(0 6px 6px rgba(0,0,0,0.25))" }}>
    <defs>
      <radialGradient id="pearlB" cx="-0.22" cy="-0.28" r="1.05">
        <stop offset="0" stopColor="#FFFFFF" />
        <stop offset="0.35" stopColor="#F3EEE7" />
        <stop offset="0.75" stopColor="#CFC6BB" />
        <stop offset="1" stopColor="#9A9187" />
      </radialGradient>
      <linearGradient id="iri" x1="0" x2="1" y1="0" y2="1">
        <stop offset="0" stopColor="#F7D9E6" stopOpacity="0.55" />
        <stop offset="0.5" stopColor="#D9F0E9" stopOpacity="0.4" />
        <stop offset="1" stopColor="#E6DFF7" stopOpacity="0.5" />
      </linearGradient>
    </defs>
    <circle r="50" fill="url(#pearlB)" />
    <circle r="50" fill="url(#iri)" transform={`rotate(${rot})`} style={{ mixBlendMode: "overlay" }} />
    <ellipse cx="-17" cy="-20" rx="13" ry="8" fill="#FFFFFF" opacity="0.9" transform="rotate(-35 -17 -20)" />
  </svg>
);

/** Water beads on the jar: masked by the jar's own alpha so they only sit on the glass. */
const Beads: React.FC<{ x: number; y: number; w: number; rot: number; t: number; f: number }> = ({ x, y, w, rot, t, f }) => {
  const h = w * JAR_RATIO;
  const r = rng(77);
  const beads = Array.from({ length: 56 }, () => ({ bx: r(), by: r(), s: 5 + r() * 10, slide: r() < 0.18 }));
  return (
    <div style={{ position: "absolute", left: x - w / 2, top: y - h, width: w, height: h, transform: `rotate(${rot}deg)`, transformOrigin: "50% 100%",
      WebkitMaskImage: `url(${staticFile(JAR)})`, maskImage: `url(${staticFile(JAR)})`, WebkitMaskSize: "100% 100%", maskSize: "100% 100%", opacity: t }}>
      {beads.map((b, i) => {
        const dy = b.slide ? ((f * 1.2 + i * 37) % (h * 0.6)) : 0;
        return (
          <div key={i} style={{ position: "absolute", left: b.bx * w, top: b.by * h * 0.92 + dy, width: b.s, height: b.s * 1.12, borderRadius: "50%",
            background: "radial-gradient(circle at 34% 28%, rgba(255,255,255,0.75) 0 10%, rgba(255,255,255,0.06) 26%, rgba(255,255,255,0.02) 55%, rgba(8,24,18,0.38) 82%, rgba(220,240,232,0.35) 100%)", opacity: 0.85 }} />
        );
      })}
    </div>
  );
};

const Drops: React.FC<{ x: number; y: number; l: number }> = ({ x, y, l }) => {
  const r = rng(5);
  return (
    <>
      {Array.from({ length: 8 }, (_, i) => {
        const t0 = i * 9 + r() * 6;
        const k = ((l - t0) % 60) / 60;
        if (l < t0) return null;
        const dx = (r() - 0.5) * 160;
        return <div key={i} style={{ position: "absolute", left: x + dx, top: y + k * k * 620, width: 9, height: 15, borderRadius: "50% 50% 50% 50% / 60% 60% 40% 40%", background: "rgba(230,245,238,0.75)", opacity: 1 - k }} />;
      })}
    </>
  );
};

export const Scene: React.FC = () => {
  const f = useCurrentFrame();
  const S1 = f < 96, S2 = f >= 96 && f < 196, S3 = f >= 196 && f < 286, S4 = f >= 286 && f < 410, S5 = f >= 410;
  return (
    <AbsoluteFill style={{ background: "#1A2620" }}>
      {/* S1 — sunlit still life: the jar on pale stone, foliage shadows, a pearl rolls in */}
      {S1 && (() => {
        const push = inOut(f / 96);
        const roll = out5(prog(f, 18, 70));
        const px = mix(1180, 760, roll);
        return (
          <div style={{ position: "absolute", inset: 0, transform: `scale(${mix(1.06, 1.0, push)})` }}>
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, #E9E4DA 0%, #DCD4C6 58%, #C9BFAE 100%)" }} />
            <div style={{ position: "absolute", left: 0, right: 0, top: 1240, bottom: 0, background: "linear-gradient(180deg, #CFC5B4, #BBAF9C)" }} />
            <Img src={staticFile("img/leaf_shadows.png")} style={{ position: "absolute", left: -260 + Math.sin(f * 0.04) * 26, top: -120, width: 1700, opacity: 0.55, filter: "blur(5px)" }} />
            <div style={{ position: "absolute", left: 540 - 250, width: 500, top: 1226, height: 46, borderRadius: "50%", background: "radial-gradient(closest-side, rgba(40,35,25,0.45), rgba(40,35,25,0))" }} />
            <Cut src={JAR} x={540} y={1250} w={430} />
            <div style={{ position: "absolute", left: 540 - 215, top: 1250 - 430 * JAR_RATIO, width: 430, height: 430 * JAR_RATIO, overflow: "hidden",
              WebkitMaskImage: `url(${staticFile(JAR)})`, maskImage: `url(${staticFile(JAR)})`, WebkitMaskSize: "100% 100%", maskSize: "100% 100%" }}>
              <Img src={staticFile("img/leaf_shadows.png")} style={{ position: "absolute", left: -260 - (540 - 215) + Math.sin(f * 0.04) * 26, top: -120 - (1250 - 430 * JAR_RATIO), width: 1700, opacity: 0.4, filter: "blur(5px)" }} />
            </div>
            <Pearl x={px} y={1222} r={28} rot={-roll * 360} />
            <div style={{ position: "absolute", left: 0, right: 0, top: 260, textAlign: "center", fontFamily: SANS, color: "#3E4A42", opacity: out3(prog(f, 30, 50)) * (1 - out3(prog(f, 84, 96))) }}>
              <div style={{ fontWeight: 300, fontSize: 40, letterSpacing: "0.16em", textTransform: "uppercase" }}>La perle entière</div>
              <div style={{ fontWeight: 700, fontSize: 84, letterSpacing: "-0.03em", lineHeight: 1.04, color: FOREST }}>et rien d'autre.</div>
            </div>
          </div>
        );
      })()}
      {/* S2 — levitation, beaded with water */}
      {S2 && (() => {
        const l = f - 96;
        const y = 1150 + Math.sin(l * 0.07) * 18 - settle(l, 0.18, 0.14) * 40;
        const rot = mix(-9, 7, inOut(l / 100));
        return (
          <>
            <div style={{ position: "absolute", inset: 0, background: "radial-gradient(70% 55% at 50% 42%, #44574C 0%, #24332B 55%, #0F1713 100%)" }} />
            <Reflect src={JAR} x={540} y={1480} w={440} strength={0.12} blur={6} rot={rot} />
            <Cut src={JAR} x={540} y={y} w={440} rot={rot} shadow="0 40px 50px rgba(0,0,0,0.45)" />
            <Beads x={540} y={y} w={440} rot={rot} t={out3(prog(l, 4, 30))} f={f} />
            <Drops x={540} y={y + 6} l={l} />
            <Sweep t={prog(l, 30, 70)} opacity={0.22} />
            <div style={{ position: "absolute", left: 0, right: 0, top: 260, textAlign: "center", fontFamily: SANS, color: MIST, opacity: out3(prog(l, 18, 36)) * (1 - out3(prog(l, 88, 100))) }}>
              <div style={{ fontWeight: 300, fontSize: 44, letterSpacing: "0.12em", textTransform: "uppercase" }}>Perles d'eau douce</div>
              <div style={{ fontWeight: 700, fontSize: 76, letterSpacing: "-0.02em", lineHeight: 1.05 }}>finement broyées</div>
            </div>
          </>
        );
      })()}
      {/* S3 — the splash (real high-speed footage, screen-blended on the dark set) */}
      {S3 && (() => {
        const l = f - 196;
        const rot = mix(6, -4, inOut(l / 90));
        return (
          <>
            <div style={{ position: "absolute", inset: 0, background: "radial-gradient(70% 55% at 50% 45%, #33463B 0%, #18231D 60%, #0A110D 100%)" }} />
            <Sequence from={196} durationInFrames={90} layout="none">
              <div style={{ position: "absolute", inset: 0, mixBlendMode: "screen", opacity: 0.95, WebkitMaskImage: "radial-gradient(60% 55% at 50% 45%, black 55%, transparent 100%)", maskImage: "radial-gradient(60% 55% at 50% 45%, black 55%, transparent 100%)" }}>
                <OffthreadVideo src={staticFile("video/stream.mp4")} muted startFrom={30} style={{ position: "absolute", left: 540 - 0.32 * 2688, top: 60, width: 2688, height: 1512, filter: "saturate(0.4) contrast(1.9) brightness(1.1)" }} />
              </div>
            </Sequence>
            <Cut src={JAR} x={540} y={1240} w={460} rot={rot} shadow="0 40px 50px rgba(0,0,0,0.45)" />
            <Beads x={540} y={1240} w={460} rot={rot} t={1} f={f} />
            <Sequence from={196} durationInFrames={90} layout="none">
              <div style={{ position: "absolute", inset: 0, mixBlendMode: "screen", opacity: 0.8, transform: "scale(1.35) rotate(-10deg) translateY(80px)", WebkitMaskImage: "radial-gradient(60% 55% at 50% 45%, black 55%, transparent 100%)", maskImage: "radial-gradient(60% 55% at 50% 45%, black 55%, transparent 100%)" }}>
                <OffthreadVideo src={staticFile("video/splash.mp4")} muted playbackRate={0.55} style={{ width: W, height: H, objectFit: "cover", filter: "contrast(1.7) brightness(1.3)" }} />
              </div>
            </Sequence>
          </>
        );
      })()}
      {/* S4 — the mossy island in water */}
      {S4 && (() => {
        const l = f - 286;
        const push = inOut(l / 124);
        const s = mix(1.0, 1.1, push);
        return (
          <div style={{ position: "absolute", inset: 0, transform: `scale(${s})`, transformOrigin: "61% 50%" }}>
            <Img src={staticFile("img/moss_rock.jpg")} style={{ position: "absolute", left: -100, top: 0, width: 1280, height: 1920, filter: "saturate(0.78) hue-rotate(-14deg) brightness(0.86) contrast(1.04)" }} />
            <Sequence from={286} durationInFrames={124} layout="none">
              <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 820, mixBlendMode: "soft-light", opacity: 0.5 }}>
                <OffthreadVideo src={staticFile("video/ripples.mp4")} muted style={{ width: W, height: 820, objectFit: "cover" }} />
              </div>
            </Sequence>
            <div style={{ position: "absolute", left: 660 - 150, width: 300, top: 962, height: 36, borderRadius: "50%", background: "radial-gradient(closest-side, rgba(5,15,10,0.6), rgba(5,15,10,0))" }} />
            <Cut src={JAR} x={660} y={984} w={250} style={{ filter: "brightness(0.92) saturate(0.9) drop-shadow(0 10px 14px rgba(0,0,0,0.4))" }} />
            <Pearl x={760} y={968} r={13} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(220,231,224,0.18) 0%, rgba(0,0,0,0) 40%, rgba(5,15,10,0.35) 100%)" }} />
          </div>
        );
      })()}
      {S4 && (
        <div style={{ position: "absolute", left: 0, right: 0, top: 250, textAlign: "center", fontFamily: SANS, color: "#F2F7F3", opacity: out3(prog(f, 306, 326)) * (1 - out3(prog(f, 398, 410))), textShadow: "0 6px 30px rgba(0,0,0,0.45)" }}>
          <div style={{ fontWeight: 700, fontSize: 80, letterSpacing: "-0.02em", lineHeight: 1.05 }}>Née de l'eau douce.</div>
          <div style={{ fontWeight: 400, fontSize: 36, marginTop: 10 }}>0 additif, 0 excipient.</div>
        </div>
      )}
      {/* S5 — brand card */}
      {S5 && (() => {
        const l = f - 410;
        const t = out3(prog(l, 4, 22));
        const up = settle(l - 6, 0.22, 0.17);
        return (
          <>
            <div style={{ position: "absolute", inset: 0, background: "radial-gradient(80% 60% at 50% 40%, #155A45 0%, #0D3B2E 60%, #082319 100%)" }} />
            <div style={{ position: "absolute", left: 0, right: 0, top: 240, display: "flex", justifyContent: "center", opacity: t }}>
              <Img src={staticFile("brand/logo_ivory.svg")} style={{ height: 64 }} />
            </div>
            <Cut src={JAR} x={540} y={1140 + (1 - up) * 80} w={380} shadow="0 34px 40px rgba(0,0,0,0.45)" />
            <Pearl x={690} y={1108 + (1 - up) * 80} r={22} />
            <div style={{ position: "absolute", left: 0, right: 0, top: 1220, textAlign: "center", fontFamily: SANS, color: "#F7F5EE", opacity: t, transform: `translateY(${(1 - t) * 24}px)` }}>
              <div style={{ fontWeight: 700, fontSize: 72, letterSpacing: "-0.02em" }}>Poudre de perle</div>
              <div style={{ fontWeight: 400, fontSize: 34, color: "#D3E3D8", marginTop: 8 }}>Zhen zhu fen · <span style={{ fontFamily: BRUSH }}>珍珠粉</span></div>
              <div style={{ fontWeight: 600, fontSize: 30, color: "#C9EC7A", marginTop: 28 }}>calebasse.com</div>
            </div>
          </>
        );
      })()}
      <Vignette strength={0.34} color="5,15,10" />
      <Grain f={f} id="pe" opacity={0.06} />
    </AbsoluteFill>
  );
};
