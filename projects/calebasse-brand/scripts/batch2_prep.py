"""Asset prep for the 6 videos: crops, rembg cutouts (bg_remove tool), particle extraction."""
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

sys.stdout.reconfigure(encoding="utf-8")
ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT))
from tools.tool_registry import registry  # noqa: E402

registry.discover()
BG = registry._tools["bg_remove"]
P = ROOT / "projects"
TMP = Path(sys.argv[1]); TMP.mkdir(parents=True, exist_ok=True)
log = []


def src(pid, name):
    return P / pid / "assets" / "source" / name


def out(pid, name):
    d = P / pid / "public" / "img"; d.mkdir(parents=True, exist_ok=True)
    return d / name


def crop(path, box, to):
    im = Image.open(path).convert("RGB")
    im.crop(box).save(to, quality=95)
    return to


def cut(path, to, box=None, trim=True, model="isnet-general-use"):
    """rembg cutout (optionally of a crop) → trimmed RGBA PNG."""
    inp = path
    if box:
        inp = TMP / f"crop_{to.stem}.png"
        Image.open(path).convert("RGB").crop(box).save(inp)
    r = BG.execute({"input_path": str(inp), "output_path": str(to), "model": model})
    if not r.success:
        raise RuntimeError(f"bg_remove failed for {path}: {r.error}")
    im = Image.open(to).convert("RGBA")
    if trim:
        a = np.array(im)[:, :, 3]
        ys, xs = np.where(a > 10)
        im = im.crop((max(0, xs.min() - 6), max(0, ys.min() - 6), min(im.width, xs.max() + 7), min(im.height, ys.max() + 7)))
    im.save(to)
    rel = lambda q: str(Path(q).relative_to(P)) if str(Path(q)).startswith(str(P)) else str(q)
    log.append({"out": rel(to), "from": rel(path), "box": box, "size": im.size})
    return im


def particles(path, pid, prefix, n, min_area=900, box=None, model="isnet-general-use"):
    """Cut the whole photo, then split the alpha into connected components → one PNG per item."""
    import cv2
    full = TMP / f"{prefix}_full.png"
    cut(path, full, box=box, trim=False, model=model)
    im = np.array(Image.open(full).convert("RGBA"))
    a = (im[:, :, 3] > 40).astype(np.uint8)
    k, lab, stats, _ = cv2.connectedComponentsWithStats(a, 8)
    comps = sorted([(stats[i, cv2.CC_STAT_AREA], i) for i in range(1, k) if stats[i, cv2.CC_STAT_AREA] >= min_area], reverse=True)[:n]
    saved = []
    for j, (_, i) in enumerate(comps):
        x, y, w, h = stats[i, 0], stats[i, 1], stats[i, 2], stats[i, 3]
        m = (lab[y:y + h, x:x + w] == i)
        piece = im[y:y + h, x:x + w].copy()
        piece[:, :, 3] = np.where(m, piece[:, :, 3], 0)
        fn = out(pid, f"{prefix}_{j:02d}.png")
        Image.fromarray(piece).save(fn)
        saved.append(fn.name)
    log.append({"particles": prefix, "count": len(saved), "from": str(Path(path).relative_to(P))})
    return saved


# ---------------------------------------------------------------- V1 fleurs
F = "calebasse-fleurs-gamme"
cut(src(F, "3872_05.jpg"), out(F, "bag_rose.png"))
cut(src(F, "3794_01.jpg"), out(F, "bag_osmanthus.png"), box=(80, 230, 370, 975))
cut(src(F, "3790_05.jpg"), out(F, "bag_camomille.png"))
cut(src(F, "3873_00.jpg"), out(F, "bag_jasmin.png"))
particles(src(F, "px_rose_buds.jpg"), F, "p_rose", 14)
particles(src(F, "px_osmanthus_dried.jpg"), F, "p_osm", 18, min_area=250)
cut(src(F, "px_jasmine_sambac.jpg"), out(F, "p_jasmin_00.png"))
for k, (name, box) in enumerate([("3872_00.jpg", None), ("3794_00.jpg", None), ("3790_00.jpg", None)]):
    pass
# macro bowls (circle content) and ingredient medallions
for fn_in, fn_out in [("3872_00.jpg", "macro_rose.jpg"), ("3794_00.jpg", "macro_osmanthus.jpg"), ("3790_00.jpg", "macro_camomille.jpg")]:
    crop(src(F, fn_in), (150, 230, 650, 730), out(F, fn_out))
