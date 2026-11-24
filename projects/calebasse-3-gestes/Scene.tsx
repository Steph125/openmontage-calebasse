// Calebasse — « De la plante au flacon : trois choses comptent » (24 s).
// Reference grammar: monochrome gridded paper, magnifier reveal, blur→sharp words, minimalist physics, dark end card.
// Signature: everything is grey on paper — only the magnifier shows the plant in colour.
import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { Grain, H, SANS, W, backOut, clamp, inOut, inOutSine, mix, out3, out5, prog, settle } from "./kit";

const PAPER = "#F2F0E9";
const INK = "#1C2622";
const FOREST = "#0D3B2E";
const LIME = "#C9EC7A";
const END = 600; // forest wipe starts

type Item = { n: string; word: string; sub: string; img: string; imgW: number; imgX: number; imgY: number; start: number };
const ITEMS: Item[] = [
  { n: "01", word: "La source", sub: "Choisir les terroirs d'origine", img: "img/bowl_astragale.png", imgW: 700, imgX: 540, imgY: 1170, start: 200 },
  { n: "02", word: "Le geste", sub: "Respecter les préparations traditionnelles", img: "img/cup_astragale.png", imgW: 720, imgX: 540, imgY: 1180, start: 330 },
  { n: "03", word: "Le contrôle", sub: "Identifier, contrôler et tracer", img: "", imgW: 0, imgX: 540, imgY: 1180, start: 460 },
];

// ------------------------------------------------------------------ page content (rendered twice: grey paper + coloured lens)
const Grid: React.FC = () => (
  <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
    <defs>
      <pattern id="g" width="60" height="60" patternUnits="userSpaceOnUse">
        <path d="M 60 0 L 0 0 0 60" fill="none" stroke="rgba(28,38,34,0.07)" strokeWidth="1.5" />
      </pattern>
    </defs>
    <rect width={W} height={H} fill="url(#g)" />
    <rect x="90" y="470" width="900" height="980" fill="none" stroke="rgba(28,38,34,0.16)" strokeWidth="2" strokeDasharray="10 12" />
  </svg>
);

const Leaves: React.FC<{ f: number }> = ({ f }) => {
  const sway = Math.sin(f * 0.025) * 2.5;
  // two fronds of pointed leaves along a stem, soft-focused like plant shadows on paper
  const frond = (x: number, y: number, ang: number, len: number, key: string) => {
    const leaves = [];
    for (let i = 0; i < 7; i++) {
      const t = i / 6;
      const px = x + Math.cos((ang * Math.PI) / 180) * len * t;
      const py = y + Math.sin((ang * Math.PI) / 180) * len * t;
      const s = 1 - t * 0.45;
      for (const side of [-1, 1]) {
        leaves.push(<path key={`${key}${i}${side}`} d={`M 0 0 C ${18 * s} ${-40 * s} ${16 * s} ${-110 * s} 0 ${-150 * s} C ${-16 * s} ${-110 * s} ${-18 * s} ${-40 * s} 0 0 Z`}
          fill="#1E2A25" transform={`translate(${px} ${py}) rotate(${ang + 90 + side * (48 - t * 10) + sway})`} />);
      }
    }
    return <g key={key}><line x1={x} y1={y} x2={x + Math.cos((ang * Math.PI) / 180) * len} y2={y + Math.sin((ang * Math.PI) / 180) * len} stroke="#1E2A25" strokeWidth={6} />{leaves}</g>;
  };
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, filter: "blur(7px)", opacity: 0.42 }}>
      {frond(-30, -20, 38, 420, "a")}
      {frond(-60, 160, 18, 300, "b")}
      {frond(1110, 1950, 218, 440, "c")}
      {frond(1140, 1760, 200, 300, "d")}
    </svg>
  );
};

const Balance: React.FC<{ l: number }> = ({ l }) => {
  const tilt = 14 * (1 - settle(l - 34, 0.22, 0.09));
  const x = 540;
  const y = 1210;
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
      <polygon points={`${x},${y} ${x - 46},${y + 90} ${x + 46},${y + 90}`} fill={INK} />
      <g transform={`rotate(${-tilt} ${x} ${y})`}>
        <rect x={x - 330} y={y - 12} width={660} height={12} rx={6} fill={INK} />
        <circle cx={x + 250} cy={y - 54} r={42} fill={INK} />
        <g transform={`translate(${x - 300} ${y - 98})`}>
          <ellipse cx="60" cy="58" rx="64" ry="26" fill="#C9AE7E" stroke={INK} strokeWidth="5" />
          <ellipse cx="60" cy="52" rx="44" ry="14" fill="#E7D3A6" />
          <path d="M 18 54 Q 60 30 102 54" stroke="#9C7A45" strokeWidth="3" fill="none" />
        </g>
      </g>
    </svg>
  );
};

