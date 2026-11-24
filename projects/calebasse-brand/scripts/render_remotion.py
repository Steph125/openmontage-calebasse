"""Render a Remotion atelier composition through video_compose: render_remotion.py <comp_id> <output_rel> [scale]"""
import json
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")
ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT))
from tools.video.video_compose import VideoCompose  # noqa: E402
sys.path.insert(0, str(Path(__file__).parent))
from localpub import local_public  # noqa: E402

P = ROOT / "projects" / "calebasse-green-friday"
comp, out_rel = sys.argv[1], sys.argv[2]
scale = float(sys.argv[3]) if len(sys.argv) > 3 else 1.0
res = VideoCompose().execute({
    "operation": "render",
    "output_path": str(P / out_rel),
    "edit_decisions": {
        "render_runtime": "remotion",
        "composition_mode": "atelier",
        "bespoke": {
            "entry": str(P / "index.tsx"),
            "composition_id": comp,
            "props_path": str(P / "artifacts" / "props.json"),
            "public_dir": str(local_public(P / "public", "gf")),
            "art_direction": str(P / "art-direction.md"),
            "scale": scale,
            "crf": 18,
            "concurrency": 6,
        },
    },
})
print("success:", res.success)
print("error:", res.error)
d = res.data or {}
fr = d.get("final_review", {})
print("final_review:", fr.get("status"), json.dumps(fr.get("issues_found", []), ensure_ascii=False)[:1500])
print("output:", d.get("output_path") or d.get("output"))
