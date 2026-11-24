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
import { loadFont as loadBrush } from "@remotion/google-fonts/MaShanZheng";

// ATELIER — Calebasse · "29 ans en 29 secondes". One second = one year (1997 → 2026).

const { fontFamily: SERIF } = loadFraunces("normal", { weights: ["300", "400", "500", "600"], subsets: ["latin", "latin-ext"] });
const { fontFamily: SERIF_I } = loadFraunces("italic", { weights: ["300", "400"], subsets: ["latin", "latin-ext"] });
const { fontFamily: SANS } = loadPoppins("normal", { weights: ["400", "500", "600"], subsets: ["latin", "latin-ext"] });
const { fontFamily: HAN } = loadNotoSC("normal", { weights: ["500", "700"] });
const { fontFamily: BRUSH } = loadBrush();

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
const DEEP = "#204E4A";
const LINE = "#EADCCB";

const soft = Easing.bezier(0.45, 0, 0.55, 1);
const settle = Easing.bezier(0.2, 0.7, 0.2, 1);
const ci = (x: number, a: number, b: number, from: number, to: number, e = soft) =>
  interpolate(x, [a, b], [from, to], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: e });

export interface SceneProps {
  duration: number;
}

// section shell: enters from the right (time moves forward), leaves to the left
const Sec: React.FC<{ a: number; b: number; t: number; children: (lt: number) => React.ReactNode }> = ({ a, b, t, children }) => {
  if (t < a - 0.01 || t > b + 0.01) return null;
  const lt = t - a;
  const len = b - a;
  const inK = ci(lt, 0, 0.45, 0, 1, settle);
  const outK = ci(lt, len - 0.35, len, 0, 1, Easing.in(Easing.cubic));
  return (
    <AbsoluteFill style={{ opacity: inK * (1 - outK), transform: `translateX(${(1 - inK) * 80 - outK * 80}px)` }}>{children(lt)}</AbsoluteFill>
  );
};

// words appear one by one
const Words: React.FC<{ text: string; lt: number; at: number; per?: number; style: React.CSSProperties; hl?: string[] }> = ({ text, lt, at, per = 0.07, style, hl = [] }) => (
  <div style={style}>
    {text.split(" ").map((w, i) => {
      const k = ci(lt, at + i * per, at + i * per + 0.3, 0, 1, settle);
      const isHl = hl.some((h) => w.toLowerCase().includes(h));
      return (
        <span key={i} style={{ display: "inline-block", opacity: k, transform: `translateY(${(1 - k) * 18}px)`, marginRight: "0.26em", color: isHl ? TERRA : undefined }}>
          {w}
        </span>
      );
    })}
  </div>
);

const Draw: React.FC<{ d: string; k: number; c?: string; w?: number; dash?: string }> = ({ d, k, c = INK, w = 4 }) => (
  <path d={d} pathLength={1} strokeDasharray={`${k} 1`} fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />
);

