const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const script = fs.readFileSync(path.join(root, "script.js"), "utf8");
const styles = fs.readFileSync(path.join(root, "styles.css"), "utf8");
const index = fs.readFileSync(path.join(root, "index.html"), "utf8");

assert.match(script, /function applyRevealOrder\(/, "script should define a reveal sequencing helper");
assert.match(
  script,
  /style\.setProperty\("--reveal-order"/,
  "reveal sequencing should write the --reveal-order CSS variable"
);
assert.match(
  script,
  /applyRevealOrder\(revealElements\)/,
  "initReveals should apply reveal ordering before observing elements"
);
assert.match(script, /function pauseSignalField\(/, "script should define a signal-field pause helper");
assert.match(
  script,
  /document\.addEventListener\("visibilitychange", handleVisibilityChange\)/,
  "signal field should pause and resume from the document visibility state"
);
assert.match(
  script,
  /document\.hidden/,
  "signal frame scheduling should respect hidden pages"
);

assert.match(styles, /--motion-stagger:\s*45ms/, "styles should define one shared reveal stagger token");
assert.match(
  styles,
  /\.js \.reveal\s*\{[\s\S]*transition-delay:\s*calc\(var\(--reveal-order, 0\) \* var\(--motion-stagger\)\)/,
  "reveals should stagger through --reveal-order instead of all entering at once"
);
assert.match(
  styles,
  /@media \(prefers-reduced-motion: reduce\)[\s\S]*\.js \.reveal\s*\{[\s\S]*transition-delay:\s*0ms/,
  "reduced motion should remove reveal stagger delay"
);
assert.match(
  index,
  /<section class="logo-banner reveal" aria-label="Network and association logos">/,
  "homepage logo banner should enter through the shared reveal primitive"
);

console.log("motion contract ok");
