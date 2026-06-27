# 02 — Scorecard

1. Good design is innovative — Score: 2/3
   Evidence: Reactive signal canvas + per-panel generative canvases + Gameboy dog (01-evidence §Structural) over an otherwise standard portfolio layout.
   Justification: Refreshes a familiar portfolio pattern with a distinctive motion/play system — an improvement, not a category-defining new pattern, so not a 3.

2. Good design is useful — Score: 3/3
   Evidence: Linear stack with two clear primary actions and a contact CTA; no decoy actions (01-evidence §Structural).
   Justification: The primary task — learn who he is, reach work/writing/contact — completes in the fewest steps with no detours.

3. Good design is aesthetic — Score: 2/3
   Evidence: 2 base hues with disciplined alpha tokens, but ~27 distinct font-size declarations / one-off clamps (01-evidence §Visual).
   Justification: Color and spacing obey one visible system; the sprawling type scale is the single loose area, keeping it at 2 not 3.

4. Good design is understandable — Score: 3/3
   Evidence: Lowercase, plainly named controls; decorative canvases labeled or `aria-hidden` (01-evidence §Structural/§Accessibility).
   Justification: A first-time user can name every primary control correctly; no jargon in navigation.

5. Good design is unobtrusive — Score: 2/3
   Evidence: Calm content-first panels, but ~6 idle motion systems plus a dog that emits prompting bubbles ("throw it!", "poke me", gameboy-dog-layer.js:266,337,347).
   Justification: Core reading surface is quiet, but the prompting dog is the one element pushing toward competing with content — scored on that worst instance.

6. Good design is honest — Score: 3/3
   Evidence: No superlatives, no dark patterns, every credential links to a real source (01-evidence §Copy).
   Justification: Every claim, badge, and label maps 1:1 to actual behavior.

7. Good design is long-lasting — Score: 2/3
   Evidence: Enduring Swiss/editorial base, but terminal-feed and Gameboy-pixel nostalgia are trend/retro markers (01-evidence §Structural).
   Justification: One-to-two mild dated markers on an otherwise timeless idiom — a 2.

8. Good design is thorough — Score: 2/3
   Evidence: Skip-link, ARIA, dark mode, reduced-motion everywhere; but faint `#8a8a8a` at 3.45:1 fails WCAG AA on 11–12px bold meta text (01-evidence §Contrast).
   Justification: Details are largely considered; the sub-AA meta text is one concrete lapse, plus unverified focus rings — keeps it from 3.

9. Good design is environmentally friendly — Score: 2/3
   Evidence: ~57KB deferred JS, dark mode honored, reduced-motion respected — but idle canvas animation runs whenever motion is allowed (01-evidence §Weight).
   Justification: <100KB and motion gated, but the "no idle animation" bar for a 3 isn't met — persistent idle rAF loops.

10. Good design is as little design as possible — Score: 1/3
    Evidence: ≈6 decorative systems (signal canvas, 4 panel canvases/feeds, Gameboy dog ~36KB) removable without breaking the primary task (01-evidence §Structural/§Weight).
    Justification: Three-to-five-plus elements can be removed with the core task intact — this is more design, not less.

**Total: 22/30**
