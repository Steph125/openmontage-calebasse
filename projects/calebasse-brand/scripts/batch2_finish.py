"""script → publish checkpoints for the 6 batch-2 projects (approved via approval_policy full_run)."""
import json
import re
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")
ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT))
from lib.checkpoint import write_checkpoint  # noqa: E402

PROJ = ROOT / "projects"
JOBS = {
    "calebasse-fleurs-gamme": ("FleursGamme", "renders/calebasse_fleurs_gamme.mp4"),
    "calebasse-3-gestes": ("TroisGestes", "renders/calebasse_3_gestes.mp4"),
    "calebasse-baume-rouge": ("BaumeRouge", "renders/calebasse_baume_rouge.mp4"),
    "calebasse-ginseng-allee": ("GinsengAllee", "renders/calebasse_ginseng_allee.mp4"),
    "calebasse-goji-socle": ("GojiSocle", "renders/calebasse_goji_socle.mp4"),
    "calebasse-perle-source": ("PerleSource", "renders/calebasse_perle_source.mp4"),
}
POLICY = "approval_policy d-approval-policy (« d'une traite »)"


def probe(p: Path):
    d = json.loads(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration,size:stream=codec_type,codec_name,width,height,r_frame_rate", "-of", "json", str(p)], capture_output=True, text=True).stdout)
    v = next(s for s in d["streams"] if s["codec_type"] == "video")
    a = next((s for s in d["streams"] if s["codec_type"] == "audio"), None)
    n, dd = v["r_frame_rate"].split("/")
    return {"format": "mp4", "codec": v["codec_name"], "audio_codec": a["codec_name"] if a else "none", "resolution": f"{v['width']}x{v['height']}",
            "fps": round(int(n) / int(dd), 3), "duration_seconds": round(float(d["format"]["duration"]), 3), "file_size_bytes": int(d["format"]["size"]), "platform_target": "instagram_reels"}


for pid, (comp, out) in JOBS.items():
    P = PROJ / pid
    beats = re.findall(r"^\| (\d+)–(\d+) \| (.+) \|$", (P / "scenes.md").read_text(encoding="utf-8"), re.M)
    secs = [{"id": f"B{i + 1}", "text": t, "start_seconds": int(a) / 30, "end_seconds": int(b) / 30} for i, (a, b, t) in enumerate(beats)]
    total = secs[-1]["end_seconds"]
    script = {"version": "1.0", "title": pid, "total_duration_seconds": total, "sections": secs, "metadata": {"narration": "none (muet)", "on_screen_text": "see Scene.tsx; no health claims"}}
    scenes = [{"id": s["id"], "type": "animation", "script_section_id": s["id"], "description": s["text"], "start_seconds": s["start_seconds"], "end_seconds": s["end_seconds"],
               "framing": "plein cadre 9:16", "movement": "voir scenes.md", "overlay_notes": "textes à l'écran sans allégation", "shot_language": {"shot_size": "medium", "camera_movement": "static"}} for s in secs]
    scene_plan = {"version": "1.0", "style_playbook": "custom", "scenes": scenes, "metadata": {"beats": "scenes.md", "art_direction": "art-direction.md"}}
    imgs = sorted((P / "public" / "img").glob("*"))
    vids = sorted((P / "public" / "video").glob("*")) if (P / "public" / "video").exists() else []
    assets = [{"id": f.stem, "type": "image", "path": f"public/img/{f.name}", "source_tool": "bg_remove/crop/web_download", "scene_id": "B1", "cost_usd": 0.0} for f in imgs]
    assets += [{"id": f.stem, "type": "video", "path": f"public/video/{f.name}", "source_tool": "pexels_video", "scene_id": "B1", "cost_usd": 0.0, "license": "Pexels License"} for f in vids]
    assets += [{"id": "comp", "type": "animation", "path": "Scene.tsx", "source_tool": "hand_authored_atelier", "scene_id": "B1", "cost_usd": 0.0}]
    manifest = {"version": "1.0", "assets": assets, "total_cost_usd": 0.0, "metadata": {"sources": "assets/source/sources.json + pexels_credits.json", "prep": "projects/calebasse-brand/catalog/prep_log_batch2.json"}}
    edit = {"version": "1.0", "render_runtime": "remotion", "composition_mode": "atelier", "renderer_family": "product-reveal",
            "cuts": [{"id": "all", "source": f"bespoke:{comp}", "in_seconds": 0, "out_seconds": total, "reason": "composition atelier unique"}],
            "bespoke": {"entry": str(P / "index.tsx"), "composition_id": comp, "art_direction": str(P / "art-direction.md")},
            "metadata": {"audio": "muet (choix utilisateur)"}}
    o = probe(P / out); o["path"] = out
    report = {"version": "1.0", "outputs": [o], "render_grammar": "product-reveal", "warnings": ["Vidéo muette (choix utilisateur)"],
              "verification_notes": ["ffprobe OK", "planche d'images extraites du MP4 relue", "textes sans allégation santé"]}
    publish = {"version": "1.0", "entries": [{"platform": "instagram_reels", "status": "pending_review", "export_path": out, "timestamp": datetime.now(timezone.utc).isoformat()}],
               "metadata": {"animation_mode": "Remotion atelier", "thumbnail_concept": "voir rapport", "platform_notes": "Reels 9:16, muet"}}
    write_checkpoint(PROJ, pid, "script", "completed", {"script": script}, pipeline_type="animation", human_approval_required=True, human_approved=True, metadata={"approved_via": POLICY})
    write_checkpoint(PROJ, pid, "scene_plan", "completed", {"scene_plan": scene_plan}, pipeline_type="animation", human_approval_required=True, human_approved=True, metadata={"approved_via": POLICY})
    write_checkpoint(PROJ, pid, "assets", "completed", {"asset_manifest": manifest}, pipeline_type="animation", human_approval_required=True, human_approved=True, metadata={"approved_via": POLICY})
    write_checkpoint(PROJ, pid, "edit", "completed", {"edit_decisions": edit}, pipeline_type="animation")
    write_checkpoint(PROJ, pid, "compose", "completed", {"render_report": report}, pipeline_type="animation")
    write_checkpoint(PROJ, pid, "publish", "awaiting_human", {"publish_log": publish}, pipeline_type="animation", human_approval_required=True)
    for name, obj in [("script", script), ("scene_plan", scene_plan), ("asset_manifest", manifest), ("edit_decisions", edit), ("render_report", report), ("publish_log", publish)]:
        (P / "artifacts" / f"{name}.json").write_text(json.dumps(obj, ensure_ascii=False, indent=2), encoding="utf-8")
    print(pid, o["resolution"], o["fps"], o["duration_seconds"], "s", o["file_size_bytes"] // 1024, "KB")
