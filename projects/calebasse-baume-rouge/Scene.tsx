// Calebasse — Baume Panacé Rouge (12 s). Reference grammar: single-hue texture film — product levitating
// with reflection, ultra-close cream waves, a spatula, the product laid on its own texture. Hue: amber-cinnamon.
import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { Cut, Grain, H, Reflect, SANS, Sweep, Vignette, W, clamp, inOut, mix, out3, out5, prog, settle } from "./kit";

const AMBER = "#D49A5C";
const LIGHT = "#F2CB93";
const DEEP = "#8E4F22";
const CINNAMON = "#5E2C12";
const CREAM = "#FFF4E6";

// ------------------------------------------------------------------ procedural balm: lit relief in one hue (crisp at any scale)
const Balm: React.FC<{ f: number; id: string; freq?: string; drift?: number; scale?: number; rot?: number; tone?: string; light?: number }> = ({ f, id, freq = "0.0011 0.0042", drift = 0.6, scale = 1, rot = -14, tone = AMBER, light = 38 }) => (
  <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
    <defs>
      <filter id={`balm-${id}`} x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
        <feTurbulence type="fractalNoise" baseFrequency="0.0016" numOctaves={2} seed={11} result="warp" />
        <feTurbulence type="fractalNoise" baseFrequency={freq} numOctaves={2} seed={7} result="n0" />
        <feDisplacementMap in="n0" in2="warp" scale={260} xChannelSelector="R" yChannelSelector="G" result="n" />
        <feGaussianBlur in="n" stdDeviation="6" result="nb" />
        <feDiffuseLighting in="nb" surfaceScale={26} diffuseConstant={1.0} lightingColor="#FFE9C8" result="dif">
          <feDistantLight azimuth={232} elevation={light} />
        </feDiffuseLighting>
        <feSpecularLighting in="nb" surfaceScale={26} specularConstant={1.1} specularExponent={22} lightingColor="#FFF7EA" result="spec">
          <feDistantLight azimuth={232} elevation={light + 6} />
        </feSpecularLighting>
        <feBlend in="SourceGraphic" in2="dif" mode="multiply" result="lit" />
        <feComposite in="lit" in2="spec" operator="arithmetic" k1={0} k2={1} k3={0.55} k4={0} />
      </filter>
    </defs>
    <g transform={`translate(540 960) rotate(${rot}) scale(${scale}) translate(${-540 - f * drift} ${-960 + f * drift * 0.35})`}>
      <rect x={-900} y={-900} width={W + 1800} height={H + 1800} fill={tone} filter={`url(#balm-${id})`} />
    </g>
  </svg>
);

const Spatula: React.FC<{ x: number; y: number; rot: number; dollop: number }> = ({ x, y, rot, dollop }) => (
  <svg width={W} height={H} style={{ position: "absolute", inset: 0, filter: "drop-shadow(0 22px 24px rgba(60,25,8,0.35))" }}>
    <defs>
      <linearGradient id="wood" x1="0" x2="1">
        <stop offset="0" stopColor="#E4C9A2" />
        <stop offset="0.5" stopColor="#F3E1C4" />
        <stop offset="1" stopColor="#CDAE82" />
      </linearGradient>
      <radialGradient id="dol" cx="0.38" cy="0.32" r="0.8">
        <stop offset="0" stopColor="#FFF1D9" />
        <stop offset="0.25" stopColor={LIGHT} />
        <stop offset="1" stopColor={DEEP} />
      </radialGradient>
    </defs>
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>
      <rect x={-34} y={-900} width={68} height={900} rx={30} fill="url(#wood)" />
      <path d="M -52 -40 Q -60 30 0 46 Q 60 30 52 -40 Z" fill="url(#wood)" />
      {dollop > 0 && (
        <path d={`M -48 ${10} C -60 ${-20 - 40 * dollop} 60 ${-20 - 40 * dollop} 48 10 C 40 ${40 + 30 * dollop} -40 ${40 + 30 * dollop} -48 10 Z`} fill="url(#dol)" opacity={dollop} />
      )}
    </g>
  </svg>
);

const Words: React.FC<{ lines: string[]; l: number; top: number; color?: string; size?: number; weight?: number }> = ({ lines, l, top, color = CREAM, size = 44, weight = 500 }) => (
  <div style={{ position: "absolute", left: 90, right: 90, top, fontFamily: SANS, color }}>
    {lines.map((t, i) => {
      const k = out5(prog(l, 4 + i * 6, 20 + i * 6));
      return (
        <div key={i} style={{ fontWeight: weight, fontSize: size, lineHeight: 1.28, letterSpacing: "0.01em", opacity: k, transform: `translateY(${(1 - k) * 26}px)` }}>{t}</div>
      );
    })}
  </div>
);

