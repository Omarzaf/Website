const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const page = fs.readFileSync(path.join(root, "rock-to-rack.html"), "utf8");
const projects = fs.readFileSync(path.join(root, "projects.html"), "utf8");
const work = fs.readFileSync(path.join(root, "work.html"), "utf8");
const buildTool = fs.readFileSync(path.join(root, "tools/build-public-site.cjs"), "utf8");
const staticCheck = fs.readFileSync(path.join(root, "tools/check-static-site.cjs"), "utf8");

const publicPages = [
  "index.html",
  "about.html",
  "work.html",
  "writing.html",
  "projects.html",
  "daadras.html",
  "davis-project.html",
  "think-tank.html",
  "photography.html",
  "rock-to-rack.html",
];

assert.match(page, /I built a semiconductor supply-chain game in 40 minutes\./, "page should lead with the 40-minute build story");
assert.match(page, /What “40 minutes” means\./, "page should explain the scope of the 40-minute claim");
assert.match(page, /initial concept-to-playable session/, "page should distinguish the prototype from later refinement");
assert.match(page, /https:\/\/rock-to-rack\.vercel\.app\//, "page should link to the playable game");
assert.match(page, /https:\/\/github\.com\/Omarzaf\/rock-to-rack/, "page should link to the source repository");

for (const image of ["screenshot-crisis.png", "screenshot-chain.png", "screenshot-fab.png"]) {
  assert.match(page, new RegExp(`assets/rock-to-rack/${image}`), `page should use ${image}`);
  assert.ok(fs.existsSync(path.join(root, "assets", "rock-to-rack", image)), `${image} should exist`);
}

for (const publicPage of publicPages) {
  const source = fs.readFileSync(path.join(root, publicPage), "utf8");
  assert.match(source, /href="rock-to-rack\.html"[^>]*>Rock to Rack<\/a>/, `${publicPage} should expose Rock to Rack in project navigation`);
}

assert.match(projects, /href="rock-to-rack\.html"/, "projects hub should link to Rock to Rack");
assert.match(projects, /read the build story/, "projects hub should describe the editorial page");
assert.match(work, /href="rock-to-rack\.html"/, "work page should link to Rock to Rack");
assert.match(work, /browser game \/ semiconductor systems/, "work page should identify the game format");

for (const file of ["rock-to-rack.html", "rock-to-rack.css"]) {
  assert.match(buildTool, new RegExp(`"${file}"`), `build should publish ${file}`);
  assert.match(staticCheck, new RegExp(`"${file}"`), `static checker should allow ${file}`);
}

console.log("rock to rack page ok");
