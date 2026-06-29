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
  "photography.html",
];
const legacyAnimations = [
  "work-graph",
  "research-terminal",
  "writing-document",
  "impact-bars",
];

for (const file of htmlFiles) {
  const source = fs.readFileSync(path.join(root, file), "utf8");

  for (const legacy of legacyAnimations) {
    assert.doesNotMatch(source, new RegExp(`data-animation="${legacy}"`), `${file} should not mount legacy ${legacy} animation`);
  }

  const canvasTags = Array.from(source.matchAll(/<canvas\b[^>]*>/gi)).map((match) => match[0]);
  const unexpectedCanvases = canvasTags.filter(
    (tag) => !tag.includes('id="signal-canvas"') && !tag.includes("data-policy-globe")
  );

  assert.equal(unexpectedCanvases.length, 0, `${file} should not add panel cube canvases`);
  assert.match(source, /<canvas id="signal-canvas" aria-hidden="true"><\/canvas>/, `${file} should keep the signal canvas`);

  if (file !== "work.html") {
    assert.doesNotMatch(source, /data-policy-globe/, `${file} should not mount the work page globe`);
  }

  assert.doesNotMatch(source, /data-cube-scene=/, `${file} should not render cube-map scene components`);
  assert.doesNotMatch(source, /cube-scene-shell/, `${file} should not render cube scene shells`);
  assert.doesNotMatch(source, /cube-scene-label/, `${file} should not render cube scene labels`);
  assert.doesNotMatch(source, /Hover a cube/, `${file} should not show cube interaction copy`);

  if (file !== "index.html") {
    assert.doesNotMatch(source, /<link rel="stylesheet" href="cube-field\.css/, `${file} should not load cube styles`);
    assert.doesNotMatch(source, /<script src="cube-field\.js/, `${file} should not load cube scripts`);
  }
}

const index = fs.readFileSync(path.join(root, "index.html"), "utf8");
assert.match(index, /<link rel="stylesheet" href="cube-field\.css/, "homepage should keep cube styles for the dog layer");
assert.match(index, /<script src="cube-field\.js/, "homepage should keep cube script for the dog layer");
assert.match(index, /<script src="gameboy-dog-layer\.js/, "homepage should keep the dog layer");

const script = fs.readFileSync(path.join(root, "script.js"), "utf8");
for (const legacy of legacyAnimations) {
  assert.doesNotMatch(script, new RegExp(legacy), `script.js should remove the legacy ${legacy} renderer`);
}
assert.doesNotMatch(script, /preparePanelCanvas/, "script.js should not keep the panel canvas preparation path");
assert.doesNotMatch(script, /UZCubeField\.mountCubeField/, "script.js should not mount panel cube-map visuals");
assert.doesNotMatch(script, /cubeSceneDefinitions/, "script.js should remove cube scene definitions");
assert.doesNotMatch(script, /function refreshCubeSceneGeometry/, "script.js should remove cube scene geometry refresh");
assert.doesNotMatch(script, /function initCubeScenes/, "script.js should remove cube scene initialization");
assert.doesNotMatch(script, /initCubeScenes\(\)/, "script.js should not call cube scene initialization");
assert.doesNotMatch(script, /data-cube-scene/, "script.js should not query cube scene components");

const styles = fs.readFileSync(path.join(root, "styles.css"), "utf8");
assert.doesNotMatch(styles, /\.panel-split-visual canvas/, "styles.css should not style panel-specific canvases");
assert.doesNotMatch(styles, /\.cube-scene-shell/, "styles.css should remove cube scene shells");
assert.doesNotMatch(styles, /\.cube-field\[data-cube-scene\]/, "styles.css should remove cube scene field styling");
assert.doesNotMatch(styles, /\.cube-scene-label/, "styles.css should remove cube scene labels");
assert.doesNotMatch(styles, /\.impact-timeline-accent/, "styles.css should remove impact cube scene accents");

console.log("cube panel scenes removed ok");
