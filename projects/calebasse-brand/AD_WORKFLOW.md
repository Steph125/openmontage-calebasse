# Workflow — vidéos publicitaires Calebasse (base du futur système d'agents)

Version 1 — 2026-11-23. Éprouvé sur `calebasse-green-friday` (4 vidéos) et le lot de 6 vidéos « comme ça ».
Moteur retenu : **Remotion** (atelier). HyperFrames reste possible (builder `calebasse-green-friday/hf-build/`).

## Vue d'ensemble — 9 étapes, un rôle d'agent par étape (+ étape 10 : déclinaison des formats)

| # | Étape | Agent | Entrées | Sorties | Validation humaine |
|---|---|---|---|---|---|
| 1 | Brief | Chef de projet | demande, URL de référence, campagne | objectif, durée, format, son | — |
| 2 | Analyse de la référence | Analyste vidéo | URL Pinterest/Instagram/TikTok | planche d'images clés, 5 aspects, rythme, « ce qui marche » | — |
| 3 | Ancrage marque & campagne | Directeur artistique | page campagne, `labo.html`, logos | palette, police, motif signature, faits datés | — |
| 4 | Casting produit | Expert catalogue | `catalog/products.json` | produit + 2 alternatives, justification | **oui (proposition)** |
| 5 | Conformité | Juriste | textes prévus, prix | textes sans allégation santé, prix exacts | (intégré à 4) |
| 6 | Préparation des visuels | Préparateur | galerie Cloudinary, images d'ingrédients | packshots détourés, macros, décors | **oui (échantillon)** |
| 7 | Plan de scènes | Réalisateur | référence + produit | `scenes.md`, `art-direction.md` | selon politique |
| 8 | Fabrication | Motion designer | plan + visuels | composition Remotion | — |
| 9 | Contrôle & rendu | Contrôleur qualité | rendu | contact sheets, ffprobe, rapport | **oui (publication)** |
| 10 | Déclinaison des formats | Adaptateur de formats | master 9:16 validé | 1:1, 4:5, 1,91:1 (+ 9:16) | (formats demandés) |

## 1. Brief
- Toujours demander : produit imposé ou libre, campagne (evergreen / Green Friday…), son (muet / musique libre de droits / voix enregistrée par l'utilisateur), politique de validation (étape par étape ou d'une traite → `decision_log` `approval_policy`).
- Format par défaut : Reels 9:16, 1080×1920, 30 i/s. Garder les infos clés hors de la bande basse d'Instagram (scène réduite à ~92 %, carton remonté).

## 2. Analyse de la référence
- `video_analyzer` (profondeur standard, 16 images clés) → `projects/_references/refN-<code>/`.
- Planche d'images clés (`ref_sheets.py`) puis lecture **humaine** : sujet, mouvement, décor/surimpressions, cadrage, caméra, rythme (durée moyenne des plans), signature.
- Écrire « garde / change » : au moins un élément conservé, au moins un élément transformé (jamais de copie).

## 3. Ancrage marque & campagne
- Palette et police : lire les variables CSS de la page de campagne (`--gf-*`) ; Poppins embarquée localement.
- Faits de marque : uniquement ce qui est écrit sur calebasse.com (labo : 1997, Paris 13e, 3 000+ références, 700+ plantes, « Remonter à la source, respecter les gestes, contrôler chaque étape », Fabriqué en France…).
- Dates et remises de campagne : FAQ de la page de campagne.

## 4. Casting produit — `projects/calebasse-brand/catalog/`
- `crawl_catalog.py` reconstruit `products.json` à partir du sitemap (1 011 fiches) : nom, description, galerie Cloudinary (5–6 visuels : principal / vertus / goût / infusion / anecdote / packshot), prix, stock, note, fil d'Ariane, **ingrédients** (nom pinyin, latin, partie, médaillon image).
- Critères de choix, dans l'ordre : (1) le **format physique** colle à la grammaire de la référence (pot, sachet kraft, boîte, flacon, texture) ; (2) une **couleur ou une matière** qui répond à la référence ; (3) la **profondeur de galerie** (≥ 4 visuels) ; (4) la **preuve sociale** (note, nombre d'avis) ; (5) le stock ; (6) la saison.
- Toujours présenter le produit choisi + 2 alternatives notées.

