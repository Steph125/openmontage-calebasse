import React, { useLayoutEffect, useMemo, useRef, useState, useEffect } from "react";
import {
  AbsoluteFill,
  Audio,
  CalculateMetadataFunction,
  Easing,
  Sequence,
  continueRender,
  delayRender,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { loadFont as loadCormorant } from "@remotion/google-fonts/CormorantGaramond";
import { loadFont as loadJost } from "@remotion/google-fonts/Jost";
import { loadFont as loadBrush } from "@remotion/google-fonts/MaShanZheng";

// ATELIER — "Nocturne du Qi". See art-direction.md. Everything below is generated.

const { fontFamily: SERIF } = loadCormorant("normal", { weights: ["500", "600", "700"], subsets: ["latin", "latin-ext"] });
const { fontFamily: SANS } = loadJost("normal", { weights: ["400", "500", "600"], subsets: ["latin", "latin-ext"] });
const { fontFamily: BRUSH } = loadBrush();

// ---------------------------------------------------------------- constants
const W = 1080;
const H = 1920;
const CX = 540;
const CY = 930;
const R_OUT = 360;
const R_IN = 235;
const R_HANZI = 298;
const R_RING = 425;
const R_HOURS = 482;
const N = 2400;
const GOLD = "#F3C969";

const EL = {
  bois: "#4FBF7F",
  feu: "#E8553A",
  terre: "#E0A93E",
  metal: "#DCE4EE",
  eau: "#4C7FE0",
} as const;
type Element = keyof typeof EL;

// Clockwise from 23h. start = starting hour of the 2-h window.
const ORGANS: { start: number; fr: string; zh: string; el: Element }[] = [
  { start: 23, fr: "Vésicule biliaire", zh: "胆", el: "bois" },
  { start: 1, fr: "Foie", zh: "肝", el: "bois" },
  { start: 3, fr: "Poumon", zh: "肺", el: "metal" },
  { start: 5, fr: "Gros intestin", zh: "大肠", el: "metal" },
  { start: 7, fr: "Estomac", zh: "胃", el: "terre" },
  { start: 9, fr: "Rate", zh: "脾", el: "terre" },
  { start: 11, fr: "Cœur", zh: "心", el: "feu" },
  { start: 13, fr: "Intestin grêle", zh: "小肠", el: "feu" },
  { start: 15, fr: "Vessie", zh: "膀胱", el: "eau" },
  { start: 17, fr: "Rein", zh: "肾", el: "eau" },
  { start: 19, fr: "Maître du cœur", zh: "心包", el: "feu" },
  { start: 21, fr: "Triple réchauffeur", zh: "三焦", el: "feu" },
];
const organAt = (startHour: number) => ORGANS.findIndex((o) => o.start === startHour);

// Noon at the top (Yang summit), midnight at the bottom, clockwise.
const hourAngle = (h: number) => ((h - 12) / 24) * Math.PI * 2;
const polar = (h: number, r: number): [number, number] => {
  const a = hourAngle(h);
  return [CX + r * Math.sin(a), CY - r * Math.cos(a)];
};

// ---------------------------------------------------------------- helpers
const hash = (i: number, k: number) => {
  const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453;
  return x - Math.floor(x);
};
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const smooth = (x: number) => {
  const t = clamp01(x);
  return t * t * (3 - 2 * t);
};
const ramp = (t: number, a: number, b: number) => smooth((t - a) / (b - a));
const inOut = Easing.bezier(0.45, 0, 0.55, 1);
const ci = (t: number, a: number, b: number, from: number, to: number, e = inOut) =>
  interpolate(t, [a, b], [from, to], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: e });
