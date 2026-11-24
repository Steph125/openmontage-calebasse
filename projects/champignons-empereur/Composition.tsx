import React, { useMemo } from "react";
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
import { loadFont as loadFraunces } from "@remotion/google-fonts/Fraunces";
import { loadFont as loadJost } from "@remotion/google-fonts/Jost";
import { loadFont as loadNotoSC } from "@remotion/google-fonts/NotoSerifSC";
import { loadFont as loadBrush } from "@remotion/google-fonts/MaShanZheng";

// ATELIER — "Coupe de sous-bois". See art-direction.md.

const { fontFamily: SERIF } = loadFraunces("normal", { weights: ["300", "400", "600"], subsets: ["latin", "latin-ext"] });
const { fontFamily: SERIF_I } = loadFraunces("italic", { weights: ["300", "400"], subsets: ["latin", "latin-ext"] });
const { fontFamily: SANS } = loadJost("normal", { weights: ["400", "500"], subsets: ["latin", "latin-ext"] });
const { fontFamily: HAN } = loadNotoSC("normal", { weights: ["400", "600"] });
const { fontFamily: BRUSH } = loadBrush();

const W = 1080;
const H = 1920;
const HUMUS = "#17120E";
const IVORY = "#EFE6D2";
const GOLD = "#D8B36A";
const SEAL = "#B8332A";
const STROMA = "#6B4A2B";
const WINTER = "#8FA3B5";
const SUMMER = "#E6B866";

const soft = Easing.bezier(0.45, 0, 0.55, 1);
const settle = Easing.bezier(0.2, 0.7, 0.2, 1);
const ci = (x: number, a: number, b: number, from: number, to: number, e = soft) =>
  interpolate(x, [a, b], [from, to], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: e });
