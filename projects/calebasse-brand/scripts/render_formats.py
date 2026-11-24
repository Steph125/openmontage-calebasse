"""Render the 6 Green Friday format variants (HyperFrames atelier workspaces) through video_compose, sequentially."""
import json, shutil, subprocess, sys, time
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")
ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT))
from tools.video.video_compose import VideoCompose  # noqa: E402
from tools.video.hyperframes_compose import HyperFramesCompose  # noqa: E402

doc = subprocess.run([shutil.which("npx"), "--yes", "hyperframes", "doctor", "--json"], capture_output=True, text=True, timeout=120)
print("doctor exit", doc.returncode, flush=True)
if doc.returncode == 0:
    HyperFramesCompose._cli_probe_cache = {"status": "ok"}  # same probe, given enough time on this machine (~24 s)

P = ROOT / "projects" / "calebasse-green-friday"
jobs = [(c, f) for c in ("a", "c") for f in ("1080x1350", "1080x1080", "1200x628")]
if len(sys.argv) > 1:
    jobs = [j for j in jobs if f"{j[0]}-{j[1]}" in sys.argv[1:]]
for concept, fmt in jobs:
    ws = P / f"hf-{concept}-{fmt}"
    out = P / "renders" / "formats" / f"gf_{concept.upper()}_hyperframes_{fmt}.mp4"
    t0 = time.time()
    res = VideoCompose().execute({
        "operation": "render", "output_path": str(out), "workspace_path": str(ws), "quality": "high", "fps": 30,
        "edit_decisions": {"version": "1.0", "render_runtime": "hyperframes", "composition_mode": "atelier",
                           "renderer_family": "product-reveal", "cuts": [], "metadata": {"art_direction": str(P / "art-direction.md")}},
    })
    fr = (res.data or {}).get("final_review", {})
    print(f"{concept}-{fmt}", "ok" if res.success else "FAIL", f"{time.time() - t0:.0f} s", fr.get("status"), (res.error or "")[:600], flush=True)