const hexToRgb = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const mixHex = (a: string, b: string, k: number) => {
  const A = hexToRgb(a);
  const B = hexToRgb(b);
  return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * k)).join(",")})`;
};

// ---------------------------------------------------------------- choreography (seconds)
const T = {
  digitsIn: [0.1, 1.7],
  explode: 5.0,
  ringFormed: 8.6,
  tiltStart: 5.6,
  tiltEnd: 9.6,
  sectorsDraw: [7.2, 9.8],
  lap: [8.4, 9.6],
  pulses: [9.7, 12.7],
  handOn: 13.0,
  diveIn: [34.0, 35.4],
  lungs: [35.0, 36.4],
  lungsOut: [41.2, 43.0],
  end: 46.2,
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
  keys?: string[];
}
export interface SceneProps {
  duration: number;
  lines: Line[];
}

// Absolute time (s) of a word inside a line, by case-insensitive prefix match.
const useWordTime = (lines: Line[]) =>
  useMemo(() => {
    return (lineIdx: number, word: string, nth = 0, fallback = 0) => {
      const l = lines.find((x) => x.i === lineIdx);
      if (!l) return fallback;
      const hits = l.words.filter((w) => w.w.toLowerCase().replace(/[.,:;!?]/g, "").startsWith(word.toLowerCase()));
      const w = hits[nth];
      return w ? l.start + w.s : fallback;
    };
  }, [lines]);

// ---------------------------------------------------------------- camera
type Cam = { s: number; x: number; y: number; rx: number };
const cameraAt = (t: number, focus: [number, number] | null, focusK: number): Cam => {
  let s = 1,
    x = 0,
    y = 0,
    rx = 0;
  // tilt-up of the wheel
  rx = ci(t, T.tiltStart, T.tiltEnd, 62, 0);
  s = ci(t, T.tiltStart, T.tiltEnd, 0.82, 1);
  // push toward named organ
  if (focus) {
    s *= 1 + 0.06 * focusK;
    x += -(focus[0] - CX) * 0.16 * focusK;
    y += (Math.max(0, -(focus[1] - CY) * 0.16) + 40) * focusK;
  }
  // dive into the lung sector
  if (t > T.diveIn[0] && t < T.lungs[1]) {
    const k = ci(t, T.diveIn[0], T.diveIn[1], 0, 1, Easing.bezier(0.6, 0, 0.9, 0.4));
    const [px, py] = polar(4, (R_IN + R_OUT) / 2);
    s = 1 + 3.2 * k;
    x = -(px - CX) * s * k;
    y = -(py - CY) * s * k;
  }
  // pull back at the end
  if (t >= T.lungsOut[0]) {
    s = ci(t, T.lungsOut[0], T.lungsOut[1] + 0.6, 1.5, 0.86, Easing.out(Easing.cubic));
    y = ci(t, T.lungsOut[0], T.lungsOut[1] + 0.6, 0, 70);
  }
  return { s, x, y, rx };
};

// ---------------------------------------------------------------- particles
const useDigitTargets = () => {
  const [targets, setTargets] = useState<[number, number][] | null>(null);
  const [handle] = useState(() => delayRender("digit targets"));
  useEffect(() => {
    const font = `600 430px ${SANS}`;
    document.fonts
      .load(font)
      .then(() => {
        const c = document.createElement("canvas");
        c.width = W;
        c.height = 700;
        const g = c.getContext("2d")!;
        g.fillStyle = "#fff";
        g.font = font;
        g.textAlign = "center";
        g.textBaseline = "middle";
        g.fillText("3:00", W / 2, 350);
        const d = g.getImageData(0, 0, W, 700).data;
        const pts: [number, number][] = [];
        for (let y = 0; y < 700; y += 5)
          for (let x = 0; x < W; x += 5) if (d[(y * W + x) * 4 + 3] > 128) pts.push([x, y + 540]);
        setTargets(pts);
        continueRender(handle);
      })
      .catch(() => {
        setTargets([[CX, 890]]);
        continueRender(handle);
      });
  }, [handle]);
  return targets;
};

const scatterPos = (i: number, t: number): [number, number] => [
  hash(i, 1) * W + 40 * Math.sin(t * 0.6 + hash(i, 2) * 6.28),
  hash(i, 3) * H + 40 * Math.cos(t * 0.45 + hash(i, 4) * 6.28),
];
const ringPos = (i: number, t: number): [number, number] => {
  const a = hash(i, 5) * Math.PI * 2 + t * 0.32;
  const r = R_RING + (hash(i, 6) - 0.5) * 46 + 7 * Math.sin(t * 2.1 + i);
  return [CX + r * Math.sin(a), CY - r * Math.cos(a)];
};
const breath = (t: number) => {
  // normal breath then short, shallow breaths on "souffle court"
  if (t < 38.4) return 1 + 0.085 * Math.sin(((t - 36) / 3.0) * Math.PI * 2);
  return 1 + 0.035 * Math.sin(((t - 38.4) / 0.9) * Math.PI * 2);
};
const lungPos = (i: number, t: number): [number, number] => {
  const b = breath(t);
  const k = hash(i, 8);
  if (k < 0.12) {
    // trachea + bronchi
    const u = hash(i, 9);
    if (u < 0.45) return [CX + (hash(i, 10) - 0.5) * 22, 560 + u * 330];
    const side = u < 0.72 ? -1 : 1;
    const v = (u - (side < 0 ? 0.45 : 0.72)) / 0.27;
    return [CX + side * v * 120 * b, 710 + v * 90];
  }
  const side = hash(i, 11) < 0.5 ? -1 : 1;
  const th = hash(i, 12) * Math.PI * 2;
  const rr = Math.sqrt(hash(i, 13));
  // lobe: taller than wide, flattened medially (heart notch on the left lobe)
  let rx = 175 * (1 + 0.12 * Math.cos(th));
  const ry = 300;
  let x = Math.sin(th) * rx * rr;
  const y = -Math.cos(th) * ry * rr;
  if (x * side < -60) x = -60 * side + (x + 60 * side) * 0.25;
  if (side < 0 && y > 40 && x > 0) rx *= 0.8;
  return [CX + side * (205 * b) + x * b, 960 + y * b];
};

const Particles: React.FC<{ t: number; comet: number | null }> = ({ t, comet }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const digits = useDigitTargets();
  const sprite = useMemo(() => {
    if (typeof document === "undefined") return null;
    const c = document.createElement("canvas");
    c.width = c.height = 48;
    const g = c.getContext("2d")!;
    const grd = g.createRadialGradient(24, 24, 0, 24, 24, 24);
    grd.addColorStop(0, "rgba(255,255,255,1)");
    grd.addColorStop(0.25, "rgba(255,255,255,0.55)");
    grd.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = grd;
    g.fillRect(0, 0, 48, 48);
    return c;
  }, []);
  useLayoutEffect(() => {
    const c = ref.current;
    if (!c || !digits || !sprite) return;
    const g = c.getContext("2d")!;
    g.clearRect(0, 0, W, H);
    g.globalCompositeOperation = "lighter";
    // tinted sprite for this frame
    const lungK = ramp(t, T.lungs[0], T.lungs[1]) * (1 - ramp(t, T.lungsOut[0], T.lungsOut[1]));
    const color = mixHex(GOLD, EL.metal, lungK);
    const tint = document.createElement("canvas");
    tint.width = tint.height = 48;
    const tg = tint.getContext("2d")!;
    tg.drawImage(sprite, 0, 0);
    tg.globalCompositeOperation = "source-in";
    tg.fillStyle = color;
    tg.fillRect(0, 0, 48, 48);
    const fadeIn = ramp(t, 0, 0.8);
    for (let i = 0; i < N; i++) {
      const d = digits[Math.floor(hash(i, 14) * digits.length)];
      const stagger = hash(i, 7);
      let p: [number, number];
      if (t < T.explode) {
        const a = scatterPos(i, t);
        const b: [number, number] = [d[0] + 2.5 * Math.sin(t * 3 + i), d[1] + 2.5 * Math.cos(t * 2.6 + i)];
        const k = ramp(t, T.digitsIn[0] + stagger * 0.6, T.digitsIn[1] - 0.4 + stagger * 0.4);
        const sw = Math.sin(Math.PI * k) * 120;
        p = [a[0] + (b[0] - a[0]) * k + sw * Math.cos(i), a[1] + (b[1] - a[1]) * k + sw * Math.sin(i * 1.3)];
      } else if (t < T.lungs[0]) {
        const k = ramp(t, T.explode + stagger * 1.2, T.ringFormed - 1.4 + stagger * 1.4);
        const b = ringPos(i, t);
        // explosion outward, then swirl into the river/ring
        const dx = d[0] - CX,
          dy = d[1] - 890;
        const burst = Math.sin(Math.PI * Math.min(1, k * 1.4)) * (160 + 260 * hash(i, 15));
        const ang = Math.atan2(dy, dx) + k * 2.4;
        p = [
          d[0] + (b[0] - d[0]) * k + Math.cos(ang) * burst,
          d[1] + (b[1] - d[1]) * k + Math.sin(ang) * burst,
        ];
      } else if (t < T.lungsOut[0]) {
        const k = ramp(t, T.lungs[0] + stagger * 0.5, T.lungs[1] + stagger * 0.4);
        const a = ringPos(i, t);
        const b = lungPos(i, t);
        const sw = Math.sin(Math.PI * k) * 90;
        p = [a[0] + (b[0] - a[0]) * k + sw * Math.sin(i * 0.7), a[1] + (b[1] - a[1]) * k + sw * Math.cos(i)];
      } else {
        const k = ramp(t, T.lungsOut[0] + stagger * 0.6, T.lungsOut[1] + stagger * 0.4);
        const a = lungPos(i, t);
        const b = ringPos(i, t);
        const sw = Math.sin(Math.PI * k) * 140;
        p = [a[0] + (b[0] - a[0]) * k + sw * Math.cos(i * 1.7), a[1] + (b[1] - a[1]) * k + sw * Math.sin(i)];
      }
      // brightness: twinkle + comet proximity
      let alpha = (0.35 + 0.45 * hash(i, 16)) * (0.75 + 0.25 * Math.sin(t * 4 + i * 1.7));
      let size = 7 + 9 * hash(i, 17);
      if (comet !== null && t > T.explode + 3) {
        const a = Math.atan2(p[0] - CX, -(p[1] - CY));
        let da = Math.abs(((a - comet + Math.PI * 3) % (Math.PI * 2)) - Math.PI);
        const near = Math.max(0, 1 - da / 0.5);
        alpha += near * 0.8;
        size += near * 10;
      }
      if (t < T.explode + 0.3) {
        alpha += 0.35 * ramp(t, T.digitsIn[1] - 0.6, T.digitsIn[1]);
        size += 3;
      }
      g.globalAlpha = Math.min(1, alpha) * fadeIn;
      g.drawImage(tint, p[0] - size / 2, p[1] - size / 2, size, size);
    }
  });
  return <canvas ref={ref} width={W} height={H} style={{ position: "absolute", left: 0, top: 0 }} />;
};

// ---------------------------------------------------------------- background
const Night: React.FC<{ t: number; frame: number }> = ({ t, frame }) => {
  const grain = `<svg xmlns='http://www.w3.org/2000/svg' width='540' height='960'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' seed='${frame % 12}'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.09 0'/></filter><rect width='100%' height='100%' filter='url(#n)'/></svg>`;
  const clouds = [
    { x: 0.2, y: 0.25, c: "rgba(40,60,120,0.35)", s: 900 },
    { x: 0.85, y: 0.6, c: "rgba(20,70,80,0.3)", s: 1000 },
    { x: 0.3, y: 0.85, c: "rgba(70,40,90,0.25)", s: 850 },
  ];
  const yang = 0; // warm tint driven elsewhere
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 42%, #0E1426 0%, #070A12 55%, #030409 100%)" }}>
      {clouds.map((c, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: c.x * W - c.s / 2 + 60 * Math.sin(t * 0.13 + i * 2),
            top: c.y * H - c.s / 2 + 50 * Math.cos(t * 0.11 + i),
            width: c.s,
            height: c.s,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${c.c} 0%, rgba(0,0,0,0) 65%)`,
            filter: "blur(30px)",
            opacity: 0.8 + yang,
          }}
        />
      ))}
      <AbsoluteFill style={{ backgroundImage: `url("data:image/svg+xml;utf8,${encodeURIComponent(grain)}")`, backgroundSize: "100% 100%", opacity: 0.9 }} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- the wheel
