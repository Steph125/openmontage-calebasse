---
name: reference-render-env-quirks
description: "Machine quirks that break OpenMontage renders here — OneDrive reparse points vs Remotion public dir, slow `hyperframes doctor` vs the 20 s availability probe"
metadata:
  node_type: memory
  type: reference
  originSessionId: 521ff7c2-1796-418e-aeb3-4f6669490ff8
  modified: 2026-11-23T20:27:58.779Z
---

The repo lives under OneDrive (`OneDrive\Bureau\OpenMontage`). Observed 2026-11-23:

- **Remotion public dir 404s after OneDrive sync.** Once OneDrive syncs a project's `public/` files they get the ReparsePoint attribute and Remotion's `--public-dir` server no longer serves them (fonts/images 404 → `cancelRender`). Fresh files work until synced, so the first render succeeds and later ones fail. Fix: copy `public/` to a plain folder under `%TEMP%` (read/write bytes) right before each render and pass that as `public_dir`.
- **HyperFrames reported "unavailable" by video_compose.** `hyperframes_compose._cli_probe` runs `npx hyperframes doctor --json` with a 20 s timeout; on this PC doctor takes ~19–24 s (Docker check), so the probe flaps. Fix used: run doctor yourself with a longer timeout and, on exit 0, seed `HyperFramesCompose._cli_probe_cache = {"status": "ok"}` in the render process (same semantics as the tool). The CLI itself works (0.9.86).
- `hyperframes check` treats intentional layering (banner over page, page scrolling under a fixed status bar) as `content_overlap`/`text_occluded` errors; hide covered content until revealed and mark pure device chrome with `data-layout-ignore`.

Related: [[project-mtc-shorts]]
