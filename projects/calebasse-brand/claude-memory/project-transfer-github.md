---
name: project-transfer-github
description: OpenMontage + all projects/ moved to a new PC via the private repo Steph125/openmontage-calebasse (main = branch calebasse); how to save work and pull OpenMontage updates
metadata:
  node_type: memory
  type: project
  originSessionId: 521ff7c2-1796-418e-aeb3-4f6669490ff8
  modified: 2026-11-24T14:38:37.513Z
---

2026-11-24: the user is **replacing their PC**. The whole install, including `projects/` (gitignored upstream), was pushed to the **private** GitHub repo `Steph125/openmontage-calebasse`. Its `main` = the local branch `calebasse` = upstream `calesthio/OpenMontage` main + tracked `projects/` (only caches and >100 MB files excluded in `.gitignore`). Remotes: `origin` = private repo, `upstream` = calesthio/OpenMontage.

Not in the repo: `.env` (user re-enters PEXELS_API_KEY and PIXABAY_API_KEY, the only keys set), caches, and `projects/horloge-organes/renders/horloge-organes_v1.mp4` / `_v2.mp4` (156 MB each, above GitHub's limit, still on OneDrive).

New-PC setup: guide `NOUVEAU_PC.md`, script `projects/calebasse-brand/setup/setup_nouveau_pc.ps1`. Python of the project = `.venv\Scripts\python.exe` (3.13; exact packages in `projects/calebasse-brand/setup/requirements-venv-lock.txt`, incl. rembg/OpenCV/faster-whisper). Working scripts from the ad sessions: `projects/calebasse-brand/scripts/` (paths computed from file location).

**Why:** this repo is the only copy of the user's work that travels between machines; the old PC is being retired.
**How to apply:** at the end of a work session, offer to commit `projects/` and `git push origin calebasse:main` (or `main` on the new clone). Update OpenMontage with `git fetch upstream` + `git merge upstream/main`. Never push to upstream, never commit `.env`, add any file > 100 MB to `.gitignore`. See [[reference-render-env-quirks]], [[project-calebasse-ad-workflow]].
