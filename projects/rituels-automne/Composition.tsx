import React from "react";
import {
  AbsoluteFill,
  Audio,
  CalculateMetadataFunction,
  Easing,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { loadFont as loadCormorant } from "@remotion/google-fonts/CormorantGaramond";
import { loadFont as loadJost } from "@remotion/google-fonts/Jost";
import { loadFont as loadNotoSC } from "@remotion/google-fonts/NotoSerifSC";

// ATELIER — "Le carnet d'automne". See art-direction.md.

const { fontFamily: SERIF } = loadCormorant("normal", { weights: ["300", "400", "500"], subsets: ["latin", "latin-ext"] });
const { fontFamily: SERIF_I } = loadCormorant("italic", { weights: ["400"], subsets: ["latin", "latin-ext"] });
const { fontFamily: SANS } = loadJost("normal", { weights: ["400", "500"], subsets: ["latin", "latin-ext"] });
const { fontFamily: HAN } = loadNotoSC("normal", { weights: ["300", "400"] });

const W = 1080;
const H = 1920;
const PAPER = "#F4EEE3";
const INK = "#2B2621";
const OCHRE = "#D9A54A";
const RUST = "#B5522B";
const SAGE = "#9AAE8C";
const DUSK = "#7C8FA8";
const METAL = "#AEB6BF";

const ease = Easing.bezier(0.33, 0, 0.2, 1); // settle
const soft = Easing.bezier(0.45, 0, 0.55, 1);
const ci = (x: number, a: number, b: number, from: number, to: number, e = ease) =>
  interpolate(x, [a, b], [from, to], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: e });
const hash = (i: number, k: number) => {
  const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453;
  return x - Math.floor(x);
};

// ---------------------------------------------------------------- timeline (s)
const S = {
  intro: [0, 7.6],
  gather: [7.4, 13.1],
  r1: [13.0, 18.3],
  r2: [18.2, 27.7],
  r3: [27.6, 33.7],
  r4: [33.6, 40.6],
  outro: [40.4, 48],
};

// ---------------------------------------------------------------- props
export interface Word {
  w: string;
  s: number;
  e: number;
}
export interface Line {
  i: number;
  text: string;
  file: string;
  dur: number;
  start: number;
  words: Word[];
  phrases: { text: string; s: number; e: number }[];
  keys?: string[];
}
export interface SceneProps {
  duration: number;
  lines: Line[];
}

// ---------------------------------------------------------------- drawing primitives
const GINKGO =
  "M0,0 C -30,-20 -80,-55 -98,-82 Q -84,-116 -34,-122 Q -9,-123 -5,-104 L 0,-80 L 5,-104 Q 9,-123 34,-122 Q 84,-116 98,-82 C 80,-55 30,-20 0,0 Z";
const GINKGO_STEM = "M0,0 C 3,25 -3,52 -12,74";
const PEAR =
  "M0,-150 C 25,-150 30,-110 45,-80 C 95,-20 112,60 82,110 C 56,152 -56,152 -82,110 C -112,60 -95,-20 -45,-80 C -30,-110 -25,-150 0,-150 Z";

// A stroke that draws itself between t0 and t1 (in section-local seconds)
const Drawn: React.FC<{
  d: string;
  t: number;
  t0: number;
  t1: number;
  stroke?: string;
  width?: number;
  fill?: string;
  fillIn?: [number, number];
  fillOpacity?: number;
}> = ({ d, t, t0, t1, stroke = INK, width = 3, fill, fillIn, fillOpacity = 1 }) => {
  const k = ci(t, t0, t1, 0, 1, soft);
  const fo = fillIn ? ci(t, fillIn[0], fillIn[1], 0, fillOpacity) : 0;
  return (
    <>
      {fill && <path d={d} fill={fill} opacity={fo} filter="url(#wash)" />}
      <path d={d} pathLength={1} fill="none" stroke={stroke} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={`${k} 1`} />
    </>
  );
};

