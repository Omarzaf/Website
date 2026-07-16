const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const pages = [
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

for (const page of pages) {
  const source = fs.readFileSync(path.join(root, page), "utf8");
  const nav = source.match(/<nav class="site-nav"[\s\S]*?<\/nav>/)?.[0] || "";
  const social = source.match(/<div class="header-social"[\s\S]*?<\/div>/)?.[0] || "";
  const header = source.match(/<header class="site-header">[\s\S]*?<\/header>/)?.[0] || "";
  const researchMenu = nav.match(/<div class="nav-menu nav-menu--research"[\s\S]*?<\/div>/)?.[0] || "";

  assert.match(source, /href="photography\.html"/, `${page} should link to the photography page`);
  assert.match(source, /href="projects\.html"/, `${page} should keep the projects nav link`);
  assert.match(nav, /class="nav-menu nav-menu--projects"/, `${page} should expose projects as a dropdown`);
  assert.match(nav, /class="nav-menu__trigger"[^>]*>projects<\/button>/, `${page} should render projects as a dropdown button`);
  assert.doesNotMatch(nav, /class="nav-menu__trigger"[^>]*aria-current="page"/, `${page} should not put current-page state on dropdown triggers`);
  assert.match(nav, /role="menuitem" href="daadras\.html"[^>]*>Daadras Foundation<\/a>/, `${page} should include Daadras in the projects dropdown`);
  assert.match(nav, /role="menuitem" href="davis-project\.html"[^>]*>Davis Projects for Peace<\/a>/, `${page} should include Davis in the projects dropdown`);
  assert.match(nav, /role="menuitem" href="think-tank\.html"[^>]*>Think Tank \/ RDL<\/a>/, `${page} should include RDL in the projects dropdown`);
  assert.doesNotMatch(nav, /href="projects\.html"[^>]*>projects<\/a>/, `${page} should not keep projects as a plain nav link`);
  assert.doesNotMatch(nav, /href="impact\.html"/, `${page} should not keep impact as a top nav item`);
  assert.doesNotMatch(nav, />impact<\/a>/, `${page} should not render impact as visible nav text`);
  assert.doesNotMatch(nav, /href="photography\.html"/, `${page} should not keep photography as a text nav item`);
  assert.doesNotMatch(nav, />photography<\/a>/, `${page} should not render photography as visible nav text`);
  assert.doesNotMatch(nav, /href="(?:index\.html)?#contact"/, `${page} should not keep contact as a top nav item`);
  assert.doesNotMatch(nav, />contact<\/a>/, `${page} should not render contact as visible nav text`);
  assert.match(nav, /class="nav-menu__trigger"[^>]*>research<\/button>/, `${page} should combine work and writing under research`);
  assert.match(researchMenu, /class="nav-menu__panel" role="menu"/, `${page} should expose a research hover menu`);
  assert.match(researchMenu, /role="menuitem" href="work\.html"[^>]*>work<\/a>/, `${page} should keep work inside the research menu`);
  assert.match(researchMenu, /role="menuitem" href="writing\.html"[^>]*>writing<\/a>/, `${page} should keep writing inside the research menu`);
  assert.doesNotMatch(nav, /<nav class="site-nav"[\s\S]*?<a href="work\.html"[^>]*>work<\/a>/, `${page} should not keep work as a top-level nav link`);
  assert.doesNotMatch(nav, /<nav class="site-nav"[\s\S]*?<a href="writing\.html"[^>]*>writing<\/a>/, `${page} should not keep writing as a top-level nav link`);
  assert.match(header, /class="header-action" href="mailto:mumerzafer@gmail\.com">email<\/a>/, `${page} should keep the top email button`);
  assert.match(social, /aria-label="Substack"[\s\S]*href="photography\.html"[\s\S]*aria-label="Photography"/, `${page} should move photography next to Substack`);
  assert.match(social, /header-social-link--photography/, `${page} should use the photography icon button style`);
  assert.match(social, /<circle cx="12" cy="13" r="3\.2"><\/circle>/, `${page} should render a camera lens icon`);
}

const photography = fs.readFileSync(path.join(root, "photography.html"), "utf8");
assert.match(photography, /href="photography\.html" aria-current="page" aria-label="Photography"/, "photography icon should expose the current page");
assert.doesNotMatch(photography, /data-depth-root/, "photography page should not opt into depth scrolling");
assert.doesNotMatch(photography, /data-depth-section/, "photography page should not mark gallery sections for depth scrolling");
assert.match(photography, /data-photo-gallery/, "photography page should expose a gallery root");
assert.match(
  photography,
  /<section class="panel-section photo-section" aria-label="Photography gallery">/,
  "photography gallery section should have a valid accessible label"
);
assert.doesNotMatch(photography, /aria-labelledby="photo-gallery-title"/, "photography gallery should not reference a missing heading id");
assert.match(photography, /data-photo-dialog/, "photography page should include a lightbox dialog");
assert.match(photography, /data-photo-full/, "lightbox should expose the full-size image target");
assert.match(photography, /data-photo-caption/, "lightbox should expose the caption target");
assert.match(photography, /data-photo-prev/, "lightbox should include previous control");
assert.match(photography, /data-photo-next/, "lightbox should include next control");
assert.match(photography, /data-photo-close/, "lightbox should include close control");
assert.doesNotMatch(photography, /Downloads\/Claude\/Photos/, "public HTML should not reference source photos");
assert.doesNotMatch(photography, /IMG_5916 2/i, "gallery should omit the duplicate IMG_5916 variant");
assert.doesNotMatch(photography, /img-5025\.jpg/, "gallery should remove the repeated street-view photo");
assert.match(photography, /<figcaption class="photo-card__meta"><span>\/001<\/span>Azul<\/figcaption>/, "gallery captions should use slash-prefixed three-digit numbering and one-word names");
assert.match(photography, /data-caption="\/073 \/ Turn signal"/, "gallery captions should include the final imported photograph");

const triggers = photography.match(/data-photo-trigger/g) || [];
assert.equal(triggers.length, 73, "gallery should render 34 existing and 39 newly imported photographs");

const imgTags = photography.match(/<img\b[^>]*>/g) || [];
assert.equal(imgTags.length, 74, "gallery plus lightbox should contain 74 image elements");

for (const tag of imgTags) {
  assert.match(tag, /\bwidth="\d+"/, "photo images should declare width");
  assert.match(tag, /\bheight="\d+"/, "photo images should declare height");
  assert.doesNotMatch(tag, /src="[^"]*\.JPG/, "photo images should use generated lowercase jpg files");
}

