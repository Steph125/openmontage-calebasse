"""Write research_brief (completed) and proposal_packet (awaiting_human) for calebasse-green-friday."""
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
ART.mkdir(parents=True, exist_ok=True)
PAGE = "https://calebasse.com/pages/black-friday-bien-etre-sante-beaute"
REF = "https://pin.it/kcJKeGtua"

research_brief = {
    "version": "1.0",
    "topic": "Short Instagram 9:16 pour le Green Friday Calebasse (20–30 nov. 2026), inspiré d'une pub « ouvriers miniatures + bannière Black Friday »",
    "research_date": "2026-11-23",
    "research_summary": (
        "Calebasse ne fait pas un Black Friday mais un « Green Friday » (son propre nom, sans promesse écologique), "
        "du 20 au 30 novembre 2026, de -5 % à -70 % (les -70 % portent sur une sélection de matériel MTC). "
        "Le site met déjà en scène ce renommage : « Black » barré d'un trait vert anis incliné à -7°, « Green » écrit au-dessus. "
        "La référence Pinterest (5 s, IA photoréaliste) fonctionne par contraste d'échelle (ouvriers miniatures / téléphone géant) "
        "et par révélation (la bannière tombe, les produits apparaissent). L'approche la plus forte : garder le chantier miniature "
        "et la révélation, mais faire jouer aux ouvriers le geste de la marque (barrer BLACK, poser GREEN) avant la chute, "
        "en motion design vectoriel généré par code (gratuit, local), avec les vraies photos produits et les vrais prix."
    ),
    "landscape": {
        "existing_content": [
            {
                "title": "Black Friday AI content idea (Ai.visual.lab, Pinterest)",
                "url": REF,
                "source": "Pinterest",
                "angle": "Ouvriers miniatures déroulant une bannière BLACK FRIDAY devant un smartphone géant (page YSL/Douglas)",
                "what_it_covers": "Contraste d'échelle, révélation produit, plan fixe unique, palette noir/blanc",
                "what_it_misses": "Aucune marque propre, aucun texte d'offre lisible, aucun appel à l'action, rendu IA générique",
                "engagement_signal": "Format « idée de contenu IA » largement repartagé sur Pinterest",
            },
            {
                "title": "Page Green Friday Calebasse",
                "url": PAGE,
                "source": "calebasse.com",
                "angle": "Black barré → Green, « Jusqu'à -70 % » en vert anis sur vert forêt",
                "what_it_covers": "Identité de campagne, 110 produits remisés, dates, FAQ",
                "what_it_misses": "Pas de version vidéo du motif « Black → Green »",
            },
            {
                "title": "6+ Viral AI Social Media Ad Examples (Anijam)",
                "url": "https://www.anijam.ai/blog/ai-social-media-video-ideas/",
                "source": "anijam.ai",
                "angle": "Mondes miniatures et produits géants comme formats courts viraux",
                "what_it_covers": "Le contraste d'échelle invite au revisionnage",
                "what_it_misses": "Pas de données chiffrées, source marketing",
            },
        ],
        "saturated_angles": [
            "Fonds noirs + gros pourcentages + compte à rebours (tout le fil Black Friday se ressemble)",
            "Rendus IA photoréalistes génériques de produits géants",
        ],
        "underserved_gaps": [
            "Une pub qui raconte le renommage Black → Green au lieu d'afficher une remise",
            "Le contraste d'échelle traité en illustration de marque plutôt qu'en photoréalisme IA",
        ],
    },
    "trending": {
        "recent_developments": [
            {
                "headline": "Le Black Friday 2026 tombe le vendredi 27 novembre ; Calebasse l'étend du 20 au 30 novembre",
                "url": PAGE,
                "date": "2026-11-23",
                "relevance": "La vidéo doit être livrée cette semaine pour servir l'opération en cours",
            },
            {
                "headline": "Mouvements « Green Friday » / Make Friday Green Again en France",
                "url": "https://www.quechoisir.org/actualite-black-friday-le-mouvement-de-boycott-prend-de-l-ampleur-n73407/",
                "date": "2025-11-01",
                "relevance": "Le terme « Green Friday » évoque souvent l'anti-consommation : ne pas laisser croire à un engagement écologique que la page ne revendique pas",
            },
        ],
        "timeliness_window": "Jusqu'au lundi 30 novembre 2026, 23 h 59",
    },
    "data_points": [
        {
            "claim": "Chez Calebasse, le Black Friday dure du vendredi 20 au lundi 30 novembre 2026 ; la plupart des remises courent jusqu'au 30 novembre 23 h 59.",
            "source_url": PAGE, "source_name": "FAQ de la page Green Friday", "credibility": "primary_source",
            "surprise_factor": "expected", "usable_as": "Carton final (dates)",
        },
        {
            "claim": "Remises de -5 % à -70 % selon les produits ; les plus fortes (-70 %) portent sur une sélection de matériel MTC.",
            "source_url": PAGE, "source_name": "FAQ de la page Green Friday", "credibility": "primary_source",
            "surprise_factor": "notable", "usable_as": "« Jusqu'à -70 % » + astérisque « sur une sélection »",
        },
        {
            "claim": "« Le Green Friday, c'est le nom que Calebasse donne à son Black Friday. »",
            "source_url": PAGE, "source_name": "FAQ de la page Green Friday", "credibility": "primary_source",
            "surprise_factor": "surprising", "usable_as": "Ressort narratif : les ouvriers renomment la bannière",
        },
        {
            "claim": "Toute annonce de réduction doit se référer au prix le plus bas pratiqué sur les 30 jours précédant la réduction.",
            "source_url": "https://www.economie.gouv.fr/particuliers/mes-droits-conso/bien-consommer/tout-savoir-sur-le-black-friday",
            "source_name": "economie.gouv.fr", "credibility": "primary_source",
            "surprise_factor": "expected", "usable_as": "N'afficher que les prix barrés exacts de la page, jamais de prix inventés",
        },
        {
            "claim": "Les allégations thérapeutiques sont interdites pour les compléments alimentaires ; seules les allégations autorisées (règlement CE 1924/2006) sont permises.",
            "source_url": "https://www.economie.gouv.fr/dgccrf/les-fiches-pratiques/allegations-nutritionnelles-et-de-sante",
            "source_name": "DGCCRF", "credibility": "primary_source",
            "surprise_factor": "expected", "usable_as": "Écran produit : noms courts sans bénéfice santé",
        },
        {
            "claim": "En 2025, 32 % des achats Black Friday des Français étaient 100 % en ligne (+7 points sur un an).",
            "source_url": "https://www.bcg.com/press/13november2025-black-friday-plus-de-7-francais-sur-10-comptent-en-profiter-dans-un-contexte-economique-toujours-contraint",
            "source_name": "BCG", "credibility": "secondary_source",
            "surprise_factor": "notable", "usable_as": "Justifie le téléphone comme vitrine",
        },
    ],
    "audience_insights": {
        "common_questions": [
            "Quand a lieu le Black Friday Calebasse ?",
            "Quelles remises ?",
            "Green Friday ou Black Friday : quelle différence ?",
        ],
        "misconceptions": [
            {
                "myth": "« Green Friday » signifie un boycott ou un engagement écologique",
                "reality": "Chez Calebasse, c'est le nom de son Black Friday (remises de -5 % à -70 %)",
                "source": PAGE,
            }
        ],
        "knowledge_level": "Clientèle Calebasse et curieux de MTC, à l'aise sur mobile, habitués aux promotions de fin d'année",
        "pain_points": ["Fil Instagram saturé de visuels Black Friday identiques", "Méfiance envers les fausses promotions"],
    },
    "angles_discovered": [
        {
            "name": "Le chantier du Green Friday",
            "hook": "Des ouvriers miniatures barrent « BLACK », écrivent « GREEN »… et la bannière tombe.",
            "type": "narrative",
            "why_now": "Reprend le motif exact de la page (Black barré → Green) pendant l'opération en cours",
            "grounded_in": ["Green Friday = nom du Black Friday Calebasse", "référence Pinterest"],
        },
        {
            "name": "Rideau vert typographique",
            "hook": "BLACK FRIDAY remplit l'écran — un trait vert le raye, et tout bascule au vert.",
            "type": "trending",
            "why_now": "Typographie cinétique, très lisible sans le son, tranche avec les fonds noirs saturés",
            "grounded_in": ["motion design en tête de Reels", "palette de campagne"],
        },
        {
            "name": "Les ouvriers remplissent la vitrine",
            "hook": "Une équipe miniature range les vrais produits Calebasse dans un téléphone vide, étiquette par étiquette.",
            "type": "evergreen",
            "why_now": "Montre les vrais produits et les vrais prix, construction plutôt que révélation",
            "grounded_in": ["110 produits remisés", "contraste d'échelle"],
        },
    ],
    "visual_references": [
        {"description": "Référence : 4 ouvriers, 2 échelles, smartphone géant, bannière noire qui tombe", "url": REF,
         "what_works": "Contraste d'échelle + révélation en un plan fixe"},
        {"description": "Héros de la page : vert forêt #0D3B2E, « -70 % » vert anis #C9EC7A, Poppins 800, « Black » barré à -7°", "url": PAGE,
         "what_works": "Identité immédiatement reconnaissable entre la pub et la page d'arrivée"},
    ],
    "sources": [
        {"url": PAGE, "title": "Black Friday 2026 : notre Green Friday jusqu'à -70 % · Calebasse", "used_for": "Identité, produits, prix, dates", "reliability": "primary"},
        {"url": REF, "title": "Black Friday AI content idea", "used_for": "Référence visuelle", "reliability": "primary"},
        {"url": "https://www.economie.gouv.fr/particuliers/mes-droits-conso/bien-consommer/tout-savoir-sur-le-black-friday", "title": "Tout savoir sur le Black Friday", "used_for": "Règle du prix de référence", "reliability": "primary"},
        {"url": "https://www.economie.gouv.fr/dgccrf/les-fiches-pratiques/allegations-nutritionnelles-et-de-sante", "title": "Allégations nutritionnelles et de santé (DGCCRF)", "used_for": "Garde-fous allégations", "reliability": "primary"},
        {"url": "https://www.bcg.com/press/13november2025-black-friday-plus-de-7-francais-sur-10-comptent-en-profiter-dans-un-contexte-economique-toujours-contraint", "title": "BCG Black Friday 2025", "used_for": "Part des achats en ligne", "reliability": "secondary"},
        {"url": "https://www.quechoisir.org/actualite-black-friday-le-mouvement-de-boycott-prend-de-l-ampleur-n73407/", "title": "Que Choisir — mouvement de boycott", "used_for": "Connotation du terme Green Friday", "reliability": "secondary"},
        {"url": "https://www.anijam.ai/blog/ai-social-media-video-ideas/", "title": "Viral AI Social Media Ad Examples", "used_for": "Tendance mondes miniatures", "reliability": "anecdotal"},
        {"url": "https://aiadvantageagency.com/black-friday-instagram-ads-ecommerce/", "title": "Black Friday Instagram Ads (2026)", "used_for": "Mouvement dès la première demi-seconde, éviter le look BFCM générique", "reliability": "anecdotal"},
        {"url": "https://en.wikipedia.com/wiki/Diorama_effect", "title": "Miniature faking", "used_for": "Technique : vue plongeante, flou de bord, mouvement accéléré", "reliability": "secondary"},
        {"url": "https://www.remotion.dev/docs/figma", "title": "Remotion — SVG", "used_for": "Technique : SVG animé, spring() pour la chute de bannière", "reliability": "primary"},
    ],
    "metadata": {
        "reference_context": {
            "reference_url": REF,
            "duration_s": 5.1, "resolution": "720x1280", "motion_type": "motion_clip (IA photoréaliste, plan fixe)",
            "keeps": ["contraste d'échelle", "révélation par chute de bannière", "plan fixe centré", "fond studio clair"],
            "changes": ["renommage Black → Green joué par les ouvriers", "illustration vectorielle de marque", "écran produit animé avec vrais prix", "carton dates + logo"],
        },
        "animation_techniques": [
            {"technique": "Bannière en tissu simulée : chemin SVG dont les plis suivent un spring() amorti + ombre portée", "mode": "remotion", "complexity": "moderate"},
            {"technique": "Trait de rature dessiné (stroke-dashoffset) à -7°, puis « GREEN » estampillé avec dépassement", "mode": "remotion", "complexity": "simple"},
            {"technique": "Personnages vectoriels à articulations (bras, tête) animés par keyframes, léger tremblé à 12 i/s pour l'effet maquette", "mode": "remotion", "complexity": "moderate"},
            {"technique": "Défilement de la page produit dans l'écran (masque + translateY), prix barré qui s'anime", "mode": "remotion", "complexity": "simple"},
        ],
    },
}

