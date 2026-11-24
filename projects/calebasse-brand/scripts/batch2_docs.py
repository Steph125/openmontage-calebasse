"""Write art-direction.md + scenes.md for the 6 batch-2 projects."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3] / "projects"
COMMON = """
## Honesty rules (binding)
- Product names, origin, preparation and sensations only — no health claim (the product-page descriptions contain claims: never on screen).
- Real Calebasse photos (Cloudinary URLs as served by the site); decor footage from Pexels (free commercial licence, credits in `assets/source/pexels_credits.json`).
- Muet (user decision). Poppins + Ma Shan Zheng subset bundled in `public/fonts`.
"""
DOCS = {
    "calebasse-fleurs-gamme": ("Fleurs à infuser — la gamme (20 s, 600 f)", "https://pin.it/2iRiCFRDL",
        "A range film: four flowers, four colour worlds, the same kraft bag — joyful and generous, never shouty.",
        "Rose magenta `#E2427F→#6E0D37` · Osmanthus gold `#F4B43A→#9A5506` · Camomille citron `#F6E486→#A88A1C` · Jasmin jade `#3EA47F→#0B4433` · finale forest `#0D3B2E`.",
        "A cream seal with the flower's Chinese name brushed vertically (玫瑰花 / 桂花 / 杭菊花 / 茉莉花), and staggered colour curtains between worlds.",
        [("0–18", "colour curtains open on the rose macro"), ("18–130", "Rose: macro + kinetic word → bag hero, real buds bursting, seal, name"),
         ("130–242", "Osmanthus: fresh-flower macro → bag, drawn golden florets"), ("242–354", "Camomille: macro → bag, drawn pompons"),
         ("354–466", "Jasmin: sambac macro → bag, real jasmine blooms + petals"), ("466–600", "Finale on forest: four arches, four bags, « Nos fleurs à infuser », logo, calebasse.com")]),
    "calebasse-3-gestes": ("De la plante au flacon — trois choses comptent (24 s, 720 f)", "https://pin.it/4XmSh6mGp",
        "A calm brand statement: grey gridded paper; the magnifier is the only place where the plant is in colour — truth seen up close.",
        "Paper `#F2F0E9`, ink `#1C2622`, forest `#0D3B2E`, lime `#C9EC7A` (end card only).",
        "The colour-revealing magnifier (grey page, colour lens, 1.5× zoom).",
        [("0–112", "« Une plante, trois exigences. » — lens sweeps the line, astragale slices bottom-left"), ("112–200", "« 3 choses comptent » blur→sharp"),
         ("200–330", "01 La source — choisir les terroirs d'origine (roots in the lens)"), ("330–460", "02 Le geste — respecter les préparations traditionnelles (decoction in the lens)"),
         ("460–600", "03 Le contrôle — identifier, contrôler et tracer (balance settles)"), ("600–720", "forest wipe → logo, « De la plante au flacon. », Fabriqué en France, astragale bag")]),
    "calebasse-baume-rouge": ("Baume Panacé Rouge — texture (12 s, 360 f)", "https://pin.it/1GukzHSpw",
        "One hue, warm and tactile: amber-cinnamon (the real colour of the balm), fast 1.5–2 s cuts.",
        "Amber `#D49A5C`, light `#F2CB93`, deep `#8E4F22`, cinnamon `#5E2C12`, cream `#FFF4E6`.",
        "A procedural balm relief (SVG lighting on displaced noise) — crisp at any scale, used as the world the tin lives in.",
        [("0–54", "ultra-close balm waves"), ("54–112", "tin levitating over its reflection, light sweep"), ("112–162", "real macro: finger in the balm"),
         ("162–218", "open tin + wooden spatula lifting a dollop"), ("218–272", "ingredients from the label (cinnamon, clove, cajeput…)"),
         ("272–312", "at home (tin on the table)"), ("312–360", "tin laid on its texture + name, « Chaleur & réconfort », calebasse.com")]),
    "calebasse-ginseng-allee": ("Racine de ginseng — l'allée (13 s, 390 f)", "https://pin.it/59sJWLdvp",
        "Hushed and noble: an endless sage corridor of identical jars; light at the end; the king arrives in focus.",
        "Sage gradient `#355446→#A9C2AE→#1E3428`, ivory text `#F4F7F1`.",
        "Hand-projected 3D corridor (perspective, depth-of-field blur, atmospheric haze, floor reflections) + real smoke footage.",
        [("0–232", "continuous dolly through the corridor, focus travelling"), ("232–262", "arrival, hero sharp, light sweep"),
         ("262–318", "low push on the hero, 人参 brushed"), ("318–352", "slices macro"), ("352–390", "hero + « Le roi des herbes » (traditional nickname), logo")]),
    "calebasse-goji-socle": ("Baies de goji premium — le socle (10 s, 300 f)", "https://pin.it/3cn23RezE",
        "Sunny and simple: summer sky, plaster plinth, moving foliage shadows, a hand presenting the bag.",
        "Sky blue, plaster `#ECE7DE`, goji red `#C8341F`, forest `#0D3B2E`.",
        "Real foliage shadows extracted from a photo, confined to the plinth and the bag (alpha-masked).",
        [("0–112", "bag on the plinth under the sky — « Ningxia 37°N · Le berceau du goji »"), ("112–192", "berries macro — « Classe premium · Première récolte »"),
         ("192–262", "a hand presents the bag — « Du soleil, à portée de main. »"), ("262–300", "end card on the plinth face")]),
    "calebasse-perle-source": ("Poudre de perle — la source (16 s, 480 f)", "https://pin.it/11ASPTq0T",
        "Serene and mineral: water is the origin of the product (freshwater pearls).",
        "Stone beige `#E9E4DA`, deep sage `#24332B`, forest `#0D3B2E`, mist `#DCE7E0`.",
        "A drawn iridescent pearl that travels through the film; water beads masked to the jar.",
        [("0–96", "sunlit still life, a pearl rolls in — « La perle entière et rien d'autre. »"), ("96–196", "levitation beaded with water — « Perles d'eau douce finement broyées »"),
         ("196–286", "real water column + splash"), ("286–410", "the jar on a mossy rock in water — « Née de l'eau douce. 0 additif, 0 excipient. »"),
         ("410–480", "forest card: Poudre de perle · Zhen zhu fen · 珍珠粉, calebasse.com")]),
}
for pid, (title, ref, read, pal, sig, beats) in DOCS.items():
    d = ROOT / pid
    (d / "art-direction.md").write_text(
        f"# Art direction — Calebasse · {title}\nReference: {ref} (analysed keyframes in `reference/`).\n\n**Design read.** {read}\n\n**Palette.** {pal}\n\n**Signature device.** {sig}\n" + COMMON,
        encoding="utf-8")
    rows = "\n".join(f"| {a} | {b} |" for a, b in beats)
    (d / "scenes.md").write_text(f"# Beats — {title}\n30 fps · 1080×1920 · Remotion atelier (`Scene.tsx`).\n\n| frames | beat |\n|---|---|\n{rows}\n", encoding="utf-8")
    print("docs", pid)
