"""assets, edit, compose (completed) and publish (awaiting_human) checkpoints for calebasse-green-friday."""
import json
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")
ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT))
from lib.checkpoint import write_checkpoint  # noqa: E402

PID = "calebasse-green-friday"
PROJ = ROOT / "projects"
P = PROJ / PID
ART = P / "artifacts"
products = json.loads((ART / "products.json").read_text(encoding="utf-8"))["products"]
SRC = {"p0.jpg": 0, "p1.jpg": 1, "p2.jpg": 2, "p3.jpg": 3, "p77.jpg": 4, "p76.jpg": 5}
PAGE = "https://calebasse.com/pages/black-friday-bien-etre-sante-beaute"

assets = []
for p in products:
    fn = Path(p["image"]).name
    assets.append({"id": f"product-{p['id']}", "type": "image", "path": f"public/{p['image']}", "source_tool": "web_download",
                   "scene_id": "A6" if SRC[fn] < 4 else "C3", "provider": "calebasse.com (Cloudinary)", "original_url": PAGE,
                   "license": "Calebasse brand asset — user confirmed affiliation and permission (2026-10-13)", "cost_usd": 0.0, "format": "jpg"})
for w in [400, 500, 600, 700, 800]:
    assets.append({"id": f"font-poppins-{w}", "type": "font", "path": f"public/fonts/Poppins-{w}.woff2", "source_tool": "web_download",
                   "scene_id": "A1", "provider": "Google Fonts", "license": "SIL OFL 1.1", "cost_usd": 0.0, "format": "woff2"})
for lg in ["logo_color.svg", "logo_inline.svg"]:
    assets.append({"id": f"brand-{lg[:-4]}", "type": "image", "path": f"public/brand/{lg}", "source_tool": "web_download", "scene_id": "A8",
                   "provider": "calebasse.com", "license": "Calebasse brand asset — user permission", "cost_usd": 0.0, "format": "svg"})
for cid, path, scene in [("comp-A-remotion", "SceneA.tsx", "A1"), ("comp-C-remotion", "SceneC.tsx", "C1"), ("comp-shared-remotion", "shared.tsx", "A1"),
                         ("comp-A-hyperframes", "hf-a/index.html", "A1"), ("comp-C-hyperframes", "hf-c/index.html", "C1"), ("comp-hf-builder", "hf-build/build.mjs", "A1")]:
    assets.append({"id": cid, "type": "animation", "path": path, "source_tool": "hand_authored_atelier", "scene_id": scene, "cost_usd": 0.0,
                   "subtype": "bespoke composition", "generation_summary": "Hand-authored (atelier); characters, phone, banner and page drawn in code"})
for sid in ["A1", "A3", "A5", "A6", "A8"]:
    pass
asset_manifest = {"version": "1.0", "assets": assets, "total_cost_usd": 0.0,
                  "metadata": {"note": "No generated media: every visual is code-drawn except the real Calebasse product photos and logo.",
                               "prices_verified": "artifacts/products.json (card-by-card, 2026-11-23)"}}

def probe(path: Path):
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration,size:stream=codec_type,codec_name,width,height,r_frame_rate",
                          "-of", "json", str(path)], capture_output=True, text=True).stdout
    d = json.loads(out)
    v = next(s for s in d["streams"] if s["codec_type"] == "video")
    a = next((s for s in d["streams"] if s["codec_type"] == "audio"), None)
    num, den = v["r_frame_rate"].split("/")
    return {"path": str(path.relative_to(P)).replace("\\", "/"), "format": "mp4", "codec": v["codec_name"],
            "audio_codec": a["codec_name"] if a else "none", "resolution": f"{v['width']}x{v['height']}",
            "fps": round(int(num) / int(den), 3), "duration_seconds": round(float(d["format"]["duration"]), 3),
            "file_size_bytes": int(d["format"]["size"]), "platform_target": "instagram_reels"}

variants = [("A-remotion", "renders/gf_A_remotion.mp4", "remotion"), ("A-hyperframes", "renders/gf_A_hyperframes.mp4", "hyperframes"),
            ("C-remotion", "renders/gf_C_remotion.mp4", "remotion"), ("C-hyperframes", "renders/gf_C_hyperframes.mp4", "hyperframes")]
outputs = [probe(P / rel) for _, rel, _ in variants]