export const Scene: React.FC = () => {
  const f = useCurrentFrame();
  const shot = (a: number, b: number) => (f >= a && f < b ? f - a : null);
  const A = shot(0, 54), B = shot(54, 112), C = shot(112, 162), D = shot(162, 218), E = shot(218, 272), F = shot(272, 312), G = shot(312, 360);
  return (
    <AbsoluteFill style={{ background: AMBER }}>
      {/* A — ultra-close balm waves */}
      {A !== null && (
        <>
          <Balm f={f} id="a" scale={mix(1.35, 1.15, inOut(A / 54))} />
          <div style={{ position: "absolute", inset: 0, background: `radial-gradient(90% 70% at 40% 35%, rgba(255,236,205,0.35), rgba(142,79,34,0.25))` }} />
        </>
      )}
      {/* B — the tin levitating over its reflection */}
      {B !== null && (() => {
        const up = settle(B, 0.2, 0.12);
        const y = 1120 + (1 - up) * 180 + Math.sin(B * 0.08) * 10;
        const rot = mix(-10, 4, inOut(B / 58));
        return (
          <>
            <div style={{ position: "absolute", inset: 0, background: `radial-gradient(70% 55% at 50% 42%, ${LIGHT} 0%, ${AMBER} 55%, ${DEEP} 100%)` }} />
            <div style={{ position: "absolute", left: 0, right: 0, top: 1240, bottom: 0, background: `linear-gradient(180deg, rgba(142,79,34,0) 0%, rgba(142,79,34,0.45) 100%)` }} />
            <div style={{ position: "absolute", left: 540 - 260, width: 520, top: 1300, height: 70, borderRadius: "50%", background: "radial-gradient(closest-side, rgba(70,30,10,0.35), rgba(70,30,10,0))", transform: `scale(${mix(0.7, 1, up)})` }} />
            <Reflect src="img/tin_top.png" x={540} y={1330} w={540} strength={0.22} blur={4} rot={rot} />
            <Cut src="img/tin_top.png" x={540} y={y} w={540} rot={rot} shadow="0 40px 40px rgba(70,30,10,0.35)" />
            <Sweep t={prog(B, 18, 50)} opacity={0.28} />
          </>
        );
      })()}
      {/* C — skin & balm macro (real photo, shown near native size) */}
      {C !== null && (
        <>
          <Balm f={f} id="c" scale={1.6} tone="#C98C52" light={30} />
          <div style={{ position: "absolute", left: -40, right: -40, top: 520, height: 900, overflow: "hidden", borderRadius: 0,
            WebkitMaskImage: "linear-gradient(180deg, transparent 0%, black 14%, black 86%, transparent 100%)", maskImage: "linear-gradient(180deg, transparent 0%, black 14%, black 86%, transparent 100%)" }}>
            <Img src={staticFile("img/texture_finger.jpg")} style={{ width: 1160, height: 860, objectFit: "cover", transform: `scale(${mix(1.04, 1.16, C / 50)}) translateX(${mix(10, -24, C / 50)}px)`, transformOrigin: "60% 40%" }} />
          </div>
          <Words lines={["Une texture souple,", "qui fond sous les doigts."]} l={C} top={1440} />
        </>
      )}
      {/* D — the open tin and the spatula */}
      {D !== null && (() => {
        const dip = inOut(prog(D, 6, 26));
        const lift = inOut(prog(D, 30, 52));
        const sx = mix(980, 820, dip) + mix(0, 40, lift);
        const sy = mix(520, 940, dip) - mix(0, 330, lift);
        return (
          <>
            <Balm f={f} id="d" scale={1.25} rot={8} tone="#CF9457" />
            <div style={{ position: "absolute", inset: 0, background: "radial-gradient(80% 60% at 70% 55%, rgba(255,236,205,0.25), rgba(94,44,18,0.35))" }} />
            <Img src={staticFile("img/tin_open.jpg")} style={{ position: "absolute", left: 1080 - 480 * 1.65, top: 960 - 460 * 1.65, width: 480 * 1.65, height: 920 * 1.65, objectFit: "cover",
              WebkitMaskImage: "radial-gradient(circle 600px at 85.4% 50%, black 97%, transparent 100%)", maskImage: "radial-gradient(circle 600px at 85.4% 50%, black 97%, transparent 100%)",
              transform: `scale(${mix(1.0, 1.06, D / 56)})`, transformOrigin: "100% 50%" }} />
            <Spatula x={sx} y={sy} rot={mix(-32, -22, dip)} dollop={lift} />
            <Words lines={["Prélever une noisette,", "masser doucement."]} l={D - 6} top={1480} color={CREAM} weight={600} />
          </>
        );
      })()}
      {/* E — what's inside */}
      {E !== null && (
        <>
          <div style={{ position: "absolute", inset: 0, background: `linear-gradient(160deg, ${CREAM} 0%, #F6E4CB 60%, ${LIGHT} 100%)` }} />
          <Img src={staticFile("img/ingredients_plants.jpg")} style={{ position: "absolute", right: -60, top: 300, height: 1320, transform: `translateY(${mix(40, -40, E / 54)}px) scale(${mix(1.02, 1.08, E / 54)})`,
            WebkitMaskImage: "linear-gradient(90deg, transparent 0%, black 30%)", maskImage: "linear-gradient(90deg, transparent 0%, black 30%)", mixBlendMode: "multiply" }} />
          <Words lines={["Cannelle, girofle", "& cajeput", "Menthe, eucalyptus", "& camphre", "Karité & sésame"]} l={E} top={560} color={CINNAMON} size={52} weight={600} />
          <div style={{ position: "absolute", left: 90, top: 1240, fontFamily: SANS, opacity: out3(prog(E, 30, 46)) }}>
            <div style={{ display: "inline-block", padding: "10px 22px", borderRadius: 999, background: "#B0442A", color: CREAM, fontWeight: 700, fontSize: 28, letterSpacing: "0.06em" }}>LE ROUGE DU LITHOSPERME</div>
          </div>
        </>
      )}
      {/* F — at home */}
      {F !== null && (
        <>
          <div style={{ position: "absolute", inset: 0, background: `linear-gradient(180deg, ${DEEP}, ${CINNAMON})` }} />
          <div style={{ position: "absolute", left: 0, right: 0, top: 560, height: 800, overflow: "hidden",
            WebkitMaskImage: "linear-gradient(180deg, transparent 0%, black 12%, black 88%, transparent 100%)", maskImage: "linear-gradient(180deg, transparent 0%, black 12%, black 88%, transparent 100%)" }}>
            <Img src={staticFile("img/lifestyle_table.jpg")} style={{ width: 1080 * 1.55, height: 520 * 1.55, objectFit: "cover", transform: `translateX(${mix(-120, -300, F / 40)}px) translateY(20px)` }} />
          </div>
          <Words lines={["Chauffant.", "Made in France."]} l={F} top={1420} />
        </>
      )}
      {/* G — the tin laid on its texture, end card */}
      {G !== null && (() => {
        const k = settle(G, 0.24, 0.16);
        const txt = out3(prog(G, 10, 28));
        return (
          <>
            <Balm f={f} id="g" scale={1.1} rot={-20} />
            <div style={{ position: "absolute", inset: 0, background: "radial-gradient(70% 50% at 50% 40%, rgba(255,240,215,0.45), rgba(94,44,18,0.35))" }} />
            <Cut src="img/tin_top.png" x={540} y={1050 + (1 - k) * 40} w={mix(640, 500, out5(prog(G, 0, 24)))} rot={mix(-24, -8, k)} shadow="0 30px 30px rgba(70,30,10,0.4)" />
            <div style={{ position: "absolute", left: 0, right: 0, top: 240, display: "flex", justifyContent: "center", opacity: txt }}>
              <Img src={staticFile("brand/logo_color.svg")} style={{ height: 60 }} />
            </div>
            <div style={{ position: "absolute", left: 0, right: 0, top: 1180, textAlign: "center", fontFamily: SANS, opacity: txt, transform: `translateY(${(1 - txt) * 26}px)` }}>
              <div style={{ fontWeight: 700, fontSize: 70, color: CINNAMON, letterSpacing: "-0.02em" }}>Baume Panacé Rouge</div>
              <div style={{ fontWeight: 400, fontSize: 38, color: "#6E3A18", marginTop: 6 }}>Chaleur & réconfort</div>
              <div style={{ fontWeight: 600, fontSize: 30, color: CREAM, marginTop: 26, display: "inline-block", padding: "10px 24px", borderRadius: 999, background: "#7A3A18" }}>calebasse.com</div>
            </div>
          </>
        );
      })()}
      <Vignette strength={0.32} color="60,25,8" />
      <Grain f={f} id="br" opacity={0.06} />
    </AbsoluteFill>
  );
};
