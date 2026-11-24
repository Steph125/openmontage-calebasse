"""approval_policy + sample approval, script and scene_plan checkpoints for calebasse-green-friday."""
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

decisions = {
    "version": "1.0",
    "project_id": PID,
    "decisions": [
        {
            "decision_id": "d-approval-policy-fullrun",
            "stage": "proposal",
            "category": "approval_policy",
            "subject": "Validations des étapes restantes",
            "options_considered": [
                {"option_id": "full_run", "label": "D'une traite jusqu'aux 4 vidéos finales", "score": 0.9, "reason": "Plan déjà montré (scenes.md) et échantillon validé"},
                {"option_id": "per_gate", "label": "Étape par étape (script, plan, assets)", "score": 0.6, "reason": "Plus de contrôle", "rejected_because": "Refusé par l'utilisateur"},
            ],
            "selected": "full_run",
            "reason": "Réponse utilisateur (2026-11-23) : « D'une traite » — script, scene_plan et assets pré-autorisés ; la publication reste soumise à validation des 4 vidéos finales.",
            "user_visible": True,
            "user_approved": True,
        },
        {
            "decision_id": "d-sample-approved",
            "stage": "proposal",
            "category": "motion_commitment",
            "subject": "Échantillon A-remotion",
            "options_considered": [
                {"option_id": "approve", "label": "Valider l'échantillon", "score": 1.0, "reason": "« c'est bon, poursuis avec les autres »"},
            ],
            "selected": "approve",
            "reason": "La direction artistique de l'échantillon s'applique aux 4 variantes",
            "user_visible": True,
            "user_approved": True,
        },
    ],
}

A = [
    ("A1", 0.0, 0.8, "BLACK FRIDAY (bannière noire) · calebasse.com visible en haut du téléphone"),
    ("A2", 0.8, 3.3, "Le rouleau barre « BLACK » d'un trait vert anis à −7°"),
    ("A3", 3.3, 5.8, "« GREEN » peint au-dessus, lettre par lettre"),
    ("A4", 5.8, 6.7, "Signe de tête, la bannière se soulève (anticipation)"),
    ("A5", 6.7, 8.2, "La bannière tombe — la page Green Friday apparaît : Black barré → Green, « Jusqu'à -70 % », « sur une sélection* », « Du 20 au 30 novembre »"),
    ("A6", 8.2, 10.1, "Défilement : « Nos incontournables » — Jujube bio -10 % 11,90 € → 10,71 € · Peau de mandarine -10 % 9,70 € → 8,73 € · Coffret Voyage en Chine -25 % 83,50 € → 62,62 € · Baies de goji premium -20 % 23,80 € → 19,04 €"),
    ("A7", 9.5, 10.8, "On range le Black Friday : le tas noir sort de l'image"),
    ("A8", 10.8, 12.0, "Logo Calebasse · « Green Friday · du 20 au 30 novembre » · calebasse.com · *Jusqu'à -70 % sur une sélection de matériel MTC, dans la limite des stocks."),
]
Cc = [
    ("C1", 0.0, 1.0, "Page Green Friday, vitrine vide (cases en pointillés) : « Jusqu'à -70 % », « Du 20 au 30 novembre »"),
    ("C2", 1.0, 4.0, "Premier carreau posé : Jujube bio -10 % 11,90 € → 10,71 €"),
    ("C3", 4.0, 8.7, "Relais : Peau de mandarine -10 % · Coffret Voyage en Chine -25 % · Baies de goji premium -20 % · Coffret Découverte de la MTC -25 % 88,90 € → 66,67 € · Coffret Beauté à la Chinoise -20 % 68,98 € → 55,18 €"),
    ("C4", 8.7, 10.7, "Vitrine complète ; « Black » barré, « Green » posé dans l'en-tête"),
    ("C5", 10.7, 13.0, "Coup de chiffon sur l'écran, tape-m'en cinq"),
    ("C6", 13.0, 15.0, "Logo Calebasse · « Green Friday · du 20 au 30 novembre » · calebasse.com · mention *"),
]
script = {
    "version": "1.0",
    "title": "Calebasse — Green Friday (A : Le chantier · C : La vitrine)",
    "total_duration_seconds": 12.0,
    "sections": [{"id": i, "text": t, "start_seconds": a, "end_seconds": b} for i, a, b, t in A]
    + [{"id": i, "text": t, "start_seconds": a, "end_seconds": b} for i, a, b, t in Cc],
    "metadata": {
        "narration": "none (user decision) — sections are on-screen text / visual beats",
        "timelines": {"A": {"duration_s": 12.0, "sections": [x[0] for x in A]}, "C": {"duration_s": 15.0, "sections": [x[0] for x in Cc]}},
        "hold_time_seconds": {"A5": 1.4, "A6": 1.2, "A8": 1.2, "C4": 1.5, "C6": 2.0},
        "fact_check": "prix et remises copiés de artifacts/products.json (vérifiés carte par carte le 2026-11-23)",
    },
}

def scene(id_, a, b, desc, subject, motion, setting, framing, overlays):
    return {
        "id": id_, "type": "animation", "script_section_id": id_,
        "description": f"{desc}. Sujet : {subject}. Mouvement du sujet : {motion}. Décor : {setting}.",
        "start_seconds": a, "end_seconds": b,
        "framing": framing,
        "movement": "Caméra : plan fixe verrouillé, hauteur des yeux, frontal, tout net, vitesse réelle (personnages en pas de 2 = 15 i/s)",
        "overlay_notes": "; ".join(f"{o['content']} — {o['placement']}" for o in overlays) if overlays else "Aucune surimpression (N/A)",
        "shot_language": {"shot_size": "wide", "camera_movement": "static"},
    }