const Leaf: React.FC<{ fill?: string; stroke?: string; sw?: number; veins?: number }> = ({ fill = OCHRE, stroke = INK, sw = 2, veins = 0 }) => (
  <g>
    <path d={GINKGO} fill={fill} stroke={stroke} strokeWidth={sw} strokeLinejoin="round" />
    <path d={GINKGO_STEM} fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round" />
    {new Array(veins).fill(0).map((_, i) => {
      const a = (-58 + (116 * i) / (veins - 1)) * (Math.PI / 180);
      return <line key={i} x1={0} y1={-6} x2={Math.sin(a) * 100} y2={-Math.cos(a) * 100 - 10} stroke={stroke} strokeWidth={0.8} opacity={0.35} />;
    })}
  </g>
);

// ---------------------------------------------------------------- background
const Paper: React.FC<{ t: number }> = ({ t }) => {
  const grain = `<svg xmlns='http://www.w3.org/2000/svg' width='540' height='960'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='3' seed='5'/><feColorMatrix values='0 0 0 0 0.45  0 0 0 0 0.38  0 0 0 0 0.3  0 0 0 0.16 0'/></filter><rect width='100%' height='100%' filter='url(#n)'/></svg>`;
  // wash colour per section
  const washes: [number, number, string, number, number][] = [
    [S.intro[0], S.gather[1], OCHRE, 0.28, 0.3],
    [S.r1[0], S.r1[1], DUSK, 0.3, 0.62],
    [S.r2[0], S.r2[1], METAL, 0.72, 0.4],
    [S.r3[0], S.r3[1], "#E8C77A", 0.3, 0.45],
    [S.r4[0], S.r4[1], RUST, 0.7, 0.3],
    [S.outro[0], S.outro[1], OCHRE, 0.5, 0.5],
  ];
  return (
    <AbsoluteFill style={{ background: PAPER }}>
      {washes.map(([a, b, c, x, y], i) => {
        const o = ci(t, a - 0.4, a + 1.2, 0, 1) * (1 - ci(t, b - 0.6, b + 0.6, 0, 1));
        if (o <= 0) return null;
        const s = 1000 + 120 * Math.sin(t * 0.2 + i);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x * W - s / 2 + 30 * Math.sin(t * 0.15 + i),
              top: y * H - s / 2,
              width: s,
              height: s * 1.1,
              borderRadius: "46% 54% 50% 50% / 55% 45% 55% 45%",
              background: `radial-gradient(circle at 45% 45%, ${c}55 0%, ${c}22 38%, ${c}00 68%)`,
              filter: "blur(22px)",
              opacity: o,
            }}
          />
        );
      })}
      <AbsoluteFill style={{ backgroundImage: `url("data:image/svg+xml;utf8,${encodeURIComponent(grain)}")`, backgroundSize: "100% 100%", mixBlendMode: "multiply" }} />
    </AbsoluteFill>
  );
};

// Ambient falling ginkgo leaves (few, slow)
const FallingLeaves: React.FC<{ t: number; count?: number; fade: number }> = ({ t, count = 5, fade }) => (
  <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0, opacity: fade }}>
    {new Array(count).fill(0).map((_, i) => {
      const period = 14 + hash(i, 1) * 8;
      const ph = hash(i, 2) * period;
      const k = ((t + ph) % period) / period;
      const x0 = 80 + hash(i, 3) * (W - 160);
      const x = x0 + Math.sin(k * Math.PI * 4 + i) * 70;
      const y = -120 + k * (H + 240);
      const rot = Math.sin(k * Math.PI * 4 + i) * 40 + hash(i, 4) * 60;
      const sc = 0.22 + hash(i, 5) * 0.16;
      return (
        <g key={i} transform={`translate(${x} ${y}) rotate(${rot}) scale(${sc})`} opacity={0.75}>
          <Leaf fill={i % 2 ? OCHRE : "#E3B85F"} stroke={INK} sw={4} />
        </g>
      );
    })}
  </svg>
);