const arcPath = (h0: number, h1: number, r: number) => {
  const [x0, y0] = polar(h0, r);
  const [x1, y1] = polar(h1, r);
  return `M ${x0} ${y0} A ${r} ${r} 0 0 1 ${x1} ${y1}`;
};

const Wheel: React.FC<{
  t: number;
  active: { idx: number; k: number }[];
  pulse: number | null;
  axes: number; // 0..1 how many opposite axes drawn (0..6 scaled)
  mainAxis: number; // 0..1 lung/bladder axis
  balance: number; // -1..1 lung high / bladder low
  yang: number;
  handAngle: number | null;
  opacity: number;
  starSpin: number;
}> = ({ t, active, pulse, axes, mainAxis, balance, yang, handAngle, opacity, starSpin }) => {
  const draw = ci(t, T.sectorsDraw[0], T.sectorsDraw[1], 0, 1, Easing.out(Easing.cubic));
  const Rm = (R_IN + R_OUT) / 2;
  const width = R_OUT - R_IN;
  return (
    <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0, opacity }}>
      <defs>
        <filter id="brush" x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="3" seed="9" />
          <feDisplacementMap in="SourceGraphic" scale="16" />
        </filter>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="18" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <radialGradient id="yangGlow" cx="50%" cy="0%" r="80%">
          <stop offset="0%" stopColor="#E8553A" stopOpacity={0.55 * yang} />
          <stop offset="100%" stopColor="#E8553A" stopOpacity={0} />
        </radialGradient>
      </defs>
      {/* Yang half glow (noon at top) */}
      <circle cx={CX} cy={CY} r={R_OUT + 40} fill="url(#yangGlow)" />
      {/* sectors */}
      {ORGANS.map((o, i) => {
        const a = active.find((x) => x.idx === i);
        const ak = a ? a.k : 0;
        const pk = pulse === i ? 1 : 0;
        const local = clamp01(draw * 12 - i * 0.6);
        const dim = balance !== 0 && o.start === 15 ? 1 - 0.75 * Math.max(0, balance) : 1;
        const hot = balance !== 0 && o.start === 3 ? Math.max(0, balance) : 0;
        const len = ((2 / 24) * Math.PI * 2 * Rm) * 0.94;
        return (
          <g key={i}>
            <path
              d={arcPath(o.start + 0.06, o.start + 1.94, Rm)}
              stroke={EL[o.el]}
              strokeWidth={width * (0.92 + 0.08 * ak)}
              fill="none"
              strokeDasharray={`${len * local} ${len}`}
              opacity={(0.16 + 0.55 * ak + 0.35 * pk + 0.6 * hot) * dim}
              filter="url(#brush)"
            />
            {(ak > 0.01 || hot > 0.01) && (
              <path
                d={arcPath(o.start + 0.1, o.start + 1.9, Rm)}
                stroke={EL[o.el]}
                strokeWidth={width * 0.7}
                fill="none"
                opacity={0.55 * Math.max(ak, hot)}
                filter="url(#glow)"
              />
            )}
          </g>
        );
      })}
      {/* hour ticks & labels */}
      {ORGANS.map((o, i) => {
        const [x0, y0] = polar(o.start, R_OUT + 8);
        const [x1, y1] = polar(o.start, R_OUT + 34);
        const [lx, ly] = polar(o.start, R_HOURS);
        const vis = clamp01(draw * 12 - i * 0.6);
        return (
          <g key={`h${i}`} opacity={vis}>
            <line x1={x0} y1={y0} x2={x1} y2={y1} stroke="rgba(243,201,105,0.7)" strokeWidth={3} />
            <text x={lx} y={ly} fill="rgba(243,221,170,0.85)" fontFamily={SANS} fontSize={30} fontWeight={500} textAnchor="middle" dominantBaseline="middle">
              {o.start}h
            </text>
          </g>
        );
      })}
      {/* hanzi */}
      {ORGANS.map((o, i) => {
        const a = active.find((x) => x.idx === i);
        const ak = a ? a.k : 0;
        const hot = balance !== 0 && o.start === 3 ? Math.max(0, balance) : 0;
        const dim = balance !== 0 && o.start === 15 ? 1 - 0.7 * Math.max(0, balance) : 1;
        const [x, y] = polar(o.start + 1, R_HANZI);
        const vis = clamp01(draw * 12 - i * 0.6 - 0.8);
        const sc = 1 + 0.45 * Math.max(ak, hot);
        return (
          <text
            key={`z${i}`}
            x={x}
            y={y}
            fill={ak > 0.3 || hot > 0.3 ? "#fff" : "rgba(255,248,235,0.88)"}
            fontFamily={BRUSH}
            fontSize={o.zh.length > 1 ? 44 : 60}
            textAnchor="middle"
            dominantBaseline="central"
            opacity={vis * dim}
            style={{ transformBox: "fill-box", transformOrigin: "center", transform: `scale(${sc})` }}
            filter={ak > 0.3 ? "url(#glow)" : undefined}
          >
            {o.zh}
          </text>
        );
      })}
      {/* inner ring & center */}
      <circle cx={CX} cy={CY} r={R_IN - 14} fill="none" stroke="rgba(243,201,105,0.35)" strokeWidth={2} strokeDasharray={`${draw * 2 * Math.PI * (R_IN - 14)} 9999`} />
      <circle cx={CX} cy={CY} r={R_OUT + 8} fill="none" stroke="rgba(243,201,105,0.25)" strokeWidth={2} strokeDasharray={`${draw * 2 * Math.PI * (R_OUT + 8)} 9999`} />
      {/* opposite axes (midi-minuit) */}
      <g style={{ transformOrigin: `${CX}px ${CY}px`, transform: `rotate(${starSpin}deg)` }}>
        {[0, 1, 2, 3, 4, 5].map((k) => {
          const h = ORGANS[k].start + 1;
          const isMain = ORGANS[k].start === 3;
          const kk = isMain ? mainAxis : clamp01(axes * 6 - (k < 2 ? k : k - 1));
          if (kk <= 0) return null;
          const [x0, y0] = polar(h, R_IN - 20);
          const [x1, y1] = polar(h + 12, R_IN - 20);
          const mx = x0 + (x1 - x0) * kk;
          const my = y0 + (y1 - y0) * kk;
          return (
            <line
              key={k}
              x1={x0}
              y1={y0}
              x2={mx}
              y2={my}
              stroke={isMain ? "#fff" : GOLD}
              strokeWidth={isMain ? 5 : 3}
              opacity={isMain ? 0.95 : 0.7}
              filter="url(#glow)"
              strokeLinecap="round"
            />
          );
        })}
      </g>
      {/* clock hand */}
      {handAngle !== null && (
        <g style={{ transformOrigin: `${CX}px ${CY}px`, transform: `rotate(${(handAngle * 180) / Math.PI}deg)` }}>
          <path
            d={`M ${CX - 7} ${CY + 30} L ${CX} ${CY - (R_IN - 30)} L ${CX + 7} ${CY + 30} Z`}
            fill={GOLD}
            filter="url(#glow)"
            opacity={ci(t, T.handOn, T.handOn + 0.5, 0, 1)}
          />
        </g>
      )}
      <circle cx={CX} cy={CY} r={14} fill={GOLD} filter="url(#glow)" opacity={draw} />
    </svg>
  );
};

