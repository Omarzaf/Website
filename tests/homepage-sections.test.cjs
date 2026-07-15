const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const source = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
const styles = fs.readFileSync(path.join(__dirname, "..", "styles.css"), "utf8");
const logoBannerMarkup = source.match(/<section class="logo-banner reveal"[\s\S]*?<\/section>/)?.[0] ?? "";
const logoBannerRule = styles.match(/\.logo-banner\s*\{([\s\S]*?)\n\}/)?.[1] ?? "";
const logoTrackRule = styles.match(/\.logo-banner__track\s*\{([\s\S]*?)\n\}/)?.[1] ?? "";
const logoTileRule = styles.match(/\.logo-tile\s*\{([\s\S]*?)\n\}/)?.[1] ?? "";
const logoMarkRule = styles.match(/\.logo-tile__mark\s*\{([\s\S]*?)\n\}/)?.[1] ?? "";
const logoMarkImageRule = styles.match(/\.logo-tile__mark img\s*\{([\s\S]*?)\n\}/)?.[1] ?? "";
const logoAssets = [
  "assets/logos/sais.png",
  "assets/logos/snf-agora.jpg",
  "assets/logos/caidp.png",
  "assets/logos/mercatus.png",
  "assets/logos/daadras.svg",
  "assets/logos/the-nation.png",
  "assets/logos/sais-observer.png",
  "assets/logos/fccu.png",
];

assert.match(
  source,
  /<a class="availability-status" href="assets\/G-Resume_2\.pdf"[^>]*aria-label="Open CV PDF"[^>]*>[\s\S]*class="availability-light"[\s\S]*Open for Work - CV[\s\S]*<\/a>/,
  "homepage hero should link the availability status to the CV PDF"
);

assert.doesNotMatch(
  source,
  /hero-cv-button|href="resume\.html"|>view CV<\/a>/,
  "homepage hero should remove the standalone CV page button and route"
);

assert.match(
  source,
  /<aside class="hero-visual reveal" aria-hidden="true">[\s\S]*data-dog-zone="hero"/,
  "homepage dog visual should remain decorative after the primary actions"
);

assert.match(
  source,
  /<h2 id="contact-title">Open for work<\/h2>/,
  "homepage contact heading should use the concise open-for-work label"
);

assert.doesNotMatch(
  source,
  /class="focus-grid"|aria-label="Working range"|<strong>field work<\/strong>/,
  "homepage hero should not render the four focus-grid boxes"
);

