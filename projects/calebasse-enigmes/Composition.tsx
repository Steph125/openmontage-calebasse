import React from "react";
import {
  AbsoluteFill,
  Audio,
  CalculateMetadataFunction,
  Easing,
  Img,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { loadFont as loadFraunces } from "@remotion/google-fonts/Fraunces";
import { loadFont as loadPoppins } from "@remotion/google-fonts/Poppins";
import { loadFont as loadNotoSC } from "@remotion/google-fonts/NotoSerifSC";

// ATELIER — Calebasse · La Quête des 29 ans · stories énigmes.
// Campaign identity taken from the editorial calendar (ivory / ink / terracotta / sage,
// Fraunces + Poppins) and the brand (logo, #AACB55 / #204E4A).

const { fontFamily: SERIF } = loadFraunces("normal", { weights: ["300", "400", "500"], subsets: ["latin", "latin-ext"] });
const { fontFamily: SERIF_I } = loadFraunces("italic", { weights: ["300", "400"], subsets: ["latin", "latin-ext"] });
const { fontFamily: SANS } = loadPoppins("normal", { weights: ["400", "500", "600", "700"], subsets: ["latin", "latin-ext"] });
const { fontFamily: HAN } = loadNotoSC("normal", { weights: ["500"] });

const W = 1080;
const H = 1920;
const IVORY = "#FBF5EE";
const PAPER = "#FFFDF9";
const INK = "#3B2A22";
const INK3 = "#5A463B";
const TERRA = "#A9472F";
const SAGE = "#E8EEDF";
const SAGEINK = "#3E5A3E";
const GREEN = "#AACB55";
const LINE = "#EADCCB";

const INTRO = 1.3; // voice starts
const TAIL = 3.8; // after voice

const soft = Easing.bezier(0.45, 0, 0.55, 1);
const settle = Easing.bezier(0.2, 0.7, 0.2, 1);
const ci = (x: number, a: number, b: number, from: number, to: number, e = soft) =>
  interpolate(x, [a, b], [from, to], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: e });
const hash = (i: number, k: number) => {
  const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453;
  return x - Math.floor(x);
};

export interface SceneProps {
  n: number;
  text: string;
  file: string;
  dur: number;
  words: { w: string; s: number }[];
}

// a stroke that draws itself
const D: React.FC<{ d: string; k: number; c?: string; w?: number; fill?: string; fo?: number }> = ({ d, k, c = INK, w = 4, fill, fo = 0 }) => (
  <>
    {fill && <path d={d} fill={fill} opacity={fo} />}
    <path d={d} pathLength={1} strokeDasharray={`${k} 1`} fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />
  </>
);

const CUP = "M -150 -40 L 150 -40 C 150 60 100 130 0 130 C -100 130 -150 60 -150 -40 Z";
const CUP_HANDLE = "M 150 0 C 210 0 210 70 140 80";
const SAUCER = "M -210 150 C -120 175 120 175 210 150";

