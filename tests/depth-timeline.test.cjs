const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const htmlFiles = [
  "index.html",
  "about.html",
  "work.html",
  "writing.html",
  "resume.html",
  "projects.html",
  "daadras.html",
  "davis-project.html",
  "think-tank.html",
  "photography.html",
];

for (const file of htmlFiles) {
  const source = fs.readFileSync(path.join(root, file), "utf8");
  assert.doesNotMatch(source, /data-depth-root/, `${file} should not opt into depth scrolling`);
  assert.doesNotMatch(source, /data-depth-section/, `${file} should not mark sections for depth scrolling`);
}

const script = fs.readFileSync(path.join(root, "script.js"), "utf8");
assert.doesNotMatch(script, /depthState/, "script.js should remove depth-scroll state");
assert.doesNotMatch(script, /function initDepthScroll/, "script.js should not initialize depth scrolling");
assert.doesNotMatch(script, /function setFlatDepthSections/, "script.js should not keep depth-scroll flattening helpers");
assert.doesNotMatch(script, /function updateDepthScroll/, "script.js should not keep depth-scroll update helpers");
assert.doesNotMatch(script, /function scheduleDepthScroll/, "script.js should not keep depth-scroll rAF helpers");
assert.doesNotMatch(script, /requestAnimationFrame\(updateDepthScroll\)/, "script.js should not schedule depth scrolling");
assert.doesNotMatch(script, /querySelectorAll\("\[data-depth-section\]"\)/, "script.js should not query depth sections");
assert.doesNotMatch(script, /initDepthScroll\(\);/, "script.js should not call depth scrolling");
assert.doesNotMatch(script, /preventDefault\(\)/, "depth scrolling must not hijack native scroll");

const styles = fs.readFileSync(path.join(root, "styles.css"), "utf8");
assert.doesNotMatch(styles, /main\[data-depth-root\]/, "styles should remove the depth-scroll root");
assert.doesNotMatch(styles, /\[data-depth-section\]/, "styles should remove depth-section transforms");
assert.doesNotMatch(styles, /--depth-opacity/, "styles should remove depth opacity variables");
assert.doesNotMatch(styles, /--cube-field-depth:\s*calc\(var\(--depth\)/, "styles should remove depth-driven cube offsets");

const daadras = fs.readFileSync(path.join(root, "daadras.html"), "utf8");
const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const milestones = [
  ["2019", "Founding charter"],
  ["2020", "Project D2D"],
  ["2021", "Self-Sustainability"],
  ["2022", "Relief at scale"],
  ["2023", "Salam + partnerships"],
  ["2024-25", "Institutionalize"],
];

for (const [year, title] of milestones) {
  const milestonePattern = new RegExp(`<time>${escapeRegExp(year)}</time>[\\s\\S]*${escapeRegExp(title)}`);
  assert.match(daadras, milestonePattern, `Daadras timeline should include ${year} ${title}`);
}

assert.match(
  daadras,
  /Building education, relief, and peacebuilding through local trust\./,
  "Daadras tagline should use direct trust-and-program framing"
);
assert.match(daadras, /data-impact-milestone/g, "timeline should expose scroll-revealed milestone entries");
assert.doesNotMatch(daadras, /data-impact-control/, "timeline should not remain button/readout driven");
assert.doesNotMatch(daadras, /data-impact-readout/, "timeline should remove old readout wiring");

console.log("flat timeline ok");