// ---------------------------------------------------------------- section shell
const Section: React.FC<{ a: number; b: number; children: (t: number) => React.ReactNode }> = ({ a, b, children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps; // local
  const len = b - a;
  const o = ci(t, 0, 0.6, 0, 1) * (1 - ci(t, len - 0.55, len, 0, 1));
  const y = ci(t, len - 0.55, len, 0, -24);
  return <AbsoluteFill style={{ opacity: o, transform: `translateY(${y}px)` }}>{children(t)}</AbsoluteFill>;
};

const Numeral: React.FC<{ n: string; t: number; title: string; han: string; hanMeaning: string }> = ({ n, t, title, han, hanMeaning }) => (
  <div style={{ position: "absolute", top: 170, left: 0, right: 0, textAlign: "center" }}>
    <div
      style={{
        fontFamily: SERIF,
        fontWeight: 300,
        fontSize: 250,
        lineHeight: 0.9,
        color: OCHRE,
        fontVariantNumeric: "lining-nums",
        fontFeatureSettings: '"lnum" 1',
        opacity: ci(t, 0.1, 0.9, 0, 1),
        transform: `translateY(${ci(t, 0.1, 1.1, 30, 0)}px)`,
      }}
    >
      {n}
    </div>
    <div style={{ fontFamily: SERIF, fontWeight: 500, fontSize: 70, color: INK, marginTop: 10, opacity: ci(t, 0.4, 1.2, 0, 1), letterSpacing: 1 }}>{title}</div>
    <div style={{ fontFamily: HAN, fontWeight: 400, fontSize: 48, color: RUST, marginTop: 18, letterSpacing: 16, opacity: ci(t, 0.8, 1.6, 0, 1) }}>
      {han}
      <span style={{ fontFamily: SERIF_I, fontSize: 38, letterSpacing: 1, color: "#5f5245", marginLeft: 10 }}>{hanMeaning}</span>
    </div>
  </div>
);

// ---------------------------------------------------------------- sections
const Intro: React.FC<{ t: number; tMetal: number; tPoumon: number }> = ({ t, tMetal, tPoumon }) => {
  const settle = ci(t, 4.6, 7.4, 0, 1, soft);
  const sc = 3.1 - 0.5 * settle;
  const rot = -8 + 4 * Math.sin(t * 0.6);
  return (
    <>
      <svg width={W} height={H} style={{ position: "absolute" }}>
        <g transform={`translate(540 ${880 - 60 * settle}) rotate(${rot}) scale(${sc})`}>
          <Drawn d={GINKGO} t={t} t0={0.2} t1={2.6} width={1.1} fill={OCHRE} fillIn={[1.8, 3.4]} fillOpacity={0.85} />
          <Drawn d={GINKGO_STEM} t={t} t0={2.2} t1={2.9} width={1.1} />
          {new Array(13).fill(0).map((_, i) => {
            const a = (-58 + (116 * i) / 12) * (Math.PI / 180);
            const k = ci(t, 2.2 + i * 0.05, 3.2 + i * 0.05, 0, 1);
            return (
              <line key={i} x1={0} y1={-6} x2={Math.sin(a) * 100 * k} y2={(-Math.cos(a) * 100 - 10) * k - 6 * (1 - k)} stroke={INK} strokeWidth={0.35} opacity={0.5} />
            );
          })}
        </g>
      </svg>
      <div style={{ position: "absolute", top: 1230, left: 0, right: 0, textAlign: "center" }}>
        <div style={{ fontFamily: HAN, fontWeight: 300, fontSize: 120, color: INK, opacity: ci(t, 1.2, 2.4, 0, 1), letterSpacing: 10 }}>秋</div>
        <div style={{ fontFamily: SERIF, fontWeight: 400, fontSize: 58, color: INK, letterSpacing: 10, opacity: ci(t, 1.8, 2.8, 0, 1), marginTop: -6 }}>
          RITUELS D'AUTOMNE
        </div>
      </div>
      {/* element chips */}
      <div style={{ position: "absolute", top: 210, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 36 }}>
        {[
          { at: tMetal, zh: "金", fr: "Métal", c: METAL },
          { at: tPoumon, zh: "肺", fr: "Poumon", c: SAGE },
        ].map((x, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              padding: "12px 28px",
              border: `1.5px solid ${INK}33`,
              borderRadius: 40,
              background: "rgba(255,255,255,0.35)",
              opacity: ci(t, x.at - 0.1, x.at + 0.5, 0, 1),
              transform: `translateY(${ci(t, x.at - 0.1, x.at + 0.6, 14, 0)}px)`,
            }}
          >
            <span style={{ fontFamily: HAN, fontSize: 44, color: RUST }}>{x.zh}</span>
            <span style={{ fontFamily: SERIF, fontSize: 46, color: INK }}>{x.fr}</span>
          </div>
        ))}
      </div>
    </>
  );
};

