# 01 — Evidence

## Structural
- Primary nav: 5 labeled links (`about/work/writing/impact/contact`) + brand + 3 social + theme toggle + email — `index.html:29-66`. No decoy/duplicate primary actions.
- Hero has 2 clear primary actions: `view work`, `read writing` — `index.html:77-90`.
- Page is a linear section stack: hero → proof-strip → work → research(tabs) → writing → impact → contact → footer. `index.html:68-345`.
- Research panel uses proper `role="tablist"/tab/tabpanel` wiring — `index.html:155-225`.
- **Decorative systems (removable without breaking primary task):** reactive signal canvas `index.html:22`; `work-graph` canvas `index.html:144`; `research-terminal` feed `index.html:228`; `writing-document` canvas `index.html:276`; `impact-bars` animation `index.html:296`; Gameboy dog layer `gameboy-dog-layer.js` (808 lines) + `.css` (425 lines). ≈6 independent decorative systems.

## Visual / tokens
- Color: 47 unique color tokens in `styles.css`, but reducible to **2 base hues** — ink `#050505` and accent gold `#ffae00` — expressed via disciplined alpha steps, plus a full dark-theme mirror. `styles.css:1-72`.
- Type scale: **~27 distinct `font-size` declarations**, including many one-off responsive clamps (`clamp(15px,3.8vw,17px)`, `clamp(24px,7vw,40px)`, `clamp(27px,3.15vw,60px)`, `clamp(32px,4vw,72px)`…). Not a tight modular scale.
- 56 `clamp()` uses; fluid sizing throughout.
- States: dark mode full token mirror `styles.css:44-72`; `prefers-reduced-motion` honored in **all three** stylesheets/scripts (`styles.css:1605`, `gameboy-dog-layer.css:411`, `script.js:5`). Progressive enhancement via `.js` class `script.js:2`.

## Contrast (computed from tokens)
- text `#050505` on white: **20.38:1** (AAA).
- muted `#565656` on white: **7.34:1** (AAA).
- **faint `#8a8a8a` on white: 3.45:1 — FAILS WCAG AA** for the 11–12px bold text it's used on: `.entry-meta` `styles.css:875`, `.tab-button span` `styles.css:973`.
- rule `#c9c9c9`: 1.66:1 (decorative borders only — acceptable).
- Dark theme: muted 9.6:1 (pass), faint `#7d766c` 4.54:1 (pass).

## Copy & honesty
- No marketing superlatives. Only `powerful` appears once — "govern **powerful** technical systems" `index.html:178` — describes AI, not a self-promotional product claim. Not an inflation.
- No forms, no inputs, no subscribe/forced-continuity, no fake scarcity, no confirmshaming (0 form/input elements site-wide).
- Every proof-strip credential links to a real external source: CAIDP, Mercatus, Daadras, The Nation, SAIS Observer `index.html:95-101`. Labels map 1:1 to destinations.

## Weight & friction
- Initial JS: `script.js` 31KB + `gameboy-dog-layer.js` 26KB = **~57KB, both `defer`-loaded**. No framework.
- External request: Google Fonts (Inter) via preconnect `index.html:12-14`.
- Idle motion when motion is allowed: signal canvas + 4 panel canvases + terminal feed + dog. 10 `requestAnimationFrame`/timer calls in `script.js`. All gated by `prefers-reduced-motion`.

## Accessibility
- Skip-link present `index.html:19`. ARIA landmarks: header/nav/main/footer + `aria-labelledby` on every section. Tab controls keyboard-wired. Decorative canvases `aria-hidden`; meaningful visuals `role="img"` + `aria-label`.
- Sole a11y defect found: faint-token contrast on meta text (see Contrast).

## Known gaps
- No running instance inspected — focus-ring visibility and actual animation feel are inferred from source, not measured. LCP/TTI not measured (estimated light given ~57KB deferred JS, no images in hero).
