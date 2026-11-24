import React from "react";
import {
  AbsoluteFill,
  Audio,
  CalculateMetadataFunction,
  Easing,
  Img,
  Sequence,
  interpolate,
  random,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { loadFont as loadCormorant } from "@remotion/google-fonts/CormorantGaramond";
import { loadFont as loadBrush } from "@remotion/google-fonts/MaShanZheng";

// ATELIER — "Astragale · Encre & Archives". See art-direction.md.

const { fontFamily: SERIF } = loadCormorant("normal", {
  weights: ["500", "600", "700"],
  subsets: ["latin", "latin-ext"],
});
const { fontFamily: BRUSH } = loadBrush();

const PAPER = "#EFE6D2";
const INK = "#1C1915";
const SEAL = "#B8332A";
const OCHRE = "#B07F1F";

type Rect = { x: number; y: number; w: number; h: number }; // normalized to image

export interface ShotSpec {
  src: string;
  w: number; // natural pixel size
  h: number;
  start: number; // seconds
  end: number;
  from: Rect;
  to: Rect;
  grade?: "painting" | "sepia";
  bleedOrigin?: [number, number]; // 0..1 of frame
}

export interface LineSpec {
  file: string;
  start: number;
  dur: number;
  who: "M" | "E";
  text: string;
  key?: string; // word(s) highlighted
}

export interface SceneProps {
  duration: number;
  shots: ShotSpec[];
  lines: LineSpec[];
  music?: { file: string; offset: number; volume: number };
  calligraphy?: { start: number; end: number; chars: string };
  seal?: { at: number; chars: string };
  footnote?: { start: number; text: string };
}

const ease = Easing.bezier(0.45, 0, 0.55, 1);

// Rect -> CSS transform that makes `rect` of the image cover the frame.
const rectTransform = (r: Rect, iw: number, ih: number, W: number, H: number) => {
  const rw = r.w * iw;
  const rh = r.h * ih;
  const s = Math.max(W / rw, H / rh);
  const cx = (r.x + r.w / 2) * iw;
  const cy = (r.y + r.h / 2) * ih;
  return { s, tx: W / 2 - cx * s, ty: H / 2 - cy * s };
};

const lerpRect = (a: Rect, b: Rect, t: number): Rect => ({
  x: a.x + (b.x - a.x) * t,
  y: a.y + (b.y - a.y) * t,
  w: a.w + (b.w - a.w) * t,
  h: a.h + (b.h - a.h) * t,
});

// Ragged ink-bleed mask, regenerated per frame as an SVG data URI.
const inkMask = (progress: number, ox: number, oy: number, W: number, H: number, seed: number) => {
  const r = progress * Math.hypot(W, H) * 1.05;
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${W}' height='${H}'>
<filter id='f' x='-20%' y='-20%' width='140%' height='140%'>
<feTurbulence type='fractalNoise' baseFrequency='0.012' numOctaves='3' seed='${seed}'/>
<feDisplacementMap in='SourceGraphic' scale='${140}' xChannelSelector='R' yChannelSelector='G'/>
<feGaussianBlur stdDeviation='6'/></filter>
<circle cx='${ox * W}' cy='${oy * H}' r='${r}' fill='white' filter='url(#f)'/></svg>`;
  return `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;
};

const Shot: React.FC<{ shot: ShotSpec; index: number }> = ({ shot, index }) => {
  const frame = useCurrentFrame();
  const { fps, width: W, height: H } = useVideoConfig();
  const len = (shot.end - shot.start) * fps;
  const t = interpolate(frame, [0, len], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });
  const r = lerpRect(shot.from, shot.to, t);
  const { s, tx, ty } = rectTransform(r, shot.w, shot.h, W, H);
  const bleed = interpolate(frame, [0, 1.1 * fps], [0, 1], {
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.2, 0.6, 0.3, 1),
  });
  const [ox, oy] = shot.bleedOrigin ?? [0.5, 0.45];
  const mask = bleed < 1 ? inkMask(bleed, ox, oy, W, H, 7 + index * 13) : undefined;
  const filter =
    shot.grade === "sepia"
      ? "sepia(0.55) saturate(0.75) contrast(1.06) brightness(0.98)"
      : "saturate(0.85) contrast(1.04)";
  return (
    <AbsoluteFill style={{ maskImage: mask, WebkitMaskImage: mask, maskSize: "100% 100%", WebkitMaskSize: "100% 100%" }}>
      <AbsoluteFill style={{ background: PAPER }} />
      <Img
        src={staticFile(shot.src)}
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: shot.w,
          height: shot.h,
          transformOrigin: "0 0",
          transform: `translate(${tx}px, ${ty}px) scale(${s})`,
          filter,
          mixBlendMode: "multiply",
        }}
      />
    </AbsoluteFill>
  );
};

