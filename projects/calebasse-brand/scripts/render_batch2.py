"""Render the 6 batch-2 Remotion atelier compositions through video_compose, one after the other."""
import json
import sys
import time
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")
ROOT = Path(__file__).resolve().parents[3]
SP = Path(__file__).parent
sys.path.insert(0, str(ROOT)); sys.path.insert(0, str(SP))
from tools.video.video_compose import VideoCompose  # noqa: E402
from localpub import local_public  # noqa: E402

JOBS = [
    ("calebasse-fleurs-gamme", "FleursGamme", "renders/calebasse_fleurs_gamme.mp4"),
    ("calebasse-3-gestes", "TroisGestes", "renders/calebasse_3_gestes.mp4"),
    ("calebasse-baume-rouge", "BaumeRouge", "renders/calebasse_baume_rouge.mp4"),
    ("calebasse-ginseng-allee", "GinsengAllee", "renders/calebasse_ginseng_allee.mp4"),
    ("calebasse-goji-socle", "GojiSocle", "renders/calebasse_goji_socle.mp4"),
    ("calebasse-perle-source", "PerleSource", "renders/calebasse_perle_source.mp4"),
]
only = set(sys.argv[1:])
report = {}
for pid, comp, out in JOBS:
    if only and pid not in only:
        continue
    P = ROOT / "projects" / pid
    t0 = time.time()
    res = VideoCompose().execute({
        "operation": "render",
        "output_path": str(P / out),
        "edit_decisions": {"render_runtime": "remotion", "composition_mode": "atelier", "bespoke": {
            "entry": str(P / "index.tsx"), "composition_id": comp, "props_path": str(P / "artifacts" / "props.json"),
            "public_dir": str(local_public(P / "public", pid)), "art_direction": str(P / "art-direction.md"),
            "scale": 1.0, "crf": 18, "concurrency": 6}},
    })
    fr = (res.data or {}).get("final_review", {})
    report[pid] = {"ok": res.success, "error": (res.error or "")[:600], "seconds": round(time.time() - t0), "review": fr.get("status"), "issues": fr.get("issues_found", [])}
    print(pid, "ok" if res.success else "FAIL", report[pid]["seconds"], "s", fr.get("status"), (res.error or "")[:300], flush=True)
(SP / "render_batch2_report.json").write_text(json.dumps(report, ensure_ascii=False, indent=1), encoding="utf-8")