STUDIO = "Studio crème #F7F5EE, sol sable, ombre de contact sous le téléphone ; pas de météo ni particules"
FRAME = "Plan large centré ; téléphone géant 600×1232 au centre (≈64 % de la hauteur, scène à 92 %) ; échelles aux bords ; ouvriers au sol au premier plan"
scenes = [
    scene("A1", 0.0, 0.8, "Installation : bannière noire BLACK FRIDAY sur le téléphone", "Téléphone géant + bannière noire + 4 ouvriers", "Bannière qui respire ; l'ouvrier au rouleau s'accroupit (anticipation)", STUDIO, FRAME, []),
    scene("A2", 0.8, 3.3, "Le rouleau barre BLACK", "Le trait de peinture vert anis", "Perche en arc, rouleau de gauche à droite à −7°, deux coulures", STUDIO, FRAME, []),
    scene("A3", 3.3, 5.8, "GREEN peint au pinceau", "Le mot GREEN", "Pinceau en tête, révélation lettre à lettre, rebond final", STUDIO, FRAME, []),
    scene("A4", 5.8, 6.7, "Signe de tête des ouvriers des échelles", "Les deux ouvriers des échelles", "Hochement, bannière soulevée de 10 px", STUDIO, FRAME, []),
    scene("A5", 6.7, 8.2, "Chute de la bannière, révélation de la page", "La bannière qui tombe / l'écran", "Chute en gravité (coin gauche 3 images avant le droit), tas qui s'écrase et rebondit, reflet sur l'écran", STUDIO, FRAME, []),
    scene("A6", 8.2, 10.1, "Défilement de la page vers les 4 produits", "La page produits", "Défilement doux, pastilles qui sautent en cascade, prix barrés", STUDIO, FRAME, []),
    scene("A7", 9.5, 10.8, "On range le Black Friday", "Le tas noir emporté", "Les deux ouvriers au sol tirent le tas hors champ à droite en marchant", STUDIO, FRAME, []),
    scene("A8", 10.8, 12.0, "Carton de fin", "Logo + dates", "Apparition décalée ; les ouvriers des échelles saluent", STUDIO, FRAME,
          [{"content": "Logo Calebasse, « Green Friday · du 20 au 30 novembre », calebasse.com, mention *", "placement": "sous le téléphone, centré, y≈1530–1740"}]),
    scene("C1", 0.0, 1.0, "Vitrine vide", "La page avec 6 cases vides", "Un ouvrier des échelles tapote l'écran", STUDIO, FRAME, []),
    scene("C2", 1.0, 4.0, "Premier carreau", "Un ouvrier portant le carreau Jujube", "Entrée par la gauche, passe le carreau à l'échelle, le carreau s'emboîte, pastille + prix", STUDIO, FRAME, []),
    scene("C3", 4.0, 8.7, "Le relais", "Les carreaux produits successifs", "Carreaux apportés des deux côtés, passés et emboîtés au rythme", STUDIO, FRAME, []),
    scene("C4", 8.7, 10.7, "Vitrine complète", "La grille de 6 produits", "Recul de l'équipe ; « Black » se barre et « Green » se pose dans l'en-tête", STUDIO, FRAME, []),
    scene("C5", 10.7, 13.0, "L'inspection", "Le coup de chiffon", "Balayage brillant sur l'écran ; tape-m'en cinq au sol", STUDIO, FRAME, []),
    scene("C6", 13.0, 15.0, "Carton de fin", "Logo + dates", "Apparition décalée ; saluts", STUDIO, FRAME,
          [{"content": "Logo Calebasse, « Green Friday · du 20 au 30 novembre », calebasse.com, mention *", "placement": "sous le téléphone, centré"}]),
]
scene_plan = {
    "version": "1.0",
    "style_playbook": "custom",
    "scenes": scenes,
    "metadata": {
        "variants": ["A-remotion", "A-hyperframes", "C-remotion", "C-hyperframes"],
        "beat_source": "scenes.md",
        "transition_rules": "Aucune coupe : un seul plan par concept ; les temps forts s'enchaînent par l'action",
        "hold_rules": "Page produits ≥1,2 s lisible ; carton de fin ≥1,2 s (A) / 2 s (C)",
        "animatic_rules": "Personnages en pas de 2 ; téléphone, bannière, page à 30 i/s",
        "reuse_strategy": {"recurring_motifs": ["téléphone géant", "équipe de 4 ouvriers", "trait −7° + GREEN"], "unique_scene_count": 14},
    },
}

write_checkpoint(PROJ, PID, "proposal", "completed", {"proposal_packet": json.loads((ART / "proposal_packet.json").read_text(encoding="utf-8")), "decision_log": decisions},
                 pipeline_type="animation", human_approval_required=True, human_approved=True,
                 metadata={"sample": "assets/sample/sample_v1_A_remotion.mp4", "sample_status": "approved"})
write_checkpoint(PROJ, PID, "script", "completed", {"script": script}, pipeline_type="animation",
                 human_approval_required=True, human_approved=True, metadata={"approved_via": "approval_policy d-approval-policy-fullrun"})
write_checkpoint(PROJ, PID, "scene_plan", "completed", {"scene_plan": scene_plan}, pipeline_type="animation",
                 human_approval_required=True, human_approved=True, metadata={"approved_via": "approval_policy d-approval-policy-fullrun"})
(ART / "script.json").write_text(json.dumps(script, ensure_ascii=False, indent=2), encoding="utf-8")
(ART / "scene_plan.json").write_text(json.dumps(scene_plan, ensure_ascii=False, indent=2), encoding="utf-8")
print("script + scene_plan ok")
