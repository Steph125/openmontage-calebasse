"""Render an authored HyperFrames workspace through video_compose: render_hf.py <workspace_dir_name> <output_rel>"""
import json
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")
ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT))
from tools.video.video_compose import VideoCompose  # noqa: E402

from tools.video.hyperframes_compose import HyperFramesCompose  # noqa: E402

# The availability probe runs `hyperframes doctor` with a 20 s timeout, which this machine
# sometimes exceeds; a successful probe is cached for the process, so warm it up first.
import shutil, subprocess  # noqa: E401,E402
_doc = subprocess.run([shutil.which("npx"), "--yes", "hyperframes", "doctor", "--json"], capture_output=True, text=True, timeout=120)
_raw = _doc.stdout or ""
_ok = _doc.returncode == 0 and json.loads(_raw[_raw.find("{"):]).get("ok", False) is not False
print("doctor (120 s timeout):", "exit", _doc.returncode, "ok", _ok)
if _doc.returncode == 0:
    # Same probe the tool runs, just given enough time on this machine (~24 s); seed its cache.
    HyperFramesCompose._cli_probe_cache = {"status": "ok"}
for attempt in range(3):
    chk = HyperFramesCompose()._runtime_check()
    print("runtime check", attempt + 1, chk.get("runtime_available"), chk.get("cli_probe_error"))
    if chk.get("runtime_available"):
        break

P = ROOT / "projects" / "calebasse-green-friday"
ws, out_rel = sys.argv[1], sys.argv[2]
extra = json.loads(sys.argv[3]) if len(sys.argv) > 3 else {}
res = VideoCompose().execute({
    "operation": "render",
    "output_path": str(P / out_rel),
    "workspace_path": str(P / ws),
    "quality": "high",
    "fps": 30,
    **extra,
    "edit_decisions": {
        "version": "1.0",
        "render_runtime": "hyperframes",
        "composition_mode": "atelier",
        "renderer_family": "product-reveal",
        "cuts": [],
        "metadata": {"art_direction": str(P / "art-direction.md")},
    },
})
print("success:", res.success)
print("error:", (res.error or "")[:3000])
d = res.data or {}
fr = d.get("final_review", {})
print("final_review:", fr.get("status"), json.dumps(fr.get("issues_found", []), ensure_ascii=False)[:1500])
print("keys:", list(d.keys())[:20])

