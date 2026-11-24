"""Stage the atelier project and render stills at given frames: stills.py <comp_id> <out_dir> <frame> [frame...]"""
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT))
from tools.video.video_compose import VideoCompose  # noqa: E402
sys.path.insert(0, str(Path(__file__).parent))
from localpub import local_public  # noqa: E402

PROJ = ROOT / "projects" / "calebasse-green-friday"
comp, out_dir, frames = sys.argv[1], Path(sys.argv[2]), [int(x) for x in sys.argv[3:]]
out_dir.mkdir(parents=True, exist_ok=True)
composer = ROOT / "remotion-composer"
entry = VideoCompose()._stage_atelier_project(PROJ / "index.tsx", composer)
PUB = local_public(PROJ / "public", "gf")
for fr in frames:
    out = out_dir / f"{comp}_{fr:04d}.png"
    cmd = ["npx", "remotion", "still", str(entry), comp, str(out), f"--frame={fr}",
           f"--props={PROJ / 'artifacts' / 'props.json'}", f"--public-dir={PUB}", "--scale=0.5", "--log=error"]
    r = subprocess.run(cmd, cwd=composer, capture_output=True, text=True, shell=True, encoding="utf-8", errors="replace")
    print(fr, "ok" if r.returncode == 0 else "FAIL", (r.stderr or r.stdout)[-1500:] if r.returncode else "")
