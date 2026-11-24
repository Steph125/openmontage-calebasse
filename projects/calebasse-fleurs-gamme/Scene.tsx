// Calebasse — « Nos fleurs à infuser » (20 s). Reference grammar: one colour world per variant,
// macro + kinetic name, product hero with ingredients bursting around it, range line-up finale.
import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { BRUSH, Curtains, Cut, Grain, H, Plate, SANS, Vignette, W, backOut, clamp, inOut, mix, out3, out5, prog, rng, settle } from "./kit";

type Flower = {
  key: "rose" | "osmanthus" | "camomille" | "jasmin";
  word: string; title: string; pinyin: string; zh: string;
  bag: string; ratio: number; macro: string;
  c1: string; c2: string; soft: string; ink: string; tones: string[];
};
const FLOWERS: Flower[] = [
  { key: "rose", word: "Rose", title: "Boutons de rose", pinyin: "Mei gui hua", zh: "玫瑰花", bag: "img/bag_rose.png", ratio: 2442 / 915, macro: "img/macro_rose_hd.jpg",
    c1: "#E2427F", c2: "#6E0D37", soft: "#FFD6E4", ink: "#FFFFFF", tones: ["#F06A9B", "#D63672", "#B01E58", "#86113F"] },
  { key: "osmanthus", word: "Osmanthus", title: "Osmanthus", pinyin: "Gui hua", zh: "桂花", bag: "img/bag_osmanthus.png", ratio: 702 / 295, macro: "img/macro_osmanthus_hd.jpg",
    c1: "#F4B43A", c2: "#9A5506", soft: "#FFF0C9", ink: "#FFFFFF", tones: ["#FFD06A", "#F2AE2E", "#DB8E12", "#B06A06"] },
  { key: "camomille", word: "Camomille", title: "Camomille chinoise", pinyin: "Ju hua", zh: "杭菊花", bag: "img/bag_camomille.png", ratio: 2442 / 914, macro: "img/macro_camomille_hd.jpg",
    c1: "#F6E486", c2: "#A88A1C", soft: "#FFFBE6", ink: "#0D3B2E", tones: ["#FFF3B0", "#F3DD72", "#E2C64B", "#C9A92A"] },
  { key: "jasmin", word: "Jasmin", title: "Fleurs de jasmin", pinyin: "Mo li hua", zh: "茉莉花", bag: "img/bag_jasmin.png", ratio: 2441 / 914, macro: "img/macro_jasmin_hd.jpg",
    c1: "#3EA47F", c2: "#0B4433", soft: "#DDF3EA", ink: "#FFFFFF", tones: ["#6CC4A0", "#3EA47F", "#22805F", "#0F5A43"] },
];
const SEG0 = 18;
const SEG = 112;
const FIN = SEG0 + SEG * 4; // 466
const FOREST = ["#1B6A52", "#13503D", "#0D3B2E", "#0A2C22"];
const ROSE_SPRITES = [5, 6, 7, 8, 9, 12, 15, 17, 18, 0, 1, 10];

// ------------------------------------------------------------------ procedural florets (tiny flowers are crisper drawn than photographed)
const Osm: React.FC<{ s: number }> = ({ s }) => (
  <svg width={s} height={s} viewBox="-50 -50 100 100" style={{ overflow: "visible" }}>
    <defs>
      <radialGradient id="osmG" cx="0" cy="0" r="50" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#FFE29A" />
        <stop offset="0.6" stopColor="#F7B23B" />
        <stop offset="1" stopColor="#D9820F" />
      </radialGradient>
    </defs>
    {[0, 90, 180, 270].map((a) => (
      <ellipse key={a} cx="0" cy="-22" rx="17" ry="25" fill="url(#osmG)" transform={`rotate(${a + 45})`} />
    ))}
    <circle r="8" fill="#C46A08" />
  </svg>
);
const Pompon: React.FC<{ s: number; seed: number }> = ({ s, seed }) => {
  const r = rng(seed);
  return (
    <svg width={s} height={s} viewBox="-50 -50 100 100" style={{ overflow: "visible" }}>
      {Array.from({ length: 22 }, (_, i) => (
        <ellipse key={`o${i}`} cx="0" cy="-30" rx="6.5" ry="17" fill={i % 3 ? "#FFF8E2" : "#F7EBC0"} transform={`rotate(${(i * 360) / 22 + r() * 6})`} />
      ))}
      {Array.from({ length: 14 }, (_, i) => (
        <ellipse key={`i${i}`} cx="0" cy="-17" rx="5" ry="11" fill={i % 2 ? "#F9E9A6" : "#F2DA7A"} transform={`rotate(${(i * 360) / 14 + 12})`} />
      ))}
      <circle r="11" fill="#E8BE3C" />
      <circle r="6" fill="#D6A21F" />
    </svg>
  );
};
const Petal: React.FC<{ s: number }> = ({ s }) => (
  <svg width={s} height={s} viewBox="-50 -50 100 100">
    <path d="M0 -46 C 26 -30 26 22 0 46 C -26 22 -26 -30 0 -46 Z" fill="#FFFFFF" opacity="0.95" />
    <path d="M0 -40 C 10 -20 10 20 0 40" stroke="#E7EFE9" strokeWidth="3" fill="none" />
  </svg>
);

