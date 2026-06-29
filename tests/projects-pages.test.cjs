const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const publicPages = [
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

for (const page of publicPages) {
  const source = fs.readFileSync(path.join(root, page), "utf8");
  const nav = source.match(/<nav class="site-nav"[\s\S]*?<\/nav>/)?.[0] || "";

  assert.match(nav, /class="nav-menu nav-menu--projects"/, `${page} should expose projects as a dropdown`);
  assert.match(nav, /class="nav-menu__trigger"[^>]*>projects<\/button>/, `${page} should expose projects as the dropdown trigger`);
  assert.doesNotMatch(nav, /class="nav-menu__trigger"[^>]*aria-current="page"/, `${page} should put current-page state on menuitem links, not dropdown triggers`);
  assert.match(nav, /role="menuitem" href="projects\.html"[^>]*>overview<\/a>/, `${page} should link to the projects overview from the dropdown`);
  assert.match(nav, /role="menuitem" href="daadras\.html"[^>]*>Daadras Foundation<\/a>/, `${page} should link to Daadras from the projects dropdown`);
  assert.match(nav, /role="menuitem" href="davis-project\.html"[^>]*>Davis Projects for Peace<\/a>/, `${page} should link to Davis from the projects dropdown`);
  assert.match(nav, /role="menuitem" href="think-tank\.html"[^>]*>Think Tank \/ RDL<\/a>/, `${page} should link to RDL from the projects dropdown`);
  assert.doesNotMatch(nav, /href="projects\.html"[^>]*>projects<\/a>/, `${page} should not keep projects as a plain top-level link`);
  assert.doesNotMatch(nav, /href="impact\.html"/, `${page} should not expose impact as the top-level page`);
  assert.doesNotMatch(nav, />impact<\/a>/, `${page} should not render impact as top-level nav text`);
}

const projects = fs.readFileSync(path.join(root, "projects.html"), "utf8");
assert.match(projects, /Projects - Muhammad Umar Zafar/, "projects hub should have a projects title");
assert.match(projects, /href="daadras\.html"/, "projects hub should link to Daadras");
assert.match(projects, /href="davis-project\.html"/, "projects hub should link to Davis Projects for Peace");
assert.match(projects, /href="think-tank\.html"/, "projects hub should link to the Think Tank project");
assert.match(projects, /Daadras Foundation/, "projects hub should list Daadras");
assert.match(projects, /Davis Projects for Peace/, "projects hub should list Davis");
assert.match(projects, /RDL Evidence Map/, "projects hub should list the Think Tank GitHub project");

const daadras = fs.readFileSync(path.join(root, "daadras.html"), "utf8");
assert.match(daadras, /Project Salam/, "Daadras page should cover Project Salam");
assert.match(
  daadras,
  /Building education, relief, and peacebuilding through local trust\./,
  "Daadras page should use a direct local-trust tagline"
);
assert.match(daadras, /data-impact-milestone/g, "Daadras page should keep the milestone timeline");

const davis = fs.readFileSync(path.join(root, "davis-project.html"), "utf8");
assert.match(davis, /Davis Projects for Peace/, "Davis page should identify the project");
assert.match(davis, /Pashtun and Punjabi youth/, "Davis page should describe the communities");
assert.match(davis, /public performance/, "Davis page should include the public performance deliverable");

const thinkTank = fs.readFileSync(path.join(root, "think-tank.html"), "utf8");
assert.match(thinkTank, /RDL Evidence Map/, "Think Tank page should use the local project title");
assert.match(thinkTank, /https:\/\/github\.com\/Omarzaf\/RDL/, "Think Tank page should link to the GitHub repository");
assert.match(thinkTank, /V3_Epistemic\/output\/reliable_influence_map\.html/, "Think Tank page should include the active static map path");
assert.match(thinkTank, /strict pipeline validation/, "Think Tank page should include validation status from the release certificate");
assert.match(thinkTank, /correlational/, "Think Tank page should include public-use caveats");

const index = fs.readFileSync(path.join(root, "index.html"), "utf8");
assert.match(index, /href="projects\.html"[\s\S]*view projects/, "homepage field-work CTA should point to projects");
assert.match(index, /class="hero-cv-button" href="resume\.html">view CV<\/a>/, "homepage dog area should link to the CV page");
assert.doesNotMatch(index, /href="impact\.html"[\s\S]*view impact/, "homepage should not keep the old impact CTA");

const writing = fs.readFileSync(path.join(root, "writing.html"), "utf8");
assert.match(writing, /class="substack-card-grid[^"]*"/, "writing page should show selected Substack cards");
for (const slug of ["tokenmaxxer", "wholesale-production-of-english", "philosopher-broz-tech-kings"]) {
  assert.match(writing, new RegExp(`https://omarzafar\\.substack\\.com/p/${slug}`), `writing page should link to ${slug}`);
}
assert.doesNotMatch(writing, /<strong class="entry-title">personal<\/strong>/, "writing voice rows should be replaced by article cards");

const buildTool = fs.readFileSync(path.join(root, "tools/build-public-site.cjs"), "utf8");
for (const page of ["resume.html", "projects.html", "daadras.html", "davis-project.html", "think-tank.html"]) {
  assert.match(buildTool, new RegExp(`"${page}"`), `build should copy ${page}`);
}
assert.doesNotMatch(buildTool, /"impact\.html"/, "build should no longer publish impact.html");

const staticCheck = fs.readFileSync(path.join(root, "tools/check-static-site.cjs"), "utf8");
for (const page of ["resume.html", "projects.html", "daadras.html", "davis-project.html", "think-tank.html"]) {
  assert.match(staticCheck, new RegExp(`"${page}"`), `static checker should allow ${page}`);
}
assert.doesNotMatch(staticCheck, /"impact\.html"/, "static checker should no longer allow impact.html");

const styles = fs.readFileSync(path.join(root, "styles.css"), "utf8");
assert.match(
  styles,
  /@media \(max-width: 720px\)[\s\S]*\.nav-menu--projects \.nav-menu__panel\s*\{[\s\S]*right:\s*auto;[\s\S]*left:\s*0;/,
  "mobile projects menu should not align the dropdown off the left edge"
);

console.log("projects pages ok");