// ---------------------------------------------------------------- hint drawings (never the answer)
const Hint: React.FC<{ n: number; t: number }> = ({ n, t }) => {
  const k = (a: number, b: number) => ci(t, a, b, 0, 1);
  switch (n) {
    case 2: {
      // still water above mud, ripples, ivory pearls rising
      return (
        <g>
          <D d="M -330 40 C -200 20 -100 60 0 40 C 100 20 200 60 330 40" k={k(0.3, 1.5)} c={SAGEINK} w={4} />
          <path d="M -330 220 C -180 200 -60 240 80 215 C 200 195 260 230 330 215 L 330 300 L -330 300 Z" fill="#8C7A64" opacity={k(0.8, 1.8) * 0.55} />
          {[0, 1, 2].map((i) => {
            const r = ((t * 0.6 + i / 3) % 1) * 300;
            return <ellipse key={i} cx={0} cy={40} rx={r} ry={r * 0.18} fill="none" stroke={SAGEINK} strokeWidth={2.5} opacity={(1 - r / 300) * k(1, 2)} />;
          })}
          {new Array(6).fill(0).map((_, i) => {
            const ph = (t * 0.35 + hash(i, 1)) % 1;
            const y = 210 - ph * 170;
            const x = -120 + i * 48 + Math.sin(t * 2 + i) * 6;
            return <circle key={i} cx={x} cy={y} r={21} fill="url(#pearl)" stroke="#8C7A64" strokeWidth={1.5} opacity={k(1.6, 2.4) * (ph < 0.9 ? 1 : (1 - ph) * 10)} />;
          })}
        </g>
      );
    }
    case 3: {
      const melt = ci(t, 3, 5.5, 1, 0);
      return (
        <g transform="translate(0 60)">
          <D d={CUP} k={k(0.2, 1.4)} fill={PAPER} fo={k(1, 1.6)} />
          <D d={CUP_HANDLE} k={k(1.1, 1.6)} />
          <D d={SAUCER} k={k(1.3, 1.9)} />
          <path d="M -140 -30 C -60 -10 60 -10 140 -30" fill="none" stroke={TERRA} strokeWidth={10} opacity={k(1.6, 2.2) * 0.7} />
          {[-60, 0, 60].map((x, i) => {
            const ph = (t * 0.45 + i * 0.33) % 1;
            return <path key={i} d={`M ${x} ${-70 - ph * 160} c 25 -30 -25 -50 0 -80`} fill="none" stroke={TERRA} strokeWidth={4} strokeLinecap="round" opacity={k(1.8, 2.4) * Math.sin(ph * Math.PI)} />;
          })}
          {/* the cold being chased: a snowflake that melts */}
          <g transform={`translate(230 ${-300 + (1 - melt) * 60}) scale(${0.4 + 0.6 * melt})`} opacity={melt * k(0.6, 1.2)}>
            {[0, 60, 120].map((a) => (
              <g key={a} transform={`rotate(${a})`}>
                <line x1={0} y1={-50} x2={0} y2={50} stroke="#7C8FA8" strokeWidth={5} strokeLinecap="round" />
                <path d="M -14 -36 L 0 -24 L 14 -36 M -14 36 L 0 24 L 14 36" fill="none" stroke="#7C8FA8" strokeWidth={4} strokeLinecap="round" />
              </g>
            ))}
          </g>
        </g>
      );
    }
    case 4: {
      return (
        <g>
          {new Array(7).fill(0).map((_, i) => {
            const at = 0.4 + i * 0.35;
            const f = Math.max(0, t - at);
            const y = Math.min(170, -260 + f * f * 520);
            const x = -240 + i * 80;
            const land = y >= 170 ? 1 : 0;
            return (
              <g key={i} transform={`translate(${x} ${y}) scale(${1 + 0.08 * land})`} opacity={t > at ? 1 : 0}>
                <path d="M 0 -42 C 18 -16 26 4 22 18 C 16 38 -16 38 -22 18 C -26 4 -18 -16 0 -42 Z" fill="#EFE7DA" stroke={INK} strokeWidth={3} />
                <path d="M -8 8 C -6 18 4 22 10 18" stroke="#B9A88F" strokeWidth={3} fill="none" strokeLinecap="round" />
              </g>
            );
          })}
          <D d="M -300 215 L 300 215" k={k(0.2, 1)} c={LINE} w={4} />
        </g>
      );
    }
    case 5: {
      // ruyi cloud scroll + imperial roof, lacquer gleam
      const g = ((t * 0.4) % 1.4) - 0.2;
      return (
        <g>
          <D d="M -320 -150 C -200 -150 -150 -175 -110 -215 L 110 -215 C 150 -175 200 -150 320 -150 M -110 -215 L -80 -260 L 80 -260 L 110 -215" k={k(0.2, 1.6)} c={TERRA} w={6} />
          <g transform="translate(0 90)">
            <D
              d="M -40 40 C -160 60 -220 -40 -150 -100 C -90 -150 -10 -110 -30 -50 C -45 -10 -100 -20 -95 -60 M 40 40 C 160 60 220 -40 150 -100 C 90 -150 10 -110 30 -50 C 45 -10 100 -20 95 -60 M -40 40 C -20 70 20 70 40 40"
              k={k(0.8, 2.6)}
              c="#7E3221"
              w={7}
            />
          </g>
          <rect x={-260 + g * 520} y={-40} width={50} height={300} fill="#FFFFFF" opacity={0.35 * k(2.4, 2.8)} transform={`skewX(-20)`} />
        </g>
      );
    }
    case 6: {
      const rise = ci(t, 0.3, 3.0, 0, 1, settle);
      return (
        <g>
          <circle cx={0} cy={0} r={330} fill="#3B4660" opacity={0.12 + 0.18 * rise} />
          <g transform={`translate(${150} ${120 - rise * 300})`}>
            <path d="M 0 -70 A 70 70 0 1 0 0 70 A 52 52 0 1 1 0 -70 Z" fill="#F3E3B5" stroke={INK} strokeWidth={3} />
          </g>
          {new Array(9).fill(0).map((_, i) => (
            <circle key={i} cx={-260 + hash(i, 1) * 420} cy={-240 + hash(i, 2) * 220} r={4 + hash(i, 3) * 4} fill="#F3E3B5" opacity={k(1.2 + i * 0.2, 1.6 + i * 0.2) * (0.6 + 0.4 * Math.sin(t * 3 + i))} />
          ))}
          <g transform="translate(-60 190) scale(0.75)">
            <D d={CUP} k={k(0.8, 1.8)} fill={PAPER} fo={k(1.4, 2)} />
            <D d={CUP_HANDLE} k={k(1.6, 2)} />
          </g>
        </g>
      );
    }
    case 7: {
      // top view of a cup; a whole flower unfolds
      const open = ci(t, 1.0, 4.0, 0, 1, settle);
      return (
        <g>
          <circle r={250} fill={PAPER} stroke={INK} strokeWidth={4} opacity={k(0.2, 0.8)} />
          <circle r={210} fill="#F3E2B8" opacity={0.45 * k(0.6, 1.2)} />
          {[0, 1, 2].map((ring) =>
            new Array(14).fill(0).map((_, i) => {
              const a = (i / 14) * 360 + ring * 13;
              const len = (60 + ring * 35) * open;
              return (
                <ellipse
                  key={`${ring}-${i}`}
                  cx={0}
                  cy={-len / 2 - 10}
                  rx={14 - ring * 2}
                  ry={len / 2 + 2}
                  transform={`rotate(${a + (1 - open) * 40})`}
                  fill={ring === 0 ? "#F6D27A" : ring === 1 ? "#F1C15A" : "#EBB54A"}
                  stroke="#B5832B"
                  strokeWidth={1.5}
                  opacity={open > 0.02 ? 1 : 0}
                />
              );
            })
          )}
          <circle r={26 * open} fill="#C98B3A" />
        </g>
      );
    }
    case 8: {
      const tilt = Math.sin(Math.max(0, t - 1) * 2.4) * 14 * Math.exp(-Math.max(0, t - 1) * 0.6);
      return (
        <g>
          <D d="M 0 -170 L 0 200 M -110 200 L 110 200" k={k(0.2, 1)} w={6} />
          <g transform={`translate(0 -170) rotate(${tilt})`}>
            <D d="M -260 0 L 260 0" k={k(0.6, 1.2)} w={6} />
            <g transform={`rotate(${-tilt}) translate(-220 0)`}>
              <D d="M 0 0 L -60 120 M 0 0 L 60 120 M -80 120 C -60 150 60 150 80 120 Z" k={k(1, 1.6)} w={3} />
              <path d="M 0 40 C 18 66 26 82 18 96 C 10 110 -10 110 -18 96 C -26 82 -18 66 0 40 Z" fill="#9FC3E6" stroke={INK} strokeWidth={2.5} opacity={k(1.6, 2.1)} />
            </g>
            <g transform={`rotate(${-tilt}) translate(220 0)`}>
              <D d="M 0 0 L -60 120 M 0 0 L 60 120 M -80 120 C -60 150 60 150 80 120 Z" k={k(1, 1.6)} w={3} />
              <circle cx={0} cy={86} r={26} fill="none" stroke={SAGEINK} strokeWidth={5} opacity={k(1.8, 2.3)} />
              <circle cx={0} cy={86} r={8} fill={SAGEINK} opacity={k(1.8, 2.3)} />
            </g>
          </g>
        </g>
      );
    }
    case 9:
    default: {
      const drop = (i: number) => ci(t, 1.6 + i * 0.25, 2.1 + i * 0.25, -260, 0, Easing.in(Easing.quad));
      const sun = ci(t, 0.2, 3.5, 0, 1, settle);
      return (
        <g>
          <circle cx={0} cy={190 - sun * 290} r={120} fill="#F6C76A" opacity={0.5 * sun} />
          <circle r={240} fill={PAPER} stroke={INK} strokeWidth={4} opacity={k(0.3, 0.9)} />
          <circle r={200} fill="#F0D6A8" opacity={0.5 * k(0.6, 1.2)} />
          <g transform={`translate(-60 ${-20 + Math.min(0, drop(0))})`} opacity={t > 1.6 ? 1 : 0}>
            <circle r={46} fill="#E8B94F" stroke="#9A6A1E" strokeWidth={3} />
            {[14, 26, 36].map((r) => (
              <circle key={r} r={r} fill="none" stroke="#9A6A1E" strokeWidth={1.5} opacity={0.6} />
            ))}
          </g>
          {[
            [70, -60],
            [40, 70],
            [-90, 80],
          ].map(([x, y], i) => (
            <g key={i} transform={`translate(${x} ${y + Math.min(0, drop(1 + i))})`} opacity={t > 1.85 + i * 0.25 ? 1 : 0}>
              <path d="M 0 -26 C 18 -18 20 10 0 22 C -20 10 -18 -18 0 -26 Z" fill="#E7A1A8" stroke="#9C4A55" strokeWidth={2.5} />
            </g>
          ))}
          {new Array(5).fill(0).map((_, i) => (
            <circle key={i} cx={-20 + Math.cos(i * 1.3) * 120} cy={10 + Math.sin(i * 1.3) * 110 + Math.min(0, drop(4 + i))} r={14} fill="#C8322B" stroke="#7A1C17" strokeWidth={2} opacity={t > 2.6 + i * 0.25 ? 1 : 0} />
          ))}
        </g>
      );
    }
  }
};

