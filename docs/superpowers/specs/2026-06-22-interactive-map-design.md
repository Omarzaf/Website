# Interactive Map Design

Date: 2026-06-22
Branch: `focus-map-redesign-20260622`
Feature namespace: `interactive_map`

## Goal

Replace the current compact pixel focus map with an immersive, accurate, theme-driven expertise atlas that shows where Muhammad Umar Zafar has expertise by region, country, corridor, and thematic category.

The map must communicate three things at once:

- thematic expertise, such as AI governance, humanitarian systems, and infrastructure corridors;
- regional coverage, such as the United States, China, India, South Asia, MENA, Africa, and cross-regional corridors;
- evidence discipline, where authored expertise claims stay local and live APIs only enrich context.

## Current Site Context

The site is a static personal website. There is no build system or package manifest.

Current relevant files:

- `index.html` contains the homepage and the existing section `04` focus map.
- `styles.css` contains global layout, map styling, responsive rules, dark theme variables, and reduced-motion rules.
- `script.js` initializes theme controls, reveals, tabs, canvas animations, and the current `#pixel-map`.
- `tools/build-public-site.cjs` copies only whitelisted public files and `assets/`.
- `tools/check-static-site.cjs` validates the public surface, links, secrets, and `dist/` allowlist.

The existing `#pixel-map` is useful as a fallback pattern but is too abstract for the requested outcome. It does not expose thematic layers, country-level expertise, source/proof structure, live context, or a serious regional dossier.

## Selected Direction

Use the hybrid design selected during brainstorming:

- Desktop: Command Atlas.
- Mobile: Lens Matrix.
- Dossier style: Evidence Briefing.
- Visual language: keep the current stark editorial grid, mono labels, black/white/gold foundation, and restrained institutional feel.

Desktop layout:

- left rail with six thematic layer buttons;
- center map with active regions, countries, and corridors;
- right dossier with expertise claim, proof links, context, confidence, and caveats;
- always-visible legend for strength and provider status.

Mobile layout:

- horizontal segmented theme control at the top of the map;
- map immediately below;
- selected-region dossier as a bottom sheet or stacked panel;
- no hover-only behavior;
- previous/next controls for keyboard and touch scanning.

## Themes

V1 includes six top-level themes:

1. AI Governance
2. Geopolitical Risk
3. Humanitarian Systems
4. Infrastructure Corridors
5. Postcolonial Institutions
6. OSINT / Research Methods

The map must support adding later themes without changing markup structure.

## Expertise Matrix

V1 data starts with this curated matrix:

| Theme | Core Expertise | Strong Working Knowledge | Comparative / Emerging |
| --- | --- | --- | --- |
| AI Governance | United States, China | India, EU | Gulf, Global South |
| Geopolitical Risk | South Asia | MENA, U.S.-China system | Africa, Europe |
| Humanitarian Systems | Pakistan | South Asia, MENA, Africa | Global South |
| Infrastructure Corridors | South Asia <-> Gulf | Red Sea, China, U.S. tech routes | Europe, Africa |
| Postcolonial Institutions | South Asia, Global South | MENA, Africa | International institutions |
| OSINT / Research Methods | Method layer across all regions | Source tracing, geocoding, network mapping | Media signals, confidence states |

## Strength Encoding

Use a hybrid encoding:

- theme color identifies the active thematic category;
- fill intensity and stroke weight identify strength;
- the selected place or corridor gets the strongest outline;
- inactive regions remain visible enough to preserve geography;
- corridors use line weight and directional labels, not animation alone.

Strength values are fixed:

- `core`: core expertise;
- `strong`: strong working knowledge;
- `comparative`: comparative frame;
- `emerging`: emerging / watchlist.

The UI must never rely on color alone. Every selected item needs a readable label and a strength label in the dossier.

## Data Ownership And Truth Layers

The local `interactive_map` dataset is the source of truth for expertise claims.

Local data owns:

- theme list;
- region and country membership;
- corridor definitions;
- expertise strength;
- expertise claim copy;
- proof links;
- caveats;
- initial selected theme and region;
- fallback geometry references.

The implementation must keep three truth layers separate:

1. authored expertise: what the site claims Umar knows and where;
2. geographic rendering: how the place, region, or corridor is drawn;
3. dated context: what public providers add as non-authoritative background.