const Gather: React.FC<{ t: number }> = ({ t }) => (
  <>
    <svg width={W} height={H} style={{ position: "absolute" }}>
      {[0, 1, 2, 3, 4].map((i) => {
        const r0 = 470 - i * 80;
        const k = ci(t, 0.3 + i * 0.35, 2.4 + i * 0.35, 0, 1, soft);
        const r = r0 * (1 - 0.18 * ci(t, 2.5, 5.2, 0, 1, soft));
        return (
          <circle
            key={i}
            cx={540}
            cy={900}
            r={r}
            fill="none"
            stroke={i === 4 ? RUST : INK}
            strokeWidth={i === 4 ? 3 : 1.5}
            opacity={0.25 + i * 0.15}
            pathLength={1}
            strokeDasharray={`${k * 0.92} 1`}
            transform={`rotate(${-90 + i * 40 + t * (6 - i)} 540 900)`}
          />
        );
      })}
    </svg>
    <div style={{ position: "absolute", top: 820, left: 0, right: 0, textAlign: "center", fontFamily: HAN, fontWeight: 300, fontSize: 150, color: INK, opacity: ci(t, 1.6, 2.8, 0, 1) }}>
      收
    </div>
    <div style={{ position: "absolute", top: 1420, left: 0, right: 0, textAlign: "center", fontFamily: SERIF_I, fontSize: 48, color: "#6d5f52", opacity: ci(t, 2.2, 3.2, 0, 1) }}>
      rassembler, récolter
    </div>
  </>
);

const Ritual1: React.FC<{ t: number }> = ({ t }) => {
  const rise = ci(t, 1.2, 4.6, 0, 1, soft);
  const set = ci(t, 0.6, 3.2, 0, 1, soft);
  const HY = 1080;
  return (
    <>
      <Numeral n="1" t={t} title="Dormir tôt, s'éveiller avec le jour" han="早卧早起" hanMeaning="— Huangdi Neijing" />
      <svg width={W} height={H} style={{ position: "absolute" }}>
        <defs>
          <clipPath id="sky">
            <rect x={0} y={0} width={W} height={HY} />
          </clipPath>
        </defs>
        <g clipPath="url(#sky)">
          {/* moon setting (left) */}
          <g transform={`translate(${300 - 60 * set} ${820 + 330 * set})`} opacity={1 - set * 0.4}>
            <path d="M 0 -58 A 58 58 0 1 0 0 58 A 44 44 0 1 1 0 -58 Z" fill={DUSK} opacity={0.55} />
            <path d="M 0 -58 A 58 58 0 1 0 0 58 A 44 44 0 1 1 0 -58 Z" fill="none" stroke={INK} strokeWidth={2} />
          </g>
          {/* sun rising (right) */}
          <g transform={`translate(${720} ${HY + 110 - 330 * rise})`}>
            <circle r={96} fill={OCHRE} opacity={0.7} filter="url(#wash)" />
            <circle r={96} fill="none" stroke={INK} strokeWidth={2} />
            {new Array(12).fill(0).map((_, i) => {
              const a = (i / 12) * Math.PI * 2;
              const k = ci(t, 3.0 + i * 0.05, 3.8 + i * 0.05, 0, 1);
              return <line key={i} x1={Math.cos(a) * 120} y1={Math.sin(a) * 120} x2={Math.cos(a) * (120 + 40 * k)} y2={Math.sin(a) * (120 + 40 * k)} stroke={INK} strokeWidth={2} opacity={k} strokeLinecap="round" />;
            })}
          </g>
        </g>
        <Drawn d={`M 110 ${HY} L 970 ${HY}`} t={t} t0={0.3} t1={1.4} width={2.5} />
        <Drawn d={`M 260 ${HY + 40} L 820 ${HY + 40}`} t={t} t0={0.6} t1={1.6} width={1.2} stroke={`${INK}88`} />
      </svg>
    </>
  );
};

