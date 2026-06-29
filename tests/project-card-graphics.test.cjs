const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const projects = fs.readFileSync(path.join(root, "projects.html"), "utf8");
const styles = fs.readFileSync(path.join(root, "styles.css"), "utf8");

assert.doesNotMatch(projects, /project-card__media/, "projects page should not render project-card graphics");
assert.doesNotMatch(projects, /assets\/policy-systems-map\.png/, "projects page should not use the policy systems graphic");
assert.doesNotMatch(projects, /assets\/impact-systems-map\.png/, "projects page should not use the impact systems graphic");
assert.doesNotMatch(projects, /photos\/thumb\/img-0269\.jpg/, "projects page should not use the Davis card photo");

assert.match(
  styles,
  /\.tag-row span\s*\{[\s\S]*border-radius:\s*3px[\s\S]*padding:\s*4px 7px[\s\S]*font-size:\s*11px/,
  "tag chips should be smaller and square"
);

console.log("project card graphics ok");