decision_log = {
    "version": "1.0",
    "project_id": PID,
    "decisions": [
        {
            "decision_id": "d-research-pipeline",
            "stage": "research",
            "category": "pipeline_selection",
            "subject": "Pipeline de production",
            "options_considered": [
                {"option_id": "animation", "label": "animation (motion design / animation d'abord)", "score": 0.9, "reason": "Pub de marque en motion design généré, sans narration obligatoire"},
                {"option_id": "animated-explainer", "label": "animated-explainer", "score": 0.5, "reason": "Pensé pour des explications narrées", "rejected_because": "Pas un format explicatif"},
                {"option_id": "cinematic", "label": "cinematic", "score": 0.3, "reason": "Montage de plans vidéo", "rejected_because": "Demanderait de la génération vidéo payante"},
            ],
            "selected": "animation",
            "reason": "Short promotionnel de 10–12 s en motion design généré par code",
            "user_visible": True,
        }
    ],
}

write_checkpoint(PROJ, PID, "research", "completed", {"research_brief": research_brief, "decision_log": decision_log},
                 pipeline_type="animation", metadata={"note": "Recherche légère (référence + page marque)"})
(ART / "research_brief.json").write_text(json.dumps(research_brief, ensure_ascii=False, indent=2), encoding="utf-8")
print("research checkpoint ok")

