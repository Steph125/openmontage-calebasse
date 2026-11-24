// Calebasse ads — engine mechanics kit (copied into each project; NO creative components here).
// Fonts bundled locally, pure helpers, deterministic randomness, generic film treatments.
import React from "react";
import { AbsoluteFill, Img, cancelRender, continueRender, delayRender, staticFile } from "remotion";

export const W = 1080;
export const H = 1920;
export const FPS = 30;

// ------------------------------------------------------------------ fonts (no network at render)
export const SANS = "PoppinsCB";
export const BRUSH = "MaShanZhengCB";
let requested = false;
const loadFonts = () => {
  if (requested || typeof FontFace === "undefined") return;
  requested = true;
  queueMicrotask(() => {
    const faces: [string, string, string][] = [
      ...["300", "400", "500", "600", "700", "800"].map((w) => [SANS, `fonts/Poppins-${w}.woff2`, w] as [string, string, string]),
      [BRUSH, "fonts/MaShanZheng-subset.woff2", "400"],
    ];
    for (const [family, file, weight] of faces) {
      const handle = delayRender(`font ${family} ${weight}`);
      const face = new FontFace(family, `url(${staticFile(file)}) format('woff2')`, { weight, style: "normal" });
      face
        .load()
        .then(() => {
          document.fonts.add(face);
          continueRender(handle);
        })
        .catch((e) => cancelRender(new Error(`font ${family} ${weight}: ${e}`)));
    }
  });
};
loadFonts();

// ------------------------------------------------------------------ math & easing
export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const mix = (a: number, b: number, t: number) => a + (b - a) * t;
export const prog = (f: number, a: number, b: number) => clamp((f - a) / (b - a));
export const inOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const out3 = (t: number) => 1 - Math.pow(1 - t, 3);
export const out5 = (t: number) => 1 - Math.pow(1 - t, 5);
export const in2 = (t: number) => t * t;
export const outExpo = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));
export const inOutSine = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2;
export const backOut = (t: number, k = 1.7) => 1 + (k + 1) * Math.pow(t - 1, 3) + k * Math.pow(t - 1, 2);
/** Damped spring settle 0→1 with overshoot, t in frames since start. */
export const settle = (t: number, freq = 0.28, damp = 0.16) => (t <= 0 ? 0 : 1 - Math.exp(-damp * t) * Math.cos(freq * t));
/** Seeded PRNG (mulberry32) — never Math.random in a frame function. */
export const rng = (seed: number) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};
/** Frame-local time inside a [start, end) window: null outside. */
export const local = (f: number, start: number, end: number) => (f >= start && f < end ? f - start : null);

// ------------------------------------------------------------------ generic treatments
export const Full: React.FC<{ children?: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <AbsoluteFill style={{ overflow: "hidden", ...style }}>{children}</AbsoluteFill>
);

/** Static-seeded animated film grain (changes every 2 frames, deterministic). */
export const Grain: React.FC<{ f: number; opacity?: number; id: string }> = ({ f, opacity = 0.06, id }) => (
  <svg width={W} height={H} style={{ position: "absolute", inset: 0, mixBlendMode: "overlay", opacity, pointerEvents: "none" }}>
    <filter id={`gr-${id}`}>
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={Math.floor(f / 2) % 97} stitchTiles="stitch" />
      <feColorMatrix type="saturate" values="0" />
    </filter>
    <rect width={W} height={H} filter={`url(#gr-${id})`} />
  </svg>
);

export const Vignette: React.FC<{ strength?: number; color?: string }> = ({ strength = 0.45, color = "0,0,0" }) => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      pointerEvents: "none",
      background: `radial-gradient(120% 85% at 50% 45%, rgba(${color},0) 55%, rgba(${color},${strength}) 100%)`,
    }}
  />
);

