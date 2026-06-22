# Interactive Map Data Seed

Date: 2026-06-22
Feature namespace: `interactive_map`
Related spec: `docs/superpowers/specs/2026-06-22-interactive-map-design.md`

This seed defines the first local dataset for the interactive expertise map. It is intentionally conservative: authored expertise claims are based on the current site copy and the user's stated intent, while external providers remain context-only.

## Data Principles

1. Use local authored data for expertise claims and strength.
2. Use public proof links when available.
3. Use local site pages as supporting proof when external proof is absent.
4. Do not expose private notes, private client work, unpublished drafts, or sensitive operational detail.
5. Keep humanitarian and geopolitical entries framed as research/program expertise, not live intelligence.
6. Keep regions/corridors approximate and caveated.

## Proof Source Tiers

| Tier | Use | Examples |
| --- | --- | --- |
| `public_external` | Public source suitable for proof link | CAIDP credential, Daadras team page, The Nation author page, SAIS Observer essay |
| `public_external_limited_check` | Public URL, but automated check may fail due bot protection | Mercatus fellowship page, LinkedIn profile |
| `public_local` | Existing public site page supports the claim | `work.html`, `writing.html`, `impact.html`, `about.html` |
| `defer_until_public` | Claim should stay broad until a public proof URL exists | Telophase details, hackathon prototypes, unpublished thesis material |

## Link Check Snapshot

Checked from local shell on 2026-06-22.

| URL | Result | Seed Use |
| --- | --- | --- |
| `https://credsverse.com/credentials/9c8f99b4-8f7f-4e11-8786-4642e0465a35` | `200` | CAIDP proof |
| `https://www.mercatus.org/students/frederic-bastiat-fellows` | `403` via curl | Public link, limited automated proof |
| `https://www.daadras.org/our-team` | `200` | Daadras founder proof |
| `https://www.daadras.org/initiatives/project-salam` | `200` | Project Salam proof |
| `https://www.nation.com.pk/columnist/muhammad-umar-zafar` | `200` | Writing proof |
| `https://saisobserver.org/2024/10/16/an-educative-tribute-to-abdus-salam-daadras-foundation/` | `200` | Writing/Daadras proof |
| `https://substack.com/@omarzafar` | `200` | Writing profile link |
| `https://github.com/Omarzaf` | `200` | Technical profile link |
| `https://www.linkedin.com/in/umarzafar1` | `999` via curl | Public link, not machine-verifiable |

## Themes

| `theme_id` | Label | Group | Default Places | Default Corridors |
| --- | --- | --- | --- | --- |
| `ai-governance` | AI Governance | `governance` | `united-states`, `china`, `india`, `european-union`, `gulf`, `global-south` | `us-china-ai-controls`, `compute-policy-divide` |
| `geopolitical-risk` | Geopolitical Risk | `risk` | `south-asia`, `mena`, `africa`, `europe`, `united-states`, `china` | `us-china-tech-competition`, `south-asia-security` |
| `humanitarian-systems` | Humanitarian Systems | `humanitarian` | `pakistan`, `south-asia`, `mena`, `africa`, `global-south` | `pakistan-relief-education`, `south-asia-humanitarian-learning` |
| `infrastructure-corridors` | Infrastructure Corridors | `infrastructure` | `south-asia`, `gulf`, `red-sea`, `china`, `united-states`, `europe`, `africa` | `south-asia-gulf`, `red-sea-corridor`, `us-tech-routes` |
| `postcolonial-institutions` | Postcolonial Institutions | `institutions` | `south-asia`, `global-south`, `mena`, `africa`, `international-institutions` | `knowledge-power-corridor` |
| `osint-research-methods` | OSINT / Research Methods | `methods` | `global-method-layer`, `south-asia`, `mena`, `united-states`, `china`, `europe` | `source-tracing-workflow`, `geocoding-network-workflow` |

## Places