const Ritual2: React.FC<{ t: number; exhaleAt: number }> = ({ t, exhaleAt }) => {
  // inhale 0.8→3.3, hold, long exhale on the "sss"
  const inhale = ci(t, 0.8, 3.3, 0, 1, soft);
  const exhale = ci(t, exhaleAt, exhaleAt + 2.4, 0, 1, Easing.bezier(0.2, 0, 0.4, 1));
  const r = 120 + 150 * inhale - 150 * exhale;
  const label = t < exhaleAt - 0.3 ? (t < 3.3 ? "inspirez" : "…") : "expirez  sss";
  return (
    <>
      <Numeral n="2" t={t} title="Le souffle du Poumon" han="呬" hanMeaning="— « sī », le son du Poumon" />
      <svg width={W} height={H} style={{ position: "absolute" }}>
        <circle cx={540} cy={1010} r={r + 40} fill={METAL} opacity={0.35} filter="url(#wash)" />
        <circle cx={540} cy={1010} r={r} fill="none" stroke={INK} strokeWidth={2.5} />
        <circle cx={540} cy={1010} r={r * 0.62} fill="none" stroke={INK} strokeWidth={1} opacity={0.35} />
        {/* exhale mist lines drifting right */}
        {new Array(9).fill(0).map((_, i) => {
          const k = ci(t, exhaleAt + i * 0.12, exhaleAt + 1.6 + i * 0.12, 0, 1, soft);
          if (k <= 0) return null;
          const y = 1010 - 100 + i * 25;
          const x0 = 540 + r * 0.6;
          const len = 60 + hash(i, 1) * 120;
          const x = x0 + k * 330;
          return (
            <path
              key={i}
              d={`M ${x} ${y} q ${len / 2} ${-10 + hash(i, 2) * 20} ${len} 0`}
              fill="none"
              stroke={INK}
              strokeWidth={1.6}
              strokeLinecap="round"
              opacity={(1 - k) * 0.7}
            />
          );
        })}
      </svg>
      <div style={{ position: "absolute", top: 1330, left: 0, right: 0, textAlign: "center", fontFamily: SERIF_I, fontSize: 52, color: "#6d5f52", opacity: ci(t, 0.8, 1.4, 0, 1) }}>
        {label}
      </div>
    </>
  );
};