const photoRefs = [...photography.matchAll(/(?:src|href|data-full)=["'](photos\/(?:thumb|full)\/[^"']+\.jpg)["']/g)]
  .map((match) => match[1]);
assert.equal(photoRefs.length, 147, "gallery should reference 73 thumb/full pairs plus the lightbox image");

for (const ref of photoRefs) {
  assert.ok(fs.existsSync(path.join(root, ref)), `missing generated photo derivative ${ref}`);
}

const buildTool = fs.readFileSync(path.join(root, "tools/build-public-site.cjs"), "utf8");
assert.match(buildTool, /"photography\.html"/, "build should copy photography.html");
assert.match(buildTool, /"photos\/full", "photos\/thumb"/, "build should copy only generated photo derivatives");
assert.doesNotMatch(buildTool, /publicDirs\s*=\s*\[[^\]]*"photos"\s*\]/, "build should not publish top-level photo masters");

const staticCheck = fs.readFileSync(path.join(root, "tools/check-static-site.cjs"), "utf8");
assert.match(staticCheck, /"photography\.html"/, "static checker should allow photography.html");
assert.match(staticCheck, /"photos"/, "static checker should allow generated photo derivatives");
assert.match(staticCheck, /data-full/, "static checker should validate lightbox full-size photo references");
assert.match(staticCheck, /raw photo master leaked into public build/, "static checker should reject raw photo masters");