type Part = { a: number; R: number; z: number; size: number; rot0: number; spin: number; drift: number; sprite: number; delay: number };
const makeParts = (seed: number, n: number): Part[] => {
  const r = rng(seed);
  return Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2 + (r() - 0.5) * 0.6;
    return { a, R: 300 + r() * 520, z: r(), size: r(), rot0: r() * 360, spin: (r() - 0.5) * 3.2, drift: 0.6 + r() * 1.2, sprite: Math.floor(r() * 1000), delay: r() * 6 };
  });
};
const PARTS = FLOWERS.map((fl, i) => makeParts(101 + i * 17, fl.key === "osmanthus" ? 46 : fl.key === "jasmin" ? 22 : 30));

const Particle: React.FC<{ fl: Flower; p: Part; l: number; front: boolean }> = ({ fl, p, l, front }) => {
  const t = out5(prog(l, 48 + p.delay, 82 + p.delay));
  if (t <= 0) return null;
  const isFront = p.z > 0.82;
  if (isFront !== front) return null;
  const cx = 540;
  const cy = 860;
  const after = Math.max(0, l - 82);
  const dx = Math.cos(p.a) * p.R * t * (isFront ? 1.25 : 1) + Math.cos(p.a) * after * p.drift;
  const dy = Math.sin(p.a) * p.R * 0.92 * t + Math.sin(p.a) * after * p.drift * 0.8 + after * after * 0.004;
  const depth = isFront ? 1.1 + (p.z - 0.82) * 2.2 : 0.55 + p.z * 0.6;
  const base = fl.key === "osmanthus" ? 74 : fl.key === "camomille" ? 82 : fl.key === "jasmin" ? 170 : 150;
  const s = base * (0.6 + p.size * 0.8) * depth;
  const blur = isFront ? 2.5 + (p.z - 0.82) * 26 : (1 - p.z) * 1.2;
  const rot = p.rot0 + p.spin * l;
  const op = clamp(t * 3) * (isFront ? 0.92 : 1);
  let el: React.ReactNode;
  if (fl.key === "rose") el = <Img src={staticFile(`img/p_rose_${String(ROSE_SPRITES[p.sprite % ROSE_SPRITES.length]).padStart(2, "0")}.png`)} style={{ width: s }} />;
  else if (fl.key === "jasmin") el = p.sprite % 3 === 0 ? <Petal s={s * 0.45} /> : <Img src={staticFile("img/p_jasmin_00.png")} style={{ width: s }} />;
  else if (fl.key === "osmanthus") el = <Osm s={s} />;
  else el = <Pompon s={s} seed={p.sprite} />;
  return (
    <div style={{ position: "absolute", left: cx + dx, top: cy + dy, transform: `translate(-50%, -50%) rotate(${rot}deg)`, filter: blur > 0.2 ? `blur(${blur}px)` : undefined, opacity: op }}>
      {el}
    </div>
  );
};

