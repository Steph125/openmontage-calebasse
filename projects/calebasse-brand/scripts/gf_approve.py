"""Record the user's proposal approval (A + C, Remotion + HyperFrames, no music, no voice)."""
import json
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")
ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT))
from lib.checkpoint import write_checkpoint  # noqa: E402

PID = "calebasse-green-friday"
PROJ = ROOT / "projects"
ART = PROJ / PID / "artifacts"
pp = json.loads((ART / "proposal_packet.json").read_text(encoding="utf-8"))

variants = [
    {"variant_id": "A-remotion", "concept_id": "A", "render_runtime": "remotion", "output": "renders/gf_A_remotion.mp4"},
    {"variant_id": "A-hyperframes", "concept_id": "A", "render_runtime": "hyperframes", "output": "renders/gf_A_hyperframes.mp4"},
    {"variant_id": "C-remotion", "concept_id": "C", "render_runtime": "remotion", "output": "renders/gf_C_remotion.mp4"},
    {"variant_id": "C-hyperframes", "concept_id": "C", "render_runtime": "hyperframes", "output": "renders/gf_C_hyperframes.mp4"},
]

pp["selected_concept"] = {
    "concept_id": "A",
    "rationale": "L'utilisateur retient A ET C pour un test A/B, chacun rendu en Remotion et en HyperFrames (4 vidéos).",
    "modifications": [
        "Concept C produit aussi (deuxième bras du test A/B)",
        "Chaque concept rendu deux fois : Remotion et HyperFrames, même storyboard, même direction artistique, mêmes timings",
        "Pas de musique, pas de voix (vidéos muettes ; son ajoutable dans Instagram)",
    ],
}
plan = pp["production_plan"]
plan["render_runtime"] = "remotion"  # schema takes one value; both runtimes are approved, see variants
plan["music_source"] = {"source_type": "none", "mood_direction": "Aucune musique (choix utilisateur)", "estimated_cost_usd": 0.0}
plan["voice_selection"] = {"provider": "none", "rationale": "Aucune voix (choix utilisateur)", "estimated_cost_usd": 0.0}
pp["approval"] = {
    "status": "approved_with_changes",
    "user_notes": "A et C, 4 vidéos pour un test A/B, Remotion (A et C) et HyperFrames (A et C), pas de musique, pas de voix.",
    "approved_budget_usd": 0.0,
}
pp.setdefault("metadata", {})["ab_test_variants"] = variants

opts_runtime = [
    {"option_id": "remotion", "label": "Remotion", "score": 0.8, "reason": "Moteur de tous les projets précédents, éprouvé sur cette machine"},
    {"option_id": "hyperframes", "label": "HyperFrames", "score": 0.75, "reason": "HTML/GSAP naturel pour pubs produit et traits dessinés"},
    {"option_id": "ffmpeg", "label": "FFmpeg", "score": 0.1, "reason": "Simple assemblage", "rejected_because": "Pas de composition animée"},
]
decision_log = {
    "version": "1.0",
    "project_id": PID,
    "decisions": [
        {
            "decision_id": "d-proposal-concept", "stage": "proposal", "category": "concept_selection",
            "subject": "Concept retenu",
            "options_considered": [
                {"option_id": "A", "label": "Le chantier du Green Friday", "score": 0.9, "reason": "Recommandé"},
                {"option_id": "B", "label": "Rideau vert", "score": 0.6, "reason": "Typographie cinétique", "rejected_because": "Non retenu par l'utilisateur"},
                {"option_id": "C", "label": "Les ouvriers remplissent la vitrine", "score": 0.7, "reason": "Construction produit par produit"},
            ],
            "selected": "A + C (test A/B)", "reason": "Choix de l'utilisateur pour un test A/B", "user_visible": True, "user_approved": True,
        },
        {
            "decision_id": "d-proposal-runtime", "stage": "proposal", "category": "render_runtime_selection",
            "subject": "Moteur de rendu",
            "options_considered": opts_runtime,
            "selected": "remotion + hyperframes (chaque concept rendu dans les deux)",
            "reason": "L'utilisateur veut comparer les deux moteurs dans son test A/B", "user_visible": True, "user_approved": True,
        },
        {
            "decision_id": "d-proposal-mode", "stage": "proposal", "category": "composition_mode",
            "subject": "Mode de composition",
            "options_considered": [
                {"option_id": "atelier", "label": "Atelier (fait main)", "score": 0.9, "reason": "Pièce de marque, identité Calebasse"},
                {"option_id": "templated", "label": "Gabarits", "score": 0.2, "reason": "Rapide", "rejected_because": "Rendu générique, pas de personnages ni de bannière"},
            ],
            "selected": "atelier", "reason": "Direction artistique propre à la campagne", "user_visible": True, "user_approved": True,
        },
        {
            "decision_id": "d-proposal-music", "stage": "proposal", "category": "music_source",
            "subject": "Musique",
            "options_considered": [
                {"option_id": "none", "label": "Aucune", "score": 1.0, "reason": "Choix utilisateur"},
                {"option_id": "pixabay_music", "label": "Pixabay Music", "score": 0.5, "reason": "Libre de droits", "rejected_because": "Refusé par l'utilisateur"},
                {"option_id": "synth", "label": "Synthèse locale", "score": 0.5, "reason": "Gratuit", "rejected_because": "Refusé par l'utilisateur"},
            ],
            "selected": "none", "reason": "Pas de musique demandée", "user_visible": True, "user_approved": True,
        },
        {
            "decision_id": "d-proposal-voice", "stage": "proposal", "category": "voice_selection",
            "subject": "Voix",
            "options_considered": [
                {"option_id": "none", "label": "Aucune voix", "score": 1.0, "reason": "Choix utilisateur"},
                {"option_id": "user_recording", "label": "Enregistrement de l'utilisateur", "score": 0.5, "reason": "Possible", "rejected_because": "Refusé par l'utilisateur"},
            ],
            "selected": "none", "reason": "Pas de voix demandée", "user_visible": True, "user_approved": True,
        },
    ],
}

write_checkpoint(PROJ, PID, "proposal", "completed", {"proposal_packet": pp, "decision_log": decision_log},
                 pipeline_type="animation", human_approval_required=True, human_approved=True,
                 metadata={"ab_test_variants": variants})
(ART / "proposal_packet.json").write_text(json.dumps(pp, ensure_ascii=False, indent=2), encoding="utf-8")
print("proposal approved ok")
