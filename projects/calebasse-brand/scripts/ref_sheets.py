"""One contact sheet per reference from its keyframes (labelled with timestamps)."""
import json
import sys
from pathlib import Path
from PIL import Image, ImageDraw

sys.stdout.reconfigure(encoding="utf-8")
ROOT = Path(__file__).resolve().parents[3] / "projects" / "_references"
OUT = Path(sys.argv[1])
OUT.mkdir(parents=True, exist_ok=True)
for d in sorted(ROOT.glob("ref*-*")):
    brief = json.loads((d / "brief.json").read_text(encoding="utf-8"))
    kfs = brief.get("keyframes", [])
    if not kfs:
        continue
    ims = []
    for k in kfs:
        p = Path(k["path"])
        if not p.is_absolute():
            p = ROOT.parent.parent / p
        if p.exists():
            ims.append((k.get("timestamp", 0), Image.open(p).convert("RGB")))
    if not ims:
        continue
    w0, h0 = ims[0][1].size
    th = 420 if h0 > w0 else 240
    tw = int(w0 * th / h0)
    cols = min(8, len(ims))
    rows = (len(ims) + cols - 1) // cols
    sheet = Image.new("RGB", (cols * tw, rows * (th + 22)), "white")
    dr = ImageDraw.Draw(sheet)
    for i, (t, im) in enumerate(ims):
        x, y = (i % cols) * tw, (i // cols) * (th + 22)
        sheet.paste(im.resize((tw, th)), (x, y + 22))
        dr.text((x + 4, y + 4), f"{t:.2f}s", fill="black")
    sheet.save(OUT / f"{d.name}.jpg", quality=88)
    print(d.name, len(ims), "frames", sheet.size)