// ------------------------------------------------------------------ one flower segment
const Macro: React.FC<{ fl: Flower; l: number }> = ({ fl, l }) => {
  const t = prog(l, 0, 50);
  const letters = fl.word.split("");
  const size = fl.word.length > 7 ? 168 : 230;
  return (
    <AbsoluteFill>
      <Plate src={fl.macro} scale={mix(1.3, 1.12, inOut(t))} rot={mix(2.5, 0, t)} x={mix(30, -20, t)} />
      <div style={{ position: "absolute", inset: 0, background: `linear-gradient(180deg, rgba(0,0,0,0) 40%, ${fl.c2}88 100%)` }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 820, display: "flex", justifyContent: "center", transform: "rotate(-6deg) skewX(-9deg)" }}>
        {letters.map((ch, i) => {
          const k = backOut(prog(l, 2 + i * 1.6, 14 + i * 1.6), 2.1);
          return (
            <span key={i} style={{ fontFamily: SANS, fontWeight: 800, fontSize: size, color: "#FFFFFF", letterSpacing: "-0.03em", display: "inline-block",
              transform: `translateY(${(1 - k) * 260}px) scale(${mix(0.6, 1, clamp(k))})`, opacity: clamp(k * 1.6), textShadow: `0 14px 50px ${fl.c2}AA` }}>
              {ch}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

const Hero: React.FC<{ fl: Flower; i: number; l: number }> = ({ fl, i, l }) => {
  const rise = settle(l - 42, 0.3, 0.17);
  const bagW = fl.key === "osmanthus" ? 380 : 362;
  const bagY = 1372 + (1 - rise) * 420;
  const bagRot = (1 - rise) * -9 + Math.sin(l * 0.06) * 0.8;
  const appear = prog(l, 42, 50);
  const seal = backOut(prog(l, 60, 74), 2.2);
  const cap = out3(prog(l, 64, 82));
  const logo = out3(prog(l, 48, 64));
  return (
    <AbsoluteFill style={{ opacity: appear }}>
      <div style={{ position: "absolute", inset: 0, background: `radial-gradient(85% 60% at 50% 46%, ${fl.c1} 0%, ${fl.tones[2]} 58%, ${fl.c2} 100%)` }} />
      <div style={{ position: "absolute", left: -200, right: -200, top: 560, textAlign: "center", transform: `rotate(-6deg) translateX(${mix(60, -60, prog(l, 42, 112))}px)`,
        fontFamily: SANS, fontWeight: 800, fontSize: fl.word.length > 7 ? 250 : 340, letterSpacing: "-0.04em", color: "rgba(255,255,255,0.13)", whiteSpace: "nowrap" }}>
        {fl.word.toUpperCase()}
      </div>
      {PARTS[i].map((p, k) => <Particle key={`b${k}`} fl={fl} p={p} l={l} front={false} />)}
      <div style={{ position: "absolute", left: 540 - 230, width: 460, top: bagY - 30, height: 70, borderRadius: "50%", background: "radial-gradient(closest-side, rgba(0,0,0,0.35), rgba(0,0,0,0))", opacity: rise }} />
      <Cut src={fl.bag} x={540} y={bagY} w={bagW} rot={bagRot} shadow="0 34px 46px rgba(0,0,0,0.28)" />
      {PARTS[i].map((p, k) => <Particle key={`f${k}`} fl={fl} p={p} l={l} front />)}
      <div style={{ position: "absolute", left: 862, top: 470, width: 118, padding: "16px 0", background: "#FFF6EC", borderRadius: 10, display: "flex", flexDirection: "column", alignItems: "center",
        transform: `rotate(-4deg) scale(${clamp(seal, 0, 1.3)})`, transformOrigin: "50% 0%", boxShadow: "0 12px 30px rgba(0,0,0,0.18)" }}>
        {fl.zh.split("").map((c, k) => (
          <span key={k} style={{ fontFamily: BRUSH, fontSize: 80, lineHeight: 1.02, color: fl.c2 }}>{c}</span>
        ))}
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 104, display: "flex", justifyContent: "center", opacity: logo }}>
        <Img src={staticFile(fl.ink === "#FFFFFF" ? "brand/logo_ivory.svg" : "brand/logo_color.svg")} style={{ height: 58 }} />
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 1430, textAlign: "center", fontFamily: SANS, opacity: cap, transform: `translateY(${(1 - cap) * 30}px)` }}>
        <div style={{ fontWeight: 700, fontSize: 60, color: fl.ink, letterSpacing: "-0.01em" }}>{fl.title}</div>
        <div style={{ fontWeight: 400, fontSize: 32, color: fl.ink === "#FFFFFF" ? fl.soft : fl.c2, marginTop: 6, letterSpacing: "0.12em", textTransform: "uppercase" }}>{fl.pinyin}</div>
      </div>
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ finale: the range
const Finale: React.FC<{ l: number }> = ({ l }) => {
  const xs = [165, 415, 665, 915];
  const title = out3(prog(l, 26, 46));
  const foot = out3(prog(l, 48, 70));
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(90% 70% at 50% 40%, #155A45 0%, #0D3B2E 60%, #082319 100%)" }} />
      {FLOWERS.map((fl, i) => {
        const up = settle(l - 4 - i * 5, 0.26, 0.16);
        const bag = settle(l - 14 - i * 5, 0.3, 0.17);
        const bw = fl.key === "osmanthus" ? 200 : 190;
        return (
          <React.Fragment key={fl.key}>
            <div style={{ position: "absolute", left: xs[i] - 112, width: 224, top: 640 + (1 - up) * 900, height: 660, borderRadius: "112px 112px 18px 18px",
              background: `linear-gradient(180deg, ${fl.tones[0]} 0%, ${fl.c1} 45%, ${fl.tones[3]} 100%)`, boxShadow: "inset 0 0 0 2px rgba(255,255,255,0.12)" }} />
            <div style={{ position: "absolute", left: xs[i] - 112, width: 224, top: 690 + (1 - up) * 900, textAlign: "center", fontFamily: BRUSH, fontSize: 58, color: "rgba(255,255,255,0.55)" }}>
              {fl.zh.slice(0, 2)}
            </div>
            <Cut src={fl.bag} x={xs[i]} y={1300 + (1 - bag) * 520} w={bw} shadow="0 22px 26px rgba(0,0,0,0.35)" />
            <div style={{ position: "absolute", left: xs[i] - 120, width: 240, top: 1322, textAlign: "center", fontFamily: SANS, fontWeight: 600, fontSize: 25, color: "#F7F5EE", opacity: foot }}>
              {fl.word}
            </div>
          </React.Fragment>
        );
      })}
      <div style={{ position: "absolute", left: 0, right: 0, top: 300, textAlign: "center", fontFamily: SANS, opacity: title, transform: `translateY(${(1 - title) * 30}px)` }}>
        <div style={{ fontWeight: 700, fontSize: 76, color: "#F7F5EE", letterSpacing: "-0.02em" }}>Nos fleurs à infuser</div>
        <div style={{ fontWeight: 400, fontSize: 30, color: "#C9EC7A", marginTop: 10, letterSpacing: "0.14em", textTransform: "uppercase" }}>Fleurs entières séchées</div>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 1410, display: "flex", flexDirection: "column", alignItems: "center", opacity: foot, transform: `translateY(${(1 - foot) * 24}px)` }}>
        <Img src={staticFile("brand/logo_ivory.svg")} style={{ height: 64 }} />
        <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: 30, color: "#C9EC7A", marginTop: 14 }}>calebasse.com</div>
      </div>
    </AbsoluteFill>
  );
};

