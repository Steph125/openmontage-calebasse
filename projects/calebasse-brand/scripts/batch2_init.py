"""Init the 6 reference-driven Calebasse ad projects: project.json, research (completed), proposal (awaiting_human)."""
import json
import shutil
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")
ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT))
from lib.checkpoint import init_project, write_checkpoint  # noqa: E402

PROJ = ROOT / "projects"
CAT = json.loads((PROJ / "calebasse-brand" / "catalog" / "products.json").read_text(encoding="utf-8"))
BYID = {p["id"]: p for p in CAT["products"] if p.get("name")}
LABO = "https://calebasse.com/pages/laboratoire"  # page text captured in projects/calebasse-brand/labo.html

ALTS = {
    1: ["Coffret de fleurs à infuser", "Tisane Éveil du Printemps"],
    2: ["Jujube Fruit entier bio", "Baies de Goji premium"],
    3: ["Baume Panacé Blanc", "Baume Citronnelle"],
    4: ["Cordyceps - Dong chong xia cao", "Reishi Extrait BIO"],
    5: ["Baume Panacé Rouge", "Gua sha en pierre de bian"],
    6: ["Reishi Extrait BIO", "Cordée des Montagnes"],
}
def find(prefix):
    return next(p for p in BYID.values() if p["name"].startswith(prefix))

