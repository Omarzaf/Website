const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const htmlFiles = [
  "index.html",
  "about.html",
  "work.html",
  "writing.html",
  "projects.html",
  "daadras.html",
  "davis-project.html",
  "think-tank.html",
];

const index = fs.readFileSync(path.join(root, "index.html"), "utf8");
const dogCss = fs.readFileSync(path.join(root, "gameboy-dog-layer.css"), "utf8");
const dogJs = fs.readFileSync(path.join(root, "gameboy-dog-layer.js"), "utf8");

assert.match(index, /class="dog-zone dog-zone--hero"[^>]+data-dog-zone="hero"/, "homepage hero should include a dog mount zone");
assert.match(index, /class="dog-zone dog-zone--rest"[^>]+data-dog-zone="rest"/, "homepage contact section should include a dog rest zone");

for (const file of htmlFiles.filter((name) => name !== "index.html")) {
  const source = fs.readFileSync(path.join(root, file), "utf8");
  assert.doesNotMatch(source, /data-dog-zone=/, `${file} should not include dog mount zones`);
  assert.doesNotMatch(source, /gameboy-dog-layer\.js/, `${file} should not load the dog script`);
}

assert.doesNotMatch(
  dogCss,
  /\.gb-dog-layer\s*{[^}]*position:\s*fixed/s,
  "dog layer should not remain a fixed viewport overlay"
);
assert.match(
  dogCss,
  /\.dog-zone\b/,
  "dog-zone layout styles should live with the dog layer"
);
assert.match(
  dogCss,
  /\.gb-dog-layer\[data-zone-kind="rest"\]\s+\.gb-dog-layer__dog\s*{[^}]*pointer-events:\s*none/s,
  "rest-zone dog should be decorative and not hit-testable"
);

assert.match(
  dogJs,
  /data-dog-zone="hero"/,
  "dog script should mount the interactive dog into the hero zone"
);
assert.match(
  dogJs,
  /data-dog-zone="rest"/,
  "dog script should mount the sleeping dog into the rest zone"
);
assert.doesNotMatch(
  dogJs,
  /document\.body\.appendChild\(layer\)/,
  "dog script should append layers into section zones instead of document.body"
);
assert.match(
  dogJs,
  /function wake\(\)\s*{[^}]*reduceMotion\.matches[^}]*return/s,
  "reduced-motion users should not be able to wake the static dog"
);
assert.match(
  dogJs,
  /function grabBone\(event\)\s*{[^}]*reduceMotion\.matches[^}]*return/s,
  "reduced-motion users should not be able to drag or throw the dog"
);

console.log("dog zones ok");