export const Scene: React.FC = () => {
  const f = useCurrentFrame();
  const segIndex = Math.min(3, Math.floor((f - SEG0) / SEG));
  const l = f - SEG0 - Math.max(0, segIndex) * SEG;
  const fl = FLOWERS[Math.max(0, segIndex)];
  const inFinale = f >= FIN;
  // curtains: cover at the end of each segment, uncover at the start of the next one
  let curtain: React.ReactNode = null;
  if (f < SEG0 + 12) curtain = <Curtains t={1 + prog(f, 0, SEG0 + 12)} colors={FLOWERS[0].tones} />;
  else if (!inFinale && l >= 96) curtain = <Curtains t={prog(l, 96, 109)} colors={segIndex < 3 ? FLOWERS[segIndex + 1].tones : FOREST} />;
  else if (!inFinale && segIndex > 0 && l < 12) curtain = <Curtains t={1 + prog(l, 0, 12)} colors={fl.tones} />;
  else if (inFinale && f - FIN < 12) curtain = <Curtains t={1 + prog(f - FIN, 0, 12)} colors={FOREST} />;
  return (
    <AbsoluteFill style={{ background: "#0D3B2E" }}>
      {!inFinale && f >= 0 && (
        <>
          {l < 52 && <Macro fl={fl} l={Math.max(0, l)} />}
          {l >= 42 && <Hero fl={fl} i={segIndex} l={l} />}
        </>
      )}
      {inFinale && <Finale l={f - FIN} />}
      {curtain}
      <Vignette strength={0.28} />
      <Grain f={f} id="fl" opacity={0.05} />
    </AbsoluteFill>
  );
};
