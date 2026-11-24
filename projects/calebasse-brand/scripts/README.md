# Scripts de travail (sessions du 23-24/11/2026)

Scripts écrits pendant la production des pubs Calebasse (Green Friday, lot de 6 vidéos « comme ça », déclinaisons de formats).
Ils servent de base au futur système d'agents : chaque étape de `../AD_WORKFLOW.md` y a son équivalent.
La racine OpenMontage est calculée depuis l'emplacement du fichier : ils marchent quel que soit le dossier d'installation.
Lancer depuis la racine OpenMontage avec l'environnement `.venv` : `.venv\Scripts\python projects\calebasse-brand\scripts\<script>.py`.
Certains écrivent des planches de contrôle dans un dossier temporaire ; les `gf_*` / `batch2_*` sont propres à un lot (à lire comme exemples).

| Script | Rôle |
|---|---|
| `analyze_refs.py` | Analyze the 6 Pinterest references with video_analyzer (standard depth). |
| `asset_sheet.py` | Contact sheet of every image in projects/<pid>/public/img on a mid-grey background (shows cutout edges). |
| `batch2_approve.py` | Record the user's approval for the 6-video batch (products, rembg, muet, d'une traite). |
| `batch2_docs.py` | Write art-direction.md + scenes.md for the 6 batch-2 projects. |
| `batch2_fetch.py` | Download each project's product galleries + ingredient images (served Cloudinary URLs, unchanged). |
| `batch2_finish.py` | script → publish checkpoints for the 6 batch-2 projects (approved via approval_policy full_run). |
| `batch2_init.py` | Init the 6 reference-driven Calebasse ad projects: project.json, research (completed), proposal (awaiting_human). |
| `batch2_prep.py` | Asset prep for the 6 videos: crops, rembg cutouts (bg_remove tool), particle extraction. |
| `batch2_prep2.py` | Second asset pass: chroma-key kraft bags on green, reflection removal, GrabCut, colour-threshold particles, text-free crops. |
| `gf_approve.py` | Record the user's proposal approval (A + C, Remotion + HyperFrames, no music, no voice). |
| `gf_finish.py` | assets, edit, compose (completed) and publish (awaiting_human) checkpoints for calebasse-green-friday. |
| `gf_research_proposal.py` | Write research_brief (completed) and proposal_packet (awaiting_human) for calebasse-green-friday. |
| `gf_script_scene.py` | approval_policy + sample approval, script and scene_plan checkpoints for calebasse-green-friday. |
| `localpub.py` | OneDrive turns synced files into reparse points that Remotion's public-dir server does not list (404). |
| `parse_cards.py` | Parse product cards (li.gc) from the saved Calebasse Green Friday page. |
| `pexels_get.py` | Download chosen Pexels photos/videos by id into project asset folders, with attribution. |
| `pexels_scout.py` | Scout Pexels photos/videos for decor elements; writes a contact sheet per query (thumbnails only). |
| `ref_sheets.py` | One contact sheet per reference from its keyframes (labelled with timestamps). |
| `render_batch2.py` | Render the 6 batch-2 Remotion atelier compositions through video_compose, one after the other. |
| `render_formats.py` | Render the 6 Green Friday format variants (HyperFrames atelier workspaces) through video_compose, sequentially. |
| `render_hf.py` | Render an authored HyperFrames workspace through video_compose: render_hf.py <workspace_dir_name> <output_rel> |
| `render_remotion.py` | Render a Remotion atelier composition through video_compose: render_remotion.py <comp_id> <output_rel> [scale] |
| `stills.py` | Stage the atelier project and render stills at given frames: stills.py <comp_id> <out_dir> <frame> [frame...] |
| `stills_any.py` | stills_any.py <project_id> <comp_id> <frames comma list> [scale] → stills + a tiled contact sheet in scratchpad/st_<pid>/ |