// Paper grain + vignette over everything, deterministic.
const PaperGrain: React.FC = () => {
  const { width: W, height: H } = useVideoConfig();
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${W}' height='${H}'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' seed='3'/><feColorMatrix values='0 0 0 0 0.35  0 0 0 0 0.3  0 0 0 0 0.22  0 0 0 0.5 0'/></filter><rect width='100%' height='100%' filter='url(#n)'/></svg>`;
  return (
    <>
      <AbsoluteFill
        style={{
          backgroundImage: `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`,
          mixBlendMode: "multiply",
          opacity: 0.35,
        }}
      />
      <AbsoluteFill
        style={{ background: "radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 55%, rgba(40,28,12,0.38) 100%)" }}
      />
    </>
  );
};

// Drifting mist bands.
const Mist: React.FC = () => {
  const frame = useCurrentFrame();
  const { width: W, height: H } = useVideoConfig();
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {new Array(6).fill(0).map((_, i) => {
        const y = random(`my${i}`) * H * 0.9;
        const speed = 0.25 + random(`ms${i}`) * 0.5;
        const x = ((random(`mx${i}`) * W * 1.6 + frame * speed) % (W * 1.6)) - W * 0.5;
        const w = W * (0.7 + random(`mw${i}`) * 0.6);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: w,
              height: w * 0.22,
              borderRadius: "50%",
              background: "rgba(246,240,226,0.32)",
              filter: "blur(48px)",
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

// Word-by-word subtitle, timed proportionally to word length.
const Subtitle: React.FC<{ line: LineSpec }> = ({ line }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const words = line.text.split(" ");
  const total = words.reduce((a, w) => a + w.length + 1, 0);
  const keys = (line.key ?? "").toLowerCase().split(" ").filter(Boolean);
  let acc = 0;
  const out = interpolate(frame, [(line.dur + 0.25) * fps, (line.dur + 0.55) * fps], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const label = line.who === "M" ? "LA MAÎTRESSE" : "L'ÉLÈVE";
  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 300, opacity: out }}>
      <div
        style={{
          position: "absolute",
          bottom: 180,
          width: "130%",
          height: 480,
          background: "radial-gradient(ellipse at 50% 60%, rgba(239,230,210,0.92) 0%, rgba(239,230,210,0.75) 40%, rgba(239,230,210,0) 70%)",
        }}
      />
      <div
        style={{
          position: "relative",
          fontFamily: SERIF,
          fontWeight: 700,
          letterSpacing: 8,
          fontSize: 30,
          color: SEAL,
          marginBottom: 18,
          opacity: interpolate(frame, [0, 8], [0, 1], { extrapolateRight: "clamp" }),
        }}
      >
        {label}
      </div>
      <div
        style={{
          position: "relative",
          width: 940,
          textAlign: "center",
          fontFamily: SERIF,
          fontWeight: 600,
          fontSize: 68,
          lineHeight: 1.18,
          color: INK,
        }}
      >
        {words.map((w, i) => {
          const at = (acc / total) * line.dur * fps;
          acc += w.length + 1;
          const o = interpolate(frame, [at - 2, at + 6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          const y = interpolate(frame, [at - 2, at + 8], [10, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });
          const clean = w.toLowerCase().replace(/[.,:;!?…']/g, "");
          const isKey = keys.some((k) => clean.includes(k));
          return (
            <span
              key={i}
              style={{
                display: "inline-block",
                opacity: o,
                transform: `translateY(${y}px)`,
                color: isKey ? OCHRE : INK,
                fontStyle: isKey ? "italic" : "normal",
                marginRight: 16,
              }}
            >
              {w}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// Vertical brush calligraphy, revealed top-to-bottom like a stroke being drawn.
const Calligraphy: React.FC<{ chars: string; len: number }> = ({ chars, len }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = interpolate(frame, [0, 1.6 * fps], [0, 100], { extrapolateRight: "clamp", easing: Easing.out(Easing.quad) });
  const fade = interpolate(frame, [len - 0.5 * fps, len], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const m = `linear-gradient(to bottom, black ${p}%, transparent ${p + 8}%)`;
  return (
    <div
      style={{
        position: "absolute",
        right: 70,
        top: 150,
        writingMode: "vertical-rl",
        fontFamily: BRUSH,
        fontSize: 230,
        lineHeight: 1,
        color: INK,
        opacity: 0.9 * fade,
        maskImage: m,
        WebkitMaskImage: m,
        textShadow: "0 0 30px rgba(239,230,210,0.9)",
      }}
    >
      {chars}
    </div>
  );
};

// Signature device: the vermilion seal stamping onto the page.
const Seal: React.FC<{ chars: string; len: number }> = ({ chars, len }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const press = interpolate(frame, [0, 5, 9], [1.35, 0.96, 1], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const o = interpolate(frame, [0, 3], [0, 0.92], { extrapolateRight: "clamp" });
  const fade = interpolate(frame, [len - 0.4 * fps, len], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div
      style={{
        position: "absolute",
        right: 96,
        top: 700,
        width: 170,
        height: 170,
        background: SEAL,
        borderRadius: 10,
        transform: `scale(${press}) rotate(-3deg)`,
        opacity: o * fade,
        mixBlendMode: "multiply",
        display: "flex",
        flexDirection: "row-reverse",
        alignItems: "center",
        justifyContent: "center",
        gap: 4,
        boxShadow: "inset 0 0 18px rgba(80,0,0,0.5)",
      }}
    >
      {chars.split("").map((c, i) => (
        <span key={i} style={{ fontFamily: BRUSH, fontSize: 72, color: PAPER, writingMode: "vertical-rl", lineHeight: 1 }}>
          {c}
        </span>
      ))}
    </div>
  );
};

const Footnote: React.FC<{ text: string }> = ({ text }) => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [0, 12], [0, 0.85], { extrapolateRight: "clamp" });
  return (
    <div
      style={{
        position: "absolute",
        left: 80,
        right: 80,
        top: 110,
        textAlign: "center",
        fontFamily: SERIF,
        fontStyle: "italic",
        fontSize: 30,
        color: INK,
        opacity: o,
      }}
    >
      {text}
    </div>
  );
};

export const Scene: React.FC<SceneProps> = (props) => {
  const { fps } = useVideoConfig();
  const f = (s: number) => Math.round(s * fps);
  return (
    <AbsoluteFill style={{ background: PAPER }}>
      {props.shots.map((s, i) => (
        <Sequence key={i} from={f(s.start)} durationInFrames={f(s.end - s.start)} layout="none">
          <Shot shot={s} index={i} />
        </Sequence>
      ))}
      <Mist />
      <PaperGrain />
      {props.calligraphy && (
        <Sequence from={f(props.calligraphy.start)} durationInFrames={f(props.calligraphy.end - props.calligraphy.start)}>
          <Calligraphy chars={props.calligraphy.chars} len={f(props.calligraphy.end - props.calligraphy.start)} />
        </Sequence>
      )}
      {props.seal && (
        <Sequence from={f(props.seal.at)} durationInFrames={f((props.calligraphy?.end ?? props.seal.at + 3) - props.seal.at)}>
          <Seal chars={props.seal.chars} len={f((props.calligraphy?.end ?? props.seal.at + 3) - props.seal.at)} />
        </Sequence>
      )}
      {props.lines.map((l, i) => (
        <Sequence key={i} from={f(l.start)} durationInFrames={f(l.dur + 0.6)}>
          <Audio src={staticFile(l.file)} />
          <Subtitle line={l} />
        </Sequence>
      ))}
      {props.footnote && (
        <Sequence from={f(props.footnote.start)}>
          <Footnote text={props.footnote.text} />
        </Sequence>
      )}
      {props.music && (
        <Audio
          src={staticFile(props.music.file)}
          startFrom={f(props.music.offset)}
          volume={(fr) =>
            interpolate(fr, [0, f(1.2), f(props.duration - 1.5), f(props.duration)], [0, props.music!.volume, props.music!.volume, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            })
          }
        />
      )}
    </AbsoluteFill>
  );
};

export const calculateMetadata: CalculateMetadataFunction<SceneProps> = async ({ props }) => ({
  durationInFrames: Math.round((props.duration ?? 15) * 30),
  fps: 30,
  width: 1080,
  height: 1920,
});