const script = fs.readFileSync(path.join(root, "script.js"), "utf8");
assert.match(script, /function initNavMenus\(/, "script should initialize dropdown menu state");
assert.match(script, /setAttribute\("aria-expanded", String\(isExpanded\)\)/, "dropdown menus should keep aria-expanded in sync with visible state");
assert.match(script, /initNavMenus\(\);/, "dropdown state initialization should run on page load");
assert.match(script, /function initPhotoGallery/, "script should initialize the photo gallery");
assert.match(script, /data-photo-trigger/, "script should wire photo triggers");
assert.match(script, /\.showModal\(\)/, "script should use the native dialog lightbox");
assert.match(script, /lastPhotoTrigger\.focus\(\)/, "lightbox should restore focus to the opened thumbnail");
assert.match(script, /event\.key === "Escape"[\s\S]*closePhoto\(\)/, "lightbox fallback should close on Escape");
assert.match(script, /close\.focus\(\)/, "lightbox fallback should move focus into the dialog");
assert.match(script, /document\.addEventListener\("keydown", onFallbackKeydown\)/, "lightbox fallback should listen for document-level Escape");
assert.match(script, /document\.removeEventListener\("keydown", onFallbackKeydown\)/, "lightbox fallback should remove document-level Escape listener");
assert.match(script, /const wasFallbackOpen = fallbackOpen/, "fallback teardown should be driven by fallback state");
assert.match(script, /if \(wasFallbackOpen\) \{[\s\S]*document\.removeEventListener\("keydown", onFallbackKeydown\)/, "fallback teardown should always remove stale document listener");
assert.doesNotMatch(script, /preventDefault\(\)/, "photo gallery should not require hijacking native defaults");

const styles = fs.readFileSync(path.join(root, "styles.css"), "utf8");
assert.match(styles, /scroll-padding-top:\s*calc\(var\(--header-height\) \+ 24px\)/, "anchor jumps should account for the sticky header height");
assert.match(styles, /\.photo-grid/, "styles should define the photo grid");
assert.match(styles, /\.photo-grid\s*\{[\s\S]*grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\)/, "photo grid should render three images per desktop row");
assert.match(styles, /\.photo-card__button img\s*\{[\s\S]*aspect-ratio:\s*3 \/ 4/, "photo thumbnails should keep a portrait crop in the three-column layout");
assert.match(styles, /\.photo-dialog/, "styles should define the lightbox dialog");
assert.match(styles, /\.site-nav\s*\{[\s\S]*grid-template-columns:\s*repeat\(3, minmax\(68px, 1fr\)\)/, "site nav should reserve three top-level columns after combining work and writing");
assert.match(styles, /html:not\(\.js\) \.nav-menu:hover \.nav-menu__panel,[\s\S]*\.nav-menu\.is-open \.nav-menu__panel[\s\S]*opacity:\s*1/, "research menu should open through controlled state with a no-js hover fallback");
assert.match(styles, /\.nav-menu__panel\s*\{[\s\S]*position:\s*absolute/, "research menu should render as an anchored dropdown");
assert.match(styles, /\.header-social-link--photography\s*\{[\s\S]*background:\s*var\(--signal\)/, "photography icon button should use the yellow signal background");
assert.match(styles, /\.header-social-link--photography\s*\{[\s\S]*border-color:\s*var\(--signal\)/, "photography icon button should use a yellow border");
assert.match(styles, /@media \(max-width: 720px\)[\s\S]*\.photo-dialog__controls[\s\S]*display:\s*grid/, "mobile lightbox controls should stack without overflow");
assert.match(styles, /@media \(prefers-reduced-motion: reduce\)[\s\S]*\.photo-card__button:focus-visible img[\s\S]*transform:\s*none/, "reduced motion should remove thumbnail lift");

console.log("photo gallery ok");
