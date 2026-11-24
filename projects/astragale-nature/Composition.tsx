import React from "react";
import {
  AbsoluteFill,
  Audio,
  CalculateMetadataFunction,
  Easing,
  Img,
  OffthreadVideo,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { loadFont as loadJost } from "@remotion/google-fonts/Jost";
import { loadFont as loadFraunces } from "@remotion/google-fonts/Fraunces";
import { loadFont as loadBrush } from "@remotion/google-fonts/MaShanZheng";

// ATELIER — "Astragale · Nature réelle" (field notebook). See art-direction.md.

const { fontFamily: SANS } = loadJost("normal", { weights: ["400", "500", "600"], subsets: ["latin", "latin-ext"] });
const { fontFamily: FRAUNCES } = loadFraunces("italic", { weights: ["400"], subsets: ["latin"] });
const { fontFamily: BRUSH } = loadBrush();

const INK = "#141414";
const JADE = "#7FB08B";
const OCHRE = "#D9A441";

type Rect = { x: number; y: number; w: number; h: number };

export interface ShotSpec {
  src: string;
  kind: "image" | "video";
  w: number;
  h: number;
  start: number;
  end: number;
  from: Rect;
  to: Rect;
  videoStart?: number;
  wipeOrigin?: [number, number];
}

export interface LineSpec {
  file: string;
  start: number;
  dur: number;
  who: "M" | "E";
  text: string;
  key?: string;
}

export interface SceneProps {
  duration: number;
  shots: ShotSpec[];
  lines: LineSpec[];
  music?: { file: string; offset: number; volume: number };
  fieldTag?: { start: number; end: number; hanzi: string; pinyin: string; latin: string };
  footnote?: { start: number; text: string };
}

const ease = Easing.bezier(0.45, 0, 0.55, 1);

const rectTransform = (r: Rect, iw: number, ih: number, W: number, H: number) => {
  const s = Math.max(W / (r.w * iw), H / (r.h * ih));
  return { s, tx: W / 2 - (r.x + r.w / 2) * iw * s, ty: H / 2 - (r.y + r.h / 2) * ih * s };
};
const lerpRect = (a: Rect, b: Rect, t: number): Rect => ({
  x: a.x + (b.x - a.x) * t,
  y: a.y + (b.y - a.y) * t,
  w: a.w + (b.w - a.w) * t,
  h: a.h + (b.h - a.h) * t,
});

const blotMask = (p: number, ox: number, oy: number, W: number, H: number, seed: number) => {
  const r = p * Math.hypot(W, H) * 1.1;
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${W}' height='${H}'>
<filter id='f' x='-30%' y='-30%' width='160%' height='160%'>
<feTurbulence type='turbulence' baseFrequency='0.02' numOctaves='2' seed='${seed}'/>
<feDisplacementMap in='SourceGraphic' scale='220' xChannelSelector='R' yChannelSelector='B'/></filter>
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
  // handheld-ish breathing on stills only
  const bx = shot.kind === "image" ? Math.sin(frame / 37) * 6 : 0;
  const by = shot.kind === "image" ? Math.cos(frame / 53) * 5 : 0;
  const wipe = interpolate(frame, [0, 0.9 * fps], [0, 1], { extrapolateRight: "clamp", easing: Easing.bezier(0.3, 0.1, 0.2, 1) });
  const [ox, oy] = shot.wipeOrigin ?? [0.5, 0.5];
  const mask = index > 0 && wipe < 1 ? blotMask(wipe, ox, oy, W, H, 11 + index * 5) : undefined;
  // dark ink rim right behind the opening edge
  const rim = index > 0 && wipe < 1 ? blotMask(Math.min(1, wipe * 1.12 + 0.02), ox, oy, W, H, 11 + index * 5) : undefined;
  const style: React.CSSProperties = {
    position: "absolute",
    left: 0,
    top: 0,
    width: shot.w,
    height: shot.h,
    transformOrigin: "0 0",
    transform: `translate(${tx + bx}px, ${ty + by}px) scale(${s})`,
    filter: "saturate(0.78) contrast(1.05) brightness(0.97) hue-rotate(-4deg)",
  };
  return (
    <>
      {rim && <AbsoluteFill style={{ background: INK, maskImage: rim, WebkitMaskImage: rim }} />}
      <AbsoluteFill style={{ maskImage: mask, WebkitMaskImage: mask, overflow: "hidden" }}>
        {shot.kind === "video" ? (
          <OffthreadVideo src={staticFile(shot.src)} muted startFrom={Math.round((shot.videoStart ?? 0) * fps)} style={style} />
        ) : (
          <Img src={staticFile(shot.src)} style={style} />
        )}
      </AbsoluteFill>
    </>
  );
};

const Grade: React.FC = () => (
  <>
    <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(20,28,26,0.28) 0%, rgba(0,0,0,0) 25%, rgba(0,0,0,0) 55%, rgba(8,10,10,0.72) 100%)" }} />
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 60%, rgba(0,0,0,0.35) 100%)" }} />
  </>
);