edit_decisions = {
    "version": "1.0",
    "render_runtime": "remotion",
    "composition_mode": "atelier",
    "renderer_family": "product-reveal",
    "cuts": [{"id": "A-oneshot", "source": "bespoke:GreenFridayA", "in_seconds": 0, "out_seconds": 12, "reason": "single locked shot, no cuts (concept A)"}],
    "bespoke": {"entry": str(P / "index.tsx"), "composition_id": "GreenFridayA", "art_direction": str(P / "art-direction.md")},
    "metadata": {
        "variants": [
            {"variant": "A-remotion", "render_runtime": "remotion", "entry": "index.tsx", "composition_id": "GreenFridayA", "duration_s": 12},
            {"variant": "C-remotion", "render_runtime": "remotion", "entry": "index.tsx", "composition_id": "GreenFridayC", "duration_s": 15},
            {"variant": "A-hyperframes", "render_runtime": "hyperframes", "workspace": "hf-a", "composition_id": "gf-a", "duration_s": 12},
            {"variant": "C-hyperframes", "render_runtime": "hyperframes", "workspace": "hf-c", "composition_id": "gf-c", "duration_s": 15},
        ],
        "hold_windows": {"A": ["8.2–10.1 s page produits", "10.8–12 s carton"], "C": ["8.7–10.7 s vitrine complète", "13–15 s carton"]},
        "stagger_rules": "pastilles de remise en cascade de 6 images (A) / à chaque emboîtement (C) ; prix barrés 10–12 images après",
        "transition_map": "aucune coupe : un plan fixe par concept",
        "runtime_parity": "même direction artistique, mêmes temps forts, mêmes personnages (pas de 2) ; seul l'interpolage des mouvements fluides diffère (ressorts/courbes Remotion vs ease GSAP : power1.in pour la gravité, elastic.out pour les rebonds, back.out pour les pastilles)",
        "audio": "aucune piste (choix utilisateur) — Remotion écrit une piste AAC muette, HyperFrames aucune piste",
        "contrast_fix": "pastilles #BF4E39 et anciens prix #5E6B64 (WCAG AA) appliqués aux 4 variantes",
    },
}

render_report = {
    "version": "1.0",
    "outputs": outputs,
    "render_grammar": "product-reveal",
    "warnings": [
        "Vidéos muettes (choix utilisateur) : la revue automatique signale l'absence de son.",
        "HyperFrames : sonde `hyperframes doctor` > 20 s sur ce PC — diagnostic relancé avec un délai de 120 s (exit 0) avant rendu.",
        "HyperFrames check : avertissements restants attendus (bords, rotation de la bannière, petites pastilles) ; 0 erreur.",
    ],
    "verification_notes": [
        "ffprobe : 4 fichiers 1080x1920, 30 i/s, h264 ; A = 12 s, C = 15 s.",
        "Contrôle visuel image par image de A (Remotion vs HyperFrames) et de C.",
        "Prix / remises identiques à la page (artifacts/products.json).",
        "Carton de fin remonté (scène à 92 %) pour dégager l'interface Instagram.",
    ],
    "metadata": {"variants": [v[0] for v in variants]},
}

now = datetime.now(timezone.utc).isoformat()
publish_log = {
    "version": "1.0",
    "entries": [{"platform": "instagram_reels", "status": "pending_review", "export_path": o["path"], "timestamp": now,
                 "metadata_used": {"variant": v[0]}} for v, o in zip(variants, outputs)],
    "metadata": {
        "animation_mode": "programmatic motion design (atelier), personnages vectoriels en pas de 2",
        "hero_frame_notes": "A : 3,8 s (GREEN peint au-dessus de BLACK barré) ; C : 14,5 s (vitrine pleine + carton)",
        "thumbnail_concept": "Couverture conseillée : A à ~4,5 s (« GREEN / BLACK barré / FRIDAY » + ouvriers), C à ~10 s (vitrine pleine, GREEN dans l'en-tête)",
        "platform_notes": "Reels 9:16 ; Green Friday du 20 au 30 nov. 2026 ; ajouter un son tendance dans Instagram si souhaité ; légende sans allégation santé",
        "ab_test": "comparer concept (A vs C) et moteur (Remotion vs HyperFrames) — 4 bras",
    },
}

write_checkpoint(PROJ, PID, "assets", "completed", {"asset_manifest": asset_manifest}, pipeline_type="animation",
                 human_approval_required=True, human_approved=True, metadata={"approved_via": "approval_policy d-approval-policy-fullrun"})
write_checkpoint(PROJ, PID, "edit", "completed", {"edit_decisions": edit_decisions}, pipeline_type="animation")
write_checkpoint(PROJ, PID, "compose", "completed", {"render_report": render_report}, pipeline_type="animation")
write_checkpoint(PROJ, PID, "publish", "awaiting_human", {"publish_log": publish_log}, pipeline_type="animation", human_approval_required=True)
for name, obj in [("asset_manifest", asset_manifest), ("edit_decisions", edit_decisions), ("render_report", render_report), ("publish_log", publish_log)]:
    (ART / f"{name}.json").write_text(json.dumps(obj, ensure_ascii=False, indent=2), encoding="utf-8")
for o in outputs:
    print(o["path"], o["resolution"], o["fps"], o["duration_seconds"], "s", o["file_size_bytes"] // 1024, "KB", "audio:", o["audio_codec"])
print("checkpoints ok")