# ---------------------------------------------------------------- proposal
base_rules = [
    "Vraies photos produits Calebasse, vrais prix et prix barrés copiés de la page (aucun prix inventé)",
    "Noms de produits courts, sans bénéfice santé",
    "« Jusqu'à -70 % » toujours accompagné de « sur une sélection »",
    "Dates : du 20 au 30 novembre",
]

concepts = [
    {
        "id": "A",
        "title": "Le chantier du Green Friday",
        "hook": "Quatre ouvriers miniatures barrent « BLACK », peignent « GREEN »… puis lâchent la bannière.",
        "narrative_structure": "story",
        "visual_approach": (
            "Plan fixe, fond crème #F7F5EE, smartphone géant au centre. Ouvriers vectoriels en salopette vert forêt, deux sur des échelles. "
            "Une bannière noire BLACK FRIDAY couvre l'écran ; un ouvrier trace au rouleau un trait vert anis à -7° sur BLACK, un autre pose GREEN au-dessus "
            "(le motif exact du site). La bannière tombe en plis, la page Green Friday apparaît dans le téléphone et défile : « Jusqu'à -70 % » puis 4 vrais produits. "
            "Carton final logo + « Du 20 au 30 novembre »."
        ),
        "suggested_playbook": "custom (direction artistique Green Friday Calebasse)",
        "target_audience": "Clientèle Calebasse et curieux de MTC sur Instagram",
        "target_platform": "instagram",
        "target_duration_seconds": 12,
        "key_points": ["Black → Green joué à l'écran", "Révélation des vrais produits", "Dates + logo"],
        "core_message": "Chez Calebasse, le Black Friday est vert.",
        "cta": "Du 20 au 30 novembre sur calebasse.com",
        "tone": "Malin, chaleureux, artisanal",
        "grounded_in": ["Green Friday = nom du Black Friday Calebasse", "Motif Black barré du site", "Référence Pinterest"],
        "why_this_works": "Garde ce qui fait marcher la référence (miniatures + révélation) et ajoute une histoire en 3 secondes qui renvoie au visuel de la page d'arrivée.",
    },
    {
        "id": "B",
        "title": "Rideau vert",
        "hook": "BLACK FRIDAY remplit l'écran. Un trait vert le raye, et tout bascule au vert.",
        "narrative_structure": "comparison",
        "visual_approach": (
            "Typographie cinétique sans personnages : lettres BLACK FRIDAY géantes en Poppins 800, un coup de pinceau vert anis raye BLACK, "
            "GREEN s'estampille, puis les lettres se replient comme un rideau et dévoilent le téléphone ; les produits y tombent un à un avec leur prix barré."
        ),
        "suggested_playbook": "custom (direction artistique Green Friday Calebasse)",
        "target_platform": "instagram",
        "target_duration_seconds": 8,
        "key_points": ["Lisible sans le son", "Rythme rapide", "Produits en cascade"],
        "core_message": "Le Black Friday version Calebasse.",
        "cta": "Du 20 au 30 novembre sur calebasse.com",
        "tone": "Énergique, graphique",
        "grounded_in": ["Motif Black barré du site", "Mouvement dès la première demi-seconde"],
        "why_this_works": "Le plus court et le plus lisible en lecture automatique sans son ; s'éloigne de la référence (pas de miniatures).",
    },
    {
        "id": "C",
        "title": "Les ouvriers remplissent la vitrine",
        "hook": "Le téléphone est vide. Une équipe miniature y range les produits Calebasse, étiquette par étiquette.",
        "narrative_structure": "journey",
        "visual_approach": (
            "Même chantier miniature, mais construction au lieu de révélation : les ouvriers portent sur l'épaule un sachet de jujubes, un coffret, "
            "un pot de ginseng géants et les déposent dans les cases de la page ; chaque dépôt fait tomber l'étiquette du prix barré. Fin sur la grille complète + dates."
        ),
        "suggested_playbook": "custom (direction artistique Green Friday Calebasse)",
        "target_platform": "instagram",
        "target_duration_seconds": 15,
        "key_points": ["Produits mis en avant un par un", "Humour de chantier", "Grille finale"],
        "core_message": "Le Green Friday se prépare chez Calebasse.",
        "cta": "Du 20 au 30 novembre sur calebasse.com",
        "tone": "Tendre, artisanal",
        "grounded_in": ["110 produits remisés", "Contraste d'échelle"],
        "why_this_works": "Met chaque produit en valeur plus longtemps ; plus lent et plus long à produire.",
    },
]