const hash = (i: number, k: number) => {
  const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453;
  return x - Math.floor(x);
};
const mix = (a: string, b: string, k: number) => {
  const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const A = p(a),
    B = p(b);
  return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * k)).join(",")})`;
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
  phrases: { text: string; s: number }[];
  keys?: string[];
}
export interface SceneProps {
  duration: number;
  lines: Line[];
}

// ---------------------------------------------------------------- mycelium (deterministic L-system)
type Seg = { d: string; t0: number; t1: number; w: number };
const grow = (seed: number, x: number, y: number, ang: number, len: number, depth: number, t0: number, speed: number, width: number, out: Seg[]) => {
  const x1 = x + Math.cos(ang) * len;
  const y1 = y + Math.sin(ang) * len;
  const bend = (hash(seed, 1) - 0.5) * len * 0.5;
  const cx = (x + x1) / 2 + Math.cos(ang + Math.PI / 2) * bend;
  const cy = (y + y1) / 2 + Math.sin(ang + Math.PI / 2) * bend;
  const t1 = t0 + len / speed;
  out.push({ d: `M ${x} ${y} Q ${cx} ${cy} ${x1} ${y1}`, t0, t1, w: width });
  if (depth <= 0) return;
  const n = hash(seed, 2) < 0.35 ? 3 : 2;
  for (let i = 0; i < n; i++) {
    const da = (hash(seed, 3 + i) - 0.5) * 1.3 + (i - (n - 1) / 2) * 0.45;
    grow(seed * 7 + i * 13 + 1, x1, y1, ang + da, len * (0.62 + hash(seed, 9 + i) * 0.25), depth - 1, t1, speed * 0.92, width * 0.72, out);
  }
};
const useHyphae = (origins: { x: number; y: number; a: number; len: number; depth: number; t0: number; speed?: number; w?: number }[], seed: number) =>
  useMemo(() => {
    const out: Seg[] = [];
    origins.forEach((o, i) => grow(seed + i * 101, o.x, o.y, o.a, o.len, o.depth, o.t0, o.speed ?? 260, o.w ?? 2.4, out));
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed]);
const Hyphae: React.FC<{ segs: Seg[]; t: number; color?: string; opacity?: number }> = ({ segs, t, color = IVORY, opacity = 0.85 }) => (
  <g opacity={opacity}>
    {segs.map((s, i) => {
      const k = Math.max(0, Math.min(1, (t - s.t0) / (s.t1 - s.t0)));
      if (k <= 0) return null;
      return <path key={i} d={s.d} pathLength={1} strokeDasharray={`${k} 1`} fill="none" stroke={color} strokeWidth={s.w} strokeLinecap="round" />;
    })}
  </g>
);

// ---------------------------------------------------------------- drawings
const Reishi: React.FC<{ k?: number; glow?: number }> = ({ k = 1, glow = 0 }) => (
  <g>
    <defs>
      <radialGradient id="lacq" cx="42%" cy="38%" r="70%">
        <stop offset="0%" stopColor="#E0823F" />
        <stop offset="45%" stopColor="#A63A22" />
        <stop offset="85%" stopColor="#6E1F15" />
        <stop offset="100%" stopColor="#D9B45E" />
      </radialGradient>
    </defs>
    {glow > 0 && <ellipse cx={0} cy={-40} rx={260} ry={170} fill={GOLD} opacity={0.18 * glow} filter="url(#blur30)" />}
    <path d="M -10,10 C -20,70 10,120 -18,190" stroke="#4A2016" strokeWidth={26} fill="none" strokeLinecap="round" opacity={k} />
    <path
      d="M -190,10 C -210,-90 -110,-160 0,-160 C 120,-160 210,-90 190,10 C 130,40 60,30 0,18 C -60,30 -130,40 -190,10 Z"
      fill="url(#lacq)"
      stroke="#2B130D"
      strokeWidth={3}
      opacity={k}
    />
    {[0.25, 0.45, 0.65, 0.82].map((r, i) => (
      <path key={i} d={`M ${-190 * r},${10 - 6 * r} C ${-200 * r},${-80 * r} ${-100 * r},${-150 * r} 0,${-150 * r} C ${110 * r},${-150 * r} ${200 * r},${-80 * r} ${190 * r},${10 - 6 * r}`} fill="none" stroke="#F0B878" strokeWidth={2} opacity={0.35 * k} />
    ))}
    <path d="M -110,-110 C -60,-140 20,-145 70,-125" stroke="#FFE3B8" strokeWidth={8} strokeLinecap="round" fill="none" opacity={0.45 * k} />
  </g>
);

const Hericium: React.FC = () => (
  <g>
    <ellipse cx={0} cy={-20} rx={120} ry={95} fill="#F4EEE0" stroke={HUMUS} strokeWidth={2} />
    {new Array(46).fill(0).map((_, i) => {
      const x = -110 + (220 * i) / 45;
      const top = -20 + Math.sqrt(Math.max(0, 1 - (x / 120) ** 2)) * 60;
      const len = 40 + hash(i, 1) * 70 * Math.sqrt(Math.max(0, 1 - (x / 125) ** 2));
      return <path key={i} d={`M ${x} ${top} q ${(hash(i, 2) - 0.5) * 8} ${len / 2} ${(hash(i, 3) - 0.5) * 6} ${len}`} stroke="#EDE3CC" strokeWidth={5} strokeLinecap="round" fill="none" />;
    })}
  </g>
);

const Tremella: React.FC = () => (
  <g>
    {[0, 1].map((ring) =>
      new Array(ring ? 7 : 9).fill(0).map((_, i) => {
        const n = ring ? 7 : 9;
        const a = (i / n) * Math.PI * 2 + ring * 0.4;
        const d = ring ? 38 : 78;
        const x = Math.cos(a) * d;
        const y = Math.sin(a) * d * 0.8;
        const rx = ring ? 48 : 62;
        // ruffled edge: a wavy closed curve
        const pts = new Array(24).fill(0).map((_, k) => {
          const th = (k / 24) * Math.PI * 2;
          const rr = 1 + 0.12 * Math.sin(th * 6 + i);
          return [Math.cos(th) * rx * rr, Math.sin(th) * rx * 0.62 * rr];
        });
        const dPath = "M " + pts.map((p) => p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" L ") + " Z";
        return (
          <path
            key={ring + "-" + i}
            d={dPath}
            transform={`translate(${x} ${y}) rotate(${(a * 180) / Math.PI + 90})`}
            fill={ring ? "rgba(248,250,253,0.62)" : "rgba(236,242,250,0.45)"}
            stroke="#E6EDF6"
            strokeWidth={2}
          />
        );
      })
    )}
    <ellipse rx={24} ry={18} fill="rgba(250,251,253,0.85)" />
  </g>
);

// ---------------------------------------------------------------- shells
const Section: React.FC<{ len: number; children: (t: number) => React.ReactNode; fadeIn?: number; fadeOut?: number }> = ({ len, children, fadeIn = 0.5, fadeOut = 0.5 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const o = ci(t, 0, fadeIn, 0, 1) * (1 - ci(t, len - fadeOut, len, 0, 1));
  return <AbsoluteFill style={{ opacity: o }}>{children(t)}</AbsoluteFill>;
};

const Tag: React.FC<{ o: number; zh: string; latin: string; note?: string; y?: number }> = ({ o, zh, latin, note, y = 110 }) => (
  <div style={{ position: "absolute", top: y, left: 0, right: 0, textAlign: "center", opacity: o, transform: `translateY(${(1 - o) * 16}px)` }}>
    <div style={{ fontFamily: BRUSH, fontSize: 88, color: IVORY, letterSpacing: 10, textShadow: "0 4px 24px rgba(0,0,0,0.5)" }}>{zh}</div>
    <div style={{ fontFamily: SERIF_I, fontWeight: 300, fontSize: 42, color: IVORY, opacity: 0.9 }}>{latin}</div>
    {note && <div style={{ fontFamily: SANS, fontSize: 30, letterSpacing: 6, color: GOLD, marginTop: 8 }}>{note}</div>}
  </div>
);

// ---------------------------------------------------------------- scenes
const Hook: React.FC<{ t: number; at: Record<string, number> }> = ({ t, at }) => {
  const cells = [
    { zh: "冬", fr: "hiver", x: 330, y: 700, c: WINTER, a: at.hiver },
    { zh: "虫", fr: "ver", x: 750, y: 700, c: WINTER, a: at.ver },
    { zh: "夏", fr: "été", x: 330, y: 1130, c: SUMMER, a: at.ete },
    { zh: "草", fr: "herbe", x: 750, y: 1130, c: SUMMER, a: at.herbe },
  ];
  return (
    <>
      {cells.map((c, i) => {
        const k = ci(t, c.a - 0.08, c.a + 0.3, 0, 1, settle);
        return (
          <div key={i} style={{ position: "absolute", left: c.x - 200, top: c.y - 190, width: 400, textAlign: "center", opacity: k }}>
            <div style={{ fontFamily: BRUSH, fontSize: 250, lineHeight: 1, color: IVORY, transform: `scale(${1.25 - 0.25 * k})`, filter: `blur(${(1 - k) * 8}px)`, textShadow: `0 0 50px ${c.c}66` }}>{c.zh}</div>
            <div style={{ fontFamily: SERIF_I, fontSize: 56, color: c.c, marginTop: 6 }}>{c.fr}</div>
          </div>
        );
      })}
    </>
  );
};

const Cordyceps: React.FC<{ t: number; at: Record<string, number> }> = ({ t, at }) => {
  const HZ = 820;
  const season = ci(t, at.ete - 0.2, at.ete + 1.0, 0, 1);
  const infect = ci(t, at.envahit - 0.1, at.envahit + 1.6, 0, 1);
  const rise = ci(t, at.jaillit - 0.5, at.jaillit + 0.9, 0, 1, Easing.bezier(0.5, 0, 0.2, 1));
  const zoom = 1 + 0.1 * ci(t, at.envahit - 0.3, at.envahit + 1.4, 0, 1) - 0.1 * ci(t, at.jaillit - 0.6, at.jaillit + 0.6, 0, 1);
  const camY = ci(t, at.jaillit - 0.6, at.jaillit + 0.8, 0, 90);
  const hyphae = useHyphae(
    new Array(7).fill(0).map((_, i) => ({
      x: 420 + i * 36,
      y: 1170 + Math.sin(i) * 6,
      a: -Math.PI / 2 + (i % 2 ? 1 : -1) * (0.6 + hash(i, 4) * 1.2) + (i > 3 ? Math.PI : 0),
      len: 70 + hash(i, 5) * 40,
      depth: 3,
      t0: 0,
      speed: 150,
      w: 2,
    })),
    41
  );
  const mountains = ci(t, at.tibet - 0.5, at.tibet + 0.8, 0, 1);
  // caterpillar body
  const segs = new Array(10).fill(0).map((_, i) => {
    const wig = (1 - infect) * Math.sin(t * 4 - i * 0.7) * 8;
    return { x: 420 + i * 30, y: 1170 + wig + Math.sin(i * 0.5) * 6, r: 30 - Math.abs(i - 3) * 1.6 };
  });
  const body = mix("#C9A172", "#E8DDC6", infect);
  const head = segs[0];
  const tipY = head.y - (head.y - (HZ - 150)) * rise;
  return (
    <AbsoluteFill style={{ transformOrigin: "540px 1100px", transform: `translateY(${camY}px) scale(${zoom})` }}>
      <svg width={W} height={H} style={{ position: "absolute", overflow: "visible" }}>
        <defs>
          <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={mix("#3E4B5A", "#C98B3E", season)} />
            <stop offset="100%" stopColor={mix(WINTER, SUMMER, season)} />
          </linearGradient>
          <linearGradient id="soil" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3A2B1F" />
            <stop offset="100%" stopColor="#140F0B" />
          </linearGradient>
        </defs>
        <rect x={-200} y={-300} width={W + 400} height={HZ + 300} fill="url(#sky)" />
        {season > 0 && <circle cx={820} cy={260} r={110} fill="#FFE7B0" opacity={0.7 * season} filter="url(#blur30)" />}
        {/* Tibetan ridges */}
        <g opacity={mountains}>
          <path d={`M -100 ${HZ} L 120 560 L 260 660 L 420 470 L 600 640 L 760 520 L 980 680 L 1180 ${HZ} Z`} fill={mix("#56657A", "#8C6A45", season)} opacity={0.75} />
          <path d={`M 360 530 L 420 470 L 480 525 M 700 575 L 760 520 L 820 570`} stroke="#F4F6F8" strokeWidth={10} strokeLinejoin="round" fill="none" opacity={1 - season * 0.8} />
          <path d={`M -100 ${HZ} L 200 700 L 380 760 L 560 690 L 800 770 L 1180 ${HZ} Z`} fill={mix("#3F4A58", "#6E5233", season)} />
        </g>
        {/* snow */}
        {new Array(60).fill(0).map((_, i) => {
          const y = ((hash(i, 1) * HZ + t * (40 + hash(i, 2) * 50)) % HZ) - 10;
          const x = hash(i, 3) * W + Math.sin(t + i) * 12;
          return <circle key={i} cx={x} cy={y} r={2 + hash(i, 4) * 3} fill="#fff" opacity={0.8 * (1 - season)} />;
        })}
        {/* soil */}
        <rect x={-200} y={HZ} width={W + 400} height={H} fill="url(#soil)" />
        {[0, 1, 2, 3].map((i) => (
          <path key={i} d={`M -50 ${HZ + 90 + i * 190} C 300 ${HZ + 60 + i * 190} 700 ${HZ + 130 + i * 190} 1130 ${HZ + 80 + i * 190}`} stroke="#4A3829" strokeWidth={3} fill="none" opacity={0.7} />
        ))}
        {new Array(22).fill(0).map((_, i) => (
          <ellipse key={i} cx={hash(i, 7) * W} cy={HZ + 60 + hash(i, 8) * 900} rx={8 + hash(i, 9) * 18} ry={5 + hash(i, 10) * 10} fill="#54402F" opacity={0.8} />
        ))}
        {/* grass line */}
        {new Array(40).fill(0).map((_, i) => {
          const x = i * 28 + hash(i, 11) * 10;
          const h = 16 + hash(i, 12) * 26 + season * 20;
          return <path key={i} d={`M ${x} ${HZ + 2} q ${4} ${-h / 2} ${(hash(i, 13) - 0.5) * 14} ${-h}`} stroke={mix("#7D8A7A", "#8FA35A", season)} strokeWidth={3} fill="none" />;
        })}
        {/* mycelium invading */}
        <Hyphae segs={hyphae} t={Math.max(0, t - at.envahit + 0.1)} opacity={0.9} />
        {/* caterpillar */}
        {segs
          .slice()
          .reverse()
          .map((s, i) => (
            <g key={i}>
              <circle cx={s.x} cy={s.y} r={s.r} fill={body} stroke="#2B1F16" strokeWidth={2} />
              <path d={`M ${s.x - s.r * 0.6} ${s.y + s.r * 0.5} q ${s.r * 0.6} ${s.r * 0.35} ${s.r * 1.2} 0`} stroke="#2B1F16" strokeWidth={1.4} fill="none" opacity={0.5} />
            </g>
          ))}
        <circle cx={head.x - 12} cy={head.y - 6} r={4} fill="#2B1F16" opacity={1 - infect} />
        {/* stroma rising from the head */}
        {rise > 0 && (
          <g>
            <path d={`M ${head.x} ${head.y - 20} C ${head.x - 30} ${head.y - 200} ${head.x + 20} ${(head.y + tipY) / 2} ${head.x - 10} ${tipY}`} stroke={STROMA} strokeWidth={22} fill="none" strokeLinecap="round" />
            <ellipse cx={head.x - 10} cy={tipY - 30} rx={19} ry={52 * rise} fill="#4E3320" stroke="#2B1A10" strokeWidth={2} />
          </g>
        )}
      </svg>
      {/* depth label */}
      <div style={{ position: "absolute", left: 80, top: HZ + 30, fontFamily: SANS, fontSize: 26, letterSpacing: 5, color: `${IVORY}88`, opacity: ci(t, 1.4, 2.2, 0, 1) }}>SOUS LA TERRE</div>
    </AbsoluteFill>
  );
};

const Treatise: React.FC<{ t: number; at: Record<string, number> }> = ({ t, at }) => {
  const slips = ["神農本草經", "藥三百六十五種", "上藥一百二十種", "中藥一百二十種", "下藥一百二十五種", "", "赤芝", "茯苓", "", "", "", ""];
  const n = slips.length;
  const reishiK = ci(t, at.reishi - 0.3, at.reishi + 0.7, 0, 1, settle);
  const slipsDim = 1 - 0.8 * reishiK;
  return (
    <>
      <div style={{ position: "absolute", top: 120, left: 0, right: 0, textAlign: "center" }}>
        <div style={{ fontFamily: SERIF, fontWeight: 300, fontSize: 150, color: IVORY, lineHeight: 1, opacity: ci(t, at.ans - 0.4, at.ans + 0.2, 0, 1) * (1 - ci(t, at.traite - 0.4, at.traite, 0, 1)) }}>2 000 ans</div>
      </div>
      <div style={{ position: "absolute", top: 110, left: 0, right: 0, textAlign: "center", opacity: ci(t, at.traite - 0.2, at.traite + 0.4, 0, 1) }}>
        <div style={{ fontFamily: SERIF, fontWeight: 400, fontSize: 64, color: IVORY }}>Shennong Bencao Jing</div>
        <div style={{ fontFamily: SERIF_I, fontWeight: 300, fontSize: 40, color: GOLD, marginTop: 6 }}>365 remèdes, en trois classes</div>
      </div>
      <svg width={W} height={H} style={{ position: "absolute", opacity: slipsDim }}>
        {slips.map((s, i) => {
          // unroll right → left, like a real bamboo book
          const x = 870 - i * 60;
          const k = ci(t, 0.3 + i * 0.12, 0.8 + i * 0.12, 0, 1, settle);
          return (
            <g key={i} opacity={k} transform={`translate(${(1 - k) * 40} 0)`}>
              <rect x={x - 26} y={430} width={52} height={980} rx={6} fill={i % 2 ? "#C9A86A" : "#D4B475"} stroke="#6E5530" strokeWidth={2} />
              <text x={x} y={480} fontFamily={HAN} fontSize={36} fill="#3A2A18" writingMode="vertical-rl" style={{ writingMode: "vertical-rl" as any }} letterSpacing={8}>
                {s}
              </text>
            </g>
          );
        })}
        {[560, 1300].map((y) => (
          <path key={y} d={`M ${870 - (n - 1) * 60 - 40} ${y} L 910 ${y}`} stroke="#5A3E22" strokeWidth={4} pathLength={1} strokeDasharray={`${ci(t, 0.4, 2.0, 0, 1)} 1`} />
        ))}
      </svg>
      {reishiK > 0 && (
        <svg width={W} height={H} style={{ position: "absolute" }}>
          <g transform={`translate(540 ${960 - 30 * reishiK}) scale(${1.1 * reishiK})`}>
            <Reishi glow={1} />
          </g>
        </svg>
      )}
      <div style={{ position: "absolute", top: 1250, left: 0, right: 0, textAlign: "center", opacity: reishiK, textShadow: "0 2px 16px rgba(0,0,0,0.9)" }}>
        <div style={{ fontFamily: HAN, fontWeight: 600, fontSize: 64, color: IVORY }}>灵芝</div>
        <div style={{ fontFamily: SERIF_I, fontSize: 40, color: IVORY }}>Lingzhi · Reishi</div>
      </div>
      <div
        style={{
          position: "absolute",
          top: 1420,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          opacity: ci(t, at.sup - 0.1, at.sup + 0.3, 0, 1),
          transform: `scale(${ci(t, at.sup - 0.1, at.sup + 0.3, 1.3, 1, settle)})`,
        }}
      >
        <div style={{ padding: "10px 30px", border: `2px solid ${GOLD}`, borderRadius: 8, fontFamily: SANS, fontSize: 32, letterSpacing: 6, color: GOLD }}>
          <span style={{ fontFamily: HAN, marginRight: 14 }}>上品</span>REMÈDE SUPÉRIEUR
        </div>
      </div>
    </>
  );
};

const Specimens: React.FC<{ t: number; at: Record<string, number> }> = ({ t, at }) => {
  const cards = [
    { a: at.singe, zh: "猴头菇", fr: "tête de singe", la: "Hericium erinaceus", draw: <Hericium /> },
    { a: at.argent, zh: "银耳", fr: "oreille d'argent", la: "Tremella fuciformis", draw: <Tremella /> },
    { a: at.esprit, zh: "灵芝", fr: "champignon de l'esprit", la: "Ganoderma lucidum", draw: <g transform="scale(0.62) translate(0 30)"><Reishi /></g> },
  ];
  return (
    <>
      <div style={{ position: "absolute", top: 130, left: 0, right: 0, textAlign: "center", fontFamily: SANS, fontSize: 30, letterSpacing: 10, color: GOLD, opacity: ci(t, 0.3, 0.9, 0, 1) }}>
        DES NOMS-POÈMES
      </div>
      {cards.map((c, i) => {
        const k = ci(t, c.a - 0.35, c.a + 0.25, 0, 1, settle);
        const y = 260 + i * 400;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: 70,
              right: 70,
              top: y,
              height: 360,
              borderRadius: 14,
              background: "rgba(239,230,210,0.06)",
              border: `1.5px solid ${IVORY}33`,
              opacity: k,
              transform: `translateX(${(1 - k) * 160}px)`,
              display: "flex",
              alignItems: "center",
            }}
          >
            <svg width={330} height={360} style={{ flexShrink: 0 }}>
              <g transform="translate(165 190) scale(0.95)">{c.draw}</g>
            </svg>
            <div>
              <div style={{ fontFamily: HAN, fontWeight: 600, fontSize: 72, color: IVORY, letterSpacing: 6 }}>{c.zh}</div>
              <div style={{ fontFamily: SERIF_I, fontSize: 50, color: GOLD, lineHeight: 1.1, marginTop: 4 }}>« {c.fr} »</div>
              <div style={{ fontFamily: SERIF_I, fontWeight: 300, fontSize: 30, color: `${IVORY}AA`, marginTop: 10 }}>{c.la}</div>
            </div>
          </div>
        );
      })}
    </>
  );
};

const Network: React.FC<{ t: number; at: Record<string, number> }> = ({ t, at }) => {
  const nodes = [
    { x: 540, y: 560, draw: <g transform="scale(0.55)"><Reishi /></g> },
    { x: 270, y: 1100, draw: <g transform="scale(0.8)"><Hericium /></g> },
    { x: 810, y: 1100, draw: <g transform="scale(0.8)"><Tremella /></g> },
  ];
  const hy = useHyphae(
    [
      { x: 540, y: 660, a: Math.PI * 0.62, len: 150, depth: 4, t0: 0.4, speed: 230 },
      { x: 540, y: 660, a: Math.PI * 0.38, len: 150, depth: 4, t0: 0.5, speed: 230 },
      { x: 330, y: 1060, a: -0.25, len: 170, depth: 4, t0: 0.8, speed: 230 },
      { x: 750, y: 1060, a: Math.PI + 0.25, len: 170, depth: 4, t0: 0.9, speed: 230 },
      { x: 270, y: 1200, a: Math.PI / 2, len: 120, depth: 3, t0: 1.2, speed: 200 },
      { x: 810, y: 1200, a: Math.PI / 2, len: 120, depth: 3, t0: 1.3, speed: 200 },
    ],
    77
  );
  const roof = ci(t, at.cour - 0.4, at.cour + 1.0, 0, 1);
  return (
    <>
      <svg width={W} height={H} style={{ position: "absolute" }}>
        <Hyphae segs={hy} t={t} opacity={0.75} />
        {nodes.map((n, i) => (
          <g key={i} transform={`translate(${n.x} ${n.y}) scale(${ci(t, 0, 0.6, 0.7, 1, settle)})`}>
            {n.draw}
          </g>
        ))}
        {/* palace roof over the network */}
        <path
          d="M 120 330 C 260 330 330 300 380 250 L 700 250 C 750 300 820 330 960 330 M 380 250 L 420 190 L 660 190 L 700 250 M 300 330 L 300 380 M 780 330 L 780 380"
          stroke={GOLD}
          strokeWidth={5}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength={1}
          strokeDasharray={`${roof} 1`}
        />
      </svg>
      <div style={{ position: "absolute", top: 1380, left: 0, right: 0, textAlign: "center", fontFamily: SERIF, fontWeight: 400, fontSize: 70, color: IVORY, opacity: roof, letterSpacing: 4 }}>
        une cour impériale
      </div>
    </>
  );
};

// Seals 君 臣 佐 使 → orbit ring
const Court: React.FC<{ t: number; at: Record<string, number>; len: number }> = ({ t, at, len }) => {
  const seals = [
    { zh: "君", fr: "EMPEREUR", role: "porte l'action", a: at.empereur, p: [540, 470], size: 230 },
    { zh: "臣", fr: "MINISTRE", role: "la renforce", a: at.ministre, p: [540, 880], size: 180 },
    { zh: "佐", fr: "ASSISTANT", role: "l'équilibre", a: at.assistant, p: [260, 1230], size: 160 },
    { zh: "使", fr: "AMBASSADEUR", role: "guide et harmonise", a: at.ambassadeur, p: [820, 1230], size: 160 },
  ];
  const orbitK = ci(t, at.royaume - 1.6, at.royaume + 0.4, 0, 1, soft);
  const spin = ci(t, at.royaume - 1.6, len, 0, 40, Easing.linear);
  const pos = (i: number) => {
    const [x, y] = seals[i].p;
    const a = ((i * 90 - 90 + spin) * Math.PI) / 180;
    const ox = 540 + Math.cos(a) * 300;
    const oy = 860 + Math.sin(a) * 300;
    return [x + (ox - x) * orbitK, y + (oy - y) * orbitK];
  };
  const links: [number, number][] = [
    [0, 1],
    [1, 2],
    [1, 3],
    [0, 2],
    [0, 3],
  ];
  return (
    <>
      <svg width={W} height={H} style={{ position: "absolute" }}>
        {links.map(([a, b], i) => {
          const k = ci(t, Math.max(seals[a].a, seals[b].a) + 0.1, Math.max(seals[a].a, seals[b].a) + 0.9, 0, 1) * (1 - orbitK);
          const [x0, y0] = pos(a);
          const [x1, y1] = pos(b);
          const mx = (x0 + x1) / 2 + (i % 2 ? 40 : -40);
          const my = (y0 + y1) / 2;
          const d = `M ${x0} ${y0} Q ${mx} ${my} ${x1} ${y1}`;
          // travelling pulse
          const ph = ((t * 0.7 + i * 0.23) % 1);
          const px = (1 - ph) * (1 - ph) * x0 + 2 * (1 - ph) * ph * mx + ph * ph * x1;
          const py = (1 - ph) * (1 - ph) * y0 + 2 * (1 - ph) * ph * my + ph * ph * y1;
          return (
            <g key={i}>
              <path d={d} stroke={GOLD} strokeWidth={i < 3 ? 3 : 1.5} fill="none" opacity={0.7} pathLength={1} strokeDasharray={`${k} 1`} />
              {k >= 1 && t > at.ambassadeur + 0.5 && <circle cx={px} cy={py} r={7} fill="#FFE7B0" opacity={0.9} filter="url(#blur4)" />}
            </g>
          );
        })}
        <circle cx={540} cy={860} r={300} fill="none" stroke={GOLD} strokeWidth={3} opacity={0.8 * orbitK} pathLength={1} strokeDasharray={`${orbitK} 1`} />
      </svg>
      {seals.map((s, i) => {
        const k = ci(t, s.a - 0.05, s.a + 0.2, 0, 1, Easing.out(Easing.cubic));
        const press = ci(t, s.a - 0.05, s.a + 0.25, 1.6, 1, Easing.out(Easing.back(2)));
        const [x, y] = pos(i);
        const sz = s.size * (1 - 0.35 * orbitK);
        return (
          <div key={i} style={{ position: "absolute", left: x - sz / 2, top: y - sz / 2, width: sz, textAlign: "center", opacity: k }}>
            <div
              style={{
                width: sz,
                height: sz,
                background: SEAL,
                borderRadius: 12,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transform: `scale(${press}) rotate(${(hash(i, 1) - 0.5) * 6}deg)`,
                boxShadow: `inset 0 0 ${sz * 0.12}px rgba(60,0,0,0.6), 0 10px 40px rgba(0,0,0,0.5)`,
              }}
            >
              <span style={{ fontFamily: BRUSH, fontSize: sz * 0.68, color: "#F6E9D8", lineHeight: 1 }}>{s.zh}</span>
            </div>
            <div style={{ marginTop: 16, opacity: 1 - orbitK, width: 420, marginLeft: (sz - 420) / 2 }}>
              <div style={{ fontFamily: SANS, fontWeight: 500, fontSize: 32, letterSpacing: 8, color: IVORY }}>{s.fr}</div>
              <div style={{ fontFamily: SERIF_I, fontSize: 38, color: GOLD }}>{s.role}</div>
            </div>
          </div>
        );
      })}
      {/* finale */}
      <div style={{ position: "absolute", top: 800, left: 0, right: 0, textAlign: "center", opacity: ci(t, at.royaume - 0.3, at.royaume + 0.5, 0, 1) }}>
        <div style={{ fontFamily: SERIF, fontWeight: 300, fontSize: 52, color: IVORY, lineHeight: 1.15 }}>
          un royaume
          <br />
          en équilibre
        </div>
      </div>
      <div style={{ position: "absolute", top: 1330, left: 0, right: 0, textAlign: "center", opacity: ci(t, at.royaume + 0.8, at.royaume + 1.6, 0, 1) }}>
        <div style={{ fontFamily: BRUSH, fontSize: 80, color: GOLD, letterSpacing: 26 }}>君臣佐使</div>
        <div style={{ fontFamily: SERIF_I, fontSize: 36, color: `${IVORY}CC`, marginTop: 8 }}>l'art de composer une formule</div>
      </div>
      <div style={{ position: "absolute", bottom: 80, left: 100, right: 100, textAlign: "center", fontFamily: SANS, fontSize: 27, lineHeight: 1.45, color: `${IVORY}99`, opacity: ci(t, at.royaume + 1.6, at.royaume + 2.4, 0, 1) }}>
        Usages traditionnels de la pharmacopée chinoise.
        <br />
        Ne remplace pas un avis médical.
      </div>
    </>
  );
};

// ---------------------------------------------------------------- captions
const Caption: React.FC<{ line: Line }> = ({ line }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const keys = (line.keys ?? []).map((k) => k.toLowerCase());
  const idx = line.phrases.findIndex((p, i) => t >= p.s - 0.1 && t < (line.phrases[i + 1]?.s ?? 99) - 0.1);
  if (idx < 0) return null;
  const ph = line.phrases[idx];
  const end = line.phrases[idx + 1] ? line.phrases[idx + 1].s - 0.1 : line.dur + 0.4;
  const o = ci(t, ph.s - 0.1, ph.s + 0.15, 0, 1) * (1 - ci(t, end - 0.15, end, 0, 1));
  return (
    <div style={{ position: "absolute", left: 80, right: 80, top: 1640, textAlign: "center", opacity: o }}>
      {ph.text.split(" ").map((w, i) => {
        const clean = w.toLowerCase().replace(/[.,:;!?]/g, "");
        const isKey = keys.some((k) => clean.startsWith(k));
        return (
          <span key={i} style={{ display: "inline-block", marginRight: 13, fontFamily: SANS, fontWeight: isKey ? 500 : 400, fontSize: 50, lineHeight: 1.3, color: isKey ? GOLD : IVORY, textShadow: "0 2px 14px rgba(0,0,0,0.7)" }}>
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
  const wt = (li: number, word: string, fb: number, nth = 0) => {
    const l = lines.find((x) => x.i === li);
    const hits = l?.words.filter((x) => x.w.toLowerCase().replace(/[.,:;!?]/g, "").includes(word)) ?? [];
    return l && hits[nth] ? l.start + hits[nth].s : fb;
  };
  const L = (i: number) => lines.find((x) => x.i === i)!;

  // sections (absolute seconds)
  const S = {
    hook: [0, L(2).start - 0.1],
    cord: [L(2).start - 0.3, L(3).start + 0.1],
    treat: [L(3).start - 0.2, L(4).start + 0.1],
    spec: [L(4).start - 0.2, L(5).start + 0.2],
    net: [L(5).start, L(6).start + 0.1],
    court: [L(6).start - 0.2, duration],
  } as const;

  const hookAt = { ver: wt(1, "vair", 0.8), hiver: wt(1, "hiver", 1.2), herbe: wt(1, "herbonété", 2.1), ete: wt(1, "herbonété", 2.1) + 0.32 };
  const cordAt = {
    tibet: wt(2, "tibet", 7.8),
    envahit: wt(2, "envahit", 8.6),
    ete: wt(2, "l'été", 10.9),
    jaillit: wt(2, "jaillit", 11.8),
  };
  const treatAt = { ans: wt(3, "2000", 14.0), traite: wt(3, "traité", 19.7), reishi: wt(3, "réchit", 20.6), sup: wt(3, "supérieur", 21.6) };
  const specAt = { singe: wt(4, "singe", 24.6), argent: wt(4, "d'argent", 25.8), esprit: wt(4, "l'esprit", 27.2) };
  const netAt = { cour: wt(5, "cour", 32.2) };
  const courtAt = {
    empereur: wt(6, "l'empereur", 33.7),
    ministre: wt(6, "ministre", 35.8),
    assistant: wt(6, "l'assistant", 37.5),
    ambassadeur: wt(6, "l'ambassadeur", 39.5),
    royaume: wt(7, "royaume", 44.3),
  };
  const rel = (o: Record<string, number>, a: number) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, v - a]));

  const sec = (k: keyof typeof S, render: (lt: number, len: number) => React.ReactNode, fadeIn = 0.5, fadeOut = 0.5) => {
    const [a, b] = S[k];
    return (
      <Sequence from={f(a)} durationInFrames={f(b - a)}>
        <Section len={b - a} fadeIn={fadeIn} fadeOut={fadeOut}>{(lt) => render(lt, b - a)}</Section>
      </Sequence>
    );
  };

  // ambient spores
  const spores = (
    <svg width={W} height={H} style={{ position: "absolute", pointerEvents: "none" }}>
      {new Array(40).fill(0).map((_, i) => {
        const y = H - ((hash(i, 1) * H + t * (14 + hash(i, 2) * 26)) % (H + 40));
        const x = hash(i, 3) * W + Math.sin(t * 0.5 + i) * 20;
        return <circle key={i} cx={x} cy={y} r={1.5 + hash(i, 4) * 2.5} fill={GOLD} opacity={0.25 + 0.35 * hash(i, 5)} />;
      })}
    </svg>
  );

  const sfx: [number, string, number][] = [
    [0.2, "wind", 0.35],
    [cordAt.tibet - 0.5, "wind", 0.3],
    [cordAt.envahit - 0.1, "grow", 0.6],
    [cordAt.jaillit - 0.6, "rise", 0.55],
    [treatAt.ans - 0.4, "clack", 0.45],
    [S.treat[0] + 1.0, "clack", 0.35],
    [treatAt.reishi - 0.2, "pop", 0.5],
    [treatAt.sup, "stamp", 0.35],
    [specAt.singe - 0.3, "clack", 0.3],
    [specAt.argent - 0.3, "clack", 0.3],
    [specAt.esprit - 0.3, "clack", 0.3],
    [S.net[0] + 0.4, "grow", 0.5],
    [courtAt.empereur, "gong", 0.55],
    [courtAt.empereur, "stamp", 0.6],
    [courtAt.ministre, "stamp", 0.55],
    [courtAt.assistant, "stamp", 0.5],
    [courtAt.ambassadeur, "stamp", 0.5],
    [courtAt.royaume - 1.6, "rise", 0.3],
  ];

  return (
    <AbsoluteFill style={{ background: HUMUS, overflow: "hidden" }}>
      <svg width={0} height={0} style={{ position: "absolute" }}>
        <defs>
          <filter id="blur30" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="30" />
          </filter>
          <filter id="blur4" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="4" />
          </filter>
        </defs>
      </svg>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 40%, #2A2019 0%, #17120E 60%, #0B0907 100%)" }} />
      {spores}
      {sec("hook", (lt) => <Hook t={lt} at={rel(hookAt, S.hook[0])} />, 0.01)}
      {sec("cord", (lt) => <Cordyceps t={lt} at={rel(cordAt, S.cord[0])} />)}
      {/* cordyceps tag sits above the cross-section */}
      <Sequence from={f(S.cord[0])} durationInFrames={f(S.cord[1] - S.cord[0])}>
        <Section len={S.cord[1] - S.cord[0]}>
          {(lt) => <Tag o={ci(lt, cordAt.tibet - S.cord[0] - 0.3, cordAt.tibet - S.cord[0] + 0.4, 0, 1)} zh="冬虫夏草" latin="Ophiocordyceps sinensis" note="TIBET · 3 000 – 5 000 M" />}
        </Section>
      </Sequence>
      {sec("treat", (lt) => <Treatise t={lt} at={rel(treatAt, S.treat[0])} />)}
      {sec("spec", (lt) => <Specimens t={lt} at={rel(specAt, S.spec[0])} />)}
      {sec("net", (lt) => <Network t={lt} at={rel(netAt, S.net[0])} />)}
      {sec("court", (lt, len) => <Court t={lt} at={rel(courtAt, S.court[0])} len={len} />, 0.5, 0.01)}

      {lines.map((l) => (
        <Sequence key={l.i} from={f(l.start)} durationInFrames={f(l.dur + 0.5)}>
          <Audio src={staticFile(l.file)} />
          {l.i !== 1 && l.i !== 7 && <Caption line={l} />}
        </Sequence>
      ))}
      <Audio
        src={staticFile("sfx/music.wav")}
        volume={(fr) => interpolate(fr, [0, f(1.5), f(duration - 2.5), f(duration)], [0, 0.5, 0.5, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}
      />
      {sfx.map(([at, name, vol], i) => (
        <Sequence key={`s${i}`} from={Math.max(0, f(at))} layout="none">
          <Audio src={staticFile(`sfx/${name}.wav`)} volume={vol} />
        </Sequence>
      ))}
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 48%, rgba(0,0,0,0) 60%, rgba(0,0,0,0.5) 100%)", pointerEvents: "none" }} />
    </AbsoluteFill>
  );
};

export const calculateMetadata: CalculateMetadataFunction<SceneProps> = async ({ props }) => ({
  durationInFrames: Math.round((props.duration ?? 48) * 30),
  fps: 30,
  width: W,
  height: H,
});
