const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const styles = fs.readFileSync(path.join(root, "styles.css"), "utf8");
const script = fs.readFileSync(path.join(root, "script.js"), "utf8");
const contactPages = [
  "index.html",
  "about.html",
  "work.html",
  "writing.html",
  "projects.html",
  "daadras.html",
  "davis-project.html",
  "think-tank.html",
  "photography.html",
  "impact.html",
];

for (const page of contactPages) {
  const source = fs.readFileSync(path.join(root, page), "utf8");
  const contactSections = source.match(/<section\b[^>]*class="[^"]*\bcontact-section\b[^"]*"[\s\S]*?<\/section>/g) || [];

  assert.equal(contactSections.length, 1, `${page} should expose one final contact section`);

  const contact = contactSections[0];

  assert.match(contact, /\bdata-contact-animation\b/, `${page} contact section should opt into the shared contact animation`);
  assert.match(
    contact,
    /<div class="contact-field" aria-hidden="true">\s*<canvas data-contact-field><\/canvas>\s*<\/div>/,
    `${page} contact section should contain the decorative contact canvas`
  );
  assert.match(contact, /class="contact-copy[^"]*\breveal\b/, `${page} contact copy should keep the shared reveal behavior`);
  assert.match(contact, /mailto:mumerzafer@gmail\.com/, `${page} contact section should include the email CTA`);
  assert.match(contact, /linkedin/, `${page} contact section should include social links`);
}

assert.match(styles, /\.contact-section\[data-contact-animation\]/, "styles should scope animation layout to opted-in contact sections");
assert.match(styles, /\.contact-field\s*\{[\s\S]*pointer-events:\s*none/, "contact field should not intercept CTA clicks");
assert.match(styles, /\.contact-field canvas\s*\{[\s\S]*display:\s*block/, "contact field canvas should fill its layer cleanly");
assert.match(
  styles,
  /@media \(prefers-reduced-motion: reduce\)[\s\S]*\.contact-field\s*\{[\s\S]*opacity:/,
  "reduced motion should keep a calmer static contact field"
);

assert.match(script, /const contactFieldStates = \[\]/, "script should track contact field animation state");
assert.match(script, /function initContactFields\(/, "script should initialize contact field canvases");
assert.match(script, /function drawContactField\(/, "script should draw the contact node animation");
assert.match(script, /timestamp - state\.lastDraw < 32/, "contact field should throttle animation frames");
assert.match(script, /document\.hidden/, "contact field should respect hidden document state");
assert.match(script, /initContactFields\(\)/, "script startup should initialize contact field canvases");
assert.match(script, /restartContactFields\(\)/, "motion and visibility handling should restart contact fields");

console.log("contact animation contract ok");
