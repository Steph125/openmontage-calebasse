---
name: project-mtc-shorts
description: "User produces French TCM (médecine traditionnelle chinoise) vertical shorts with OpenMontage, 20–40/month, free local path; what styles they liked"
metadata:
  node_type: memory
  type: project
  originSessionId: d24cc014-8447-4da9-a140-c9cf6af0ae61
  modified: 2026-11-23T14:12:36.201Z
---

User (French-speaking) is building a series of vertical 9:16 shorts on médecine traditionnelle chinoise, target 20–40 videos/month, starting on the free local path (Piper TTS fr_FR-siwis, Remotion atelier, synthesized sound, Pexels/Pixabay keys set, FFmpeg via winget).

- 2026-09-30: stills + Ken Burns samples (astragale-encre / astragale-nature) were judged unsatisfying ("pousse les limites de l'animation et du motion design").
- Loved `projects/horloge-organes` (fully generated particles, 3D wheel, word-synced events via Whisper timestamps, synthesized SFX).
- Then asked for an "épurée et naturelle" autumn rituals piece → `projects/rituels-automne` (light paper, line drawings, ginkgo motif).

- User explicitly does NOT want fixed reusable styles/templates: themes vary constantly and follow trends, so each video gets its own bespoke art direction.
- Themes can come from a URL (e.g. a TCM brand page); make brand-neutral educational content with traditional-use framing (no EU-unauthorized health claims) unless user says they're affiliated.

- 2026-10-13: user confirmed they work for/with Laboratoire Calebasse (calebasse.com) and may use its logo/photos. Oct 2026 campaign "La Quête des 29 ans" (9–31 oct.): riddle stories 14–21 oct. (never reveal answer, no health claims, never pre-announce ×2/×3 Chi), "29 ans en 29 secondes" Instagram video for 28 oct. Projects under `projects/calebasse-*`.

- 2026-11-23: user said they will use **their own recorded voice audio** from now on (no TTS), and is not interested in paid providers. Backlot series labels added to project.json: "Shorts MTC" (astragale-*, champignons-empereur, horloge-organes, rituels-automne) and "Calebasse" (calebasse-29ans, calebasse-enigmes).

**Why:** content quality bar is motion-design-heavy, not slideshow.
**How to apply:** default to code-generated animation synced to word timestamps (Whisper on the user's own recording); avoid still-image slideshows; keep claims framed as "tradition" + disclaimer; don't pitch TTS or paid providers. Pass `series="Shorts MTC"` or `series="Calebasse"` to `init_project` for new videos. See [[feedback-no-slideshow]].
