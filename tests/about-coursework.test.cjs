const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const about = fs.readFileSync(path.join(root, "about.html"), "utf8");
const styles = fs.readFileSync(path.join(root, "styles.css"), "utf8");
const script = fs.readFileSync(path.join(root, "script.js"), "utf8");

assert.match(about, /id="coursework-title"[^>]*>Coursework map\./, "about page should replace the range section with coursework");
assert.match(about, /data-education-map/, "about page should include an interactive education map wrapper");
assert.equal((about.match(/data-education-node=/g) || []).length, 5, "coursework map should expose five phase controls");
assert.equal((about.match(/data-course-panel=/g) || []).length, 5, "coursework map should expose five matching panels");
assert.doesNotMatch(about, /transcript course titles|private records stay off the public site/, "coursework map should not expose the old private-source note");
assert.match(about, /class="coursework-mentors"[\s\S]*Henry Farrell[\s\S]*Dipali Mukhopadhyay[\s\S]*Jeanette Manfra[\s\S]*Ian McCulloh[\s\S]*Jennifer R\. Cole[\s\S]*Jonathan Cook[\s\S]*Vali Nasr/, "coursework map should list transcript and official-source evidenced faculty and instructors");
assert.match(about, /class="coursework-lenses"[\s\S]*Power[\s\S]*Society[\s\S]*Evidence[\s\S]*Systems/, "coursework lenses should be integrated into the board");
assert.match(about, /Political Economy of AI/, "coursework map should include SAIS AI policy coursework");
assert.match(about, /Research Methodology/, "coursework map should include undergraduate methods coursework");
assert.match(about, /World Order and Disorder/, "coursework map should include SAIS order and security coursework");
assert.doesNotMatch(about, /Working range\./, "old range heading should be removed");
assert.doesNotMatch(about, /class="coursework-evolution"/, "coursework lenses should not render as a separate box row");

assert.match(styles, /\.coursework-board\s*\{/, "coursework board styles should exist");
assert.match(styles, /\.coursework-node\.is-active/, "coursework active node styles should exist");
assert.match(styles, /\.coursework-lenses\s*\{/, "coursework lens footer styles should exist");
assert.match(styles, /\.coursework-mentors span\s*\{[\s\S]*border:\s*1px solid var\(--tag-border\)/, "coursework faculty names should render as compact chips");
assert.doesNotMatch(styles, /\.coursework-evolution\s*\{/, "old coursework evolution box styles should be removed");
assert.match(styles, /\.contact-mosaic \.contact-mosaic-copy\s*\{[\s\S]*grid-column:\s*1 \/ 4/, "about contact mosaic should align left");

assert.match(script, /function initEducationMaps\(\)/, "coursework interaction initializer should exist");
assert.match(script, /querySelectorAll\("\[data-education-map\]"\)/, "script should bind education maps by data attribute");
assert.match(script, /initEducationMaps\(\);/, "coursework interaction should be initialized on load");

console.log("about coursework ok");