No function should calculate expertise strength from a basemap, country boundary file, context API, or media signal. The only valid source for `core`, `strong`, `comparative`, or `emerging` is the local authored dataset.

External data may enrich:

- contextual indicators;
- source dates;
- policy-context snippets;
- media-signal summaries.

External data must not:

- assign expertise strength;
- alter the authored claim;
- determine which regions appear for a theme;
- hide proof links;
- block the core atlas from rendering.

## Data Shape

Implementation should create a local public data file at `assets/interactive-map/interactive-map-data.json`. A separate `interactive-map.js` file may be added only if keeping the logic inside `script.js` becomes too large to review safely.

Top-level data should include:

- `version`: semantic version for the local map data;
- `title`;
- `subtitle`;
- `last_reviewed_at`;
- `reviewed_by`;
- `themes`;
- `places`;
- `corridors`;
- `providers`;
- `fallback_geometry`;
- `default_state`;

Each theme record should include:

- `theme_id`: stable kebab-case identifier;
- `theme_label`: display name;
- `theme_group`: `governance`, `risk`, `humanitarian`, `infrastructure`, `institutions`, or `methods`;
- `summary`: one-sentence theme explanation;
- `color`: theme color token or hex value;
- `place_ids`: ordered list of place ids shown for that theme;
- `corridor_ids`: ordered list of corridor ids shown for that theme.

Each place record should include:

- `place_id`: stable kebab-case identifier;
- `place_type`: `country`, `region`, or `method`;
- `display_name`;
- `region_code`, `iso2`, or `iso3` where applicable;
- `theme_ids`: themes where this place appears;
- `strength`: `core`, `strong`, `comparative`, or `emerging`;
- `confidence` or `evidence_weight`;
- `provenance_type`: `authored`, `cited`, `measured`, `estimated`, or `cached`;
- `claim`: authored expertise claim;
- `proof`: title, URL, publisher, published date, and proof type;
- `context_provider_ids`: optional provider ids used for non-authoritative context;
- `context_snapshots`: provider id, status, retrieved date, stale-after date, metric label, display value, source URL, and error text for cached or failed context;
- `geometry`: centroid, bounding box, fallback shape id, geometry source, geometry version, and boundary policy;
- `caveat`: short caveat for sensitive geopolitical or humanitarian topics.
- `sensitivity_tags`: tags such as `disputed_boundary`, `humanitarian`, `media_signal`, or `regional_aggregate`.

Each corridor record should include:

- `corridor_id`;
- `label`;
- `from`;
- `to`;
- `theme_ids`;
- `strength`: `core`, `strong`, `comparative`, or `emerging`;
- `confidence` or `evidence_weight`;
- `claim`;
- `waypoints`;
- `geometry_source`;
- `boundary_policy`;
- `caveat`.

Each provider record should include:

- `provider_id`;
- `label`;
- `role`: `basemap`, `fallback_geometry`, `indicator`, `policy_context`, `media_signal`, or `server_only_future`;
- `status`: `live`, `cached`, `optional`, `deferred`, or `server_only`;
- `retrieved_at`;
- `stale_after`;
- `attribution_text`;
- `license`;
- `error_message` for unavailable states;
- `deferred` or `server_only` flags where applicable.

## Provider Stack

Use the provider stack below for v1.

| Role | Provider | V1 Decision | Rationale |
| --- | --- | --- | --- |
| Interactive basemap | MapLibre GL JS + OpenFreeMap | Ship | Open-source renderer, public style endpoint, no browser API key, attribution required, no service-level guarantee. |
| Fallback geography | Natural Earth / curated local GeoJSON | Bundle | Public-domain map data and local shapes keep the atlas usable without network tile access. |
| Country indicators | World Bank Indicators API | Live safe context | Public API with CORS in live checks; suitable for source-labeled context cards. |
| AI policy context | OECD.AI Policy Navigator | Cached or source-linked context | Useful policy database, but not a blocking runtime dependency. |
| Media signal | GDELT DOC API | Optional / cached | Useful for article lists and timelines; not reliable enough for a v1 geography dependency. |
| Humanitarian live data | ReliefWeb API | Defer | API now requires pre-approved `appname`; do not ship anonymous browser calls in v1. |
| Keyed or restricted sources | GDELT Cloud, OpenSanctions, NASA FIRMS | Server route later | Do not place API keys or high-volume research queries in browser code. |