proposal_packet = {
    "version": "1.0",
    "concept_options": concepts,
    "selected_concept": {
        "concept_id": "A",
        "rationale": "Recommandé (en attente de validation) : le plus fidèle à la référence aimée, et le seul qui raconte le renommage Black → Green de la marque.",
        "modifications": [],
    },
    "production_plan": {
        "pipeline": "animation",
        "playbook": "custom",
        "renderer_family": "product-reveal",
        "composition_mode": "atelier",
        "art_direction": (
            "Green Friday Calebasse : vert forêt #0D3B2E / #0A2C22, vert #1F6B4A, vert anis #C9EC7A, crème #F7F5EE, sable #F2E9D4, corail #E2725B (pastilles de remise), "
            "encre #14271F ; Poppins 600/800 ; trait de rature vert anis à -7° et « Green » incliné ; logo Calebasse ; vraies photos produits sur fond blanc."
        ),
        "taste_profile": {
            "design_read": "Pub de marque malicieuse et artisanale : un chantier miniature qui renomme le Black Friday en Green Friday, chaleureux plutôt que criard.",
            "visual_variance": 3,
            "motion_intensity": 6,
            "information_density": 3,
            "palette_discipline": "Crème + vert forêt dominants, vert anis réservé au geste Green et au -70 %, noir uniquement pour la bannière qu'on retire.",
            "layout_variation": "Un seul plan fixe (comme la référence), la variété vient de l'action et de l'écran du téléphone.",
            "reference_strategy": "Une image de style validée (le plan d'ouverture) avant de produire tout le mouvement.",
            "anti_patterns": ["Fond noir + gros pourcentages + compte à rebours", "Rendu IA photoréaliste générique", "Allégations santé", "Discours anti-consommation"],
            "quality_gates": ["On reconnaît la page Calebasse en une image", "Le prix affiché = le prix de la page", "Texte lisible sur mobile sans le son"],
        },
        "delivery_promise": {
            "promise_type": "motion_led",
            "motion_required": True,
            "source_required": False,
            "tone_mode": "playful_brand_promo",
            "quality_floor": "broadcast",
            "approved_fallback": None,
        },
        "music_source": {
            "source_type": "none",
            "mood_direction": "À choisir : piste Pixabay Music libre de droits, ou musique + bruitages synthétisés localement (échelle, rouleau, chute de tissu, « ding »)",
            "estimated_cost_usd": 0.0,
        },
        "voice_selection": {
            "provider": "enregistrement de l'utilisateur (optionnel)",
            "rationale": "L'utilisateur fournit ses propres voix ; un short de 12 s peut aussi fonctionner sans voix.",
            "estimated_cost_usd": 0.0,
        },
        "stages": [
            {"stage": "script", "tools": [], "approach": "Script en temps forts visuels (pas de narration obligatoire), textes à l'écran validés"},
            {"stage": "scene_plan", "tools": [], "approach": "Un plan fixe découpé en temps forts : installation, rature, GREEN, chute, défilement produits, carton"},
            {"stage": "assets", "tools": [
                {"tool_name": "image_selector", "role": "aucun appel prévu (photos produits déjà téléchargées de calebasse.com)", "provider": "n/a", "available": True, "estimated_cost_usd": 0.0},
                {"tool_name": "pixabay_music", "role": "piste musicale libre de droits (si choisie)", "provider": "pixabay", "available": True, "estimated_cost_usd": 0.0},
                {"tool_name": "audio_mixer", "role": "mixage musique + bruitages", "provider": "ffmpeg", "available": True, "estimated_cost_usd": 0.0},
            ], "approach": "Personnages, téléphone et bannière dessinés en code ; vraies photos produits"},
            {"stage": "compose", "tools": [
                {"tool_name": "video_compose", "role": "rendu atelier 1080x1920", "provider": "local", "available": True, "estimated_cost_usd": 0.0}
            ], "approach": "Rendu local, échantillon de 5 s d'abord"},
        ],
        "alternative_paths": [
            {"description": "Rendu photoréaliste via génération vidéo IA", "total_cost_usd": 0.0, "quality_level": "premium",
             "what_changes": "Non retenu : demande un fournisseur payant, que l'utilisateur ne souhaite pas"},
        ],
        "quality_tradeoffs": [
            {"tradeoff": "Illustration vectorielle au lieu du photoréalisme de la référence", "recommendation": "Assumer un style de marque dessiné", "quality_impact": "Plus distinctif, moins « IA générique »"},
        ],
    },
    "cost_estimate": {
        "total_estimated_usd": 0.0,
        "line_items": [
            {"tool": "video_compose", "operation": "rendu local Remotion ou HyperFrames", "estimated_usd": 0.0},
            {"tool": "pixabay_music", "operation": "recherche et téléchargement d'une piste (optionnel)", "estimated_usd": 0.0},
        ],
        "budget_cap_usd": 0.0,
        "budget_verdict": "within_budget",
    },
    "approval": {"status": "pending"},
}

write_checkpoint(PROJ, PID, "proposal", "awaiting_human", {"proposal_packet": proposal_packet},
                 pipeline_type="animation", human_approval_required=True,
                 metadata={"awaiting": ["concept", "render_runtime", "music", "voice"]})
(ART / "proposal_packet.json").write_text(json.dumps(proposal_packet, ensure_ascii=False, indent=2), encoding="utf-8")
print("proposal checkpoint awaiting_human ok")