const Ritual3: React.FC<{ t: number; tPoire: number; tSesame: number; tMiel: number }> = ({ t, tPoire, tSesame, tMiel }) => {
  const drop = ci(t, tMiel, tMiel + 0.7, 0, 1, Easing.in(Easing.quad));
  const ripple = t > tMiel + 0.7 ? (t - tMiel - 0.7) / 1.2 : -1;
  return (
    <>
      <Numeral n="3" t={t} title="Blanc et doux" han="润燥" hanMeaning="— hydrater la sécheresse" />
      <svg width={W} height={H} style={{ position: "absolute" }}>
        <g transform="translate(540 1040) scale(1.35)">
          <Drawn d={PEAR} t={t} t0={tPoire - 0.4} t1={tPoire + 1.2} width={2} fill="#F7F1DF" fillIn={[tPoire + 0.4, tPoire + 1.4]} fillOpacity={1} />
          <Drawn d="M0,-150 C 2,-175 8,-190 18,-202" t={t} t0={tPoire + 0.9} t1={tPoire + 1.3} width={2} />
          <Drawn d="M10,-186 C 30,-205 60,-200 70,-188 C 50,-176 28,-176 10,-186 Z" t={t} t0={tPoire + 1.1} t1={tPoire + 1.6} width={1.6} fill={SAGE} fillIn={[tPoire + 1.3, tPoire + 1.8]} fillOpacity={0.8} />
          {/* poached-pear honey sheen */}
          <path d="M -40,20 C -60,60 -50,100 -20,118" fill="none" stroke={OCHRE} strokeWidth={6} strokeLinecap="round" opacity={ci(t, tMiel + 0.7, tMiel + 1.4, 0, 0.8)} />
        </g>
        {/* sesame seeds */}
        {new Array(14).fill(0).map((_, i) => {
          const at = tSesame + i * 0.04;
          const k = ci(t, at, at + 0.35, 0, 1, Easing.out(Easing.back(2)));
          const x = 380 + hash(i, 1) * 320;
          const y = 1330 + hash(i, 2) * 60;
          return <ellipse key={i} cx={x} cy={y} rx={15 * k} ry={8 * k} fill="#FBF6EA" stroke={INK} strokeWidth={1.2} transform={`rotate(${hash(i, 3) * 180} ${x} ${y})`} />;
        })}
        {/* honey drop */}
        {drop > 0 && ripple < 0 && <path d="M0,-18 C 10,-4 12,6 0,14 C -12,6 -10,-4 0,-18 Z" transform={`translate(540 ${640 + drop * 230})`} fill={OCHRE} stroke={INK} strokeWidth={1.2} />}
        {ripple > 0 &&
          [0, 0.3].map((d) => {
            const k = Math.max(0, Math.min(1, ripple - d));
            return <ellipse key={d} cx={540} cy={868} rx={10 + 90 * k} ry={3 + 16 * k} fill="none" stroke={OCHRE} strokeWidth={2} opacity={1 - k} />;
          })}
      </svg>
    </>
  );
};

const Ritual4: React.FC<{ t: number; tTomber: number }> = ({ t, tTomber }) => {
  const leaves = [
    [0.2, -30, 0.34],
    [0.32, 25, 0.3],
    [0.45, -20, 0.36],
    [0.56, 30, 0.28],
    [0.68, -35, 0.32],
    [0.8, 20, 0.3],
    [0.9, -10, 0.26],
  ];
  // branch from upper-right toward centre
  const bx = (u: number) => 1000 - u * 640;
  const by = (u: number) => 740 + u * 180 - Math.sin(u * Math.PI) * 60;
  return (
    <>
      <Numeral n="4" t={t} title="Lâcher prise" han="放下" hanMeaning="— laisser partir" />
      <svg width={W} height={H} style={{ position: "absolute" }}>
        <Drawn d={`M 1090 700 Q 700 800 330 920`} t={t} t0={0.2} t1={1.8} width={5} />
        <Drawn d={`M 760 790 Q 700 720 640 700`} t={t} t0={1.0} t1={1.8} width={3} />
        {leaves.map(([u, rot0, sc], i) => {
          const grow = ci(t, 1.2 + i * 0.1, 1.8 + i * 0.1, 0, 1, Easing.out(Easing.back(1.4)));
          const release = tTomber - 0.2 + i * 0.28;
          const f = t > release ? t - release : 0;
          const fall = Math.min(1, f / 3.6);
          const x = bx(u) + Math.sin(f * 2.2 + i) * 70 * Math.min(1, f) + f * 20;
          const y = by(u) + 30 + fall * fall * 1300 + f * 40;
          const rot = rot0 + Math.sin(f * 2.4 + i) * 55 * Math.min(1, f);
          return (
            <g key={i} transform={`translate(${x} ${y}) rotate(${rot + 180}) scale(${sc * grow})`} opacity={1 - ci(f, 2.6, 3.6, 0, 1)}>
              <Leaf fill={i % 3 === 0 ? "#E3B85F" : OCHRE} sw={3.2} />
            </g>
          );
        })}
      </svg>
    </>
  );
};

