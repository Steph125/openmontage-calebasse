"""Analyze the 6 Pinterest references with video_analyzer (standard depth)."""
import json
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")
ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT))
from tools.tool_registry import registry  # noqa: E402

registry.discover()
va = registry._tools["video_analyzer"]
REFS = ["2iRiCFRDL", "4XmSh6mGp", "1GukzHSpw", "59sJWLdvp", "3cn23RezE", "11ASPTq0T"]
out = {}
for i, code in enumerate(REFS, 1):
    od = ROOT / "projects" / "_references" / f"ref{i}-{code}"
    r = va.execute({"source": f"https://pin.it/{code}", "analysis_depth": "standard", "max_keyframes": 16, "output_dir": str(od)})
    d = r.data or {}
    src = d.get("source", {})
    meta = src.get("platform_metadata", {})
    summary = {
        "ok": r.success, "error": r.error, "title": src.get("title"), "duration": src.get("duration_seconds"),
        "resolution": src.get("resolution"), "uploader": meta.get("uploader"), "description": (meta.get("description") or "")[:400],
        "scenes": d.get("structure_analysis", {}).get("total_scenes"),
        "motion": [s.get("motion_type") for s in d.get("structure_analysis", {}).get("scenes", [])][:12],
        "keyframes": [k.get("path") for k in d.get("keyframes", [])],
        "failed": d.get("_analysis_meta", {}).get("steps_failed"),
    }
    out[f"ref{i}"] = summary
    (od / "brief.json").write_text(json.dumps(d, ensure_ascii=False, indent=1, default=str), encoding="utf-8")
    print(f"ref{i}", code, "|", summary["title"], "|", summary["duration"], "s |", summary["resolution"], "| scenes", summary["scenes"], "|", summary["uploader"])
    print("    ", summary["description"][:300])
    print("     motion:", summary["motion"], "| failed:", summary["failed"])
(ROOT / "projects" / "_references" / "batch2_summary.json").write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding="utf-8")