assert.match(
  styles,
  /\.availability-status\s*\{[\s\S]*display:\s*inline-flex[\s\S]*font-size:\s*clamp\(11px, 0\.78vw, 13px\)/,
  "availability status should stay visually minimal"
);

assert.match(
  styles,
  /\.availability-light\s*\{[\s\S]*background:\s*var\(--availability-green\)/,
  "availability light should use the green availability token"
);

assert.match(
  styles,
  /\.button,\s*\n\.contact-link\s*\{[\s\S]*min-height:\s*34px[\s\S]*border-radius:\s*3px/,
  "shared CTA buttons should be smaller and boxy"
);

assert.doesNotMatch(
  styles,
  /\.hero-cv-button\b/,
  "stylesheet should not keep the removed standalone CV button style"
);

assert.match(
  source,
  /<section class="logo-banner reveal" aria-label="Network and association logos">[\s\S]*data-logo-banner-toggle[\s\S]*Johns Hopkins SAIS[\s\S]*Daadras Foundation[\s\S]*Forman Christian College/,
  "homepage should replace the proof line with a named association logo banner"
);

assert.equal(
  (source.match(/class="logo-tile" href=/g) || []).length,
  14,
  "homepage logo banner should expose the primary association tiles once for keyboard users"
);

for (const asset of logoAssets) {
  assert.match(source, new RegExp(`src="${asset.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`), `${asset} should be used in the logo banner`);
  assert.ok(fs.existsSync(path.join(__dirname, "..", asset)), `${asset} should exist locally`);
}

assert.equal(
  (logoBannerMarkup.match(/<img src="assets\/logos\//g) || []).length,
  16,
  "homepage logo banner should use sourced image marks for the primary and duplicate logo rows"
);

assert.equal(
  (source.match(/logo-tile__mark logo-tile__mark--text/g) || []).length,
  12,
  "only unverified or scholarship/program marks should render as text marks in the primary and duplicate rows"
);

for (const mark of ["BASI", "SALAM", "PFP", "PEEF", "PSF", "TR"]) {
  assert.match(source, new RegExp(`logo-tile__mark logo-tile__mark--text">${mark}<`), `${mark} should render as a styled text mark`);
}

assert.match(
  source,
  /Public Service Fellow[\s\S]*PEEF|PEEF[\s\S]*Public Service Fellow/,
  "homepage logo banner should include locally documented fellowship and scholarship associations"
);

assert.doesNotMatch(
  source,
  /<span class="logo-tile__mark">(?:SAIS|SNF|AI|MC|D|PS|DP|TN|SO|FCCU)<\/span>/,
  "sourced associations should not fall back to initial-only marks"
);

assert.doesNotMatch(
  logoBannerMarkup,
  /davis-middlebury-shield|Project Salam<\/strong><em>Pakistan<\/em><\/span><\/span>[\s\S]*assets\/logos\/daadras\.svg/,
  "Project Salam and Davis should not use borrowed logo assets without standalone verified marks"
);

assert.match(
  logoBannerRule,
  /grid-template-columns:\s*minmax\(0, 1fr\)/,
  "homepage logo banner should let the rolling logo track span the full width"
);

assert.doesNotMatch(
  source + styles,
  /logo-banner__head|network[\s\S]*US \+ Pakistan/,
  "homepage logo banner should not keep the label box"
);

assert.match(
  logoTrackRule,
  /animation:\s*logo-roll 56s linear infinite/,
  "homepage logo banner should continuously roll"
);

assert.match(
  styles,
  /\.logo-banner\.is-paused \.logo-banner__track\s*\{[\s\S]*animation-play-state:\s*paused/,
  "homepage logo banner should expose a user-controlled pause state"
);

assert.match(
  styles,
  /\.logo-banner__control\s*\{[\s\S]*min-height:\s*28px/,
  "homepage logo banner pause control should be compact but visible"
);

assert.match(
  fs.readFileSync(path.join(__dirname, "..", "script.js"), "utf8"),
  /function initLogoBannerControls\(\)[\s\S]*data-logo-banner-toggle[\s\S]*aria-pressed[\s\S]*initLogoBannerControls\(\);/,
  "script should wire the logo banner pause/play control"
);

assert.match(
  styles,
  /\.logo-banner__viewport\s*\{[\s\S]*mask-image:\s*linear-gradient\(90deg, transparent, #000 7%, #000 93%, transparent\)/,
  "homepage logo banner should fade its marquee edges instead of clipping abruptly"
);

assert.match(
  styles,
  /\.logo-banner__group\s*\{[\s\S]*flex:\s*0 0 auto/,
  "homepage logo banner groups should not shrink during marquee animation"
);

assert.match(
  logoTileRule,
  /flex:\s*0 0 clamp\(244px, 22vw, 324px\)[\s\S]*box-sizing:\s*border-box/,
  "homepage logo tiles should use a fixed no-shrink marquee rhythm"
);

assert.match(
  logoMarkRule,
  /width:\s*96px[\s\S]*background:\s*color-mix\(in srgb, #ffffff 88%, var\(--surface-solid\)\)/,
  "homepage logo mark well should give real logos a consistent theme-aware field"
);

assert.match(
  logoMarkImageRule,
  /object-fit:\s*contain/,
  "homepage logo images should fit within the compact mark well"
);

assert.match(
  logoMarkImageRule,
  /filter:\s*saturate\(0\.94\) contrast\(1\.12\)/,
  "homepage logo images should get a subtle contrast lift"
);

assert.doesNotMatch(
  source + styles,
  /proof-strip/,
  "old proof-strip line should be removed after the logo banner replacement"
);

assert.doesNotMatch(
  source,
  /<p class="section-number">01<\/p>/,
  "homepage section 01 should be removed"
);

assert.doesNotMatch(
  source,
  /id="field-title"/,
  "homepage proof/profile section should be removed with section 01"
);

assert.doesNotMatch(
  source,
  /aria-label="Section 04 reserved"/,
  "reserved homepage section 04 should be removed"
);

assert.doesNotMatch(
  source,
  /<p class="section-number reveal">04<\/p>/,
  "homepage reserved section 04 marker should be removed"
);

assert.doesNotMatch(
  source,
  /id="research-title"|A practical agenda for technical power|Research focus areas|id="research-tab-1"/,
  "homepage practical agenda section should be removed"
);

for (const [title, sectionNumber] of [["Projects", "02"], ["Writings", "05"], ["Ongoing projects", "06"]]) {
  assert.match(
    source,
    new RegExp(`<section class="editorial-section"[^>]*>[\\s\\S]*?<p class="section-number">${sectionNumber}<\\/p>[\\s\\S]*?<h2[^>]*>${title}<\\/h2>`),
    `homepage should render the ${title} editorial section with its stable section number`
  );
}

assert.equal(
  (source.match(/<article class="editorial-card reveal">/g) || []).length,
  9,
  "homepage editorial sections should display three cards each"
);

assert.equal(
  (source.match(/<figure class="editorial-card__media/g) || []).length,
  9,
  "every homepage editorial card should have a local image surface"
);

assert.doesNotMatch(
  source.match(/<section class="editorial-section"[\s\S]*?<section id="contact"/)?.[0] ?? "",
  /<img[^>]+src="https?:\/\//,
  "homepage editorial cards should use existing local image assets"
);

for (const asset of [
  "assets/logos/daadras.svg",
  "assets/impact-systems-map.png",
  "assets/rock-to-rack/screenshot-chain.png",
  "assets/work/work-gallery-dc.jpg",
  "assets/work/work-gallery-room.jpg",
  "assets/work/work-gallery-painting.jpg",
  "assets/policy-systems-map.png",
  "assets/impact-systems-map.png",
  "assets/rock-to-rack/screenshot-fab.png",
]) {
  assert.match(source, new RegExp(`src="${asset.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`), `${asset} should appear in a homepage editorial card`);
  assert.ok(fs.existsSync(path.join(__dirname, "..", asset)), `${asset} should exist locally`);
}

assert.match(
  styles,
  /\.editorial-card-grid\s*\{[\s\S]*grid-template-columns:\s*repeat\(3, minmax\(0, 1fr\)\)/,
  "homepage editorial cards should use a three-column desktop grid"
);

assert.match(
  styles,
  /@media \(max-width: 980px\)[\s\S]*\.editorial-card-grid\s*\{[\s\S]*grid-template-columns:\s*1fr/,
  "homepage editorial cards should stack at compact widths"
);

console.log("homepage sections ok");
