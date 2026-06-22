# Interactive Map Implementation Preflight

Date: 2026-06-22
Branch: `focus-map-redesign-20260622`
Feature namespace: `interactive_map`

This preflight records the current worktree state and integration risks before production implementation begins. It is meant to prevent the real build from duplicating the existing focus map or leaking new map assets outside the static-site allowlist.

## Current Branch State

Latest committed interactive-map preparation commits:

- `568737b docs(interactive-map): define expertise atlas spec`
- `dd3325a docs(interactive-map): add coverage audit`
- `6bf359d docs(interactive-map): validate provider stack`
- `f19d3c6 docs(interactive-map): seed expertise data model`

The worktree still contains unrelated modified and untracked files from earlier site work. Production implementation must not stage or revert unrelated changes.

Current dirty tracked files:

- `.codexignore`
- `.gitignore`
- `AGENTS.md`
- `about.html`
- `impact.html`
- `index.html`
- `script.js`
- `styles.css`
- `work.html`
- `writing.html`

Current notable untracked paths include:

- `.github/`
- `.vercelignore`
- `DESIGN-IS-2026-06-22/`
- `README.md`
- `brand-book.md`
- `design_resources.md`
- `docs/superpowers/plans/`
- `figma/`
- `gameboy-dog-layer.css`
- `gameboy-dog-layer.js`
- `tests/`
- `tools/`
- `vercel.json`

## Existing Map Surface

`index.html` currently contains one compact focus-map section:

- section label: `04`
- title: `Focus map.`
- interactive host: `#pixel-map`
- readout: `#map-readout`
- current language: "Hover, click, or use arrow keys to scan the terrain."

Implementation implication:

- Replace this section in place.
- Do not add a second map section.
- Retire `#pixel-map` and `#map-readout` selectors unless they are intentionally preserved as aliases for compatibility.
- New root should be one `data-interactive-map` host with static fallback content inside it.

## Existing Runtime Surface

`script.js` currently contains:

- `hashCell(x, y, seed)`
- `initPixelMap()`
- `deferPixelMap()`
- the final startup call `deferPixelMap();`

`initPixelMap()` currently:

- hard-codes regions inside JavaScript;
- generates pseudo-geographic cells;
- supports pointer hover, click selection, and arrow-key scanning;
- writes plain text into `#map-readout`;
- does not expose the six-theme matrix, proof links, provider status, or dossier.

Implementation implication:

- Replace `initPixelMap()` with `initInteractiveMap()`.
- Remove or isolate `hashCell()` if no longer used.
- Replace `deferPixelMap()` with `deferInteractiveMap()` using the same lazy-initialization pattern.
- Preserve the current startup order around theme, reveals, filters, tabs, impact timeline, panel animations, and motion settings.
- Keep the code local-data-first; no provider callback may mutate authored strength/claim fields.

## Existing Style Surface

`styles.css` currently defines:

- `.map-copy`
- `.map-shell`
- `.pixel-map`
- `.map-cell`
- `.map-readout`
- mobile `.pixel-map` min-height rules

Implementation implication:

- Replace `.pixel-map` and `.map-cell` styling with `interactive_map` classes.
- Keep the current design language: editorial grid, mono labels, black/white/gold, restrained panels.
- Avoid nested cards inside cards.
- Add explicit desktop and 320px mobile sizing so map/dossier controls do not overlap.
- Preserve `prefers-reduced-motion` behavior and add map-specific reduced-motion rules.

## Static Build And Public Surface

`tools/build-public-site.cjs` currently copies:

- five HTML pages;
- `styles.css`;
- `script.js`;
- `gameboy-dog-layer.css`;
- `gameboy-dog-layer.js`;
- `assets/`.

`tools/check-static-site.cjs` currently:

- allowlists the same public root files;
- allows asset extensions: `.png`, `.jpg`, `.jpeg`, `.svg`, `.webp`, `.gif`;
- treats `assets/` as public;
- checks HTML links and scans secrets in public HTML/CSS/JS.

Implementation implication:

- If `assets/interactive-map/interactive-map-data.json` is added, the checker must allow `.json` under approved public roots and secret-scan JSON.
- If a separate `assets/interactive-map/interactive-map.js` is added, both build and check scripts must include or allow it.
- Do not copy docs, `.superpowers/`, local review artifacts, or source-only plans into `dist/`.

## Suggested Implementation File Boundary

Preferred minimal write set after approval:

- `index.html`
- `styles.css`
- `script.js`
- `assets/interactive-map/interactive-map-data.json`
- `tools/build-public-site.cjs`
- `tools/check-static-site.cjs`

Optional split if `script.js` becomes too large:

- `assets/interactive-map/interactive-map.js`

Avoid touching:

- unrelated page content outside the map section;
- existing proof/writing/impact pages except for link corrections directly required by the map;
- generated design artifacts;
- `.superpowers/` companion files.

## Implementation Risks

1. Duplicate behavior risk: leaving `#pixel-map` and adding `data-interactive-map` would create two competing maps.
2. Accessibility regression risk: MapLibre is pointer-friendly but not sufficient for the full keyboard/screen-reader contract by itself.
3. Public-surface risk: JSON or JS assets may fail static checks if allowlists are not updated deliberately.
4. Accuracy risk: local data must remain the only source of strength and claim values.
5. Mobile risk: the existing panel layout can make a large map too short or too tall unless explicit responsive constraints are added.
6. Motion risk: fly-to animations or pulsing route styles must respect reduced-motion preferences.
7. Dirty-worktree risk: implementation commits must stage only intentional map-related changes.

## Pre-Implementation Decision Still Needed

The committed data seed marks these review items before public JSON is generated:

1. China equal `core` with the United States under AI Governance.
2. India `strong` versus `comparative`.
3. MENA and Africa under Humanitarian Systems as `strong` versus `comparative`.
4. Red Sea as visible v1 node versus corridor-only label.
5. Whether Telophase can be referenced beyond existing public work-page wording.
6. Whether hackathon prototypes can link to public repos/demos or remain local proof only.

If no answer is provided, implementation should use the conservative seed as written and keep uncertain proof broad.

## Verification Preflight

The following lightweight check still passes before implementation:

```bash
node --check script.js
```

Full completion remains unproven until implementation and browser verification run.
