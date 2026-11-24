// Calebasse — Baies de goji premium, « le socle » (10 s). Reference grammar: the product on a plaster plinth
// under an open summer sky with moving foliage shadows, a macro beat, then a hand presenting the product.
import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { Cut, Grain, H, SANS, Vignette, W, clamp, inOut, mix, out3, out5, prog, rng, settle } from "./kit";

const RED = "#C8341F";
const FOREST = "#0D3B2E";
const BAG = "img/bag_goji.png";
const GOJI = [19, 20, 21, 22, 23, 24, 25, 16, 13, 12];

const Sky: React.FC<{ f: number; y?: number; scale?: number; blur?: number }> = ({ f, y = 0, scale = 1.12, blur = 0 }) => (
  <Img src={staticFile("img/sky.jpg")} style={{ position: "absolute", left: -60, top: -120 + y, width: W + 120, height: H + 240, objectFit: "cover",
    transform: `scale(${scale}) translateX(${mix(0, -40, f / 300)}px)`, filter: blur ? `blur(${blur}px)` : undefined }} />
);

/** Plaster plinth seen slightly from above: top face + front face (real stucco texture), moving leaf shadows. */
const Plinth: React.FC<{ f: number; top: number; w: number; children?: React.ReactNode; shade?: number }> = ({ f, top, w, children, shade = 0.5 }) => {
  const x0 = 540 - w / 2;
  const depth = 70;
  const sh = Math.sin(f * 0.05) * 18;
  return (
    <>
      <div style={{ position: "absolute", left: x0 + 18, top: top - depth, width: w - 36, height: depth + 4, background: "linear-gradient(180deg, #F3EEE6, #E4DDD1)", clipPath: `polygon(3% 0, 97% 0, 100% 100%, 0 100%)` }} />
      <div style={{ position: "absolute", left: x0, top, width: w, height: H - top + 40, overflow: "hidden", background: "#E9E3D9" }}>
        <Img src={staticFile("img/plinth_face_smooth.jpg")} style={{ position: "absolute", left: -60, top: -40, width: w + 120 }} />
        <Img src={staticFile("img/leaf_shadows.png")} style={{ position: "absolute", left: -200 + sh, top: -260 + sh * 0.4, width: w + 500, opacity: shade, filter: "blur(3px)" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, rgba(0,0,0,0.12), rgba(0,0,0,0) 30%, rgba(255,255,255,0.08) 70%, rgba(0,0,0,0.1))" }} />
      </div>
      {children}
    </>
  );
};

const Berries: React.FC<{ y: number; spread: number; seed: number; count: number; size: number }> = ({ y, spread, seed, count, size }) => {
  const r = rng(seed);
  return (
    <>
      {Array.from({ length: count }, (_, i) => {
        const side = i % 2 ? 1 : -1;
        const x = 540 + side * (150 + r() * spread);
        const yy = y - 30 + r() * 44;
        return <Img key={i} src={staticFile(`img/p_goji_${GOJI[i % GOJI.length]}.png`)} style={{ position: "absolute", left: x - size / 2, top: yy - size / 2, width: size * (0.8 + r() * 0.4), transform: `rotate(${r() * 360}deg)`, filter: "drop-shadow(0 6px 4px rgba(0,0,0,0.25))" }} />;
      })}
    </>
  );
};

export const Scene: React.FC = () => {
  const f = useCurrentFrame();
  const S1 = f < 112, S2 = f >= 112 && f < 192, S3 = f >= 192 && f < 262, S4 = f >= 262;
  return (
    <AbsoluteFill style={{ background: "#7FB3E2" }}>
      {S1 && (() => {
        const push = inOut(prog(f, 0, 112));
        const land = settle(f - 6, 0.25, 0.16);
        return (
          <div style={{ position: "absolute", inset: 0, transform: `scale(${mix(1.0, 1.07, push)})`, transformOrigin: "50% 62%" }}>
            <Sky f={f} y={mix(0, -60, push)} />
            <Plinth f={f} top={1270} w={820}>
              <div style={{ position: "absolute", left: 540 - 190, width: 380, top: 1250, height: 40, borderRadius: "50%", background: "radial-gradient(closest-side, rgba(40,30,20,0.4), rgba(40,30,20,0))" }} />
              <Cut src={BAG} x={540} y={1264 - (1 - land) * 60} w={280} shadow="0 18px 18px rgba(40,30,20,0.25)" />
              <div style={{ position: "absolute", left: 540 - 140, top: 1264 - (1 - land) * 60 - 280 * (701 / 267), width: 280, height: 280 * (701 / 267), overflow: "hidden",
                WebkitMaskImage: `url(${staticFile(BAG)})`, maskImage: `url(${staticFile(BAG)})`, WebkitMaskSize: "100% 100%", maskSize: "100% 100%" }}>
                <Img src={staticFile("img/leaf_shadows.png")} style={{ position: "absolute", left: -380 + Math.sin(f * 0.05) * 18, top: -300, width: 1100, opacity: 0.5, filter: "blur(3px)" }} />
              </div>
              <Berries y={1246} spread={200} seed={4} count={9} size={40} />
            </Plinth>
            <div style={{ position: "absolute", left: 0, right: 0, top: 200, textAlign: "center", fontFamily: SANS, color: "#FFFFFF", opacity: out3(prog(f, 24, 44)) * (1 - out3(prog(f, 100, 112))), textShadow: "0 6px 30px rgba(20,60,100,0.45)" }}>
              <div style={{ fontWeight: 300, fontSize: 40, letterSpacing: "0.16em", textTransform: "uppercase" }}>Ningxia 37°N</div>
              <div style={{ fontWeight: 700, fontSize: 92, letterSpacing: "-0.03em", lineHeight: 1.02, marginTop: 8 }}>Le berceau<br />du goji</div>
            </div>
          </div>
        );
      })()}
      {S2 && (() => {
        const l = f - 112;
        return (
          <>
            <Img src={staticFile("img/goji_macro.jpg")} style={{ position: "absolute", left: -500, top: -100, width: 2300, height: H + 200, objectFit: "cover", objectPosition: "82% 40%", transform: `scale(${mix(1.0, 1.12, l / 80)}) rotate(${mix(-3, 2, l / 80)}deg)`, transformOrigin: "60% 50%" }} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(255,255,255,0) 50%, rgba(255,248,240,0.85) 100%)" }} />
            <div style={{ position: "absolute", left: 80, right: 80, top: 1360, fontFamily: SANS, color: RED }}>
              <div style={{ fontWeight: 300, fontSize: 38, letterSpacing: "0.16em", textTransform: "uppercase", opacity: out3(prog(l, 6, 22)) }}>Classe premium</div>
              <div style={{ fontWeight: 800, fontSize: 104, letterSpacing: "-0.04em", lineHeight: 1, opacity: out5(prog(l, 10, 30)), transform: `translateY(${(1 - out5(prog(l, 10, 30))) * 40}px)` }}>Première récolte</div>
            </div>
          </>
        );
      })()}
      {S3 && (() => {
        const l = f - 192;
        const slide = out5(prog(l, 0, 26));
        const lift = Math.sin(clamp((l - 30) / 30) * Math.PI) * 18;
        const hx = mix(-1100, -310, slide);
        const hy = 1240 - lift;
        const handW = 1320;
        const palmX = hx + 0.75 * handW;
        const palmY = hy + 100 * (handW / 4299);
        return (
          <>
            <Sky f={f + 120} y={-140} scale={1.2} blur={1.5} />
            <div style={{ position: "absolute", left: palmX - 150, width: 300, top: palmY - 16, height: 34, borderRadius: "50%", background: "radial-gradient(closest-side, rgba(60,40,30,0.35), rgba(60,40,30,0))" }} />
            <Img src={staticFile("img/hand.png")} style={{ position: "absolute", left: hx, top: hy, width: handW }} />
            <Cut src={BAG} x={palmX} y={palmY + 10} w={290} rot={mix(-6, 2, slide)} shadow="0 14px 14px rgba(40,30,20,0.25)" />
            <div style={{ position: "absolute", left: 0, right: 0, top: 300, textAlign: "center", fontFamily: SANS, color: "#FFFFFF", opacity: out3(prog(l, 18, 34)), textShadow: "0 6px 30px rgba(20,60,100,0.45)" }}>
              <div style={{ fontWeight: 700, fontSize: 84, letterSpacing: "-0.03em", lineHeight: 1.04 }}>Du soleil,<br />à portée de main.</div>
            </div>
          </>
        );
      })()}
      {S4 && (() => {
        const l = f - 262;
        const t = out3(prog(l, 4, 20));
        return (
          <>
            <Sky f={f} y={-60} blur={3} />
            <Plinth f={f} top={1040} w={900} shade={0.18}>
              <Cut src={BAG} x={540} y={1034} w={300} shadow="0 18px 18px rgba(40,30,20,0.25)" />
              <Berries y={1018} spread={250} seed={9} count={10} size={42} />
              <div style={{ position: "absolute", left: 0, right: 0, top: 1170, textAlign: "center", fontFamily: SANS, opacity: t, transform: `translateY(${(1 - t) * 20}px)` }}>
                <Img src={staticFile("brand/logo_color.svg")} style={{ height: 58 }} />
                <div style={{ fontWeight: 700, fontSize: 62, color: FOREST, letterSpacing: "-0.02em", marginTop: 26 }}>Baies de goji premium</div>
                <div style={{ fontWeight: 500, fontSize: 30, color: RED, marginTop: 8, letterSpacing: "0.06em" }}>Première récolte · Ningxia</div>
                <div style={{ fontWeight: 600, fontSize: 30, color: FOREST, marginTop: 22 }}>calebasse.com</div>
              </div>
            </Plinth>
          </>
        );
      })()}
      <Vignette strength={0.25} color="20,40,60" />
      <Grain f={f} id="gj" opacity={0.05} />
    </AbsoluteFill>
  );
};
