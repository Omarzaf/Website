# 04 — /make-plan Handoff

````
/make-plan Refine the Umar Zafar personal site (static HTML/CSS/JS) based on a Dieter Rams audit (total 22/30).

Verdict paragraph (quoted from the audit):
> The site scores 22/30 with no principle below 1 — the bones are good and the load-bearing dimensions (useful, understandable, honest) all score 3, so the right move is to iterate, not start over. The drag is concentrated in one theme: the site carries more decoration than the primary task needs. "As little design as possible" scores 1 and pulls down unobtrusive, long-lasting, and environmental with it; fixing the decoration surplus lifts four principles at once. The remaining two fixes — type-scale consolidation and one WCAG contrast failure — are small, contained, and high-certainty.

Keep (already strong, do NOT touch in this pass):
- Principle #2 (Useful) scored 3 — Evidence: linear section stack with two clear hero actions and a contact CTA, no decoy actions (index.html:77-90, 314-334). Regression check: confirm hero still exposes "view work" + "read writing" and #contact still reachable from nav.
- Principle #4 (Understandable) scored 3 — Evidence: lowercase plainly-named nav/controls; decorative canvases aria-hidden or role="img"+aria-label (index.html:35-41, 144-146). Regression check: every nav item and primary button keeps a literal one-word/plain label; no new jargon.
- Principle #6 (Honest) scored 3 — Evidence: no superlatives, no forms/dark-patterns, every proof-strip credential links to a real source (index.html:95-101). Regression check: grep for marketing superlatives returns only the descriptive "powerful" at index.html:178; all proof links still resolve.

Fix in priority order (top 5 moves from the audit, verbatim):
1. #10 As little design as possible: Pick ONE signature motif and cut the rest. The Gameboy dog (~36KB across gameboy-dog-layer.js:808 lines + gameboy-dog-layer.css:425 lines) + four panel canvases/feeds (index.html:144,228,276,296) + the reactive signal canvas (index.html:22) are ~6 removable decorative systems. Decide which single one is the site's voice; delete the others (markup, CSS, JS, and the script/style includes at index.html:16,348).
2. #5 Unobtrusive: If the dog stays, silence it — remove the prompting speech bubbles by default ("throw it!", "poke me"). Evidence: gameboy-dog-layer.js:266,337,347. Make the dog passive, not attention-seeking.
3. #3 Aesthetic: Collapse ~27 ad-hoc font-size declarations / one-off clamps into a named 6–7 step modular scale (--fs-* tokens in :root) and reference those tokens only. Evidence: 27 distinct font-size declarations in styles.css.
4. #8 Thorough: Darken --faint from #8a8a8a (3.45:1, fails WCAG AA on 11–12px bold text) to >=4.5:1, e.g. #707070. Evidence: token styles.css:33, used styles.css:875 (.entry-meta) and styles.css:973 (.tab-button span). Also verify focus-visible rings exist on all interactive controls.
5. #9 Environmentally friendly: Pause idle canvas animation loops when offscreen (IntersectionObserver) and when the tab is hidden (visibilitychange). Evidence: 10 requestAnimationFrame/timer call sites in script.js. Motion must stay gated by prefers-reduced-motion (already honored at styles.css:1605, gameboy-dog-layer.css:411, script.js:5).

Out of scope for this refine pass: information architecture, navigation structure, copy/voice, the proof-strip credentials, dark/light theming, and the existing reduced-motion handling — none of these need changes.

Deliverables for the plan:
- Per-fix: target files, exact change, and a verification step.
- A single decision recorded up front: which one decorative motif survives move #1 (and therefore what gets deleted).
- Token changes (type scale + --faint) consolidated in styles.css :root.
- Regression checklist for every "Keep" item above.

Anti-patterns to guard against (specific to REFINE):
- Adding new abstractions where a direct deletion or token change suffices.
- Restyling areas that already scored 3 (nav, hero IA, proof strip).
- Scope creep into structural redesign — if the IA must change, that's a separate REDESIGN, not this pass.
- Letting the decoration cull mutate honest/useful/understandable (keep all labels and links intact).
````
