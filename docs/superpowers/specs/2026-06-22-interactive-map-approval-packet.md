# Interactive Map Approval Packet

Date: 2026-06-22
Branch: `focus-map-redesign-20260622`
Feature namespace: `interactive_map`

This packet summarizes the decisions needed before moving from design/spec work into the implementation plan. It is intentionally short so approval can be given without rereading every supporting document.

## Approval Phrase

Use this phrase to approve the conservative defaults and let implementation planning begin:

```text
approve interactive_map defaults
```

That means:

- use the committed design spec;
- use the conservative data seed;
- keep uncertain proof broad;
- do not expose private notes or unpublished details;
- build the actual homepage map in the existing section `04`;
- verify against the coverage audit before completion.

## Documents Being Approved

| Document | Purpose |
| --- | --- |
| `2026-06-22-interactive-map-design.md` | Product and technical design |
| `2026-06-22-interactive-map-coverage-audit.md` | Completion evidence checklist |
| `2026-06-22-interactive-map-source-validation.md` | Provider/API decision record |
| `2026-06-22-interactive-map-data-seed.md` | Conservative v1 expertise dataset seed |
| `2026-06-22-interactive-map-implementation-preflight.md` | Current worktree and integration risks |

## Conservative Defaults

| Decision | Default |
| --- | --- |
| Basemap | MapLibre GL JS with OpenFreeMap, lazy-loaded |
| Fallback | Local authored atlas and approximate geometry/list |
| Data authority | Local `interactive_map` data owns all expertise claims |
| APIs | Context only; never scoring or claim authority |
| ReliefWeb | Deferred in v1 |
| GDELT | Optional/cached media signal only |
| Public proof | Use current public links and local public pages only |
| Private/prototype work | Keep broad unless public URLs are supplied |
| Production deployment | Out of scope |

## Strength Defaults

| Theme | Core | Strong | Comparative / Emerging |
| --- | --- | --- | --- |
| AI Governance | United States, China | India, EU | Gulf, Global South |
| Geopolitical Risk | South Asia | MENA, U.S.-China system | Africa, Europe |
| Humanitarian Systems | Pakistan | South Asia, MENA, Africa | Global South |
| Infrastructure Corridors | South Asia <-> Gulf | Red Sea, China, U.S. tech routes | Europe, Africa |
| Postcolonial Institutions | South Asia, Global South | MENA, Africa | International institutions |
| OSINT / Research Methods | Method layer | Source tracing, geocoding, network mapping | Media signals, confidence states |

## Open Decisions With Safe Defaults

| Decision | Safe Default If No Change |
| --- | --- |
| China equal `core` with United States under AI Governance | Keep China as `core`, as requested earlier |
| India `strong` vs `comparative` | Keep India as `strong` |
| MENA/Africa under Humanitarian Systems | Keep both visible; mark MENA/Africa as `strong` in the seed but caveated |
| Red Sea visible v1 node vs corridor only | Keep Red Sea visible as corridor-risk node |
| Telophase public detail | Keep broad and use only existing work-page wording |
| Hackathon prototype links | Keep as local proof/GitHub profile only unless public repo/demo URLs are supplied |

## Implementation Plan After Approval

The next approved step is not direct production editing. The next step is a detailed implementation plan saved at:

```text
docs/superpowers/plans/2026-06-22-interactive-map.md
```

That plan must map every spec/audit requirement to:

- exact files;
- exact code/data edits;
- exact verification commands;
- browser smoke-test requirements;
- commit boundaries.

## Non-Negotiables For The Build

- Replace the current `#pixel-map`; do not add a second map.
- Keep all expertise claims in local authored data.
- Show context/provider status visibly.
- Preserve no-network and reduced-motion fallback behavior.
- Keep the map usable at 320px width.
- Keep proof links public and regular anchors.
- Do not stage unrelated dirty files.