| `place_id` | Type | Display | Codes | Primary Strength | Claim Seed | Proof Seed | Caveat |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `united-states` | `country` | United States | `USA`, `US` | `core` for AI Governance | Research focus on U.S. AI export controls, compute governance, lobbying, and institutional design. | CAIDP credential; Mercatus link; work page thesis copy | Expertise claim is about governance/policy systems, not representation of any institution. |
| `china` | `country` | China | `CHN`, `CN` | `core` for AI Governance | Research focus on China in U.S.-China AI competition, export controls, semiconductor policy, and technology security. | Work page thesis/RDL copy | Use as policy-system expertise, not countrywide social or domestic-political expertise. |
| `india` | `country` | India | `IND`, `IN` | `strong` for AI Governance | Comparative AI governance and Global South policy frame, adjacent to South Asia expertise. | About/work local pages | Keep below U.S./China strength unless user adds public proof. |
| `european-union` | `region` | European Union | `EU` | `strong` for AI Governance | Regulatory standards and democratic-values comparison for AI governance. | CAIDP credential; writing/research local pages | Treat as comparative regulatory frame, not country-level expertise. |
| `gulf` | `region` | Gulf | `GULF` | `comparative` for AI Governance | Comparative sovereign AI, compute, infrastructure, and regional technology ambition frame. | Work/about local pages | Regional aggregate; avoid implying equal expertise across all Gulf states. |
| `global-south` | `region` | Global South | `GS` | `comparative` for AI Governance, `core` for Postcolonial Institutions | Structural analysis of AI divides, compute access, postcolonial institutions, and whose knowledge counts in governance. | Writing page themes; about page intellectual anchors | Analytical category, not a geographic boundary. |
| `south-asia` | `region` | South Asia | `SA` | `core` for Geopolitical Risk, `core` for Postcolonial Institutions | Regional risk, security policy, infrastructure, development practice, and postcolonial institutional analysis. | About/work/writing local pages | Regional aggregate; distinguish from country-specific Pakistan claims. |
| `pakistan` | `country` | Pakistan | `PAK`, `PK` | `core` for Humanitarian Systems | Field-built education, relief, digital-literacy, dialogue, and social-impact program expertise through Daadras and Project Salam. | Daadras team page; Project Salam page; SAIS Observer essay; impact page | Humanitarian/program expertise, not live crisis assessment. |
| `mena` | `region` | MENA | `MENA` | `strong` for Geopolitical Risk and Humanitarian Systems | Regional risk and digital-governance frame connected to South Asia, humanitarian systems, and infrastructure politics. | About page; map spec user intent | Regional aggregate; avoid claims about every country. |
| `africa` | `region` | Africa | `AFR` | `strong` for Humanitarian Systems, `comparative` for Geopolitical Risk | Humanitarian and development-systems comparison across Global South contexts. | User intent; writing page Global South themes | Comparative frame unless user adds more public proof. |
| `europe` | `region` | Europe | `EUR` | `comparative` for Geopolitical Risk | Standards, alliance coordination, and comparative institutional frame. | Existing pixel-map readout; about/work local pages | Do not conflate Europe with EU in UI labels. |
| `red-sea` | `region` | Red Sea | `REDSEA` | `strong` for Infrastructure Corridors | Infrastructure, shipping, regional security, and corridor-risk lens. | User intent; writing page infrastructure politics | Corridor-risk frame, not live maritime security intelligence. |
| `international-institutions` | `method` | International Institutions | `INTL` | `comparative` for Postcolonial Institutions | TWAIL, sovereignty, knowledge production, and global governance institutional inheritance. | Writing page themes; about page intellectual anchors | Conceptual node, not geography. |
| `global-method-layer` | `method` | Method Layer | `METHOD` | `core` for OSINT / Research Methods | Cross-regional method layer for source tracing, geocoding, network mapping, and confidence labeling. | Work page prototypes; GitHub profile link | Method expertise should show workflow confidence, not surveillance or private-source claims. |

## Corridors