for fn_in, fn_out in [("3872_06.png", "med_rose.png"), ("3790_06.png", "med_camomille.png"), ("3873_03.png", "med_jasmin.png")]:
    Image.open(src(F, fn_in)).save(out(F, fn_out))
for fn_in, fn_out in [("3872_03.jpg", "cup_rose.jpg"), ("3794_03.jpg", "cup_osmanthus.jpg"), ("3790_03.jpg", "cup_camomille.jpg")]:
    Image.open(src(F, fn_in)).convert("RGB").save(out(F, fn_out), quality=92)
Image.open(src(F, "px_osmanthus_fresh.jpg")).convert("RGB").save(out(F, "fresh_osmanthus.jpg"), quality=92)

# ---------------------------------------------------------------- V2 astragale
A = "calebasse-3-gestes"
cut(src(A, "4498_01.jpg"), out(A, "bag_astragale.png"), box=(80, 235, 320, 975))
cut(src(A, "4498_00.jpg"), out(A, "bowl_astragale.png"), box=(120, 220, 720, 820))
Image.open(src(A, "4498_02.jpg")).convert("RGB").save(out(A, "cup_astragale.jpg"), quality=92)

# ---------------------------------------------------------------- V3 baume rouge
B = "calebasse-baume-rouge"
cut(src(B, "5314_00.jpg"), out(B, "tin_top.png"), box=(270, 290, 720, 800))
crop(src(B, "5314_02.jpg"), (600, 80, 1080, 1000), out(B, "tin_open.jpg"))
Image.open(src(B, "5314_03.jpg")).convert("RGB").save(out(B, "texture_finger.jpg"), quality=94)
Image.open(src(B, "5314_01.jpg")).convert("RGB").save(out(B, "ingredients_card.jpg"), quality=94)
Image.open(src(B, "5314_04.jpg")).convert("RGB").save(out(B, "lifestyle_neck.jpg"), quality=92)

# ---------------------------------------------------------------- V4 ginseng
G = "calebasse-ginseng-allee"
jars = cut(src(G, "gf_ginseng_3jars.jpg"), TMP / "jars3.png", trim=False)
cut(src(G, "gf_ginseng_3jars.jpg"), out(G, "jar_ginseng.png"), box=(300, 210, 724, 640))
cut(src(G, "4679_00.jpg"), out(G, "bowl_ginseng.png"), box=(100, 200, 700, 800))
Image.open(src(G, "4679_02.jpg")).convert("RGB").save(out(G, "slices_water.jpg"), quality=92)

# ---------------------------------------------------------------- V5 goji
J = "calebasse-goji-socle"
cut(src(J, "gf_goji_2bags.jpg"), out(J, "bag_goji.png"), box=(150, 60, 520, 960))
cut(src(J, "px_hand_palm.jpg"), out(J, "hand.png"))
particles(src(J, "px_goji_scatter.jpg"), J, "p_goji", 26, min_area=600)
cut(src(J, "3832_00.jpg"), out(J, "bowl_goji.png"), box=(150, 220, 750, 820))
for fn in ["px_sky.jpg", "px_leaf_shadow_stucco.jpg"]:
    im = Image.open(src(J, fn)).convert("RGB"); im.thumbnail((1600, 2200)); im.save(out(J, fn.replace("px_", "")), quality=90)

# ---------------------------------------------------------------- V6 perle
R = "calebasse-perle-source"
cut(src(R, "4279_00.jpg"), out(R, "jar_perle.png"), box=(330, 330, 740, 840))
cut(src(R, "4279_00.jpg"), out(R, "pearl.png"), box=(745, 745, 850, 845))
crop(src(R, "4279_02.jpg"), (0, 300, 1080, 1000), out(R, "sand_pearls.jpg"))
im = Image.open(src(R, "px_moss_rock_sea.jpg")).convert("RGB"); im.save(out(R, "moss_rock.jpg"), quality=92)

(P / "calebasse-brand" / "catalog" / "prep_log_batch2.json").write_text(json.dumps(log, ensure_ascii=False, indent=1), encoding="utf-8")
print(json.dumps(log, ensure_ascii=False)[:3000])