const Subtitle: React.FC<{ line: LineSpec }> = ({ line }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const words = line.text.split(" ");
  const total = words.reduce((a, w) => a + w.length + 1, 0);
  const keys = (line.key ?? "").toLowerCase().split(" ").filter(Boolean);
  const out = interpolate(frame, [(line.dur + 0.25) * fps, (line.dur + 0.5) * fps], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const color = line.who === "M" ? JADE : OCHRE;
  let acc = 0;
  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 290, opacity: out }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 22, opacity: interpolate(frame, [0, 8], [0, 1], { extrapolateRight: "clamp" }) }}>
        <div style={{ width: 16, height: 16, borderRadius: 8, background: color }} />
        <div style={{ fontFamily: SANS, fontWeight: 500, fontSize: 30, letterSpacing: 6, color: "rgba(255,255,255,0.85)" }}>
          {line.who === "M" ? "MAÎTRESSE" : "ÉLÈVE"}
        </div>
      </div>
      <div style={{ width: 940, textAlign: "center", fontFamily: SANS, fontWeight: 500, fontSize: 64, lineHeight: 1.2, color: "#fff", textShadow: "0 2px 18px rgba(0,0,0,0.55)" }}>
        {words.map((w, i) => {
          const at = (acc / total) * line.dur * fps;
          acc += w.length + 1;
          const o = interpolate(frame, [at - 2, at + 5], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          const clean = w.toLowerCase().replace(/[.,:;!?…']/g, "");
          const isKey = keys.some((k) => clean.includes(k));
          return (
            <span key={i} style={{ display: "inline-block", opacity: o, color: isKey ? OCHRE : "#fff", marginRight: 16, fontWeight: isKey ? 600 : 500 }}>
              {w}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// Signature device: brush ensō + a field-note tag that writes itself.
const FieldTag: React.FC<{ tag: NonNullable<SceneProps["fieldTag"]>; len: number }> = ({ tag, len }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const draw = interpolate(frame, [0, 1.3 * fps], [0, 1], { extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) });
  const fade = interpolate(frame, [len - 0.4 * fps, len], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const tagIn = interpolate(frame, [0.8 * fps, 1.4 * fps], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });
  const C = 2 * Math.PI * 330;
  return (
    <AbsoluteFill style={{ opacity: fade }}>
      <svg width={1080} height={1920} style={{ position: "absolute" }}>
        <defs>
          <filter id="brush">
            <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="2" seed="4" />
            <feDisplacementMap in="SourceGraphic" scale="14" />
          </filter>
        </defs>
        <circle
          cx={540}
          cy={760}
          r={330}
          fill="none"
          stroke="rgba(255,255,255,0.92)"
          strokeWidth={26}
          strokeLinecap="round"
          strokeDasharray={`${C * 0.93 * draw} ${C}`}
          transform="rotate(-70 540 760)"
          filter="url(#brush)"
        />
      </svg>
      <div
        style={{
          position: "absolute",
          left: 90,
          top: 150,
          padding: "22px 30px",
          background: "rgba(245,240,228,0.94)",
          borderLeft: `8px solid ${OCHRE}`,
          opacity: tagIn,
          transform: `translateY(${(1 - tagIn) * 20}px) rotate(-1.5deg)`,
          boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: 22 }}>
          <span style={{ fontFamily: BRUSH, fontSize: 84, color: INK, lineHeight: 1 }}>{tag.hanzi}</span>
          <span style={{ fontFamily: SANS, fontSize: 40, fontWeight: 500, color: INK }}>{tag.pinyin}</span>
        </div>
        <div style={{ fontFamily: FRAUNCES, fontStyle: "italic", fontSize: 34, color: "#444", marginTop: 6 }}>{tag.latin}</div>
      </div>
    </AbsoluteFill>
  );
};

const Footnote: React.FC<{ text: string }> = ({ text }) => {
  const frame = useCurrentFrame();
  return (
    <div style={{ position: "absolute", left: 80, right: 80, top: 110, textAlign: "center", fontFamily: SANS, fontSize: 28, color: "rgba(255,255,255,0.85)", opacity: interpolate(frame, [0, 12], [0, 1], { extrapolateRight: "clamp" }) }}>
      {text}
    </div>
  );
};

export const Scene: React.FC<SceneProps> = (props) => {
  const { fps } = useVideoConfig();
  const f = (s: number) => Math.round(s * fps);
  return (
    <AbsoluteFill style={{ background: INK }}>
      {props.shots.map((s, i) => (
        <Sequence key={i} from={f(s.start)} durationInFrames={f(s.end - s.start)} layout="none">
          <Shot shot={s} index={i} />
        </Sequence>
      ))}
      <Grade />
      {props.fieldTag && (
        <Sequence from={f(props.fieldTag.start)} durationInFrames={f(props.fieldTag.end - props.fieldTag.start)}>
          <FieldTag tag={props.fieldTag} len={f(props.fieldTag.end - props.fieldTag.start)} />
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
            interpolate(fr, [0, f(1), f(props.duration - 1.5), f(props.duration)], [0, props.music!.volume, props.music!.volume, 0], {
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