V = [
    dict(pid="calebasse-fleurs-gamme", title="Calebasse — Fleurs à infuser (la gamme)", ref=1, code="2iRiCFRDL", dur=20,
         ref_read="Pub de gamme UCB « Spécial » : un univers couleur par parfum, fruits en explosion autour de la bouteille, gros mot cinétique sur macro, médaillon-logo par parfum, alignement final « Découvrez la nouvelle gamme ». 17 plans, ~1,75 s/plan.",
         products=["3872", "3794", "3790", "3873"],
         concept="Quatre fleurs, quatre mondes : Boutons de rose (magenta), Osmanthus (or), Camomille chinoise (citron pâle), Jasmin (jade). Pour chacune : volet couleur, macro réelle de la fleur (photo du site) + nom géant animé + caractère chinois en sceau, le sachet kraft au centre entouré de fleurs qui jaillissent, puis alignement final des 4 sachets « Nos fleurs à infuser ».",
         keep=["un monde couleur par variante", "ingrédients en explosion autour du produit", "mot géant sur macro", "alignement final de la gamme"],
         change=["vertical 9:16 et 20 s au lieu de 30 s paysage", "sceau chinois à la place du médaillon-logo", "vraies photos de fleurs du site"],
         why="Les 4 fleurs les mieux notées du catalogue (4,9★, 15 à 27 avis), même sachet kraft = vraie « gamme », chacune a une couleur forte."),
    dict(pid="calebasse-3-gestes", title="Calebasse — De la plante au flacon (3 choses comptent)", ref=2, code="4XmSh6mGp", dur=24,
         ref_read="Message de marque « 3 things matter » : papier quadrillé noir et blanc, loupe qui révèle « Clarity », mots qui passent du flou au net, icônes qui tombent, petite balance physique, transition brune, carton noir + logo. 4 séquences longues, ~8 s.",
         products=["4498"],
         concept="« Une plante, trois choses comptent » : la loupe révèle LA SOURCE (terroirs d'origine), LE GESTE (préparations traditionnelles), LE CONTRÔLE (identifier, contrôler, tracer) — tirés mot pour mot de la page Laboratoire. Fil rouge : une tranche de racine d'astragale (photo du site) en monochrome, la balance s'équilibre, transition vert forêt, carton logo + « Fabriqué en France ».",
         keep=["papier quadrillé monochrome", "loupe révélatrice", "mise au point flou → net", "balance physique minimaliste", "carton sombre + logo"],
         change=["contenu = la démarche qualité Calebasse (faits de la page Laboratoire)", "noir → vert forêt de la marque", "produit fil rouge : Racine d'astragale"],
         why="L'astragale est le best-seller du catalogue (4,8★, 106 avis) ; le format « 3 choses » colle exactement aux trois étapes « Remonter à la source, respecter les gestes, contrôler chaque étape »."),
    dict(pid="calebasse-baume-rouge", title="Calebasse — Baume Panacé Rouge (texture)", ref=3, code="1GukzHSpw", dur=12,
         ref_read="Film texture Vivienne Sabo : camaïeu rose-mauve, tube en lévitation avec reflet, macro de l'étiquette, vagues de crème en très gros plan, noisette de crème, spatule, tube posé sur la crème. 9 plans courts (~1,3 s), lumière douce.",
         products=["5314"],
         concept="Camaïeu rouge lithosperme : la boîte flotte avec son reflet, macro du couvercle « Baume Panacé Rouge », vagues de baume rouge en très gros plan, une spatule qui le prélève, la boîte ouverte posée sur la texture, carton « chaleur & réconfort ».",
         keep=["monochrome d'une seule teinte", "macro de texture", "lévitation + reflet", "spatule", "rythme 1–1,5 s/plan"],
         change=["rose-mauve → rouge naturel du lithosperme", "tube → boîte ronde métallique", "saison : baume chauffant pour l'hiver"],
         why="Seuls produits « texture » du catalogue : les baumes. Le Rouge a une vraie couleur (lithosperme) qui fait écho au camaïeu de la référence, et il est de saison (chauffant)."),
    dict(pid="calebasse-ginseng-allee", title="Calebasse — Racine de Ginseng (l'allée)", ref=4, code="59sJWLdvp", dur=13,
         ref_read="Sérum Healthia : couloir infini de flacons identiques, mise au point qui s'arrête sur celui du centre, contre-plongées de l'étiquette, brume qui monte, vert sauge. Un seul mouvement continu, pas de coupe.",
         products=["4679"],
         concept="Une allée infinie de pots de ginseng en vert forêt : travelling avant continu, flou de profondeur, la mise au point se pose sur le pot central, contre-plongée sur « Racine de Ginseng · 人参 », brume chaude qui monte, puis la macro des tranches de racine et le surnom « Le roi des herbes ».",
         keep=["couloir de produits identiques", "mise au point sur le héros", "brume", "plan continu", "camaïeu vert"],
         change=["sérum → pots de racine (l'étiquette verte de la marque)", "ajout d'un plan macro des tranches de racine", "surnom traditionnel en signature"],
         why="Le packshot officiel montre déjà 3 pots alignés à étiquette vert forêt (4,7★, 45 avis) : la répétition du couloir est native au produit."),
    dict(pid="calebasse-goji-socle", title="Calebasse — Baies de Goji premium (le socle)", ref=5, code="3cn23RezE", dur=10,
         ref_read="Stick Medicube : produit rouge et blanc sur socle de plâtre, ciel bleu et ombres de palmes, macro de l'étiquette, main qui saisit le produit (UGC). 2–3 plans, ~5 s.",
         products=["3832"],
         concept="Le sachet de goji sur un socle de pierre sous un ciel d'été, ombres de feuillage qui bougent, macro de l'étiquette « Baies de Goji » puis des baies rouges par la fenêtre du sachet, une main qui le saisit, carton « Première récolte ».",
         keep=["socle + ciel + ombres végétales", "macro d'étiquette", "main qui saisit le produit", "3 plans"],
         change=["rouge cosmétique → rouge des baies", "palmes → feuillage de goji", "accroche « première récolte » (fait de la page produit)"],
         why="Le produit rouge emblématique (4,9★, 98 avis) ; la récolte d'été justifie le ciel et la lumière de la référence."),
    dict(pid="calebasse-perle-source", title="Calebasse — Poudre de perle (la source)", ref=6, code="11ASPTq0T", dur=16,
         ref_read="Sérum Relance Ritual : flacon ambré dans une lumière filtrée par des plantes, lévitation avec gouttes d'eau, rotation, gerbe d'eau autour du flacon, diorama de mousse posé sur l'eau, carton noir RELANCE. 5 plans, ~3,4 s.",
         products=["4279"],
         concept="« Perles d'eau douce finement broyées » : le pot vert sous une lumière tamisée de feuillage, une perle qui roule, le pot en lévitation perlé de gouttes, une gerbe d'eau, le pot sur un îlot de mousse au milieu de l'eau, carton CALEBASSE.",
         keep=["lumière filtrée par les plantes", "lévitation + gouttes", "gerbe d'eau", "diorama mousse + eau", "carton sobre"],
         change=["flacon ambré → pot vert de la marque + une perle", "l'eau devient le récit (perles d'eau douce)", "carton vert forêt au lieu du noir"],
         why="Le récit du produit est littéralement l'eau douce (4,8★, 61 avis) ; l'eau et la nature de la référence deviennent son origine."),
]