| `corridor_id` | From | To | Strength | Claim Seed | Caveat |
| --- | --- | --- | --- | --- | --- |
| `us-china-ai-controls` | `united-states` | `china` | `core` | AI export controls, corporate co-securitization, lobbying, compute governance, and semiconductor policy as a cross-border system. | Do not imply cartographic route; this is a policy-system corridor. |
| `compute-policy-divide` | `united-states` | `global-south` | `strong` | Compute concentration, AI divides, and access to shared computing capacity. | Analytical corridor; avoid quantifying without source context. |
| `us-china-tech-competition` | `united-states` | `china` | `strong` | Technology competition across cyber, semiconductors, infrastructure, and regulatory capacity. | Strategic analysis, not intelligence assessment. |
| `south-asia-security` | `south-asia` | `china` | `strong` | South Asia security and dual-use technology modernization in wider regional competition. | Keep high-level unless public proof expands. |
| `pakistan-relief-education` | `pakistan` | `south-asia` | `core` | Movement from relief response to education, digital literacy, and dialogue programming. | Program history, not current humanitarian incident data. |
| `south-asia-humanitarian-learning` | `south-asia` | `global-south` | `strong` | Lessons from Pakistan/South Asia field programs as a comparative humanitarian-systems frame. | Comparative and programmatic, not universal regional claim. |
| `south-asia-gulf` | `south-asia` | `gulf` | `core` | Labor, capital, infrastructure, ports, energy, and strategic movement between South Asia and the Gulf. | Corridor is thematic and approximate. |
| `red-sea-corridor` | `mena` | `red-sea` | `strong` | Shipping, infrastructure risk, and regional pressure around strategic maritime corridors. | No live shipping/security claims. |
| `us-tech-routes` | `united-states` | `european-union` | `strong` | Standards, export controls, democratic-values governance, and technology policy coordination. | Policy alignment frame, not formal treaty map. |
| `knowledge-power-corridor` | `global-south` | `international-institutions` | `core` | Postcolonial institutional analysis of epistemic power, sovereignty, and whose knowledge counts. | Conceptual corridor; render differently from geographic routes. |
| `source-tracing-workflow` | `global-method-layer` | `south-asia` | `strong` | Source tracing and confidence labeling for regional research. | Method node; no private-source disclosure. |
| `geocoding-network-workflow` | `global-method-layer` | `united-states` | `strong` | Geocoding, network mapping, and visual analytics for policy systems. | Workflow claim; do not imply live monitoring. |

## Provider Records To Seed

| `provider_id` | Role | Status | UI Label |
| --- | --- | --- | --- |
| `maplibre-gl-js` | `basemap` | `available` when script loads | Enhanced map renderer |
| `openfreemap-bright` | `basemap` | `available` or `unavailable` | OpenFreeMap basemap |
| `natural-earth-fallback` | `fallback_geometry` | `cached` | Approximate fallback geometry |
| `world-bank-indicators` | `indicator` | `available`, `cached`, or `unavailable` | World Bank country context |
| `oecd-ai-policy-navigator` | `policy_context` | `cached` | OECD.AI policy context |
| `gdelt-doc` | `media_signal` | `optional` | Optional media signal |
| `reliefweb-v2` | `server_only_future` | `deferred` | ReliefWeb deferred |

## Default State

- `active_theme_id`: `ai-governance`
- `selected_place_id`: `united-states`
- `selected_corridor_id`: `us-china-ai-controls`
- `map_mode`: `enhanced_when_available`
- `fallback_mode`: `local_geometry_and_static_list`

## Claims That Need User Review Before Public Data File

These should remain broad in implementation until Umar confirms exact wording:

1. Whether China should appear as equal `core` strength with the United States under AI Governance.
2. Whether India should stay `strong` or move to `comparative`.
3. Whether MENA and Africa under Humanitarian Systems should be `strong` or `comparative`.
4. Whether Red Sea should be a visible v1 node or only a corridor label.
5. Whether Telophase work can be referenced publicly beyond the existing work-page wording.
6. Whether hackathon prototypes can link to public repos, demos, or remain local proof only.