const Outro: React.FC<{ t: number }> = ({ t }) => {
  const k = ci(t, 0.2, 3.4, 0, 1, Easing.bezier(0.25, 0.1, 0.25, 1));
  const x = 540 + Math.sin(k * Math.PI * 3) * 120 * (1 - k);
  const y = 250 + k * 700;
  const rot = Math.sin(k * Math.PI * 3) * 50 * (1 - k) - 10;
  return (
    <>
      <svg width={W} height={H} style={{ position: "absolute" }}>
        <ellipse cx={540} cy={1010} rx={150 * k} ry={16 * k} fill={INK} opacity={0.08 * k} />
        <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${0.9 + 0.3 * k})`}>
          <Leaf sw={2.5} veins={11} />
        </g>
      </svg>
      <div style={{ position: "absolute", top: 1150, left: 0, right: 0, textAlign: "center" }}>
        <div style={{ fontFamily: SERIF, fontWeight: 400, fontSize: 72, color: INK, lineHeight: 1.15, opacity: ci(t, 1.0, 2.2, 0, 1) }}>
          Rassemblez
          <br />
          votre énergie.
        </div>
        <div style={{ fontFamily: HAN, fontWeight: 300, fontSize: 64, color: RUST, marginTop: 26, opacity: ci(t, 2.0, 3.0, 0, 1), letterSpacing: 20 }}>秋收</div>
      </div>
      <div style={{ position: "absolute", bottom: 80, left: 100, right: 100, textAlign: "center", fontFamily: SANS, fontSize: 28, color: `${INK}aa`, lineHeight: 1.45, opacity: ci(t, 3.2, 4.2, 0, 1) }}>
        Inspiré de la médecine traditionnelle chinoise.
        <br />
        Ne remplace pas un avis médical.
      </div>
    </>
  );
};

// ---------------------------------------------------------------- captions (phrase by phrase)
const Caption: React.FC<{ line: Line }> = ({ line }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const keys = (line.keys ?? []).map((k) => k.toLowerCase());
  const ph = line.phrases.find((p, i) => t >= p.s - 0.1 && t < (line.phrases[i + 1]?.s ?? 99) - 0.1);
  if (!ph) return null;
  const idx = line.phrases.indexOf(ph);
  const end = line.phrases[idx + 1] ? line.phrases[idx + 1].s - 0.1 : line.dur + 0.4;
  const o = ci(t, ph.s - 0.1, ph.s + 0.2, 0, 1) * (1 - ci(t, end - 0.2, end, 0, 1));
  return (
    <div style={{ position: "absolute", left: 90, right: 90, top: 1560, textAlign: "center", opacity: o }}>
      {ph.text.split(" ").map((w, i) => {
        const clean = w.toLowerCase().replace(/[.,:;!?]/g, "");
        const isKey = keys.some((k) => clean.startsWith(k));
        return (
          <span key={i} style={{ fontFamily: SANS, fontWeight: isKey ? 500 : 400, fontSize: 50, lineHeight: 1.35, color: isKey ? RUST : INK, marginRight: 12, display: "inline-block" }}>
            {w}
          </span>
        );
      })}
    </div>
  );
};

// ---------------------------------------------------------------- scene
export const Scene: React.FC<SceneProps> = ({ lines, duration }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const f = (s: number) => Math.round(s * fps);
  const wt = (li: number, word: string, fb: number) => {
    const l = lines.find((x) => x.i === li);
    const w = l?.words.find((x) => x.w.toLowerCase().replace(/[.,:;!?]/g, "").startsWith(word));
    return l && w ? l.start + w.s : fb;
  };
  const tMetal = wt(1, "métal", 5.8);
  const tPoumon = wt(1, "poumon", 6.9);
  const l4 = lines.find((x) => x.i === 4)!;
  const exhaleAt = l4.start + l4.dur + 0.35;
  const tPoire = wt(5, "poire", 30.8);
  const tSesame = wt(5, "ses", 31.5);
  const tMiel = wt(5, "miel", 32.1);
  const tTomber = wt(6, "tomber", 37.1);

  const sec = (k: keyof typeof S, render: (lt: number) => React.ReactNode) => (
    <Sequence from={f(S[k][0])} durationInFrames={f(S[k][1] - S[k][0])}>
      <Section a={S[k][0]} b={S[k][1]}>{(lt) => render(lt)}</Section>
    </Sequence>
  );

  const ambientFade = ci(t, 3, 5, 0, 1) * (1 - ci(t, S.r4[0], S.r4[0] + 1, 0, 1)) + ci(t, S.outro[0] + 3.5, S.outro[0] + 5, 0, 0.6);

  return (
    <AbsoluteFill style={{ background: PAPER }}>
      <svg width={0} height={0} style={{ position: "absolute" }}>
        <defs>
          <filter id="wash" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="3" seed="12" />
            <feDisplacementMap in="SourceGraphic" scale="12" />
            <feGaussianBlur stdDeviation="1.2" />
          </filter>
        </defs>
      </svg>
      <Paper t={t} />
      <FallingLeaves t={t} fade={ambientFade} />
      {sec("intro", (lt) => <Intro t={lt} tMetal={tMetal - S.intro[0]} tPoumon={tPoumon - S.intro[0]} />)}
      {sec("gather", (lt) => <Gather t={lt} />)}
      {sec("r1", (lt) => <Ritual1 t={lt} />)}
      {sec("r2", (lt) => <Ritual2 t={lt} exhaleAt={exhaleAt - S.r2[0]} />)}
      {sec("r3", (lt) => <Ritual3 t={lt} tPoire={tPoire - S.r3[0]} tSesame={tSesame - S.r3[0]} tMiel={tMiel - S.r3[0]} />)}
      {sec("r4", (lt) => <Ritual4 t={lt} tTomber={tTomber - S.r4[0]} />)}
      {sec("outro", (lt) => <Outro t={lt} />)}

      {lines.map((l) => (
        <Sequence key={l.i} from={f(l.start)} durationInFrames={f(l.dur + 0.5)}>
          <Audio src={staticFile(l.file)} />
          {l.i !== 7 && <Caption line={l} />}
        </Sequence>
      ))}

      <Audio
        src={staticFile("sfx/music.wav")}
        volume={(fr) => interpolate(fr, [0, f(1.5), f(duration - 2.5), f(duration)], [0, 0.42, 0.42, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}
      />
      {[S.r1[0] + 0.1, S.r2[0] + 0.1, S.r3[0] + 0.1, S.r4[0] + 0.1].map((at, i) => (
        <Sequence key={`c${i}`} from={f(at)} layout="none">
          <Audio src={staticFile("sfx/chime.wav")} volume={0.35} />
        </Sequence>
      ))}
      <Sequence from={f(exhaleAt)} layout="none">
        <Audio src={staticFile("sfx/sss.wav")} volume={0.55} />
      </Sequence>
      {[tTomber - 0.1, tTomber + 0.9, S.outro[0] + 0.3].map((at, i) => (
        <Sequence key={`r${i}`} from={f(at)} layout="none">
          <Audio src={staticFile("sfx/rustle.wav")} volume={0.35} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

export const calculateMetadata: CalculateMetadataFunction<SceneProps> = async ({ props }) => ({
  durationInFrames: Math.round((props.duration ?? 48) * 30),
  fps: 30,
  width: W,
  height: H,
});
