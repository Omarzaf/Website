# Plan — Dynamic Dimensional Redesign

**Date:** 2026-06-24
**Site:** Umar Zafar personal site — vanilla HTML/CSS/JS, no build, single static deploy.
**Goal:** Move the site from "static" to "dimensional" by consolidating every decorative system into ONE 3D cube motif, confining the dog to the home page's first + last sections in document flow, adding depth-parallax scrolling, a scroll-driven Daadras timeline, and a dedicated photography page.

**Guiding constraint (from today's Rams audit, DESIGN-IS-2026-06-24 → 22/30 REFINE):**
#10 "as little design as possible" scored **1** because ~6 decorative systems competed (signal canvas, 4 panel canvases/feeds, dog). **This redesign must REDUCE the number of motifs, not add one.** Every new visual is the same cube primitive — no new rendering system is introduced.

---

## The single motif: `cube-field`

The dog layer already ships a reusable 3D cube: `createCuboid(part)` ([gameboy-dog-layer.js:166-189](../gameboy-dog-layer.js#L166)) builds a `<span class="gb-cuboid">` with six `preserve-3d` faces, driven by CSS vars `--gb-x/y/z/w/h/d/color`. The CSS for it lives at [gameboy-dog-layer.css:86-150](../gameboy-dog-layer.css#L86) (`perspective`, `transform-style: preserve-3d`, per-face `rotateY/translateZ`).

**Decision:** Promote this cube into a shared, page-agnostic module `cube-field.js` / `cube-field.css`. The dog, the panel visuals, and the depth-scroll all consume it. One primitive, one mental model, one place to tune.

---

## Allowed primitives (reuse — do NOT invent)

| Need | Reuse | Source |
|---|---|---|
| 3D cube with 6 faces | `createCuboid()` + `.gb-cuboid` | [gameboy-dog-layer.js:166](../gameboy-dog-layer.js#L166), [.css:86](../gameboy-dog-layer.css#L86) |
| Scroll-triggered activation | `.reveal` + IntersectionObserver | [script.js:312-340](../script.js#L312) |
| Per-panel visual dispatch | `[data-animation]` + IO | [script.js:956-980](../script.js#L956) |
| Cursor-reactive grid highlight | signal field + `--cursor-x/y` | [script.js:1-40](../script.js#L1), [styles.css:8-18](../styles.css#L8) |
| Reduced-motion gate | `reduceMotion.matches` / media query | [script.js:5](../script.js#L5), [styles.css:1605](../styles.css#L1605) |
| Theme tokens | `:root` + `[data-theme="dark"]` | [styles.css:1-72](../styles.css#L1) |

**Anti-patterns to forbid in every phase:**
- No new canvas-2D render loop. The work-graph / writing-document / research-terminal / impact-bars canvas renderers are being REMOVED, not joined.
- No WebGL / three.js / any library. Vanilla CSS 3D transforms only.
- No scroll-jacking that disables native scrolling (see Phase 4 — depth effect rides the real scroll position, never replaces it).
- No runtime code-eval primitives (`eval`, dynamic `Function` constructors) — none are needed.
- Never run motion when `prefers-reduced-motion: reduce` — every phase ships a static fallback.

---

## Current-state facts (verified)

- Dog script loads on **index.html only** (only index includes `gameboy-dog-layer`). It is `position: fixed; z-index: 18` ([gameboy-dog-layer.css:8-10](../gameboy-dog-layer.css#L8)) — a viewport overlay, NOT in document flow.
- Panel canvases by page: index has work-graph + research-terminal + writing-document + impact-bars; **work.html** has work-graph; **impact.html** has work-graph + impact-bars; about/writing have neither.
- All pages share `grid-field` + `signal-canvas` + `styles.css` + `script.js`.
- `.panel-split-visual canvas` is the right-hand visual slot ([styles.css:693](../styles.css#L693)).
- Impact section currently uses static `.impact-nodes` bars ([index.html:296-310](../index.html#L296)) + `impact-bars` canvas.

---

## Open decisions — RESOLVED

1. **Panel right-side content (Req 3).** RESOLVED → procedural cube compositions, one per panel theme (vanilla, no backend). User confirmed "cubical effect in all of the website."
2. **Photography page source (Req 5).** RESOLVED → real photos at `~/Downloads/Claude/Photos/` (36 JPGs, 3–12 MB each; one dup `IMG_5916` w/o extension to drop). User wants a **gallery** — "simple but amazing UI/UX, the whole vibe of the page should be a gallery." Photos must be optimized for web before commit (see Phase 6).
3. **Daadras timeline data (Req 6).** RESOLVED → pulled from Google Drive (`Daadras Introduction`, `Daadras Newsletter`). Real milestones below.

### Daadras milestone data (from Drive — use verbatim in Phase 5)
"Daadras" = *justice* / "the just hand of charity." Tagline: **"Making a Difference in Pakistan, One Heart at a Time."**

| Year | Title | What | Effect |
|---|---|---|---|
| 2019 | Founding charter | Executive Council drafts the constitution — empathy, non-discrimination, youth-led civic action. | The principles that still govern the org. |
| 2020 | Project D2D (Door-to-Door) | First project, launched in the adversity of COVID-19: monthly food rations delivered to families. | Immediate relief; the program that started everything (active since). |
| 2021 | Self-Sustainability | Pivot away from dependency — commercialize families' existing skills: motorbikes, rickshaws, fruit stalls, sewing machines. Plus medicine, sanitation & blood-donation support. | Recipients become self-supporting; aid as a stepping stone, not a comfort zone. |
| 2022 | Relief at scale | Flood-victim relief; Ramadan iftar drives; orphanage support; book donations. | Reach broadened from single families to communities in crisis. |
| 2023 | Salam + partnerships | Project Salam skill-based education curriculum; partnerships with TRN & PSZ; three domains formalized — Dastarkhan, Salam, Research; Campus Ambassador Program; digital/AI adoption; 10K Monthly Challenge. | From relief org to durable institution: education + data + national volunteer network. |
| 2024–25 | Institutionalize | Donor Database (Aug 2025), digital-rights workshops, continued programming. | Operational maturity; systems for sustained impact. |

---

## Phase 0 — Documentation discovery (DONE — this section is the output)

The "docs" here are the existing codebase primitives above. No external library docs are needed because no new dependency is introduced. The Allowed-primitives table is the Phase-0 deliverable: every later phase copies from those cited locations rather than inventing APIs.

**Verification:** `grep -rni 'three\.js\|webgl\|cdn' *.js` returns nothing after implementation (no libraries snuck in).

---

## Phase 1 — Extract the shared `cube-field` module (foundation)

**What to implement**
1. Create `cube-field.css`: copy `.gb-cuboid` + 6 face rules from [gameboy-dog-layer.css:86-150](../gameboy-dog-layer.css#L86), rename to neutral `.cube` / `.cube__face--*`. Add `:root` perspective tokens: `--cube-perspective: 720px`, `--cube-depth-step`, and reuse `--accent`/`--ink` for face colors (keep two-hue brand).
2. Create `cube-field.js`: copy `createCuboid()` from [gameboy-dog-layer.js:166](../gameboy-dog-layer.js#L166) into an exported `createCube(part)`; add `mountCubeField(container, layout, opts)` that places N cubes from a layout descriptor and exposes `setDepth(z)` / `activate()` / `destroy()`.
3. Point the dog layer at the shared module (the dog keeps working, now consuming `createCube`).

**Documentation references:** copy from [gameboy-dog-layer.js:166-189](../gameboy-dog-layer.js#L166) and [gameboy-dog-layer.css:60-150](../gameboy-dog-layer.css#L60) verbatim, then rename.

**Verification checklist**
- Dog still runs on index.html with no visual regression.
- `grep -n 'createCube' cube-field.js` shows the exported primitive.
- `prefers-reduced-motion` still freezes the dog (existing gate untouched).

**Anti-pattern guards:** do not re-derive the cube math; copy it. Do not change the dog's behavior in this phase — pure extraction.

---

## Phase 2 — Confine the dog to home first + last section, in document flow (Req 1)

**What to implement**
1. Change `.gb-dog-layer` from `position: fixed` to `position: absolute` within a new in-flow wrapper, so it scrolls with the page ([gameboy-dog-layer.css:8](../gameboy-dog-layer.css#L8)).
2. Add two mount targets in [index.html](../index.html): a `<div class="dog-zone dog-zone--hero">` inside the hero section and a `<div class="dog-zone dog-zone--rest">` inside the contact/last section. Dog runs/plays in the hero zone; on scroll past the middle it is NOT rendered; at the last section it appears "asleep" (reuse the existing `gb-dog-layer__zzz` sleep visual at [gameboy-dog-layer.js:252](../gameboy-dog-layer.js#L252)) anchored at the bottom, scrolling up with the page.
3. Guard the mount: dog init already checks `page === index.html` ([gameboy-dog-layer.js:150-152](../gameboy-dog-layer.js#L150)); add a section-presence check so it never mounts outside the two zones.

**Verification checklist**
- Dog visible only in hero (awake) and last section (asleep); absent in middle panels.
- Dog translates with scroll (in flow), not pinned to viewport.
- Dog absent on about/work/writing/impact (already true — confirm includes unchanged).
- Reduced-motion: dog renders a single static asleep frame, no animation.

**Anti-pattern guards:** do not leave the old fixed overlay path active. Do not load the dog script on any other page.

---

## Phase 3 — Replace right-side panel canvases with cube-field visuals (Req 3)

**What to implement**
1. In [script.js](../script.js), delete the `work-graph` / `writing-document` / `research-terminal` / `impact-bars` canvas renderers and their dispatch ([script.js:546-980](../script.js#L546)). Replace the `[data-animation]` dispatch so each panel mounts a `cube-field` instead.
2. In each `.panel-split-visual` ([styles.css:682-693](../styles.css#L682)), swap `<canvas>` for a `<div class="cube-field" data-cube-scene="...">`. Each scene = a procedural cube layout themed to the adjacent text (see Open Decision 1).
3. Tie the cube field to the existing cursor-grid: when the cursor highlights the underlying grid (`--cursor-x/y`), the cube field's nearest cubes raise on Z (`translateZ`) — "cells pop up out of the grid." Reuse the cursor vars already set in [script.js](../script.js).
4. Activate on scroll-in via the existing reveal IntersectionObserver ([script.js:312-340](../script.js#L312)).

**Verification checklist**
- No `<canvas>` remains in any `.panel-split-visual` (`grep -n 'panel-split-visual' *.html` → no canvas children).
- Cube fields appear on index (3 panels) + work + impact, themed per text.
- Cursor over a panel raises cubes on Z; leaving settles them.
- Reduced-motion: cubes render in a static raised arrangement, no transitions.

**Anti-pattern guards:** the 4 canvas renderers must be DELETED, not left dormant (audit #10). No per-panel bespoke animation code — all panels use the same `mountCubeField` with different layout data.

---

## Phase 4 — Dimensional depth-scroll on every page (Req 4)

**What to implement**
1. Add a `perspective` container on `<body>`/`main` and give each `section` a depth transform tied to scroll position: as a section enters, it advances from `translateZ(-depth)` toward 0 ("step forward"); as it leaves upward, it recedes ("step down"). Drive from a single `scroll` handler computing each section's viewport progress (rAF-throttled), writing a `--depth` CSS var per section — CSS does the transform.
2. **Critical:** native scroll stays fully intact — the effect only adds a Z-translate/opacity based on real scroll offset. No `preventDefault`, no virtual scrolling, no snap that traps the user.
3. Reuse the cube-field depth: the same `--depth` var can nudge panel cubes, unifying the motif so the whole page reads as one 3D space.

**Verification checklist**
- Every page (index/about/work/writing/impact/photography) shows the step-depth effect.
- Keyboard/scrollbar/space/page-down all still scroll normally; no hijack.
- `prefers-reduced-motion`: depth transforms disabled, sections render flat (the [styles.css:1605](../styles.css#L1605) block plus a JS `reduceMotion.matches` early-return).
- No layout shift / no horizontal overflow introduced (`overflow-x: hidden` already set [styles.css:81](../styles.css#L81)).

**Anti-pattern guards:** no scroll-jacking libraries; no `scroll-snap` that fights the user; throttle with rAF, never run transform writes per raw scroll event.

---

## Phase 5 — Daadras 5-year scroll timeline (Req 6)

**What to implement**
1. Replace the static `.impact-nodes` bars + `impact-bars` canvas ([index.html:296-310](../index.html#L296)) and the impact.html equivalents with a vertical scroll-driven timeline: a sticky spine, milestone nodes revealed as they scroll into view (reuse `.reveal` IO).
2. Data: a milestone array `{ year, title, what, effect }` for years 1–5 (origin → COVID relief → education → digital literacy → dialogue programming — placeholder copy until real data, Open Decision 3). Render each as a timeline entry; mark cube-field accents on the active milestone to keep the motif.
3. Put the timeline on **impact.html** (full) and a condensed teaser on the index impact section linking to it.

**Verification checklist**
- Scrolling the impact section advances through 5 dated milestones in order.
- Each milestone shows year + what + effect.
- Reduced-motion: all milestones shown statically, no reveal animation.
- No leftover `impact-bars` canvas renderer.

**Anti-pattern guards:** timeline uses the shared reveal + cube primitives, not a new charting system.

---

## Phase 6 — Dedicated photography GALLERY page (Req 5)

**Design intent:** the whole page *is* a gallery — "simple but amazing UI/UX." Photos are the figure; chrome recedes (Rams #5). The cube motif is minimized here to a quiet hover-lift only — it must not compete with the images.

**What to implement**
1. **Optimize source images first.** Copy from `~/Downloads/Claude/Photos/` into repo `photos/`. The originals are 3–12 MB — unacceptable for web. Generate two sizes per photo with `sips`/`ffmpeg` (built-in `sips` on macOS, no new dep): a grid thumb (~1200px long edge, ~75% quality) and a full view (~2000px long edge, ~82%). Strip EXIF. Drop the dup `IMG_5916` (keep the `.JPG`). Target <400 KB/grid-thumb. Name `photos/full/<id>.jpg` + `photos/thumb/<id>.jpg`.
2. Create `photography.html` from the shared shell (copy header/footer/skip-link/grid-field/signal-canvas from [index.html:1-66,337-350](../index.html#L1)). Add `photography` to the nav on every page ([index.html:35-41](../index.html#L35) and the same block in the other 4 pages).
3. **Gallery layout:** a justified/masonry grid that respects each photo's aspect ratio (these are mixed portrait/landscape), generous gutters, lazy-load (`loading="lazy"` + `decoding="async"`), width/height attrs to prevent layout shift. Quiet hover: thumbnail lifts slightly on Z (the cube motif, dialed down) with a subtle caption fade-in.
4. **Lightbox:** click opens a full-view overlay (built minimally, no library) — keyboard accessible: Esc closes, ←/→ navigate, focus trapped in overlay, returns focus to the triggering thumb. Honors reduced-motion (no transition).
5. **Captions/alt:** an inline JS manifest `[{ id, alt, caption? }]`. Alt text is required and descriptive (e.g. "Mughal fresco archway, Lahore"; "Lone figure atop a mud-brick fort, Cholistan"; "Golden Gate Bridge under overcast sky"). Order is the curator's choice — lead with the two strong Pakistan frames, mix the SF/DC sets after.

**Verification checklist**
- `photography.html` reachable from nav on all pages; nav link present 6×.
- Every `<img>` has non-empty descriptive `alt`, `loading="lazy"`, and width/height (no CLS).
- No grid thumbnail over ~400 KB; total page weight reasonable.
- Lightbox: Esc/arrows/focus-trap/return-focus all work; reduced-motion respected.
- Depth-scroll (Phase 4, dialed down) + theme + reduced-motion all work.
- Dog does NOT appear here (Phase 2 scoping holds).

**Anti-pattern guards:** no carousel/lightbox library; build the lightbox minimally with the existing focus-management patterns. Never commit the multi-MB originals — only the optimized derivatives. Don't let the cube motif overpower the photos here.

**Open sub-decision (non-blocking):** user pasted 25 photos but the folder holds 35 unique. Default = build the gallery from all 35 and let the user prune; OR user supplies the exact 25 filenames. Proceeding with all-35 unless told otherwise.

---

## Phase 7 — Verification & audit regression

1. **Motif count (the whole point):** `grep -rn 'canvas' *.html` shows only the signal-canvas (cursor effect kept) — all 4 panel canvases gone. Confirm ONE cube motif drives dog + panels + depth + timeline + photos.
2. **Reduced-motion:** with `prefers-reduced-motion: reduce`, every page is static and fully usable (manual check + grep that each new JS module early-returns on `reduceMotion.matches`).
3. **A11y:** skip-link, ARIA landmarks, labeled controls intact on all 6 pages; new photo `alt` text present; cube fields are `aria-hidden` (decorative) or labeled where representational.
4. **Contrast (carry-over audit fix #8):** also darken `--faint #8a8a8a` → ≥4.5:1 while touching tokens ([styles.css:33](../styles.css#L33)).
5. **Themes:** light + dark both correct on every page including photography.
6. **Re-score against Rams #5/#9/#10:** confirm #10 rises (one motif, fewer systems), #5 rises (dog confined, silent in middle), #9 holds (motion gated, depth via CSS vars + rAF, no library).
7. **Perf:** no new network library; images lazy; `grep -rni 'three\.js\|webgl\|cdn'` empty.

---

## Phase ordering rationale

1 (extract primitive) unblocks everything. 2 (dog) and 3 (panels) both consume the primitive and can run in parallel after 1. 4 (depth-scroll) layers on top and reuses the cube depth var. 5 (timeline) and 6 (photography) are independent surfaces. 7 verifies the consolidation actually happened — the success test is *fewer systems doing more*, directly answering the audit.