/** Diagonal light sweep across a box, t 0→1. */
export const Sweep: React.FC<{ t: number; width?: number; opacity?: number; angle?: number }> = ({ t, width = 18, opacity = 0.35, angle = 115 }) =>
  t <= 0 || t >= 1 ? null : (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        mixBlendMode: "screen",
        background: `linear-gradient(${angle}deg, rgba(255,255,255,0) ${mix(-30, 130, t) - width}%, rgba(255,255,255,${opacity}) ${mix(-30, 130, t)}%, rgba(255,255,255,0) ${mix(-30, 130, t) + width}%)`,
      }}
    />
  );

/** A cut-out image placed by its bottom-centre (x, y) — the natural anchor for products standing on a surface. */
export const Cut: React.FC<{
  src: string; x: number; y: number; w: number; rot?: number; scale?: number; blur?: number; opacity?: number;
  shadow?: string; style?: React.CSSProperties; anchor?: "bottom" | "center";
}> = ({ src, x, y, w, rot = 0, scale = 1, blur = 0, opacity = 1, shadow, style, anchor = "bottom" }) => (
  <Img
    src={staticFile(src)}
    style={{
      position: "absolute",
      left: x - w / 2,
      top: anchor === "bottom" ? undefined : y,
      bottom: anchor === "bottom" ? H - y : undefined,
      width: w,
      transform: `${anchor === "center" ? "translateY(-50%) " : ""}rotate(${rot}deg) scale(${scale})`,
      transformOrigin: anchor === "bottom" ? "50% 100%" : "50% 50%",
      filter: [blur > 0.05 ? `blur(${blur}px)` : "", shadow ? `drop-shadow(${shadow})` : ""].filter(Boolean).join(" ") || undefined,
      opacity,
      ...style,
    }}
  />
);

/** Mirror reflection of a cut-out standing at (x, y): flipped, faded, slightly blurred. */
export const Reflect: React.FC<{ src: string; x: number; y: number; w: number; strength?: number; blur?: number; rot?: number }> = ({ src, x, y, w, strength = 0.28, blur = 2.5, rot = 0 }) => (
  <div style={{ position: "absolute", left: x - w / 2, top: y, width: w, transform: `rotate(${-rot}deg)`, transformOrigin: "50% 0%" }}>
    <Img
      src={staticFile(src)}
      style={{
        width: w,
        transform: "scaleY(-1)",
        opacity: strength,
        filter: `blur(${blur}px)`,
        WebkitMaskImage: "linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 55%)",
        maskImage: "linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 55%)",
      }}
    />
  </div>
);

/** Full-bleed photo with a Ken-Burns-free "camera" (scale + translate + rotate) — used for macro plates. */
export const Plate: React.FC<{ src: string; scale?: number; x?: number; y?: number; rot?: number; blur?: number; filter?: string; fit?: "cover" | "contain" }> = ({ src, scale = 1, x = 0, y = 0, rot = 0, blur = 0, filter, fit = "cover" }) => (
  <Img
    src={staticFile(src)}
    style={{
      position: "absolute",
      inset: 0,
      width: W,
      height: H,
      objectFit: fit,
      transform: `translate(${x}px, ${y}px) scale(${scale}) rotate(${rot}deg)`,
      filter: [blur > 0.05 ? `blur(${blur}px)` : "", filter || ""].filter(Boolean).join(" ") || undefined,
    }}
  />
);

/** Vertical colour curtains (staggered stripes) — a wipe between worlds; t 0→1 covers, 1→2 uncovers. */
export const Curtains: React.FC<{ t: number; colors: string[]; dir?: 1 | -1 }> = ({ t, colors, dir = 1 }) => {
  if (t <= 0 || t >= 2) return null;
  const n = colors.length;
  return (
    <>
      {colors.map((c, i) => {
        const k = dir === 1 ? i : n - 1 - i;
        const delay = k * 0.1;
        const tin = out3(clamp((t - delay) / (1 - 0.1 * (n - 1))));
        const tout = out3(clamp((t - 1 - delay) / (1 - 0.1 * (n - 1))));
        const top = mix(H, 0, tin) - mix(0, H, tout);
        return <div key={i} style={{ position: "absolute", left: (i * W) / n, width: W / n + 1, top, height: H, background: c }} />;
      })}
    </>
  );
};
