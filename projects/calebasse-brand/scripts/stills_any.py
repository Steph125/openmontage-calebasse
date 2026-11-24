"""stills_any.py <project_id> <comp_id> <frames comma list> [scale] → stills + a tiled contact sheet in scratchpad/st_<pid>/"""
import subprocess
import sys
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[3]
SP = Path(__file__).parent
sys.path.insert(0, str(ROOT)); sys.path.insert(0, str(SP))
from tools.video.video_compose import VideoCompose  # noqa: E402
from localpub import local_public  # noqa: E402

pid, comp, frames = sys.argv[1], sys.argv[2], [int(x) for x in sys.argv[3].split(",")]
scale = sys.argv[4] if len(sys.argv) > 4 else "0.4"
PROJ = ROOT / "projects" / pid
out_dir = SP / f"st_{pid}"; out_dir.mkdir(exist_ok=True)
composer = ROOT / "remotion-composer"
entry = VideoCompose()._stage_atelier_project(PROJ / "index.tsx", composer)
PUB = local_public(PROJ / "public", pid)
ims = []
for fr in frames:
    out = out_dir / f"f{fr:04d}.png"
    cmd = ["npx", "remotion", "still", str(entry), comp, str(out), f"--frame={fr}", f"--props={PROJ / 'artifacts' / 'props.json'}", f"--public-dir={PUB}", f"--scale={scale}", "--log=error"]
    r = subprocess.run(cmd, cwd=composer, capture_output=True, text=True, shell=True, encoding="utf-8", errors="replace")
    if r.returncode:
        print(fr, "FAIL", (r.stderr or r.stdout)[-1800:]); continue
    ims.append((fr, Image.open(out).convert("RGB")))
if ims:
    w, h = ims[0][1].size
    cols = min(6, len(ims)); rows = (len(ims) + cols - 1) // cols
    sh = Image.new("RGB", (cols * w, rows * (h + 22)), "white"); d = ImageDraw.Draw(sh)
    for i, (fr, im) in enumerate(ims):
        x, y = (i % cols) * w, (i // cols) * (h + 22)
        sh.paste(im, (x, y + 22)); d.text((x + 4, y + 4), f"f{fr} ({fr / 30:.2f}s)", fill="black")
    sh.save(out_dir / "sheet.jpg", quality=86)
    print("sheet", out_dir / "sheet.jpg", len(ims))
