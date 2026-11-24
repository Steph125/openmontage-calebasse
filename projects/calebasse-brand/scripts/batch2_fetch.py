"""Download each project's product galleries + ingredient images (served Cloudinary URLs, unchanged)."""
import json
import sys
import time
import urllib.request
from pathlib import Path
from PIL import Image, ImageDraw

sys.stdout.reconfigure(encoding="utf-8")
ROOT = Path(__file__).resolve().parents[3]
CAT = json.loads((ROOT / "projects/calebasse-brand/catalog/products.json").read_text(encoding="utf-8"))
BYID = {p["id"]: p for p in CAT["products"] if p.get("name")}
MAP = {
    "calebasse-fleurs-gamme": ["3872", "3794", "3790", "3873"],
    "calebasse-3-gestes": ["4498"],
    "calebasse-baume-rouge": ["5314"],
    "calebasse-ginseng-allee": ["4679"],
    "calebasse-goji-socle": ["3832"],
    "calebasse-perle-source": ["4279"],
}
sheet_dir = Path(sys.argv[1]); sheet_dir.mkdir(parents=True, exist_ok=True)
for pid, ids in MAP.items():
    src = ROOT / "projects" / pid / "assets" / "source"
    src.mkdir(parents=True, exist_ok=True)
    tiles = []
    manifest = []
    for i in ids:
        p = BYID[i]
        urls = list(p.get("images") or []) + [g["image"] for g in p["ingredients"] if g.get("image")]
        for k, u in enumerate(urls):
            ext = u.rsplit(".", 1)[-1].split("?")[0][:4].lower()
            fn = src / f"{i}_{k:02d}.{ext}"
            if not fn.exists():
                req = urllib.request.Request(u, headers={"User-Agent": "Mozilla/5.0"})
                fn.write_bytes(urllib.request.urlopen(req, timeout=40).read())
                time.sleep(0.2)
            manifest.append({"file": fn.name, "url": u, "product": p["name"], "product_url": p["url"]})
            tiles.append((f"{fn.name}", fn))
    (src / "sources.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=1), encoding="utf-8")
    T = 260; cols = 7; rows = (len(tiles) + cols - 1) // cols
    sh = Image.new("RGB", (cols * T, rows * (T + 16)), "white"); dr = ImageDraw.Draw(sh)
    for n, (lab, fn) in enumerate(tiles):
        im = Image.open(fn).convert("RGB"); im.thumbnail((T, T))
        x, y = (n % cols) * T, (n // cols) * (T + 16)
        sh.paste(im, (x + (T - im.width) // 2, y + 16)); dr.text((x + 3, y + 2), lab, fill="black")
    sh.save(sheet_dir / f"{pid}.jpg", quality=85)
    print(pid, len(tiles), "images")
