---
name: project-calebasse-ad-workflow
description: User wants the Calebasse ad-video workflow retained to build their own custom agent system; written at projects/calebasse-brand/AD_WORKFLOW.md; Remotion is the chosen runtime
metadata:
  node_type: memory
  type: project
  originSessionId: 521ff7c2-1796-418e-aeb3-4f6669490ff8
  modified: 2026-11-24T10:17:18.455Z
---

2026-11-23: user asked to "retenir le workflow" of reference-driven Calebasse ads because it will become **their own custom agent system for advertising videos**, and to make it "le plus soigné possible". The living spec is `projects/calebasse-brand/AD_WORKFLOW.md` (9 steps, one agent role per step) — update it whenever the process changes.

Key decisions: runtime **Remotion** "pour le moment" (HyperFrames builds kept as an option); every video must pick the **best-suited product from the whole catalog** (user insisted), using `projects/calebasse-brand/catalog/products.json` (1 011 products, galleries + ingredients, rebuilt by `crawl_catalog.py`); product images come from Cloudinary URLs served by the site.

Batch 2 (2026-11-23): 6 reference-driven ads rendered (fleurs-gamme, 3-gestes/astragale, baume-rouge, ginseng-allee, goji-socle, perle-source), muet, evergreen (no promo tag), approval_policy « d'une traite »; publish gate still awaiting the user. Shared mechanics kit: `projects/calebasse-brand/remotion-kit/kit.tsx`.

2026-11-24: user asked for the Green Friday **HyperFrames A and C** in the 4 ad formats 1080x1080, 1080x1350, 1080x1920, 1200x628, **silent (they add music themselves)**. Done by re-layout (uniform window of the 9:16 frame + per-format end card), now step 10 of AD_WORKFLOW.md; expect every future ad to need these 4 formats.

**Why:** the user is formalising a repeatable ad pipeline for the brand.
**How to apply:** follow AD_WORKFLOW.md step by step, always present chosen product + 2 alternatives with reasons, keep the compliance step blocking, and refine the doc after each batch. See [[project-mtc-shorts]], [[reference-render-env-quirks]].
