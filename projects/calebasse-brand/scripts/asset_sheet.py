"""Contact sheet of every image in projects/<pid>/public/img on a mid-grey background (shows cutout edges)."""
import sys
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[3] / "projects"
OUT = Path(sys.argv[1]); OUT.mkdir(parents=True, exist_ok=True)
for pid in sys.argv[2:]:
    files = sorted((ROOT / pid / "public" / "img").glob("*"))
    T = 230; cols = 8; rows = (len(files) + cols - 1) // cols
    sh = Image.new("RGB", (cols * T, rows * (T + 16)), (118, 124, 120)); dr = ImageDraw.Draw(sh)
    for n, f in enumerate(files):
        im = Image.open(f).convert("RGBA"); w0, h0 = im.size; im.thumbnail((T - 8, T - 8))
        x, y = (n % cols) * T, (n // cols) * (T + 16)
        sh.paste(im, (x + (T - im.width) // 2, y + 16 + (T - im.height) // 2), im)
        dr.text((x + 3, y + 2), f"{f.name[:22]} {w0}x{h0}", fill="white")
    sh.save(OUT / f"{pid}.jpg", quality=85)
    print(pid, len(files))
