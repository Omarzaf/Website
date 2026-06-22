# Interactive Map Source Validation

Date: 2026-06-22
Feature namespace: `interactive_map`
Related spec: `docs/superpowers/specs/2026-06-22-interactive-map-design.md`

This note records the source/provider checks behind the `interactive_map` provider stack. It keeps implementation decisions grounded in current official documentation and live endpoint behavior.

## Decision Summary

| Provider | V1 Decision | Confidence | Implementation Use |
| --- | --- | --- | --- |
| MapLibre GL JS | Ship as optional enhanced basemap renderer | High | Lazy-load only on the homepage map section; use local data as authoritative expertise layer |
| OpenFreeMap | Ship as public no-key style endpoint | High, best-effort service | Basemap style URL for MapLibre when network is available |
| Natural Earth | Bundle or derive fallback geometry | High | Approximate fallback geometry; never political recognition or expertise scoring |
| World Bank Indicators API | Use as optional live context | High | Source-labeled country context cards only |
| OECD.AI Policy Navigator | Use as cached/source-linked context | Medium-high | AI policy context references with retrieved dates |
| GDELT DOC API | Optional/cached media signal only | Medium | Media-signal context, never core map behavior |
| ReliefWeb API | Defer live browser use | High | Mark as deferred until there is a pre-approved appname or server route |
| OSMF tile servers | Do not use directly | High | Use OSM data through OpenFreeMap or another compliant tile provider, not `tile.openstreetmap.org` |

## Official Documentation Findings

### MapLibre GL JS

Source: https://www.maplibre.org/maplibre-gl-js/docs/

MapLibre GL JS is the right browser renderer for an immersive map because it supports WebGL vector-tile rendering, GeoJSON sources/layers, feature querying, events, and state-based visual changes. Context7 resolved the current documentation to `/maplibre/maplibre-gl-js`; examples cover `new maplibregl.Map`, `map.addSource`, `map.addLayer`, `map.on`, `map.queryRenderedFeatures`, and `map.setFeatureState`.

Implementation consequence:

- Use MapLibre only as the drawing layer.
- Add authored expertise features from local data.
- Use `addSource` / `addLayer` for local GeoJSON.
- Use event handlers for pointer preview, but keep keyboard selection outside the canvas through semantic controls.
- Pin the MapLibre CDN version during implementation after one final docs check.

### OpenFreeMap

Source: https://openfreemap.org/

OpenFreeMap remains the best no-key public basemap option for this static site. Its public instance is free to use and does not require registration, API keys, user accounts, or cookies. It still needs visible attribution and should be treated as best-effort, not as a service-level-guaranteed dependency.

Live check:

```text
Checked: 2026-06-22 19:13 UTC
URL: https://tiles.openfreemap.org/styles/bright
Result: HTTP/2 200
Content-Type: application/json
CORS: access-control-allow-origin: *
Cache: public, max-age=86400
```

Implementation consequence:

- Use `https://tiles.openfreemap.org/styles/bright` as the default enhanced basemap style.
- Keep local fallback map visible if this style or tiles fail.
- Keep attribution visible when tiles are visible.

### Natural Earth

Sources:

- https://www.naturalearthdata.com/
- https://www.naturalearthdata.com/about/terms-of-use/

Natural Earth is appropriate for fallback geometry because it is public-domain map data at multiple scales. It is cartographic base data, not a claim about sovereignty, control, or political recognition.

Implementation consequence:

- Use or derive simplified fallback shapes from Natural Earth or locally curated geometry.
- Label fallback boundaries as approximate geometry.
- Do not use fallback geometry to determine expertise strength.

### World Bank Indicators API

Source: https://datahelpdesk.worldbank.org/knowledgebase/articles/889392-about-the-indicators-api-documentation

The World Bank Indicators API is suitable for public, country-level context cards. It should not decide whether expertise exists or how strong it is.

Live check:

```text
Checked: 2026-06-22 19:13 UTC
URL: https://api.worldbank.org/v2/country/USA;CHN;IND;PAK/indicator/IT.NET.USER.ZS?format=json&date=2023:2025&per_page=4
Result: HTTP/2 200
Content-Type: application/json;charset=utf-8
CORS: access-control-allow-origin: *
Allowed method: GET
Cache: public, max-age=2592001
```

Implementation consequence:

- Use World Bank only for optional context snapshots.
- Cache or display provider status with `retrieved_at` and `stale_after`.
- If the request fails, show `context unavailable` while keeping authored claims and proof links.

### OECD.AI Policy Navigator

Sources:

- https://oecd.ai/
- https://oecd.ai/en/dashboards/policy-initiatives
- https://oecd.ai/en/wonk/introducing-gaiin

OECD.AI is valuable for AI-policy context because it provides a maintained policy navigator and national AI policy coverage. For v1, it should be cached or source-linked rather than required at runtime.

Implementation consequence:

- Use OECD.AI as cited context for AI Governance regions.
- Add `retrieved_at` to any cached policy context.
- Do not block rendering on OECD.AI availability.

### GDELT DOC API

Sources:

- https://blog.gdeltproject.org/gdelt-doc-2-0-api-debuts/
- https://www.gdeltproject.org/data.html
- https://www.gdeltproject.org/

GDELT is useful for media-signal context, but it should remain optional. The endpoint can return useful DOC timelines, but live availability and rate behavior are not stable enough for core map behavior.

Live checks:

```text
Checked: 2026-06-22 19:13 UTC
URL: https://api.gdeltproject.org/api/v2/doc/doc?query=artificial%20intelligence&mode=timelinevol&format=json&timespan=1week
HEAD result during this run: HTTP/1.1 429 Too Many Requests
GET result during this run: returned JSON timeline data
```

Implementation consequence:

- Do not depend on GDELT for initial rendering or geography.
- If used, present it as optional media signal with an unavailable state.
- Prefer cached snippets over live browser calls in v1.

### ReliefWeb API

Sources:

- https://apidoc.reliefweb.int/
- https://apidoc.reliefweb.int/parameters

ReliefWeb is not a v1 browser dependency. The current API requires `appname`, and the docs state that pre-approved appnames are required from November 1, 2025.

Live check:

```text
Checked: 2026-06-22 19:13 UTC
URL: https://api.reliefweb.int/v2/reports?limit=1
Result: HTTP/2 400
Body: Missing appname parameter
CORS: access-control-allow-origin: *
```

Implementation consequence:

- Mark ReliefWeb as deferred in provider metadata.
- Do not make anonymous ReliefWeb browser requests in v1.
- Reconsider later only with an approved appname or a server-side route.

### OpenStreetMap Foundation Tile Servers

Source: https://operations.osmfoundation.org/policies/tiles/

OSM data is free to use, but OSMF public tile servers are limited infrastructure and should not be treated as the production tile backend for this site.

Implementation consequence:

- Do not use `tile.openstreetmap.org` as the v1 basemap.
- Use OpenFreeMap or another compliant provider instead.

## Implementation Rules Derived From Validation

1. Local authored data owns expertise.
2. MapLibre/OpenFreeMap own enhanced rendering only.
3. Natural Earth or local geometry owns fallback drawing only.
4. World Bank and OECD.AI may enrich context with retrieval dates.
5. GDELT is optional and must fail quietly.
6. ReliefWeb stays deferred in v1.
7. No provider can alter `strength`, `claim`, `proof`, or `theme_ids`.
8. Every provider-facing UI state needs a visible status: `available`, `cached`, `unavailable`, `deferred`, or `server_only`.