## 5. Conformité (bloquant)
- Aucune allégation santé/thérapeutique (règlement CE 1924/2006) : afficher noms courts, origine, préparation, sensations (« chauffant », « floral »), surnoms traditionnels présentés comme tels (« le roi des herbes »).
- Les descriptions des fiches contiennent des allégations (« réduit le stress »…) : **ne jamais les reprendre** à l'écran.
- Prix barrés : uniquement ceux de la page, vérifiés carte par carte (règle du prix de référence 30 jours).
- « Jusqu'à -X % » toujours suivi de « sur une sélection » + mention en bas.
- Couleurs de texte : contraste WCAG AA (pastille corail `#BF4E39`, prix gris `#5E6B64`).

## 6. Préparation des visuels
- Utiliser les URL Cloudinary **telles que servies par le site** (pas de nouvelles transformations sur le compte de la marque).
- Détourage : `bg_remove` (rembg, local, gratuit) si installé ; sinon `catalog/cutout.py` (GrabCut OpenCV) + recadrage manuel des reflets.
- Macros : recadrer les photos « principal » (bol d'ingrédient) des galeries ; médaillons d'ingrédients (`ingredients[].image`, PNG 300 px).
- Décors réels si besoin : `pexels_image` / `pexels_video` (licence Pexels, usage commercial libre).
- **OneDrive** : copier `public/` dans `%TEMP%` avant chaque rendu Remotion (sinon 404 sur les fichiers synchronisés).

### Recettes de détourage (apprises sur le lot de 6)
| Cas | Méthode qui marche | Piège |
|---|---|---|
| Sachet kraft sur fond blanc | `bg_remove` `isnet-general-use` puis suppression du reflet (couper sous la dernière ligne opaque à > 18 %) | le reflet au sol est gardé |
| Sachet kraft sur carte vert forêt | **clé de couleur** HSV (vert 45–95, sat ≥ 35, val ≤ 150), plus grand blob, trous remplis, puis retirer la bande d'ombre sombre en bas | `rembg` prend le kraft pour du fond et ne garde que la fenêtre |
| Pot sombre sur fond sombre | `bg_remove` `u2net` | `isnet` laisse des morceaux de fond |
| Pot à couvercle argenté sur blanc | **union** masque `u2net` (étiquette) + GrabCut (couvercle), puis couper le reflet | chaque méthode seule perd une partie |
| Objets éparpillés sur fond clair (baies, boutons) | seuil saturation/valeur → composantes connexes → une PNG par objet | `rembg` ne garde que l'objet central |
| Bol rond partiellement caché | masque circulaire calculé + fondu, ou placer le bord coupé hors cadre | |
| Fleurs minuscules (osmanthus, camomille) | **les dessiner en code** (4 pétales / pompon) | les photos sont trop petites ou trop denses |
- Les galeries Cloudinary du site sont des cartes 1080 px : packshots en haute définition, mais les macros recadrées sont faibles. Pour du plein écran : photo Pexels originale (≥ 2 400 px) ou texture **générée en code** (relief SVG éclairé, cf. baume).
- Ne jamais zoomer sur une étiquette qui porte une allégation (ex. sachet goji « antioxydant, détoxifiant ») : faire le gros plan sur la matière.
- Vidéos de stock en mode « écran » (eau, fumée) : vérifier la frise du clip (`ffmpeg fps=1,tile`) — mains, gobelets, passages noirs — puis **écraser les noirs** (`contrast(1.7–1.9)`) et **estomper les bords** (masque radial), sinon un rectangle gris apparaît.

### Table « grammaire de référence → technique Remotion »
| Grammaire vue dans la référence | Technique |
|---|---|
| Gamme de variantes, un monde couleur par variante | rideaux de couleur décalés + macro + mot cinétique + produit héros + particules (avant/arrière-plan, flou de profondeur) + alignement final |
| Message de marque sur papier, loupe | page rendue deux fois : grise, et en couleur zoomée dans un `clipPath` circulaire |
| Film de texture monochrome | relief procédural (feTurbulence → feDisplacementMap → feDiffuse/SpecularLighting) + vraies macros à taille native |
| Couloir de produits identiques, mise au point | projection perspective calculée à la main, flou ∝ distance au plan net, brume atmosphérique, reflets au sol, fumée réelle en « écran » |
| Produit sur socle en extérieur + main | ciel photo, socle plâtre (texture lissée), ombres de feuillage masquées par l'alpha du produit, main détourée + produit posé sur la paume |
| Lévitation, gouttes, gerbe d'eau, îlot | gouttes masquées par l'alpha du produit, clips d'eau réels en « écran », photo de rocher + ombre de contact + étalonnage |

## 7. Plan de scènes
- `art-direction.md` (lecture du design, 3 curseurs, palette, typo, motif signature, règles d'honnêteté) + `scenes.md` (tableau des temps forts : images, sujet principal, action).
- Chaque temps fort a un sujet principal différent du précédent ; motif signature dans 1–2 temps forts maximum.

## 8. Fabrication (Remotion atelier)
- `projects/<slug>/` : `index.tsx`, `Root.tsx`, scène(s), `shared.tsx` propre au projet, `public/`, `artifacts/props.json`.
- Mécanique réutilisable (polices embarquées en micro-tâche, `<Img>` + `staticFile`, fonctions pures du temps, personnages « en pas de 2 ») ; **jamais** de composant créatif réutilisé d'une vidéo à l'autre.

## 9. Contrôle & rendu
- Images fixes clés (`npx remotion still`) → planche → corrections avant le rendu complet.
- Rendu via `video_compose` (atelier), puis ffprobe (durée, résolution, i/s) et planche d'images extraites du MP4.
- Relecture : prix = page, aucune allégation, texte lisible sur mobile, zone sûre Instagram, distinctivité (« pourrait-ce être une autre marque ? »).
- Checkpoints `assets` → `edit` → `compose` → `publish` (en attente de validation).

## 10. Déclinaison des formats (agent « Adaptateur de formats »)
Formats publicitaires standard : **1080×1920** (Reels/Stories), **1080×1350** (fil 4:5), **1080×1080** (fil 1:1), **1200×628** (annonce lien 1,91:1).
Rendus **muets** si l'utilisateur pose sa musique lui-même (durées : A = 12 s, C = 15 s).
- **Jamais de recadrage FFmpeg ni d'étirement** : le 9:16 validé est le *cadre de référence* ; chaque format en montre une fenêtre à **échelle uniforme** `k` (première ligne visible `top`), et seul le carton de fin est recomposé.
- Carton de fin par format : 9:16 = empilé (logo / titre / url / mentions) ; 4:5 et 1:1 = **bloc compact** sous les pieds d'échelle (logo | « Green Friday » + « dates · url », mentions dessous) ; 1,91:1 = **panneau marque** forêt à gauche (logo ivoire centré pendant l'action, qui monte quand le texte arrive ; url en pastille citron), scène collée à droite.
- Le panneau paysage sert aussi de **coulisse** : les personnages entrent de derrière son bord, comme ils entrent du bord du cadre en 9:16.
- Là où le canevas est plus large que la scène réduite (marges latérales), les personnages **attendent plus loin hors champ** et la sortie de scène est allongée, pour qu'on ne les voie jamais plantés dans la marge ; leur **cadence de pas** est multipliée par le même rapport, sinon les pieds glissent. Calcul automatique dans `resolveFormat()`.
- Garder les mêmes temps qu'au master (A/B test cohérent) ; si un carton de fin est trop court (< 2 s), le signaler plutôt que de rallonger seul.
- Texte réduit : refaire passer `hyperframes check` sur **chaque** format. Les gris fins perdent du contraste mesuré une fois réduits (prix barré `#5E6B64` → `#525E58` pour k ≤ 0,95).
- Vérifier que les masters régénérés restent **identiques à l'octet** (`cmp`) : les MP4 9:16 déjà validés restent alors valables.
- Implémentation de référence : `calebasse-green-friday/hf-build/build.mjs` (`FORMAT_SPECS`, `pageFmt`, `lockupCard`, `panelCard`). Contrôle visuel : `npx hyperframes snapshot --at …` dans chaque espace de travail avant le rendu complet.
