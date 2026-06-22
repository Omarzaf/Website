# Interactive Map Coverage Audit

Date: 2026-06-22
Spec: `docs/superpowers/specs/2026-06-22-interactive-map-design.md`
Feature namespace: `interactive_map`

This audit turns the design spec into implementation evidence. It is not the implementation plan; it is the checklist the plan and final verification must satisfy.

## Completion Requirements

| Requirement | Current Evidence | Required Implementation Evidence |
| --- | --- | --- |
| Replace the compact pixel map with `interactive_map` | `index.html` still mounts `#pixel-map`; `script.js` still initializes `initPixelMap()` | `index.html` contains one homepage map host using `data-interactive-map`; `#pixel-map` code is removed or retired without duplicate map behavior |
| Keep the feature homepage-scoped | Current map section is only in `index.html` | Only `index.html` loads or mounts the map; other pages keep their existing structure |
| Provide six top-level themes | Spec names the six themes | Local map data contains exactly the six v1 themes with stable `theme_id` values |
| Encode expertise strength locally | Spec defines `core`, `strong`, `comparative`, `emerging` | Local data assigns every visible place/corridor one enum value; no code derives strength from API or geometry responses |
| Separate claim, geometry, and context | Spec defines three truth layers | Data model has separate authored claim fields, geometry fields, and provider/context fields; update functions keep them separate |
| Show desktop Command Atlas | Companion concept and spec define rail-map-dossier layout | Desktop browser screenshot shows theme rail, map, dossier, legend, and provider status visible together |
| Show mobile Lens Matrix | Spec defines mobile segmented control and stacked dossier | 320px browser screenshot shows theme control, map, and selected dossier without overlap or hover dependency |
| Preserve local fallback | Spec requires meaningful fallback if network or MapLibre fails | Browser test with MapLibre/tile failure still shows local atlas shapes/list and authored dossier |
| Keep context non-authoritative | Provider stack defines APIs as context only | Dossier labels context as dated/source-backed background; failed context never hides claim or proof links |
| Defer ReliefWeb live browser use | Spec marks ReliefWeb as deferred due appname requirement | Local data/provider UI marks ReliefWeb deferred or omits live calls; no browser request to ReliefWeb in v1 |
| Include visible attribution | Spec requires OpenFreeMap attribution when tiles appear | Browser screenshot or DOM evidence shows attribution while basemap is active |
| Avoid sensitive geography overclaiming | Spec bans territorial recognition, control, casualties, live intelligence | Dossier caveats and fallback geometry labels state approximate/context-only boundary policy |
| Keyboard operation | Spec requires theme switching, place/corridor scanning, selection, reset | Browser keyboard test proves Tab, arrow keys, Enter/Space, and Escape update state and live readout |
| Screen-reader support | Spec requires real buttons, live readout, anchors | DOM has semantic buttons, `aria-live="polite"` readout, regular proof anchors, and selected state attributes |
| Reduced motion | Spec requires no pulses/fly-to/continuous routes | Browser test with reduced-motion media emulation shows instant state changes and no route animation |
| Public-surface safety | Spec requires build/check allowlists for new public files | `tools/build-public-site.cjs` copies only approved map assets; `tools/check-static-site.cjs` rejects unexpected files and secrets |
| No secrets or private notes | Spec bans secrets, tokens, unpublished claims | Static checker passes; data file contains only public links and authored public-facing claims |
| Local verification commands pass | Spec names command suite | `node --check script.js`, optional `node --check interactive-map.js`, build, static check, and browser smoke tests pass |

## Expected File Evidence

`index.html`

- Contains the section `04` map replacement.
- Uses one `data-interactive-map` host.
- Includes static fallback content inside the section.
- Includes proof links as normal anchors.

`styles.css`

- Defines desktop atlas layout.
- Defines mobile lens layout at small widths.
- Defines strength, selected, provider-status, focus, fallback, and reduced-motion states.
- Keeps text and controls usable at 320px.

`script.js` or `assets/interactive-map/interactive-map.js`

- Initializes the feature behind an `initInteractiveMap()` boundary.
- Loads local data.
- Normalizes state from local data only.
- Handles theme switching, place/corridor selection, keyboard events, hash updates, fallback, reduced motion, and context-provider states.
- Does not mutate authored expertise from external context.

`assets/interactive-map/interactive-map-data.json`

- Contains `version`, `title`, `subtitle`, `last_reviewed_at`, `reviewed_by`, `themes`, `places`, `corridors`, `providers`, `fallback_geometry`, and `default_state`.
- Uses stable ids and the required strength enum.
- Includes proof, caveat, sensitivity, provider, attribution, license, and boundary policy fields.
- Contains no secrets or private notes.

`tools/build-public-site.cjs`

- Copies any new public map files into `dist/`.
- Does not copy docs, `.superpowers/`, local notes, or review artifacts.

`tools/check-static-site.cjs`

- Allows only the expected map data/script asset paths and extensions.
- Validates all local references.
- Preserves secret scanning on public HTML, CSS, JS, and JSON where feasible.

## Browser Evidence To Capture

Desktop viewport:

- Theme rail visible.
- Map visible.
- Dossier visible.
- Legend visible.
- Provider/source status visible.
- Selecting AI Governance highlights United States and China as core expertise.
- Selecting Humanitarian Systems highlights Pakistan/South Asia/MENA/Africa according to local strengths.

Mobile viewport near 320px:

- Theme control remains tappable.
- Map does not squeeze below useful height.
- Dossier content does not overlap controls.
- Previous/next or equivalent scanning control is visible.
- Text wraps without clipping.

Failure states:

- Block MapLibre or tile load and confirm local fallback map/list remains useful.
- Block context fetch and confirm claim/proof links remain visible with `context unavailable`.
- Emulate reduced motion and confirm no animated pulses or fly-to transitions.

Keyboard:

- Tab reaches theme controls, map region controls, proof links, and dossier actions.
- Arrow keys scan active places/corridors.
- Enter or Space commits selection.
- Escape cancels preview or resets to committed selection.
- `aria-live` readout changes with selection.

## Implementation Planning Implications

The implementation plan should split work into these independently reviewable slices:

1. Data model and public asset allowlist.
2. Static HTML fallback and map host replacement.
3. CSS atlas layout and responsive states.
4. JavaScript state machine and local rendering.
5. Optional MapLibre lazy-loading and provider status handling.
6. Accessibility, keyboard, reduced-motion, and failure-state tests.
7. Browser visual verification and final moderation.
