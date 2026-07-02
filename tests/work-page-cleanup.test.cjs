const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const work = fs.readFileSync(path.join(root, "work.html"), "utf8");
const script = fs.readFileSync(path.join(root, "script.js"), "utf8");
const styles = fs.readFileSync(path.join(root, "styles.css"), "utf8");

assert.doesNotMatch(work, /The method is legibility\./, "work page should not keep the removed legibility module");
assert.doesNotMatch(work, /aria-labelledby="featured-title"/, "work page should remove the featured module wrapper");
assert.doesNotMatch(work, /ScholarisAI — AI curriculum design/, "work page should not keep the longer ScholarisAI title");
assert.match(work, /<strong class="entry-title">AI curriculum design<\/strong>/, "work page should use the shorter AI curriculum title");
assert.match(work, /<h1 id="work-title" class="page-title">Case studies, Risk and Systems Analysis, Policy and Prototypes<\/h1>/, "work page should use the updated hero title");
assert.match(work, /A generalist guided by curiosity of the unknown, of the lost knowledge of mundane, and\s+of human err\./, "work page should use the updated hero body");
assert.match(work, /<h3 id="work-globe-title">Regional Interests<\/h3>/, "work globe title should use the updated label");
assert.match(work, /<h2 id="contact-title">Contact<\/h2>/, "work page contact heading should be concise");
assert.match(work, /<p class="section-number section-kicker reveal">01<\/p>[\s\S]*<h2 id="case-title">Selected work\.<\/h2>/, "selected work should become section 01");
assert.match(work, /<section class="contact-section work-contact-section"[\s\S]*<div class="contact-copy work-contact-copy reveal">[\s\S]*<p class="section-number work-contact-number">02<\/p>[\s\S]*<h2 id="contact-title">Contact<\/h2>/, "contact section number should sit inside the bottom-left copy block");
assert.match(work, /class="work-globe reveal"/, "work page should include the animated geography module");
assert.match(work, /data-policy-globe/, "work globe should mount a canvas renderer");
assert.match(work, /data-policy-globe[\s\S]*width="320"[\s\S]*height="320"/, "work globe should use the higher-resolution canvas");
assert.match(work, /data-lat="38\.9072" data-lon="-77\.0369"/, "work globe should use coordinates for Washington DC");
assert.match(work, /data-lat="37\.7749" data-lon="-122\.4194"/, "work globe should use coordinates for San Francisco");
assert.match(work, /data-lat="23\.8103" data-lon="90\.4125"/, "work globe should use coordinates for Dhaka");
assert.doesNotMatch(work, /class="work-globe__places"/, "work globe should not render the city label strip");
assert.doesNotMatch(styles, /\.work-globe__places\b/, "city strip styling should be removed with the visible strip");
assert.match(work, /<dd>DC, SF, Beijing, Nordics<\/dd>/, "policy geography fact should use the approved label");
assert.match(work, /<dd>Pakistan \/ US<\/dd>/, "field geography fact should use the approved label");
assert.match(work, /<dd>South Asia \/ Nuclear Policy<\/dd>/, "risk geography fact should use the approved label");
assert.doesNotMatch(work, /DC, Beijing, Copenhagen|Islamabad and Lahore|Dhaka and South Asia/, "work globe should not keep the old fact copy");
assert.doesNotMatch(work, /Animated pixel globe showing Washington DC/, "work globe aria label should not keep stale city-list copy");
assert.doesNotMatch(work, /Screen Recording 2026-06-28/, "work page should not embed the raw reference recording");
assert.match(script, /function initPolicyGlobes\(\)/, "script should initialize the work-page policy globe");
assert.match(script, /function projectGlobePoint\(/, "policy globe should project latitude and longitude points");
assert.match(script, /const cell = 2;/, "policy globe should render with a smoother pixel grid");
assert.match(styles, /\.policy-globe\s*\{[\s\S]*image-rendering:\s*pixelated/, "policy globe canvas should render crisp pixel art");
assert.match(styles, /\.work-globe__stage\s*\{[\s\S]*border:\s*0;[\s\S]*background:\s*transparent/, "work globe stage should not render as a box");
assert.match(styles, /@keyframes policy-globe-hover/, "work globe should have a subtle hover animation");

const filterList = work.match(/<div class="filter-list filter-list--visual reveal"[\s\S]*?<\/div>\s*<\/div>\s*<div class="filtered-grid">/)?.[0] || "";
const filterImages = [...filterList.matchAll(/<img\b[^>]*\bsrc="(assets\/[^"]+\.(?:png|jpe?g|webp))"[^>]*>/g)];
assert.equal(filterImages.length, 3, "filter panel should include three work photo assets");
for (const [, src] of filterImages) {
  assert.ok(fs.existsSync(path.join(root, src)), `missing filter panel asset ${src}`);
}
assert.doesNotMatch(filterList, /<img\b(?![^>]*\balt="[^"]+")/, "filter panel images should include alt text");
assert.match(styles, /\.filter-list--visual\s*\{[\s\S]*grid-template-rows:\s*repeat\(5,\s*auto\) minmax\(360px,\s*1fr\)/, "filter photo column should reserve remaining desktop height for images");
assert.match(styles, /\.filter-visual-strip\s*\{[\s\S]*height:\s*100%;[\s\S]*min-height:\s*clamp\(560px,\s*56vw,\s*980px\)/, "filter photos should expand to cover the empty lower column");
assert.match(styles, /\.filter-visual-strip img\s*\{[\s\S]*height:\s*100%;[\s\S]*object-fit:\s*cover/, "filter photos should crop to fill their expanded frames");
assert.match(styles, /@media \(max-width: 820px\)[\s\S]*\.filter-visual-strip\s*\{[\s\S]*height:\s*auto;[\s\S]*min-height:\s*0/, "filter photos should return to compact thumbnails on smaller screens");
assert.match(styles, /\.work-contact-section\s*\{[\s\S]*align-items:\s*end/, "work contact section should anchor content to the bottom");
assert.match(styles, /\.work-contact-copy\s*\{[\s\S]*grid-column:\s*1 \/ 3;[\s\S]*justify-self:\s*start/, "work contact copy should be left aligned in the grid");

const filterButtonRule =
  [...styles.matchAll(/\.filter-button\s*\{([\s\S]*?)\n\}/g)]
    .map((match) => match[1])
    .find((rule) => /grid-template-columns:\s*1fr/.test(rule)) || "";
assert.match(filterButtonRule, /border:\s*1px solid var\(--rule\)/, "filter buttons should render as bordered boxes");
assert.match(filterButtonRule, /border-radius:\s*[12]px/, "filter buttons should stay boxy");
assert.match(styles, /\.filter-button:hover,\s*\n\.filter-button:focus-visible,\s*\n\.filter-button\.is-active\s*\{[\s\S]*padding-left:\s*14px/, "filter buttons should not shift on hover");

console.log("work page cleanup ok");