// ---------------------------------------------------------------- scene
export const Scene: React.FC<SceneProps> = ({ n, text, file, dur, words }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const f = (s: number) => Math.round(s * fps);
  const total = INTRO + dur + TAIL;
  const vEnd = INTRO + dur;

  const head = ci(t, 0.05, 0.6, 0, 1, settle);
  const card = ci(t, 0.5, 1.1, 0, 1, settle);
  const badge = ci(t, vEnd + 0.25, vEnd + 0.75, 0, 1, Easing.out(Easing.back(1.8)));
  const cta = ci(t, vEnd + 0.8, vEnd + 1.4, 0, 1, settle);
  const outro = ci(t, total - 0.35, total, 1, 0);

  return (
    <AbsoluteFill style={{ background: IVORY, opacity: outro }}>
      {/* soft paper wash */}
      <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 35%, ${PAPER} 0%, ${IVORY} 55%, #F3E7D8 100%)` }} />
      {/* header */}
      <div style={{ position: "absolute", top: 120, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center", opacity: head, transform: `translateY(${(1 - head) * -20}px)` }}>
        <Img src={staticFile("brand/logo512.png")} style={{ width: 96, height: 96, transform: `scale(${ci(t, 0.05, 0.45, 1.4, 1, Easing.out(Easing.back(2)))})` }} />
        <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: 30, letterSpacing: 8, color: INK, marginTop: 22 }}>LA QUÊTE DES 29 ANS</div>
        <div style={{ fontFamily: SERIF_I, fontWeight: 400, fontSize: 52, color: TERRA, marginTop: 6 }}>
          Énigme {n} <span style={{ color: INK3, fontSize: 40 }}>/ 9</span>
        </div>
      </div>

      {/* campaign watermark */}
      <div style={{ position: "absolute", top: 230, left: 0, right: 0, textAlign: "center", fontFamily: SERIF, fontWeight: 300, fontSize: 820, lineHeight: 1, color: TERRA, opacity: 0.06 * head, letterSpacing: -30 }}>29</div>
      {/* hint drawing */}
      <svg width={W} height={H} style={{ position: "absolute" }}>
        <defs>
          <radialGradient id="pearl" cx="35%" cy="30%" r="75%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="55%" stopColor="#F3EADB" />
            <stop offset="100%" stopColor="#CDBEA6" />
          </radialGradient>
        </defs>
        <g transform={`translate(540 ${650 + ({5: 50, 6: 40, 7: 50, 9: 50} as Record<number, number>)[n] ?? 0}) scale(${1.32 * (({5: 0.8, 6: 0.78, 7: 0.8, 9: 0.82} as Record<number, number>)[n] ?? 1)})`}>
          <Hint n={n} t={t} />
        </g>
      </svg>

      {/* riddle card */}
      <div
        style={{
          position: "absolute",
          left: 70,
          right: 70,
          top: 1040,
          background: SAGE,
          borderRadius: 34,
          padding: "40px 46px 46px",
          opacity: card,
          transform: `translateY(${(1 - card) * 40}px)`,
          boxShadow: "0 30px 60px -40px rgba(59,42,34,0.45)",
        }}
      >
        <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: 26, letterSpacing: 5, color: SAGEINK, marginBottom: 14 }}>QUI SUIS-JE ?</div>
        <div style={{ fontFamily: SERIF, fontWeight: 400, fontSize: 50, lineHeight: 1.32, color: INK }}>
          <span style={{ color: TERRA }}>« </span>
          {words.map((w, i) => {
            const at = INTRO + w.s;
            const o = ci(t, at - 0.06, at + 0.18, 0.18, 1);
            return (
              <span key={i} style={{ opacity: o }}>
                {w.w}{" "}
              </span>
            );
          })}
          <span style={{ color: TERRA, opacity: ci(t, vEnd - 0.2, vEnd, 0.18, 1) }}>»</span>
        </div>
      </div>

      {/* reward + CTA */}
      <div style={{ position: "absolute", top: 1560, left: 0, right: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 28 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            background: TERRA,
            color: "#fff",
            borderRadius: 999,
            padding: "14px 30px 14px 16px",
            opacity: Math.min(1, badge * 1.5),
            transform: `scale(${badge})`,
            boxShadow: "0 16px 30px -18px rgba(169,71,47,0.8)",
          }}
        >
          <div style={{ width: 58, height: 58, borderRadius: 29, background: "#F6E8DA", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontFamily: HAN, fontSize: 34, color: TERRA }}>气</span>
          </div>
          <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 44 }}>+100 Chi</span>
        </div>
      </div>
      <div style={{ position: "absolute", top: 1675, left: 0, right: 0, textAlign: "center", opacity: cta, transform: `translateY(${(1 - cta) * 14}px)` }}>
        <div style={{ fontFamily: SANS, fontWeight: 500, fontSize: 32, color: INK }}>Trouvez la réponse sur calebasse.com</div>
        <div style={{ fontFamily: SANS, fontWeight: 400, fontSize: 24, color: INK3, marginTop: 6 }}>Énigme ouverte jusqu'au 21 octobre</div>
      </div>

      <Img src={staticFile("brand/logo_color.svg")} style={{ position: "absolute", left: 340, width: 400, top: 1800, opacity: cta }} />
      <Sequence from={f(INTRO)}>
        <Audio src={staticFile(file)} />
      </Sequence>
      <Audio
        src={staticFile("sfx/music.wav")}
        volume={(fr) => interpolate(fr, [0, f(0.8), f(total - 1.2), f(total)], [0, 0.3, 0.3, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}
      />
      <Sequence from={f(0.05)} layout="none">
        <Audio src={staticFile("sfx/pop.wav")} volume={0.5} />
      </Sequence>
      <Sequence from={f(vEnd + 0.25)} layout="none">
        <Audio src={staticFile("sfx/chime.wav")} volume={0.45} />
      </Sequence>
    </AbsoluteFill>
  );
};

export const calculateMetadata: CalculateMetadataFunction<SceneProps> = async ({ props }) => ({
  durationInFrames: Math.round((INTRO + (props.dur ?? 6) + TAIL) * 30),
  fps: 30,
  width: W,
  height: H,
});