for v in V:
    pid = v["pid"]
    init_project(pid, title=v["title"], pipeline_type="animation", series="Calebasse")
    ref_dir = PROJ / "_references" / f"ref{v['ref']}-{v['code']}"
    dst = PROJ / pid / "reference"
    dst.mkdir(parents=True, exist_ok=True)
    for kf in sorted((ref_dir / "keyframes").glob("*.jpg"))[:6]:
        shutil.copy2(kf, dst / kf.name)
    prods = [BYID[i] for i in v["products"]]
    alts = [find(a) for a in ALTS[v["ref"]]]
    short = lambda p: p["name"].split(" - ")[0].split(" – ")[0]
    rat = lambda p: f"{(p.get('rating') or {}).get('ratingValue', '–')}★ ({(p.get('rating') or {}).get('reviewCount', 0)} avis)"
    research = {
        "version": "1.0",
        "topic": v["title"],
        "research_date": "2026-11-23",
        "research_summary": f"Référence : {v['ref_read']} Produit choisi dans le catalogue complet (1 011 fiches) : {', '.join(p['name'].split(' - ')[0] for p in prods)}. {v['why']}",
        "landscape": {
            "existing_content": [{"title": f"Référence Pinterest {v['code']}", "url": f"https://pin.it/{v['code']}", "source": "Pinterest", "angle": "référence visuelle", "what_it_covers": v["ref_read"], "what_it_misses": "Pas de marque Calebasse ni de produit de pharmacopée chinoise"}]
            + [{"title": p["name"], "url": p["url"], "source": "calebasse.com", "angle": "galerie produit (visuels de marque)", "what_it_covers": f"{len(p.get('images') or [])} visuels de galerie, {rat(p)}", "what_it_misses": "aucune vidéo produit"} for p in prods[:2]]
            + [{"title": "Page Green Friday Calebasse", "url": "https://calebasse.com/pages/black-friday-bien-etre-sante-beaute", "source": "calebasse.com", "angle": "campagne en cours", "what_it_covers": "identité de campagne", "what_it_misses": "pas de vidéo"}],
            "saturated_angles": ["rendus IA photoréalistes génériques"],
            "underserved_gaps": ["la même grammaire appliquée à des plantes MTC réelles, avec leurs vraies photos"],
        },
        "data_points": [
            {"claim": f"{p['name']} — {p['rating'].get('ratingValue', '–')}★ ({p['rating'].get('reviewCount', 0)} avis) ; ingrédients : {', '.join(g['title'] + ' (' + (g['latin'] or '') + ')' for g in p['ingredients']) or 'mono-plante'}",
             "source_url": p["url"], "source_name": "fiche produit calebasse.com", "credibility": "primary_source", "surprise_factor": "expected", "usable_as": "choix produit / textes"}
            for p in prods
        ] + [
            {"claim": f"Alternative étudiée : {p['name']} — {rat(p)}", "source_url": p["url"], "source_name": "fiche produit calebasse.com", "credibility": "primary_source", "surprise_factor": "expected", "usable_as": "produit alternatif"}
            for p in alts
        ] + [{"claim": "Les allégations thérapeutiques sont interdites ; n'afficher que des noms de produits, des faits d'origine/préparation et des sensations.", "source_url": "https://www.economie.gouv.fr/dgccrf/les-fiches-pratiques/allegations-nutritionnelles-et-de-sante", "source_name": "DGCCRF", "credibility": "primary_source", "surprise_factor": "expected", "usable_as": "garde-fou textes"}],
        "audience_insights": {"common_questions": ["Comment s'utilise ce produit ?", "D'où vient-il ?", "Qu'est-ce qui le distingue ?"], "misconceptions": [], "knowledge_level": "Clientèle Calebasse et curieux de MTC sur Instagram"},
        "angles_discovered": [{"name": v["title"], "hook": v["concept"][:140], "type": "evergreen", "why_now": "Format de la référence choisie par l'utilisateur", "grounded_in": [v["why"]]}]
        + [{"name": f"Même grammaire avec {short(p)}", "hook": f"La référence appliquée à {short(p)}", "type": "evergreen", "why_now": "alternative produit", "grounded_in": [rat(p)]} for p in alts],
        "sources": [{"url": f"https://pin.it/{v['code']}", "title": "Référence", "used_for": "grammaire visuelle", "reliability": "primary"}]
        + [{"url": p["url"], "title": p["name"], "used_for": "produit, photos, ingrédients", "reliability": "primary"} for p in prods + alts]
        + [{"url": "https://www.economie.gouv.fr/dgccrf/les-fiches-pratiques/allegations-nutritionnelles-et-de-sante", "title": "DGCCRF allégations", "used_for": "garde-fous textes", "reliability": "primary"}]
        + ([{"url": LABO, "title": "Laboratoire Calebasse", "used_for": "les 3 étapes qualité", "reliability": "primary"}] if v["ref"] == 2 else []),
        "metadata": {"reference_dir": str(ref_dir.relative_to(ROOT)), "products": v["products"]},
    }
    write_checkpoint(PROJ, pid, "research", "completed", {"research_brief": research}, pipeline_type="animation")
    proposal = {
        "version": "1.0",
        "concept_options": [{
            "id": "main", "title": v["title"], "hook": v["concept"][:200], "narrative_structure": "story",
            "visual_approach": v["concept"], "target_platform": "instagram", "target_duration_seconds": v["dur"],
            "key_points": v["keep"], "why_this_works": v["why"], "grounded_in": [f"https://pin.it/{v['code']}"] + [p["url"] for p in prods],
        }] + [{
            "id": f"alt{k + 1}", "title": f"Variante produit : {short(p)}", "hook": f"Même grammaire, produit {short(p)}", "narrative_structure": "story",
            "visual_approach": f"Même construction que la proposition principale, appliquée à {p['name']}", "target_platform": "instagram",
            "target_duration_seconds": v["dur"], "key_points": ["même grammaire de référence", "produit alternatif"],
            "why_this_works": f"Alternative étudiée — {rat(p)}", "grounded_in": [p["url"]],
        } for k, p in enumerate(alts)],
        "selected_concept": {"concept_id": "main", "rationale": "Proposition principale (en attente de validation)", "modifications": [f"Garde : {', '.join(v['keep'])}", f"Change : {', '.join(v['change'])}"]},
        "production_plan": {
            "pipeline": "animation", "renderer_family": "product-reveal", "composition_mode": "atelier",
            "delivery_promise": {"promise_type": "motion_led", "motion_required": True, "tone_mode": "premium_product_ad", "quality_floor": "broadcast", "approved_fallback": None},
            "stages": [{"stage": "assets", "tools": [{"tool_name": "image_selector", "role": "photos produit (galerie Cloudinary du site) + images libres d'ingrédients/décors si besoin", "available": True, "estimated_cost_usd": 0.0}], "approach": "vraies photos produit détourées"},
                       {"stage": "compose", "tools": [{"tool_name": "video_compose", "role": "rendu Remotion atelier 1080x1920", "available": True, "estimated_cost_usd": 0.0}], "approach": "Remotion (choix utilisateur)"}],
        },
        "cost_estimate": {"total_estimated_usd": 0.0, "line_items": [{"tool": "video_compose", "operation": "rendu local", "estimated_usd": 0.0}], "budget_verdict": "within_budget"},
        "approval": {"status": "pending"},
    }
    write_checkpoint(PROJ, pid, "proposal", "awaiting_human", {"proposal_packet": proposal}, pipeline_type="animation", human_approval_required=True)
    (PROJ / pid / "artifacts").mkdir(exist_ok=True)
    (PROJ / pid / "artifacts" / "proposal_packet.json").write_text(json.dumps(proposal, ensure_ascii=False, indent=2), encoding="utf-8")
    print("ok", pid, "| products:", [BYID[i]["name"][:40] for i in v["products"]])