If OpenFreeMap or MapLibre fails, the local fallback atlas still renders.

OpenFreeMap attribution must remain visible when its tiles are visible. Natural Earth or any fallback boundary source must be labeled as approximate geometry, not political recognition or control.

## Interaction Model

Initial state:

- active theme: `ai-governance`;
- selected place: strongest place in that theme;
- dossier visible on desktop and collapsed or stacked on mobile.

Theme switching:

- clicking, tapping, or keyboard-activating a theme updates visible regions and dossier;
- if the current selected place is not in the next theme, select the first `core` place for that theme;
- preserve the map position where possible.
- update the URL hash only for committed selections, not hover previews.

Region selection:

- pointer hover may preview a region on desktop;
- click, tap, Enter, or Space commits selection;
- arrow keys scan ordered places and corridors within the active theme;
- Escape returns from preview to committed selection.
- hash links may deep-link to a valid theme or place id, but invalid hashes fall back to the default state.

Dossier order:

1. expertise claim;
2. strength label and caveat;
3. proof links;
4. live or cached context;
5. provider/source status.

## Accessibility

The map must be usable without a pointer.

Requirements:

- theme controls use real `button` elements;
- selected state is exposed with `aria-pressed` or `aria-selected`;
- the map has a concise accessible label;
- selected-region changes update an `aria-live="polite"` readout;
- keyboard support covers theme switching, place/corridor scanning, selection, and reset;
- proof links are regular anchors;
- reduced-motion mode disables animated pulses and uses instant state changes;
- mobile does not depend on hover;
- text labels and controls fit at 320px width.

## Error And Fallback States

The core atlas must work in these conditions:

- JavaScript enabled, network available: MapLibre basemap plus local expertise layers and optional context.
- JavaScript enabled, network unavailable: local fallback map plus authored dossier.
- MapLibre unavailable: local fallback map plus authored dossier.
- Context API failure: dossier shows `context unavailable` for that provider while keeping the expertise claim and proof links.
- Reduced motion: no map fly-to animations, no pulsing markers, no continuously animated routes.

The page must not render a blank map for any provider failure.

If the local data file fails to load, the HTML must still contain a static fallback list with the six themes and primary regions so the section remains meaningful.

## Privacy And Security

The v1 browser implementation must not include secrets, API keys, tokens, private notes, private contact data, or unpublished claims.

External requests must be limited to public, no-auth endpoints. Any future keyed provider must move behind a server-controlled route before use.

## Public Surface

If implementation adds files under `assets/interactive-map/`, update both static tools:

- `tools/build-public-site.cjs` must copy the new public assets.
- `tools/check-static-site.cjs` must allow the new public asset extensions and reject anything outside the approved public surface.

The implementation must not leak `.superpowers/`, docs, local notes, generated review artifacts, or agent state into `dist/`.

## Verification Plan

Minimum verification before calling the feature complete:

- `node --check script.js`
- `node tools/build-public-site.cjs`
- `node tools/check-static-site.cjs`
- local static server at `http://127.0.0.1:8765/`
- browser smoke test at desktop width;
- browser smoke test at mobile width near 320px;
- keyboard-only scan through themes and regions;
- reduced-motion behavior check;
- simulated MapLibre or tile failure proves fallback atlas is visible;
- simulated context API failure proves dossier stays visible with unavailable status;
- visual check that labels, buttons, legend, and dossier do not overlap.

## Implementation Boundary

This design is a homepage feature replacement, not a site-wide redesign.

Expected implementation files:

- modify `index.html` to replace the current `#pixel-map` section with the `interactive_map` structure;
- modify `styles.css` for atlas layout, theme rail, fallback map, dossier, mobile mode, and status states;
- modify `script.js` to initialize `interactive_map`, state transitions, keyboard support, fallback handling, and optional context fetching;
- create public `assets/interactive-map/` data and fallback geometry files if the implementation uses separate data assets;
- update static build/check tools if new public files are added.

Non-goals for v1:

- no production deployment;
- no API keys;
- no server backend;
- no live humanitarian crisis claims;
- no disputed-border assertions;
- no replacing the entire homepage layout.

## User Review Gate

After this spec is reviewed, the next artifact is a detailed implementation plan in `docs/superpowers/plans/2026-06-22-interactive-map.md`.

Implementation should not begin until the plan maps every requirement above to concrete file edits and verification steps.
