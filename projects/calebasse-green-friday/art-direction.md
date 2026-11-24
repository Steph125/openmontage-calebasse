# Art direction — Calebasse · Green Friday (Instagram 9:16, 20–30 nov. 2026)

**Design read.** A cheeky, hand-made brand promo: a crew of miniature workers *renames* the Black Friday
into Calebasse's Green Friday on a giant phone. Warm and crafty, never shouty. The ad must read as the
same object as the landing page (calebasse.com/pages/black-friday-bien-etre-sante-beaute) at first glance.

Dials: visual_variance 3 · motion_intensity 6 · information_density 3.

## Palette (from the page's own `--gf-*` tokens)
| token | hex | use |
|---|---|---|
| cream | `#F7F5EE` | studio background |
| sand | `#F2E9D4` | floor, shirts |
| forest | `#0D3B2E` / forest-2 `#0A2C22` | page hero, overalls, end-card type |
| green | `#1F6B4A` | overalls, prices |
| lime | `#C9EC7A` | the GREEN gesture only: strike bar, "Green", "-70 %", caps |
| coral | `#BF4E39` | discount pills (page coral `#E2725B` deepened for WCAG AA: white text 4.8:1) |
| ink | `#14271F` | phone body, small text |
| black | `#0E0F0E` | the banner we take down — the only black in the piece |
Brand logo keeps its own colours (`#AACB55` / `#204E4A`).

## Type
Poppins, bundled locally (`public/fonts/Poppins-{400..800}.woff2`, SIL OFL) — no network at render.
800 for BLACK FRIDAY / -70 %, letter-spacing −0.045em like the page; 600 for UI; 400 for fine print.

## Signature device
**The strike + "Green" stamp at −7°** — the page's `.gh__x` treatment (lime bar through "Black",
"Green" above, both rotated −7°) performed *physically* by the workers: a paint-roller stroke and a
pole-brush lettering. Appears once on the banner (climax of the setup) and echoes once, small, in the
phone hero. Nowhere else.

## Characters
Four flat-vector workers (~1/4 phone height): forest/green overalls, sand shirt sleeves, lime cap or
beanie, ink boots, dot eyes + tiny smile, four different skin tones. Two on aluminium ladders holding
the banner's top corners; two on the floor with long poles (roller · brush).
Workers animate **on twos (15 fps steps)** for a stop-motion/miniature feel; phone, banner and screen
stay at 30 fps.

## Motion language (Disney principles applied)
Anticipation before every action (crouch before the roller lifts, banner lifted 10 px before release),
follow-through on the banner landing (pile squash + settle), slow-in/slow-out on the page scroll,
staggered pops for discount pills (back-out overshoot), arcs for pole swings.

## Shot
One locked-off centred wide shot, as in the reference: giant phone (600×1220) centred, floor line at
y≈1610, soft contact shadow. No camera move, no cuts.

## Honesty rules (binding)
- Prices / reference prices / pills copied verbatim from the page (see `artifacts/products.json`,
  verified card-by-card on 2026-11-23). Never invent a price.
- Product names shortened, **no health benefit wording**.
- "Jusqu'à -70 %" always followed by "sur une sélection"; fine print names it (matériel MTC).
- Dates: "Du 20 au 30 novembre". No eco / anti-consumption claim ("Green Friday" is just the name).
- No music, no voice (user decision) — every beat must read silently.