const Content: React.FC<{ f: number }> = ({ f }) => {
  // S1 — opening line
  const s1 = f < 112 ? 1 - out3(prog(f, 96, 112)) : 0;
  const s1in = out5(prog(f, 6, 30));
  // S2 — "3 choses comptent"
  const s2in = out5(prog(f, 112, 136));
  const s2out = out3(prog(f, 186, 200));
  const s2blur = mix(22, 0, out3(prog(f, 112, 140)));
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", inset: 0, background: PAPER }} />
      <Grid />
      {/* S1 */}
      {f < 112 && (
        <>
          <Img src={staticFile("img/bowl_astragale.png")} style={{ position: "absolute", width: 620, left: mix(-420, -150, out5(prog(f, 0, 40))), top: 1250, transform: `rotate(${mix(-30, -12, prog(f, 0, 60))}deg)`, opacity: s1 }} />
          <div style={{ position: "absolute", left: 120, right: 120, top: 760, fontFamily: SANS, color: INK, opacity: s1 * s1in, transform: `translateY(${(1 - s1in) * 30}px)` }}>
            <div style={{ fontWeight: 300, fontSize: 54, letterSpacing: "-0.01em" }}>Une plante,</div>
            <div style={{ fontWeight: 700, fontSize: 104, letterSpacing: "-0.03em", lineHeight: 1.02 }}>trois exigences.</div>
          </div>
        </>
      )}
      {/* S2 */}
      {f >= 112 && f < 200 && (
        <div style={{ position: "absolute", left: 0, right: 0, top: 690, textAlign: "center", fontFamily: SANS, color: INK, opacity: s2in * (1 - s2out), filter: `blur(${s2blur}px)` }}>
          <div style={{ fontWeight: 300, fontSize: 300, lineHeight: 1, letterSpacing: "-0.04em" }}>3</div>
          <div style={{ fontWeight: 700, fontSize: 72, letterSpacing: "-0.02em" }}>choses comptent</div>
          <div style={{ fontWeight: 400, fontSize: 30, letterSpacing: "0.14em", textTransform: "uppercase", marginTop: 12, opacity: 0.6 }}>de la plante au flacon</div>
        </div>
      )}
      {/* S3–S5 */}
      {ITEMS.map((it, i) => {
        const l = f - it.start;
        const len = 130;
        if (l < 0 || l >= len) return null;
        const inT = out5(prog(l, 0, 22));
        const outT = out3(prog(l, len - 14, len));
        const focus = mix(20, 0, out3(prog(l, 4, 30)));
        const imgIn = out5(prog(l, 6, 34));
        return (
          <React.Fragment key={it.n}>
            {it.img && (
              <Img src={staticFile(it.img)} style={{ position: "absolute", width: it.imgW, left: it.imgX - it.imgW / 2, top: it.imgY - 260 + (1 - imgIn) * 160,
                opacity: imgIn * (1 - outT), borderRadius: it.img.endsWith(".jpg") ? 28 : 0, transform: `rotate(${mix(i ? 4 : -6, 0, imgIn)}deg)` }} />
            )}
            {!it.img && <div style={{ opacity: 1 - outT }}><Balance l={l} /></div>}
            <div style={{ position: "absolute", left: 120, right: 120, top: 560, fontFamily: SANS, color: INK, opacity: inT * (1 - outT) }}>
              <div style={{ fontWeight: 600, fontSize: 34, letterSpacing: "0.2em", opacity: 0.55, transform: `translateY(${(1 - inT) * 20}px)` }}>{it.n}</div>
              <div style={{ fontWeight: 800, fontSize: 132, letterSpacing: "-0.04em", lineHeight: 1.02, filter: `blur(${focus}px)` }}>{it.word}</div>
              <div style={{ fontWeight: 400, fontSize: 40, lineHeight: 1.3, marginTop: 14, opacity: out3(prog(l, 18, 40)), maxWidth: 820 }}>{it.sub}</div>
            </div>
          </React.Fragment>
        );
      })}
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ the magnifier
const lensPath = (f: number): { x: number; y: number; on: number } => {
  const keys: [number, number, number][] = [
    [0, 1250, 1500], [30, 1250, 1500], [70, 640, 900], [104, 700, 880], // S1: sweeps onto the line
    [128, 1300, 1250], // exits (S2 is pure typography)
    [210, 1300, 1300], [250, 600, 1160], [318, 520, 1120], // S3 over the roots
    [340, 1300, 1300], [380, 640, 1200], [446, 470, 1140], // S4 over the cup
    [470, 1300, 1300], [520, 760, 1140], [586, 560, 1110], // S5 over the balance
    [600, 1350, 1250],
  ];
  let k = 0;
  while (k < keys.length - 1 && f > keys[k + 1][0]) k++;
  const [f0, x0, y0] = keys[k];
  const [f1, x1, y1] = keys[Math.min(k + 1, keys.length - 1)];
  const t = f1 === f0 ? 1 : inOutSine(clamp((f - f0) / (f1 - f0)));
  const x = mix(x0, x1, t) + Math.sin(f * 0.07) * 6;
  const y = mix(y0, y1, t) + Math.cos(f * 0.06) * 6;
  const on = x < 1250 ? 1 : 0;
  return { x, y, on };
};

export const Scene: React.FC = () => {
  const f = useCurrentFrame();
  const L = lensPath(f);
  const R = 205;
  const zoom = 1.5;
  const wipe = out5(prog(f, END, END + 22));
  const endIn = out3(prog(f, END + 18, END + 44));
  const endBag = settle(f - END - 26, 0.2, 0.2);
  return (
    <AbsoluteFill style={{ background: PAPER }}>
      {/* grey paper */}
      <div style={{ position: "absolute", inset: 0, filter: "grayscale(1) contrast(1.05)" }}>
        <Content f={f} />
      </div>
      <Leaves f={f} />
      {/* coloured, magnified view inside the lens */}
      {L.on > 0 && (
        <div style={{ position: "absolute", inset: 0, clipPath: `circle(${R - 14}px at ${L.x}px ${L.y}px)` }}>
          <div style={{ position: "absolute", inset: 0, transform: `scale(${zoom})`, transformOrigin: `${L.x}px ${L.y}px` }}>
            <Content f={f} />
          </div>
          <div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at ${L.x - 60}px ${L.y - 70}px, rgba(255,255,255,0.35) 0, rgba(255,255,255,0) ${R * 0.6}px)` }} />
        </div>
      )}
      {L.on > 0 && (
        <svg width={W} height={H} style={{ position: "absolute", inset: 0, filter: "drop-shadow(0 18px 22px rgba(0,0,0,0.28))" }}>
          <g transform={`translate(${L.x} ${L.y})`}>
            <line x1={R * 0.72} y1={R * 0.72} x2={R * 1.75} y2={R * 1.75} stroke={INK} strokeWidth={34} strokeLinecap="round" />
            <circle r={R - 4} fill="none" stroke={INK} strokeWidth={22} />
            <circle r={R - 16} fill="none" stroke="#3B4842" strokeWidth={3} />
          </g>
        </svg>
      )}
      {/* persistent brand mark (ref: logo at the top of the paper) */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 120, display: "flex", justifyContent: "center", opacity: 1 - wipe }}>
        <Img src={staticFile("brand/logo_color.svg")} style={{ height: 56, filter: "grayscale(1) brightness(0.35)" }} />
      </div>
      {/* forest wipe + end card */}
      {wipe > 0 && (
        <>
          <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: H * wipe, background: `linear-gradient(180deg, #145240 0%, ${FOREST} 50%, #082319 100%)` }} />
          <div style={{ position: "absolute", left: 0, right: 0, top: 330, display: "flex", flexDirection: "column", alignItems: "center", fontFamily: SANS, opacity: endIn, transform: `translateY(${(1 - endIn) * 30}px)` }}>
            <Img src={staticFile("brand/logo_ivory.svg")} style={{ height: 70 }} />
            <div style={{ fontWeight: 700, fontSize: 82, color: "#F7F5EE", letterSpacing: "-0.03em", marginTop: 60, textAlign: "center", lineHeight: 1.05 }}>De la plante<br />au flacon.</div>
            <div style={{ marginTop: 30, padding: "10px 26px", borderRadius: 999, background: LIME, color: FOREST, fontWeight: 700, fontSize: 30 }}>Fabriqué en France</div>
          </div>
          <Img src={staticFile("img/bag_astragale.png")} style={{ position: "absolute", width: 236, left: 540 - 118, top: 770 + (1 - endBag) * 700, filter: "drop-shadow(0 26px 30px rgba(0,0,0,0.4))" }} />
          <div style={{ position: "absolute", left: 0, right: 0, top: 1448, textAlign: "center", fontFamily: SANS, opacity: out3(prog(f, END + 40, END + 60)) }}>
            <div style={{ fontWeight: 600, fontSize: 40, color: "#F7F5EE" }}>Racine d'astragale</div>
            <div style={{ fontWeight: 400, fontSize: 28, color: LIME, letterSpacing: "0.14em", textTransform: "uppercase", marginTop: 4 }}>Huang qi · calebasse.com</div>
          </div>
        </>
      )}
      <Grain f={f} id="tg" opacity={0.07} />
    </AbsoluteFill>
  );
};
