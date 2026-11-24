"""Record the user's approval for the 6-video batch (products, rembg, muet, d'une traite)."""
import json
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")
ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT))
from lib.checkpoint import write_checkpoint  # noqa: E402

PROJ = ROOT / "projects"
PIDS = ["calebasse-fleurs-gamme", "calebasse-3-gestes", "calebasse-baume-rouge", "calebasse-ginseng-allee", "calebasse-goji-socle", "calebasse-perle-source"]
NOTE = "Réponse utilisateur 2026-11-23 : « oui pour tout, installe rembg, muet, d'une traite »"
for pid in PIDS:
    art = PROJ / pid / "artifacts"
    pp = json.loads((art / "proposal_packet.json").read_text(encoding="utf-8"))
    pp["selected_concept"]["rationale"] = "Validé par l'utilisateur (produit et concept principal)."
    plan = pp["production_plan"]
    plan["render_runtime"] = "remotion"
    plan["music_source"] = {"source_type": "none", "mood_direction": "muet (choix utilisateur)", "estimated_cost_usd": 0.0}
    plan["voice_selection"] = {"provider": "none", "rationale": "muet (choix utilisateur)", "estimated_cost_usd": 0.0}
    pp["approval"] = {"status": "approved", "user_notes": NOTE, "approved_budget_usd": 0.0}
    dl = {"version": "1.0", "project_id": pid, "decisions": [
        {"decision_id": "d-runtime", "stage": "proposal", "category": "render_runtime_selection", "subject": "Moteur de rendu",
         "options_considered": [{"option_id": "remotion", "label": "Remotion", "score": 0.9, "reason": "Choix utilisateur « on va partir sur remotion pour le moment »"},
                                {"option_id": "hyperframes", "label": "HyperFrames", "score": 0.6, "reason": "Disponible", "rejected_because": "Utilisateur : Remotion pour le moment"}],
         "selected": "remotion", "reason": "Choix utilisateur", "user_visible": True, "user_approved": True},
        {"decision_id": "d-mode", "stage": "proposal", "category": "composition_mode", "subject": "Mode de composition",
         "options_considered": [{"option_id": "atelier", "label": "Atelier", "score": 0.9, "reason": "Pub de marque soignée"},
                                {"option_id": "templated", "label": "Gabarits", "score": 0.2, "reason": "Rapide", "rejected_because": "Rendu générique"}],
         "selected": "atelier", "reason": "« le plus soigné possible »", "user_visible": True, "user_approved": True},
        {"decision_id": "d-music", "stage": "proposal", "category": "music_source", "subject": "Musique",
         "options_considered": [{"option_id": "none", "label": "Muet", "score": 1.0, "reason": "Choix utilisateur"},
                                {"option_id": "pixabay_music", "label": "Pixabay Music", "score": 0.5, "reason": "Libre de droits", "rejected_because": "Utilisateur : muet"}],
         "selected": "none", "reason": NOTE, "user_visible": True, "user_approved": True},
        {"decision_id": "d-concept", "stage": "proposal", "category": "concept_selection", "subject": "Produit et concept",
         "options_considered": [{"option_id": c["id"], "label": c["title"], "score": 0.9 if c["id"] == "main" else 0.6, "reason": c["why_this_works"], **({} if c["id"] == "main" else {"rejected_because": "Produit principal validé"})} for c in pp["concept_options"]],
         "selected": "main", "reason": NOTE, "user_visible": True, "user_approved": True},
        {"decision_id": "d-approval-policy", "stage": "proposal", "category": "approval_policy", "subject": "Validations des étapes restantes",
         "options_considered": [{"option_id": "full_run", "label": "D'une traite", "score": 0.9, "reason": "Choix utilisateur"},
                                {"option_id": "per_gate", "label": "Étape par étape", "score": 0.5, "reason": "Plus de contrôle", "rejected_because": "Utilisateur : d'une traite"}],
         "selected": "full_run", "reason": NOTE + " — script, scene_plan, assets et échantillon pré-autorisés ; la publication reste soumise à validation des vidéos finales.", "user_visible": True, "user_approved": True},
    ]}
    write_checkpoint(PROJ, pid, "proposal", "completed", {"proposal_packet": pp, "decision_log": dl}, pipeline_type="animation",
                     human_approval_required=True, human_approved=True)
    (art / "proposal_packet.json").write_text(json.dumps(pp, ensure_ascii=False, indent=2), encoding="utf-8")
    print("approved", pid)
