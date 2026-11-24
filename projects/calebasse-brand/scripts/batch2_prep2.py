"""Second asset pass: chroma-key kraft bags on green, reflection removal, GrabCut, colour-threshold particles, text-free crops."""
import sys
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

sys.stdout.reconfigure(encoding="utf-8")
ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(ROOT / "projects" / "calebasse-brand" / "catalog"))
from tools.tool_registry import registry  # noqa: E402
from cutout import cutout as grabcut  # noqa: E402

registry.discover()
BG = registry._tools["bg_remove"]
P = ROOT / "projects"
TMP = Path(sys.argv[1]); TMP.mkdir(parents=True, exist_ok=True)
src = lambda pid, n: P / pid / "assets" / "source" / n
out = lambda pid, n: P / pid / "public" / "img" / n


def trim_save(rgba: np.ndarray, to: Path, pad=6):
    a = rgba[:, :, 3]
    ys, xs = np.where(a > 10)
    rgba = rgba[max(0, ys.min() - pad): ys.max() + pad + 1, max(0, xs.min() - pad): xs.max() + pad + 1]
    Image.fromarray(rgba).save(to)
    print("saved", to.name, rgba.shape[1], "x", rgba.shape[0])


def key_green(path, box, to):
    """Kraft bag on the brand's dark-green card: key out the green, keep the largest blob."""
    img = cv2.cvtColor(np.array(Image.open(path).convert("RGB").crop(box)), cv2.COLOR_RGB2BGR)
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    h, s, v = hsv[:, :, 0].astype(int), hsv[:, :, 1].astype(int), hsv[:, :, 2].astype(int)
    bg = (h >= 45) & (h <= 95) & (s >= 35) & (v <= 150)
    fg = (~bg).astype(np.uint8) * 255
    fg = cv2.morphologyEx(fg, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    n, lab, st, _ = cv2.connectedComponentsWithStats(fg, 8)
    i = 1 + int(np.argmax(st[1:, cv2.CC_STAT_AREA]))
    m = np.where(lab == i, 255, 0).astype(np.uint8)
    cnts, _ = cv2.findContours(m, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    m = np.zeros_like(m); cv2.drawContours(m, cnts, -1, 255, -1)  # fill holes (window, label)
    m = cv2.erode(m, np.ones((3, 3), np.uint8))
    a = cv2.GaussianBlur(m, (0, 0), 1.0)
    rgba = np.dstack([cv2.cvtColor(img, cv2.COLOR_BGR2RGB), a])
    trim_save(rgba, to)


def drop_reflection(path_png: Path, to: Path, opaque=225, frac=0.18):
    """Remove the floor reflection under a packshot cutout: cut below the last mostly-opaque row, soften the base."""
    rgba = np.array(Image.open(path_png).convert("RGBA"))
    a = rgba[:, :, 3]
    W = a.shape[1]
    rows = np.where((a > opaque).sum(axis=1) > W * frac)[0]
    bottom = rows.max() + 2
    rgba = rgba[: bottom + 1].copy()
    fade = 6
    for k in range(fade):
        rgba[bottom - k, :, 3] = (rgba[bottom - k, :, 3] * (k + 1) / (fade + 1)).astype(np.uint8)
    trim_save(rgba, to)


def rembg(path, to, box=None, model="isnet-general-use", matting=False):
    inp = path
    if box:
        inp = TMP / f"c_{to.stem}.png"; Image.open(path).convert("RGB").crop(box).save(inp)
    r = BG.execute({"input_path": str(inp), "output_path": str(to), "model": model, "alpha_matting": matting})
    assert r.success, r.error
    trim_save(np.array(Image.open(to).convert("RGBA")), to)


def color_particles(path, pid, prefix, n, min_area, sat=0.20, val=0.80):
    """Items on a light background: keep pixels that are saturated or dark, split into components."""
    rgb = np.array(Image.open(path).convert("RGB"))
    hsv = cv2.cvtColor(rgb, cv2.COLOR_RGB2HSV).astype(float)
    m = ((hsv[:, :, 1] / 255 > sat) | (hsv[:, :, 2] / 255 < val)).astype(np.uint8) * 255
    m = cv2.morphologyEx(m, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, np.ones((7, 7), np.uint8))
    k, lab, st, _ = cv2.connectedComponentsWithStats(m, 8)
    comps = sorted([(st[i, cv2.CC_STAT_AREA], i) for i in range(1, k) if st[i, cv2.CC_STAT_AREA] >= min_area], reverse=True)[:n]
    for j, (_, i) in enumerate(comps):
        x, y, w, h = st[i, 0], st[i, 1], st[i, 2], st[i, 3]
        x0, y0, x1, y1 = max(0, x - 4), max(0, y - 4), min(rgb.shape[1], x + w + 4), min(rgb.shape[0], y + h + 4)
        mm = (lab[y0:y1, x0:x1] == i).astype(np.uint8) * 255
        cnts, _ = cv2.findContours(mm, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
        mm = np.zeros_like(mm); cv2.drawContours(mm, cnts, -1, 255, -1)
        a = cv2.GaussianBlur(mm, (0, 0), 0.9)
        trim_save(np.dstack([rgb[y0:y1, x0:x1], a]), out(pid, f"{prefix}_{j:02d}.png"), pad=2)


def crop(pid, name, box, to):
    Image.open(src(pid, name)).convert("RGB").crop(box).save(out(pid, to), quality=94)
    print("crop", to)


F, A, B, G, J, R = "calebasse-fleurs-gamme", "calebasse-3-gestes", "calebasse-baume-rouge", "calebasse-ginseng-allee", "calebasse-goji-socle", "calebasse-perle-source"
# kraft bags on green cards
key_green(src(F, "3794_01.jpg"), (60, 220, 390, 985), out(F, "bag_osmanthus.png"))
key_green(src(A, "4498_01.jpg"), (60, 225, 340, 985), out(A, "bag_astragale.png"))
# kraft bags on white: drop the floor reflection from the rembg cutouts
for n in ["bag_rose.png", "bag_camomille.png", "bag_jasmin.png"]:
    drop_reflection(out(F, n), out(F, n))
# goji bag (GrabCut on the left bag) + reflection
gb = TMP / "goji_crop.jpg"; Image.open(src(J, "gf_goji_2bags.jpg")).convert("RGB").crop((222, 158, 498, 885)).save(gb, quality=96)
grabcut(str(gb), str(out(J, "bag_goji.png"))); drop_reflection(out(J, "bag_goji.png"), out(J, "bag_goji.png"))
# ginseng jar (white bg) + reflection
rembg(src(G, "gf_ginseng_3jars.jpg"), out(G, "jar_ginseng.png"), box=(296, 388, 709, 760)); drop_reflection(out(G, "jar_ginseng.png"), out(G, "jar_ginseng.png"))
# perle jar: three candidates
rembg(src(R, "4279_00.jpg"), out(R, "jar_perle_isnet_matting.png"), box=(330, 330, 740, 845), matting=True)
rembg(src(R, "4279_00.jpg"), out(R, "jar_perle_u2net.png"), box=(330, 330, 740, 845), model="u2net")
jc = TMP / "perle_crop.png"; Image.open(src(R, "4279_00.jpg")).convert("RGB").crop((330, 330, 740, 845)).save(jc)
img = cv2.imread(str(jc)); mask = np.zeros(img.shape[:2], np.uint8); rect = (8, 8, img.shape[1] - 16, img.shape[0] - 16)
bgd, fgd = np.zeros((1, 65), np.float64), np.zeros((1, 65), np.float64)
cv2.grabCut(img, mask, rect, bgd, fgd, 6, cv2.GC_INIT_WITH_RECT)
m = np.where((mask == 1) | (mask == 3), 255, 0).astype(np.uint8)
trim_save(np.dstack([cv2.cvtColor(img, cv2.COLOR_BGR2RGB), cv2.GaussianBlur(m, (0, 0), 1.0)]), out(R, "jar_perle_grabcut.png"))
# particles
color_particles(src(F, "px_rose_buds.jpg"), F, "p_rose", 16, min_area=1800, sat=0.22, val=0.70)
# text-free crops
for n, to in [("3872_00.jpg", "macro_rose.jpg"), ("3794_00.jpg", "macro_osmanthus.jpg"), ("3790_00.jpg", "macro_camomille.jpg")]:
    crop(F, n, (320, 320, 780, 760), to)
for n, to in [("3872_02.jpg", "cup_rose.jpg"), ("3794_02.jpg", "cup_osmanthus.jpg"), ("3790_02.jpg", "cup_camomille.jpg")]:
    crop(F, n, (200, 600, 880, 1080), to)
crop(A, "4498_02.jpg", (100, 560, 980, 1080), "cup_astragale.jpg")
crop(B, "5314_03.jpg", (0, 0, 1080, 800), "texture_finger.jpg")
crop(B, "5314_04.jpg", (0, 560, 1080, 1080), "lifestyle_table.jpg")
crop(B, "5314_01.jpg", (560, 0, 1080, 1080), "ingredients_plants.jpg")
crop(R, "4279_02.jpg", (0, 270, 1080, 960), "sand_pearls.jpg")
for stale in [out(B, "lifestyle_neck.jpg"), out(B, "ingredients_card.jpg"), out(F, "p_osm_00.png")]:
    if stale.exists():
        stale.unlink()
for k in range(3):
    f = out(F, f"p_rose_{k:02d}.png")