// ---------------------------------------------------------------- photo card (then / now)
const PhotoCard: React.FC<{ develop: number; wipe: number; y: number }> = ({ develop, wipe, y }) => {
  const w = 940;
  const h = Math.round((w * 1086) / 1448);
  return (
    <div style={{ position: "absolute", left: (W - w) / 2 - 22, top: y, width: w + 44, padding: 22, paddingBottom: 30, background: PAPER, borderRadius: 10, boxShadow: "0 40px 70px -40px rgba(59,42,34,0.55)", transform: `rotate(${-1.2 + wipe * 1.2}deg)` }}>
      <div style={{ position: "relative", width: w, height: h, overflow: "hidden", background: "#E9E1D6" }}>
        <Img src={staticFile("brand/shop_1997.jpg")} style={{ position: "absolute", width: w, height: h, filter: `sepia(0.35) contrast(1.05) brightness(${0.6 + 0.4 * develop})`, opacity: develop }} />
        <div style={{ position: "absolute", left: 0, top: 0, width: w * wipe, height: h, overflow: "hidden" }}>
          <Img src={staticFile("brand/shop_now.jpg")} style={{ position: "absolute", width: w, height: h }} />
        </div>
        {wipe > 0 && wipe < 1 && <div style={{ position: "absolute", left: w * wipe - 3, top: 0, width: 6, height: h, background: "#fff", boxShadow: "0 0 30px rgba(255,255,255,0.9)" }} />}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------- scene
export const Scene: React.FC<SceneProps> = ({ duration }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const f = (s: number) => Math.round(s * fps);

  const year = t >= 27.5 ? 2026 : 1997 + Math.floor(t);
  const yearPulse = ci(t % 1, 0, 0.18, 1.12, 1, settle);

  return (
    <AbsoluteFill style={{ background: IVORY, overflow: "hidden" }}>
      <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 40%, ${PAPER} 0%, ${IVORY} 55%, #F2E5D4 100%)` }} />

      {/* persistent year counter + 29-tick timeline */}
      <div style={{ position: "absolute", top: 90, left: 0, right: 0, textAlign: "center", opacity: t < 27.3 ? 1 : ci(t, 27.3, 27.6, 1, 0) }}>
        <div style={{ fontFamily: SERIF, fontWeight: 400, fontSize: 92, color: TERRA, letterSpacing: 4, transform: `scale(${yearPulse})`, display: "inline-block" }}>{year}</div>
        <svg width={760} height={30} style={{ display: "block", margin: "8px auto 0" }}>
          {new Array(30).fill(0).map((_, i) => (
            <rect key={i} x={i * 26} y={i % 5 === 0 ? 4 : 10} width={4} height={i % 5 === 0 ? 22 : 12} rx={2} fill={i <= t ? TERRA : LINE} />
          ))}
        </svg>
      </div>

      {/* A — 1997, the shop */}
      <Sec a={0} b={4.2} t={t}>
        {(lt) => (
          <>
            <PhotoCard develop={ci(lt, 0.1, 1.4, 0, 1)} wipe={0} y={330} />
            <Words text="Paris 13ᵉ." lt={lt} at={0.6} style={{ position: "absolute", top: 1160, left: 80, right: 80, textAlign: "center", fontFamily: SANS, fontWeight: 500, fontSize: 40, letterSpacing: 6, color: INK3 }} />
            <Words text="Une petite boutique de plantes : « À la Calebasse Verte »." lt={lt} at={1.0} per={0.08} hl={["calebasse", "verte"]} style={{ position: "absolute", top: 1250, left: 90, right: 90, textAlign: "center", fontFamily: SERIF, fontWeight: 400, fontSize: 66, lineHeight: 1.2, color: INK }} />
          </>
        )}
      </Sec>

      {/* B — the founder */}
      <Sec a={4.0} b={8.2} t={t}>
        {(lt) => (
          <>
            <svg width={W} height={H} style={{ position: "absolute" }}>
              {[-330, -170, 0, 170, 330].map((x, i) => {
                const k = ci(lt, 0.2 + i * 0.12, 1.6 + i * 0.12, 0, 1);
                const hgt = 260 + (i % 2) * 120;
                return (
                  <g key={i} transform={`translate(${540 + x} 1700)`}>
                    <Draw d={`M 0 0 C ${i % 2 ? 20 : -20} ${-hgt / 2} 0 ${-hgt * 0.8} ${i % 2 ? -10 : 10} ${-hgt}`} k={k} c={SAGEINK} w={4} />
                    {[0.35, 0.55, 0.75].map((p, j) => (
                      <ellipse key={j} cx={(j % 2 ? 1 : -1) * 28} cy={-hgt * p} rx={30 * ci(lt, 0.8 + i * 0.12 + j * 0.15, 1.4 + i * 0.12 + j * 0.15, 0, 1)} ry={12 * ci(lt, 0.8 + i * 0.12 + j * 0.15, 1.4 + i * 0.12 + j * 0.15, 0, 1)} transform={`rotate(${(j % 2 ? -1 : 1) * 30} ${(j % 2 ? 1 : -1) * 28} ${-hgt * p})`} fill={SAGE} stroke={SAGEINK} strokeWidth={2} />
                    ))}
                  </g>
                );
              })}
            </svg>
            <Words text="Elle s'appelle" lt={lt} at={0.2} style={{ position: "absolute", top: 470, left: 0, right: 0, textAlign: "center", fontFamily: SERIF_I, fontWeight: 300, fontSize: 56, color: INK3 }} />
            <div style={{ position: "absolute", top: 560, left: 0, right: 0, textAlign: "center", fontFamily: SERIF, fontWeight: 500, fontSize: 132, color: INK, opacity: ci(lt, 0.5, 1.0, 0, 1), transform: `scale(${ci(lt, 0.5, 1.2, 1.15, 1, settle)})`, letterSpacing: 2 }}>
              LIU Shao Hua
            </div>
            <Words text="Gynécologue et praticienne de médecine chinoise, elle veut rendre la pharmacopée accessible." lt={lt} at={1.3} per={0.07} hl={["médecine", "chinoise", "pharmacopée"]} style={{ position: "absolute", top: 780, left: 100, right: 100, textAlign: "center", fontFamily: SERIF, fontWeight: 400, fontSize: 54, lineHeight: 1.3, color: INK }} />
          </>
        )}
      </Sec>

      {/* C — why a calabash */}
      <Sec a={8.0} b={13.2} t={t}>
        {(lt) => {
          const gourd = ci(lt, 0.2, 1.8, 0, 1);
          const travel = ci(lt, 2.0, 4.6, 0, 1, soft);
          // path between villages
          const P = (u: number) => [180 + u * 720, 1660 - Math.sin(u * Math.PI) * 90 + Math.sin(u * 9) * 12];
          const [gx, gy] = P(travel);
          return (
            <>
              <Words text="Pourquoi « Calebasse » ?" lt={lt} at={0.1} hl={["calebasse"]} style={{ position: "absolute", top: 330, left: 0, right: 0, textAlign: "center", fontFamily: SERIF, fontWeight: 500, fontSize: 76, color: INK }} />
              <svg width={W} height={H} style={{ position: "absolute" }}>
                <g transform="translate(540 760)">
                  <path
                    d="M 0 -230 C -22 -230 -26 -205 -24 -185 C -22 -150 -80 -140 -84 -80 C -88 -35 -50 -20 -54 0 C -150 20 -190 100 -170 180 C -150 260 -60 290 0 290 C 60 290 150 260 170 180 C 190 100 150 20 54 0 C 50 -20 88 -35 84 -80 C 80 -140 22 -150 24 -185 C 26 -205 22 -230 0 -230 Z"
                    fill="#E9C77A"
                    opacity={ci(lt, 1.4, 2.0, 0, 0.85)}
                  />
                  <Draw d="M 0 -230 C -22 -230 -26 -205 -24 -185 C -22 -150 -80 -140 -84 -80 C -88 -35 -50 -20 -54 0 C -150 20 -190 100 -170 180 C -150 260 -60 290 0 290 C 60 290 150 260 170 180 C 190 100 150 20 54 0 C 50 -20 88 -35 84 -80 C 80 -140 22 -150 24 -185 C 26 -205 22 -230 0 -230 Z" k={gourd} w={5} />
                  <Draw d="M -54 0 C -20 12 20 12 54 0" k={ci(lt, 1.2, 1.7, 0, 1)} c={TERRA} w={8} />
                  <Draw d="M 0 -230 C 10 -260 40 -270 60 -262" k={ci(lt, 1.5, 1.9, 0, 1)} c={SAGEINK} w={5} />
                </g>
                {/* villages & travel */}
                {[0, 0.5, 1].map((u, i) => {
                  const [x, y] = P(u);
                  return (
                    <g key={i} transform={`translate(${x} ${y - 40})`} opacity={ci(lt, 1.8 + i * 0.15, 2.2 + i * 0.15, 0, 1)}>
                      <path d="M -36 30 L -36 -4 L 0 -32 L 36 -4 L 36 30 Z" fill={PAPER} stroke={INK} strokeWidth={3} strokeLinejoin="round" />
                      <path d="M -46 -2 L 0 -42 L 46 -2" fill="none" stroke={TERRA} strokeWidth={5} strokeLinecap="round" />
                    </g>
                  );
                })}
                <path d={`M ${P(0)[0]} ${P(0)[1]} ${new Array(40).fill(0).map((_, i) => { const [x, y] = P((i + 1) / 40); return `L ${x} ${y}`; }).join(" ")}`} fill="none" stroke={INK3} strokeWidth={3} strokeDasharray="2 14" strokeLinecap="round" opacity={ci(lt, 1.9, 2.3, 0, 1)} />
                <g transform={`translate(${gx} ${gy - 30}) scale(0.16)`} opacity={ci(lt, 2.0, 2.2, 0, 1)}>
                  <path d="M 0 -230 C -22 -230 -26 -205 -24 -185 C -22 -150 -80 -140 -84 -80 C -88 -35 -50 -20 -54 0 C -150 20 -190 100 -170 180 C -150 260 -60 290 0 290 C 60 290 150 260 170 180 C 190 100 150 20 54 0 C 50 -20 88 -35 84 -80 C 80 -140 22 -150 24 -185 C 26 -205 22 -230 0 -230 Z" fill="#E9C77A" stroke={INK} strokeWidth={14} />
                </g>
              </svg>
              <Words text="Les médecins itinérants y transportaient plantes et pilules, de village en village." lt={lt} at={2.1} per={0.07} hl={["médecins", "itinérants", "village"]} style={{ position: "absolute", top: 1120, left: 100, right: 100, textAlign: "center", fontFamily: SERIF, fontWeight: 400, fontSize: 54, lineHeight: 1.3, color: INK }} />
            </>
          );
        }}
      </Sec>

      {/* D — three principles (seals) */}
      <Sec a={13.0} b={19.6} t={t}>
        {(lt) => {
          const items = [
            { zh: "医者仁心", fr: "Votre santé avant tout" },
            { zh: "上工治未病", fr: "Prendre soin en amont" },
            { zh: "为学日益", fr: "Étudier plus, formuler avec justesse" },
          ];
          return (
            <>
              <Words text="Une maison, trois principes." lt={lt} at={0.1} style={{ position: "absolute", top: 340, left: 0, right: 0, textAlign: "center", fontFamily: SERIF_I, fontWeight: 300, fontSize: 60, color: INK3 }} />
              {items.map((it, i) => {
                const at = 0.6 + i * 1.9;
                const k = ci(lt, at, at + 0.3, 0, 1, Easing.out(Easing.back(2.2)));
                const y = 520 + i * 360;
                return (
                  <div key={i} style={{ position: "absolute", left: 110, right: 90, top: y, display: "flex", alignItems: "center", gap: 46, opacity: Math.min(1, k * 1.4) }}>
                    <div style={{ flexShrink: 0, width: 250, height: 250, background: TERRA, borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${0.6 + 0.4 * k}) rotate(${(i - 1) * 3}deg)`, boxShadow: "inset 0 0 26px rgba(70,10,0,0.55)" }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", fontFamily: BRUSH, color: "#FBEFE2", lineHeight: 1.02 }}>
                        {(it.zh.length === 4 ? [it.zh.slice(0, 2), it.zh.slice(2)] : [it.zh.slice(0, 3), it.zh.slice(3)]).map((row, r) => (
                          <span key={r} style={{ fontSize: it.zh.length > 4 ? 64 : 84, letterSpacing: 2 }}>{row}</span>
                        ))}
                      </div>
                    </div>
                    <div style={{ fontFamily: SERIF, fontWeight: 400, fontSize: 56, lineHeight: 1.2, color: INK, opacity: ci(lt, at + 0.2, at + 0.6, 0, 1), transform: `translateX(${ci(lt, at + 0.2, at + 0.7, 30, 0, settle)}px)` }}>{it.fr}</div>
                  </div>
                );
              })}
            </>
          );
        }}
      </Sec>

      {/* E — 2017, the Laboratoire */}
      <Sec a={19.4} b={23.6} t={t}>
        {(lt) => {
          const logo = ci(lt, 2.0, 3.0, 0, 1, settle);
          return (
            <>
              <Words text="Son fils, WU Ruosi, docteur en pharmacie," lt={lt} at={0.6} per={0.07} hl={["wu", "ruosi"]} style={{ position: "absolute", top: 420, left: 100, right: 100, textAlign: "center", fontFamily: SERIF, fontWeight: 400, fontSize: 60, lineHeight: 1.25, color: INK }} />
              <Words text="fonde le Laboratoire Calebasse." lt={lt} at={1.2} per={0.09} style={{ position: "absolute", top: 600, left: 100, right: 100, textAlign: "center", fontFamily: SERIF, fontWeight: 500, fontSize: 72, lineHeight: 1.2, color: DEEP }} />
              <div style={{ position: "absolute", left: 140, width: 800, top: 900, height: 170, overflow: "hidden", clipPath: `inset(0 ${100 - logo * 100}% 0 0)` }}>
                <Img src={staticFile("brand/logo_color.svg")} style={{ width: 800 }} />
              </div>
              <Words text="La tradition, avec le regard de la science." lt={lt} at={2.4} per={0.07} style={{ position: "absolute", top: 1180, left: 100, right: 100, textAlign: "center", fontFamily: SERIF_I, fontWeight: 300, fontSize: 50, color: INK3 }} />
            </>
          );
        }}
      </Sec>

      {/* F — numbers */}
      <Sec a={23.4} b={25.8} t={t}>
        {(lt) => {
          const c1 = Math.round(ci(lt, 0.2, 1.3, 0, 700, Easing.out(Easing.cubic)));
          const c2 = Math.round(ci(lt, 0.5, 1.6, 0, 3000, Easing.out(Easing.cubic)));
          const fmt = (n: number) => n.toLocaleString("fr-FR").replace(/ | /g, " ");
          return (
            <>
              {[
                { v: `${fmt(c1)}+`, l: "plantes de la pharmacopée chinoise", y: 520 },
                { v: `${fmt(c2)}+`, l: "praticiens partenaires en France", y: 960 },
              ].map((x, i) => (
                <div key={i} style={{ position: "absolute", top: x.y, left: 0, right: 0, textAlign: "center", opacity: ci(lt, 0.1 + i * 0.3, 0.4 + i * 0.3, 0, 1) }}>
                  <div style={{ fontFamily: SERIF, fontWeight: 500, fontSize: 190, color: i ? DEEP : TERRA, lineHeight: 1 }}>{x.v}</div>
                  <div style={{ fontFamily: SANS, fontWeight: 500, fontSize: 40, color: INK3, marginTop: 10 }}>{x.l}</div>
                </div>
              ))}
            </>
          );
        }}
      </Sec>

      {/* G — then / now */}
      <Sec a={25.6} b={27.7} t={t}>
        {(lt) => (
          <>
            <PhotoCard develop={1} wipe={ci(lt, 0.3, 1.3, 0, 1, Easing.inOut(Easing.cubic))} y={330} />
            <div style={{ position: "absolute", top: 1160, left: 0, right: 0, display: "flex", justifyContent: "space-between", padding: "0 120px", fontFamily: SANS, fontWeight: 600, fontSize: 34, letterSpacing: 6, color: INK3 }}>
              <span style={{ opacity: 1 - ci(lt, 0.8, 1.2, 0, 1) }}>1997</span>
              <span style={{ opacity: ci(lt, 0.8, 1.2, 0, 1), color: TERRA }}>AUJOURD'HUI</span>
            </div>
            <Words text="Aujourd'hui, comme hier." lt={lt} at={0.9} per={0.1} style={{ position: "absolute", top: 1260, left: 0, right: 0, textAlign: "center", fontFamily: SERIF, fontWeight: 400, fontSize: 80, color: INK }} />
          </>
        )}
      </Sec>

      {/* H — 29 ans */}
      {t >= 27.5 && (
        <AbsoluteFill style={{ opacity: ci(t, 27.5, 27.8, 0, 1) }}>
          <div style={{ position: "absolute", top: 300, left: 0, right: 0, textAlign: "center" }}>
            <Img src={staticFile("brand/logo512.png")} style={{ width: 150, transform: `scale(${ci(t, 27.5, 27.9, 1.5, 1, Easing.out(Easing.back(2)))})` }} />
          </div>
          <div style={{ position: "absolute", top: 520, left: 0, right: 0, textAlign: "center", fontFamily: SERIF, fontWeight: 500, fontSize: 330, lineHeight: 1, color: TERRA, transform: `scale(${ci(t, 27.55, 28.0, 0.8, 1, settle)})` }}>29</div>
          <div style={{ position: "absolute", top: 860, left: 0, right: 0, textAlign: "center", fontFamily: SERIF_I, fontWeight: 300, fontSize: 96, color: INK }}>ans</div>
          <div style={{ position: "absolute", top: 1080, left: 120, right: 120, textAlign: "center", fontFamily: SERIF, fontWeight: 400, fontSize: 60, lineHeight: 1.2, color: INK, opacity: ci(t, 27.9, 28.3, 0, 1) }}>
            Une maison avant d'être une marque.
          </div>
          <div style={{ position: "absolute", top: 1360, left: 0, right: 0, textAlign: "center", fontFamily: SANS, fontWeight: 600, fontSize: 30, letterSpacing: 8, color: SAGEINK, opacity: ci(t, 28.1, 28.4, 0, 1) }}>
            1997 — 2026
          </div>
          <Img src={staticFile("brand/logo_color.svg")} style={{ position: "absolute", left: 290, width: 500, top: 1640, opacity: ci(t, 28.0, 28.4, 0, 1) }} />
        </AbsoluteFill>
      )}

      <Audio src={staticFile("sfx/music.wav")} volume={0.9} />
      <Sequence from={f(25.85)} layout="none">
        <Audio src={staticFile("sfx/whoosh.wav")} volume={0.5} />
      </Sequence>
    </AbsoluteFill>
  );
};

export const calculateMetadata: CalculateMetadataFunction<SceneProps> = async ({ props }) => ({
  durationInFrames: Math.round((props.duration ?? 29) * 30),
  fps: 30,
  width: W,
  height: H,
});