// Ink splash burst at a sector (element colour)
const Splash: React.FC<{ at: [number, number]; color: string; seed: number }> = ({ at, color, seed }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const k = interpolate(frame, [0, 0.7 * fps], [0, 1], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const o = interpolate(frame, [0, 3, 1.3 * fps], [0, 0.85, 0], { extrapolateRight: "clamp" });
  return (
    <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0, mixBlendMode: "screen" }}>
      <defs>
        <filter id={`sp${seed}`} x="-50%" y="-50%" width="200%" height="200%">
          <feTurbulence type="turbulence" baseFrequency="0.03" numOctaves="3" seed={seed} />
          <feDisplacementMap in="SourceGraphic" scale={90} />
          <feGaussianBlur stdDeviation="2" />
        </filter>
      </defs>
      <circle cx={at[0]} cy={at[1]} r={40 + 170 * k} fill={color} opacity={o * 0.5} filter={`url(#sp${seed})`} />
      <circle cx={at[0]} cy={at[1]} r={30 + 260 * k} fill="none" stroke={color} strokeWidth={6 * (1 - k) + 1} opacity={o} />
    </svg>
  );
};

// Hero title — letters resolve from blur
const Hero: React.FC<{ title: string; zh?: string; sub?: string; color: string; len: number; y?: number; size?: number }> = ({
  title,
  zh,
  sub,
  color,
  len,
  y = 120,
  size = 128,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const out = interpolate(frame, [len - 0.35 * fps, len], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const lift = interpolate(frame, [len - 0.35 * fps, len], [0, -30], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{ position: "absolute", top: y, left: 0, right: 0, textAlign: "center", opacity: out, transform: `translateY(${lift}px)` }}>
      {zh && (
        <div
          style={{
            fontFamily: BRUSH,
            fontSize: 84,
            color,
            opacity: interpolate(frame, [0, 10], [0, 1], { extrapolateRight: "clamp" }),
            filter: `blur(${interpolate(frame, [0, 10], [10, 0], { extrapolateRight: "clamp" })}px)`,
            textShadow: `0 0 30px ${color}`,
            marginBottom: 4,
          }}
        >
          {zh}
        </div>
      )}
      <div style={{ fontFamily: SERIF, fontWeight: 600, fontSize: size, letterSpacing: 10, color: "#FFF8EA", lineHeight: 1, textShadow: `0 0 40px ${color}88` }}>
        {title.split("").map((ch, i) => {
          const at = 3 + i * 1.3;
          const o = interpolate(frame, [at, at + 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          const b = interpolate(frame, [at, at + 10], [14, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          const ty = interpolate(frame, [at, at + 12], [26, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: inOut });
          return (
            <span key={i} style={{ display: "inline-block", opacity: o, filter: `blur(${b}px)`, transform: `translateY(${ty}px)`, whiteSpace: "pre" }}>
              {ch}
            </span>
          );
        })}
      </div>
      {sub && (
        <div
          style={{
            fontFamily: SANS,
            fontWeight: 500,
            fontSize: 36,
            letterSpacing: 8,
            color,
            marginTop: 18,
            opacity: interpolate(frame, [12, 22], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
          }}
        >
          {sub}
        </div>
      )}
    </div>
  );
};

// Karaoke captions from Whisper word timings
const Caption: React.FC<{ line: Line }> = ({ line }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const out = interpolate(t, [line.dur + 0.15, line.dur + 0.4], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const keys = (line.keys ?? []).map((k) => k.toLowerCase());
  // show at most ~7 words: current chunk split on sentence punctuation
  const chunks: Word[][] = [];
  let cur: Word[] = [];
  line.words.forEach((w) => {
    cur.push(w);
    if (/[.?!]$/.test(w.w) || cur.length >= 7) {
      chunks.push(cur);
      cur = [];
    }
  });
  if (cur.length) chunks.push(cur);
  const chunk = chunks.find((c, i) => t < (chunks[i + 1] ? chunks[i + 1][0].s - 0.05 : 99)) ?? chunks[chunks.length - 1];
  const chunkStart = chunk[0].s;
  const inK = interpolate(t, [chunkStart - 0.05, chunkStart + 0.15], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{ position: "absolute", left: 60, right: 60, top: 1540, textAlign: "center", opacity: out * inK }}>
      {chunk.map((w, i) => {
        const on = t >= w.s - 0.03;
        const now = t >= w.s - 0.03 && t < w.e + 0.1;
        const clean = w.w.toLowerCase().replace(/[.,:;!?]/g, "");
        const isKey = keys.some((k) => clean.startsWith(k));
        const pop = now ? interpolate(t, [w.s - 0.03, w.s + 0.12], [1.18, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 1;
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              marginRight: 16,
              fontFamily: SANS,
              fontWeight: isKey ? 600 : 500,
              fontSize: 60,
              lineHeight: 1.25,
              color: isKey ? GOLD : "#fff",
              opacity: on ? 1 : 0.28,
              transform: `scale(${pop})`,
              textShadow: isKey && on ? `0 0 24px ${GOLD}` : "0 2px 12px rgba(0,0,0,0.6)",
            }}
          >
            {w.w}
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
  const wt = useWordTime(lines);
  const f = (s: number) => Math.round(s * fps);

  // key moments from speech
  const tFoie = wt(4, "foie", 0, 14.2);
  const tPoumon = wt(4, "poumon", 0, 17.2);
  const tEstomac = wt(5, "l'estomac", 0, 21.1);
  const tCoeur = wt(5, "cœur", 0, 22.8);
  const tYang = wt(5, "yang", 0, 23.6);
  const tUne = wt(4, "une", 0, 13.3);
  const tTrois = wt(4, "trois", 0, 16.1);
  const tSept = wt(5, "sept", 0, 20.2);
  const tMidi = wt(5, "midi", 0, 22.0);
  const tOppose = wt(6, "opposé", 0, 25.4);
  const tPoumon2 = wt(6, "poumon", 0, 27.9);
  const tVessie = wt(6, "vessie", 0, 29.2);
  const tLoi = wt(6, "loi", 0, 30.9);
  const tAcu = wt(6, "acupuncture", 0, 32.6);
  const tSouffle = wt(7, "souffle", 0, 38.7);
  const tTristesse = wt(7, "tristesse", 0, 40.1);
  const tHasard = wt(2, "hasard", 0, 5.0);

  // clock hand: spring between targets
  const handTargets: [number, number][] = [
    [tUne, 2],
    [tTrois, 4],
    [tSept, 8],
    [tMidi, 12],
  ];
  let handAngle: number | null = null;
  if (t >= T.handOn && t < T.diveIn[1]) {
    let prev = hourAngle(0) - Math.PI * 2 * 0; // start at midnight
    let ang = prev;
    for (const [at, h] of handTargets) {
      if (t < at) break;
      let target = hourAngle(h);
      while (target < prev) target += Math.PI * 2;
      const sp = spring({ frame: frame - f(at), fps, config: { damping: 11, stiffness: 120, mass: 0.8 } });
      ang = prev + (target - prev) * sp;
      prev = target;
    }
    handAngle = ang;
  }

  // active organs (bloom envelopes)
  const env = (at: number, hold: number) => ci(t, at - 0.1, at + 0.25, 0, 1) * (1 - ci(t, at + hold, at + hold + 0.5, 0, 1));
  const active = [
    { idx: organAt(1), k: env(tFoie, tTrois - tFoie - 0.3) },
    { idx: organAt(3), k: env(tPoumon, tSept - tPoumon - 0.3) },
    { idx: organAt(7), k: env(tEstomac, tMidi - tEstomac - 0.2) },
    { idx: organAt(11), k: env(tCoeur, 24.2 - tCoeur) },
  ];
  const focusList: [number, number, number][] = [
    [tFoie, 2, tTrois - 0.2],
    [tPoumon, 4, tSept - 0.2],
    [tEstomac, 8, tMidi - 0.1],
    [tCoeur, 12, 24.3],
  ];
  let focus: [number, number] | null = null;
  let focusK = 0;
  for (const [a, h, b] of focusList) {
    if (t >= a - 0.4 && t < b + 0.6) {
      focus = polar(h, (R_IN + R_OUT) / 2);
      focusK = ci(t, a - 0.4, a + 0.4, 0, 1) * (1 - ci(t, b, b + 0.6, 0, 1));
    }
  }
  const cam = cameraAt(t, focus, focusK);

  // comet: lap then sector hops
  let comet: number | null = null;
  let pulse: number | null = null;
  if (t >= T.lap[0] && t < T.lap[1]) comet = ci(t, T.lap[0], T.lap[1], 0, Math.PI * 2, Easing.inOut(Easing.quad));
  if (t >= T.pulses[0] && t < T.pulses[1]) {
    const step = (T.pulses[1] - T.pulses[0]) / 12;
    const k = Math.floor((t - T.pulses[0]) / step);
    pulse = k;
    comet = hourAngle(ORGANS[k].start + 1);
  }
  if (t >= T.handOn && handAngle !== null) comet = handAngle;

  // midi-minuit
  const mainAxis = ci(t, tOppose, tOppose + 0.6, 0, 1, Easing.out(Easing.cubic));
  const balance = ci(t, tPoumon2 - 0.2, tVessie + 0.5, 0, 1) * (1 - ci(t, tLoi - 0.2, tLoi + 0.4, 0, 1));
  const axes = ci(t, tLoi, tLoi + 1.0, 0, 1);
  const starSpin = ci(t, tLoi, T.diveIn[0] + 0.5, 0, 30, Easing.inOut(Easing.cubic));
  const yang = ci(t, tYang - 0.3, tYang + 0.3, 0, 1) * (1 - ci(t, 24.4, 25.2, 0, 1));

  const wheelOpacity =
    ci(t, 6.6, 7.4, 0, 1) * (1 - ci(t, T.diveIn[1] - 0.3, T.diveIn[1], 0, 1)) + ci(t, T.lungsOut[0] + 0.4, T.lungsOut[1] + 0.4, 0, 1);

  const camStyle: React.CSSProperties = {
    transformOrigin: `${CX}px ${CY}px`,
    transform: `perspective(1700px) translate(${cam.x}px, ${cam.y}px) scale(${cam.s}) rotateX(${cam.rx}deg)`,
  };
  const flash = ci(t, T.diveIn[1] - 0.25, T.diveIn[1], 0, 1) * (1 - ci(t, T.diveIn[1], T.diveIn[1] + 0.6, 0, 1));
  const lungsVisible = t > T.lungs[0] && t < T.lungsOut[1];

  // drop + ripple
  const dropK = ci(t, tTristesse - 0.1, tTristesse + 0.55, 0, 1, Easing.in(Easing.quad));
  const ripple = t > tTristesse + 0.55 ? (t - tTristesse - 0.55) / 1.4 : -1;

  // needle
  const needleK = ci(t, tAcu - 0.3, tAcu + 0.25, 0, 1, Easing.in(Easing.cubic));
  const needleOut = 1 - ci(t, tAcu + 1.0, tAcu + 1.5, 0, 1);
  const needleRipple = t > tAcu + 0.25 ? (t - tAcu - 0.25) / 1.2 : -1;

  const sfx: [number, string, number][] = [
    [tHasard - 0.15, "boom", 0.5],
    [tHasard - 0.3, "whoosh", 0.55],
    [T.tiltStart, "whoosh", 0.35],
    [T.lap[0], "whoosh", 0.3],
    ...new Array(12).fill(0).map((_, k) => [T.pulses[0] + (k * (T.pulses[1] - T.pulses[0])) / 12, "tick", 0.35] as [number, string, number]),
    [tUne, "tick", 0.5],
    [tFoie, "bowl_wood", 0.45],
    [tTrois, "tick", 0.5],
    [tPoumon, "bowl_metal", 0.45],
    [tSept, "tick", 0.5],
    [tEstomac, "bowl_earth", 0.45],
    [tMidi, "tick", 0.5],
    [tCoeur, "bowl_fire", 0.5],
    [tOppose, "whoosh", 0.3],
    [tLoi, "bowl_deep", 0.7],
    [tAcu + 0.2, "ting", 0.4],
    [T.diveIn[0] + 0.2, "whoosh", 0.6],
    [T.diveIn[1] - 0.1, "boom", 0.35],
    [36.0, "breath", 0.35],
    [39.0, "breath", 0.25],
    [tSouffle + 0.2, "breath", 0.2],
    [tTristesse + 0.5, "drop", 0.5],
    [T.lungsOut[0], "whoosh", 0.5],
    [42.9, "bowl_high", 0.35],
  ];

  return (
    <AbsoluteFill style={{ background: "#030409", overflow: "hidden" }}>
      <Night t={t} frame={frame} />
      <AbsoluteFill style={camStyle}>
        <Wheel
          t={t}
          active={active}
          pulse={pulse}
          axes={axes}
          mainAxis={mainAxis}
          balance={balance}
          yang={yang}
          handAngle={handAngle}
          opacity={wheelOpacity}
          starSpin={starSpin}
        />
        {[
          [tFoie, 2, EL.bois],
          [tPoumon, 4, EL.metal],
          [tEstomac, 8, EL.terre],
          [tCoeur, 12, EL.feu],
          [tLoi, 4, "#FFFFFF"],
        ].map(([at, h, c], i) => (
          <Sequence key={i} from={f(at as number)} durationInFrames={f(1.4)} layout="none">
            <Splash at={polar(h as number, (R_IN + R_OUT) / 2)} color={c as string} seed={3 + i * 7} />
          </Sequence>
        ))}
        {/* acupuncture needle into the centre */}
        {needleK > 0 && needleOut > 0 && (
          <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0, opacity: needleOut }}>
            <line x1={CX} y1={CY - 900 + 900 * needleK - 520} x2={CX} y2={CY - 900 + 900 * needleK} stroke="#F8E7B8" strokeWidth={4} strokeLinecap="round" />
            <circle cx={CX} cy={CY - 900 + 900 * needleK - 520} r={10} fill={GOLD} />
            {needleRipple > 0 &&
              [0, 0.25, 0.5].map((d) => {
                const k = clamp01(needleRipple - d);
                return <circle key={d} cx={CX} cy={CY} r={20 + 300 * k} fill="none" stroke={GOLD} strokeWidth={3} opacity={(1 - k) * 0.8} />;
              })}
          </svg>
        )}
      </AbsoluteFill>
      <AbsoluteFill style={lungsVisible ? {} : camStyle}>
        <Particles t={t} comet={comet} />
      </AbsoluteFill>

      {/* lung-scene glyphs: 肺 · 悲 behind the lungs */}
      {lungsVisible && (
        <div
          style={{
            position: "absolute",
            top: 1250,
            left: 0,
            right: 0,
            textAlign: "center",
            fontFamily: BRUSH,
            fontSize: 120,
            color: "rgba(220,228,238,0.8)",
            opacity: ci(t, 36.6, 37.4, 0, 1) * (1 - ci(t, T.lungsOut[0], T.lungsOut[0] + 0.5, 0, 1)),
            textShadow: "0 0 30px rgba(220,228,238,0.6)",
            letterSpacing: 40,
          }}
        >
          肺 · 悲
        </div>
      )}
      {/* the tear-drop */}
      {lungsVisible && dropK > 0 && (
        <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0 }}>
          {ripple < 0 && <ellipse cx={CX} cy={640 + dropK * 720} rx={10} ry={16} fill="#BFD3F2" opacity={0.95} />}
          {ripple >= 0 &&
            [0, 0.2, 0.4].map((d) => {
              const k = clamp01(ripple - d);
              return <ellipse key={d} cx={CX} cy={1360} rx={20 + 360 * k} ry={6 + 70 * k} fill="none" stroke="#BFD3F2" strokeWidth={3} opacity={(1 - k) * 0.9} />;
            })}
        </svg>
      )}

      <AbsoluteFill style={{ background: "#E9F0FA", opacity: flash * 0.4, mixBlendMode: "screen" }} />

      {/* hook subtitle under the particle time */}
      <Sequence from={f(2.2)} durationInFrames={f(tHasard - 2.2)}>
        <Hero title="" zh="寅时" sub="L'HEURE DU TIGRE · 3H — 5H" color={GOLD} len={f(tHasard - 2.2)} y={1240} />
      </Sequence>

      {/* hero organ names */}
      <Sequence from={f(tFoie - 0.15)} durationInFrames={f(tTrois - tFoie - 0.1)}>
        <Hero title="LE FOIE" zh="肝" sub="1H — 3H · BOIS" color={EL.bois} len={f(tTrois - tFoie - 0.1)} />
      </Sequence>
      <Sequence from={f(tPoumon - 0.15)} durationInFrames={f(tSept - tPoumon - 0.1)}>
        <Hero title="LE POUMON" zh="肺" sub="3H — 5H · MÉTAL" color={EL.metal} len={f(tSept - tPoumon - 0.1)} />
      </Sequence>
      <Sequence from={f(tEstomac - 0.15)} durationInFrames={f(tMidi - tEstomac)}>
        <Hero title="L'ESTOMAC" zh="胃" sub="7H — 9H · TERRE" color={EL.terre} len={f(tMidi - tEstomac)} />
      </Sequence>
      <Sequence from={f(tCoeur - 0.15)} durationInFrames={f(24.4 - tCoeur)}>
        <Hero title="LE CŒUR" zh="心" sub="11H — 13H · FEU" color={EL.feu} len={f(24.4 - tCoeur)} />
      </Sequence>
      <Sequence from={f(tOppose - 0.1)} durationInFrames={f(tPoumon2 - tOppose - 0.2)}>
        <Hero title="12 HEURES" sub="D'ÉCART" color={GOLD} len={f(tPoumon2 - tOppose - 0.2)} size={120} />
      </Sequence>
      <Sequence from={f(tPoumon2 - 0.1)} durationInFrames={f(tLoi - tPoumon2 - 0.2)}>
        <Balance t0={tPoumon2} tV={tVessie} len={f(tLoi - tPoumon2 - 0.2)} />
      </Sequence>
      <Sequence from={f(tLoi - 0.1)} durationInFrames={f(T.diveIn[0] - tLoi + 0.2)}>
        <Hero title="MIDI – MINUIT" zh="子午" sub="LA LOI DES OPPOSÉS" color={GOLD} len={f(T.diveIn[0] - tLoi + 0.2)} size={112} />
      </Sequence>

      {/* end card */}
      <Sequence from={f(T.lungsOut[1] - 0.6)}>
        <EndCard />
      </Sequence>

      {/* captions */}
      {lines.map((l) => (
        <Sequence key={l.i} from={f(l.start)} durationInFrames={f(l.dur + 0.45)}>
          <Audio src={staticFile(l.file)} />
          {l.i !== 8 && <Caption line={l} />}
        </Sequence>
      ))}

      {/* sound design */}
      <Audio
        src={staticFile("sfx/drone.wav")}
        volume={(fr) => interpolate(fr, [0, f(2), f(duration - 2), f(duration)], [0, 0.55, 0.55, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}
      />
      {sfx.map(([at, name, vol], i) => (
        <Sequence key={`s${i}`} from={Math.max(0, f(at))} layout="none">
          <Audio src={staticFile(`sfx/${name}.wav`)} volume={vol} />
        </Sequence>
      ))}

      {/* vignette */}
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 48%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.55) 100%)", pointerEvents: "none" }} />
    </AbsoluteFill>
  );
};

// Poumon ▲ / Vessie ▼ balance readout
const Balance: React.FC<{ t0: number; tV: number; len: number }> = ({ t0, tV, len }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = t0 - 0.1 + frame / fps;
  const out = interpolate(frame, [len - 8, len], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const up = ci(t, t0 - 0.1, t0 + 0.6, 0, 1, Easing.out(Easing.back(1.6)));
  const down = ci(t, tV - 0.1, tV + 0.6, 0, 1, Easing.out(Easing.cubic));
  const Row: React.FC<{ zh: string; name: string; v: number; color: string; label: string; o: number }> = ({ zh, name, v, color, label, o }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 26, opacity: o, margin: "18px 0" }}>
      <span style={{ fontFamily: BRUSH, fontSize: 76, color, width: 170, textAlign: "right", textShadow: `0 0 20px ${color}` }}>{zh}</span>
      <div style={{ width: 420 }}>
        <div style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 52, color: "#FFF8EA", letterSpacing: 4 }}>{name}</div>
        <div style={{ height: 12, borderRadius: 6, background: "rgba(255,255,255,0.12)", marginTop: 8 }}>
          <div style={{ height: 12, borderRadius: 6, width: `${v * 100}%`, background: color, boxShadow: `0 0 18px ${color}` }} />
        </div>
        <div style={{ fontFamily: SANS, fontSize: 28, letterSpacing: 5, color, marginTop: 8 }}>{label}</div>
      </div>
    </div>
  );
  return (
    <div style={{ position: "absolute", top: 90, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center", opacity: out }}>
      <Row zh="肺" name="POUMON" v={0.2 + 0.8 * up} color={EL.metal} label="AU PLUS HAUT · 3H–5H" o={Math.min(1, up * 2)} />
      <Row zh="膀胱" name="VESSIE" v={0.55 - 0.45 * down} color={EL.eau} label="AU PLUS BAS · 15H–17H" o={Math.min(1, down * 2 + 0.001) > 0.01 ? Math.min(1, down * 2) : 0} />
    </div>
  );
};

const EndCard: React.FC = () => {
  const frame = useCurrentFrame();
  const o = (a: number) => interpolate(frame, [a, a + 14], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <>
      <div style={{ position: "absolute", top: 170, left: 0, right: 0, textAlign: "center" }}>
        <div style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 86, color: "#FFF8EA", lineHeight: 1.1, opacity: o(0), filter: `blur(${(1 - o(0)) * 10}px)` }}>
          Votre corps
          <br />a une horloge.
        </div>
        <div style={{ fontFamily: BRUSH, fontSize: 60, color: GOLD, letterSpacing: 24, marginTop: 20, opacity: o(20), textShadow: `0 0 24px ${GOLD}` }}>子午流注</div>
      </div>
      <div
        style={{
          position: "absolute",
          bottom: 70,
          left: 90,
          right: 90,
          textAlign: "center",
          fontFamily: SANS,
          fontSize: 25,
          lineHeight: 1.4,
          color: "rgba(255,255,255,0.6)",
          opacity: o(40),
        }}
      >
        Contenu culturel sur la médecine traditionnelle chinoise.
        <br />
        Ne remplace pas un avis médical.
      </div>
    </>
  );
};

export const calculateMetadata: CalculateMetadataFunction<SceneProps> = async ({ props }) => ({
  durationInFrames: Math.round((props.duration ?? 46) * 30),
  fps: 30,
  width: W,
  height: H,
});
