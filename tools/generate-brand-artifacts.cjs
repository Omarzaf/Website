#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const today = "2026-06-21";

function ensureDir(relativePath) {
  fs.mkdirSync(path.join(root, relativePath), { recursive: true });
}

function readAssetData(relativePath) {
  const absolutePath = path.join(root, relativePath);
  const extension = path.extname(relativePath).slice(1).toLowerCase();
  const mime = extension === "jpg" || extension === "jpeg" ? "image/jpeg" : "image/png";
  return `data:${mime};base64,${fs.readFileSync(absolutePath).toString("base64")}`;
}

function readFirstAssetData(relativePaths) {
  const relativePath = relativePaths.find((candidate) => fs.existsSync(path.join(root, candidate)));

  if (!relativePath) {
    throw new Error(`None of these assets exist: ${relativePaths.join(", ")}`);
  }

  return readAssetData(relativePath);
}

function esc(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function wrapText(text, maxChars) {
  const words = String(text).split(/\s+/);
  const lines = [];
  let line = "";

  words.forEach((word) => {
    const next = line ? `${line} ${word}` : word;

    if (next.length > maxChars && line) {
      lines.push(line);
      line = word;
      return;
    }

    line = next;
  });

  if (line) {
    lines.push(line);
  }

  return lines;
}

function textBlock(text, x, y, options = {}) {
  const {
    width = 380,
    size = 18,
    lineHeight = Math.round(size * 1.35),
    fill = "#565656",
    weight = 500,
    family = "Inter, Helvetica Neue, Arial, sans-serif",
    maxLines = 6,
    anchor = "start",
    uppercase = false,
  } = options;
  const maxChars = Math.max(10, Math.floor(width / (size * 0.54)));
  const lines = wrapText(uppercase ? String(text).toUpperCase() : text, maxChars).slice(0, maxLines);
  const tspans = lines
    .map((line, index) => `<tspan x="${x}" dy="${index === 0 ? 0 : lineHeight}">${esc(line)}</tspan>`)
    .join("");

  return `<text x="${x}" y="${y}" text-anchor="${anchor}" font-family="${family}" font-size="${size}" font-weight="${weight}" fill="${fill}">${tspans}</text>`;
}

function pill(label, x, y, width = 130, fill = "#ffffff", stroke = "#c9c9c9") {
  return `
    <rect x="${x}" y="${y}" width="${width}" height="34" rx="17" fill="${fill}" stroke="${stroke}"/>
    <text x="${x + 16}" y="${y + 22}" font-family="SFMono-Regular, Roboto Mono, monospace" font-size="11" font-weight="760" fill="#050505">${esc(label)}</text>
  `;
}

function arrow(x, y, color = "currentColor") {
  return `
    <path d="M${x} ${y}h13M${x + 8} ${y - 6}l6 6-6 6" fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="square" stroke-linejoin="miter"/>
  `;
}

function sectionLabel(number, x, y) {
  return `<text x="${x}" y="${y}" font-family="SFMono-Regular, Roboto Mono, monospace" font-size="14" font-weight="760" fill="#050505">${esc(number)}</text>`;
}

function gridPattern(id, color = "#050505", opacity = "0.055", size = 20) {
  return `
    <pattern id="${id}" width="${size}" height="${size}" patternUnits="userSpaceOnUse">
      <path d="M ${size} 0 L 0 0 0 ${size}" fill="none" stroke="${color}" stroke-opacity="${opacity}" stroke-width="1"/>
    </pattern>
  `;
}

function columnRules(x, y, width, height) {
  const quarter = width / 4;
  return [1, 2, 3]
    .map((index) => `<line x1="${x + quarter * index}" y1="${y}" x2="${x + quarter * index}" y2="${y + height}" stroke="#c9c9c9"/>`)
    .join("");
}

function header(x, y, width, active) {
  const nav = ["about", "work", "writing", "impact", "contact"];
  const navWidth = 520;
  const startX = x + width - navWidth - 164;
  return `
    <rect x="${x}" y="${y}" width="${width}" height="58" fill="#ffffff" stroke="#c9c9c9"/>
    <rect x="${x + 14}" y="${y + 18}" width="24" height="24" fill="#ffae00"/>
    <text x="${x + 20}" y="${y + 34}" font-family="SFMono-Regular, Roboto Mono, monospace" font-size="10" font-weight="760" fill="#050505">UZ</text>
    <text x="${x + 48}" y="${y + 35}" font-family="SFMono-Regular, Roboto Mono, monospace" font-size="14" font-weight="760" fill="#050505">umar zafar</text>
    ${nav
      .map((item, index) => {
        const itemX = startX + index * 96;
        const isActive = item === active;
        return `
          <rect x="${itemX - 8}" y="${y + 14}" width="82" height="26" fill="${isActive ? "#050505" : "transparent"}"/>
          <text x="${itemX}" y="${y + 33}" font-family="SFMono-Regular, Roboto Mono, monospace" font-size="13" font-weight="760" fill="${isActive ? "#ffffff" : "#050505"}">${item}</text>
        `;
      })
      .join("")}
    <rect x="${x + width - 136}" y="${y + 15}" width="74" height="28" fill="transparent"/>
    <rect x="${x + width - 126}" y="${y + 24}" width="12" height="12" fill="#ffae00" stroke="#050505"/>
    <text x="${x + width - 106}" y="${y + 34}" font-family="SFMono-Regular, Roboto Mono, monospace" font-size="13" font-weight="760" fill="#050505">dark</text>
    <text x="${x + width - 48}" y="${y + 34}" font-family="SFMono-Regular, Roboto Mono, monospace" font-size="13" font-weight="760" fill="#050505">email</text>
  `;
}

function card(x, y, width, height, eyebrow, title, body, tags = []) {
  return `
    <g>
      <rect x="${x}" y="${y}" width="${width}" height="${height}" rx="8" fill="#ffffff" fill-opacity="0.78" stroke="#c9c9c9"/>
      <line x1="${x}" y1="${y + 1}" x2="${x + width}" y2="${y + 1}" stroke="#ffae00" stroke-width="2"/>
      <text x="${x + 22}" y="${y + 32}" font-family="SFMono-Regular, Roboto Mono, monospace" font-size="12" font-weight="760" fill="#565656">${esc(eyebrow)}</text>
      ${textBlock(title, x + 22, y + 92, { width: width - 44, size: 38, lineHeight: 38, fill: "#050505", weight: 440, family: "Helvetica Neue, Arial, sans-serif", maxLines: 3 })}
      ${textBlock(body, x + 22, y + 186, { width: width - 44, size: 15, lineHeight: 22, fill: "#565656", maxLines: 5 })}
      ${tags
        .slice(0, 3)
        .map((tag, index) => pill(tag, x + 22 + index * 112, y + height - 52, 98, "#fff4d6", "#d9c27a"))
        .join("")}
    </g>
  `;
}

function visualFrame(x, y, width, height, imageHref, caption) {
  return `
    <g>
      <rect x="${x}" y="${y}" width="${width}" height="${height}" rx="8" fill="#ffffff" stroke="#c9c9c9"/>
      <clipPath id="clip-${x}-${y}"><rect x="${x + 1}" y="${y + 1}" width="${width - 2}" height="${height - 46}" rx="7"/></clipPath>
      <image href="${imageHref}" x="${x + 1}" y="${y + 1}" width="${width - 2}" height="${height - 46}" preserveAspectRatio="xMidYMid slice" clip-path="url(#clip-${x}-${y})"/>
      <rect x="${x}" y="${y + height - 45}" width="${width}" height="45" fill="#ffffff" fill-opacity="0.92" stroke="#c9c9c9"/>
      ${textBlock(caption, x + 12, y + height - 20, { width: width - 24, size: 12, lineHeight: 15, fill: "#565656", weight: 760, family: "SFMono-Regular, Roboto Mono, monospace", maxLines: 2 })}
    </g>
  `;
}

function pageFrame(page, x, y, width, height, innerSvg) {
  return `
    <g id="${page.id}">
      <rect x="${x - 28}" y="${y - 54}" width="${width + 56}" height="${height + 92}" rx="18" fill="#f7f7f7" stroke="#c9c9c9"/>
      <text x="${x}" y="${y - 20}" font-family="SFMono-Regular, Roboto Mono, monospace" font-size="15" font-weight="760" fill="#565656">${esc(page.label)}</text>
      <rect x="${x}" y="${y}" width="${width}" height="${height}" fill="#ffffff"/>
      <rect x="${x}" y="${y}" width="${width}" height="${height}" fill="url(#site-grid)"/>
      ${columnRules(x, y, width, height)}
      ${innerSvg}
      <rect x="${x}" y="${y}" width="${width}" height="${height}" fill="none" stroke="#050505" stroke-opacity="0.16"/>
    </g>
  `;
}

function proofStrip(x, y, width) {
  const links = ["CAIDP AI Policy Clinic", "Mercatus Bastiat Fellow", "Daadras founder", "The Nation byline", "SAIS Observer writing"];
  const cell = width / links.length;
  return `
    <g>
      <rect x="${x}" y="${y}" width="${width}" height="68" fill="#ffffff" fill-opacity="0.9" stroke="#c9c9c9"/>
      ${links
        .map((link, index) => `
          <line x1="${x + cell * index}" y1="${y}" x2="${x + cell * index}" y2="${y + 68}" stroke="#c9c9c9"/>
          ${textBlock(link, x + cell * index + 12, y + 25, { width: cell - 24, size: 12, lineHeight: 16, fill: "#565656", weight: 760, family: "SFMono-Regular, Roboto Mono, monospace", maxLines: 2 })}
        `)
        .join("")}
    </g>
  `;
}

function signalPanel(x, y) {
  return `
    <g>
      <rect x="${x}" y="${y}" width="322" height="252" rx="8" fill="#ffffff" fill-opacity="0.9" stroke="#c9c9c9"/>
      <text x="${x + 14}" y="${y + 30}" font-family="SFMono-Regular, Roboto Mono, monospace" font-size="13" font-weight="760" fill="#050505">signal</text>
      <text x="${x + 284}" y="${y + 30}" font-family="SFMono-Regular, Roboto Mono, monospace" font-size="13" font-weight="760" fill="#050505">24</text>
      <line x1="${x + 12}" y1="${y + 46}" x2="${x + 310}" y2="${y + 46}" stroke="#c9c9c9"/>
      <text x="${x + 14}" y="${y + 76}" font-family="SFMono-Regular, Roboto Mono, monospace" font-size="12" font-weight="760" fill="#050505">pressure</text>
      <line x1="${x + 14}" y1="${y + 98}" x2="${x + 308}" y2="${y + 98}" stroke="#c9c9c9" stroke-width="5"/>
      <circle cx="${x + 84}" cy="${y + 98}" r="8" fill="#ffae00" stroke="#050505"/>
      ${textBlock("technical systems", x + 14, y + 142, { width: 270, size: 28, lineHeight: 28, fill: "#050505", weight: 470, family: "Helvetica Neue, Arial, sans-serif", maxLines: 2 })}
      ${textBlock("Move the control or pointer to bend the grid around code, capital, and regulation.", x + 14, y + 188, { width: 282, size: 12, lineHeight: 16, fill: "#565656", weight: 760, family: "SFMono-Regular, Roboto Mono, monospace", maxLines: 3 })}
      ${[38, 48, 70, 44, 58]
        .map((barHeight, index) => `<rect x="${x + 16 + index * 58}" y="${y + 228 - barHeight}" width="48" height="${barHeight}" fill="${index === 2 ? "#ffae00" : "#050505"}"/>`)
        .join("")}
    </g>
  `;
}

function homePage(x, y, width, height, assets) {
  return `
    ${header(x, y, width, "")}
    <text x="${x + width / 2}" y="${y + 350}" text-anchor="middle" font-family="Helvetica Neue, Arial, sans-serif" font-size="360" font-weight="620" fill="#050505" opacity="0.045">UZ</text>
    <text x="${x + width / 4 + 16}" y="${y + 104}" font-family="SFMono-Regular, Roboto Mono, monospace" font-size="12" font-weight="760" fill="#8a8a8a">AI governance</text>
    <text x="${x + width / 2 + 16}" y="${y + 104}" font-family="SFMono-Regular, Roboto Mono, monospace" font-size="12" font-weight="760" fill="#8a8a8a">geopolitical risk</text>
    <text x="${x + width * 0.75 + 16}" y="${y + 104}" font-family="SFMono-Regular, Roboto Mono, monospace" font-size="12" font-weight="760" fill="#8a8a8a">public-interest systems</text>
    ${sectionLabel("00", x + 14, y + 185)}
    ${textBlock("I study how technical systems become political institutions.", x + 14, y + 285, { width: 910, size: 96, lineHeight: 88, fill: "#ffae00", weight: 360, family: "Helvetica Neue, Arial, sans-serif", maxLines: 5 })}
    ${textBlock("I work across AI governance, geopolitical risk, writing, and field-built social impact: the places where infrastructure, law, and human institutions start making each other.", x + width / 2 + 8, y + 630, { width: 560, size: 20, lineHeight: 29, fill: "#050505", weight: 520, maxLines: 5 })}
    ${pill("view work", x + width / 2 + 8, y + 730, 128, "#050505", "#050505")}
    <text x="${x + width / 2 + 25}" y="${y + 752}" font-family="SFMono-Regular, Roboto Mono, monospace" font-size="12" font-weight="760" fill="#ffffff">view work</text>
    ${arrow(x + width / 2 + 102, y + 747, "#ffffff")}
    ${pill("read writing", x + width / 2 + 150, y + 730, 152)}
    ${signalPanel(x + width - 360, y + 570)}
    ${proofStrip(x, y + 920, width)}
    ${sectionLabel("01", x + 14, y + 1090)}
    ${textBlock("A public profile built around proof, not polish.", x + 14, y + 1160, { width: 460, size: 54, lineHeight: 52, fill: "#050505", weight: 440, family: "Helvetica Neue, Arial, sans-serif", maxLines: 4 })}
    ${textBlock("The site organizes a blended identity: AI governance research, regional risk analysis, public writing, technical prototypes, and Daadras as field experience in institution-building.", x + 14, y + 1390, { width: 420, size: 17, lineHeight: 25, fill: "#565656", maxLines: 6 })}
    ${visualFrame(x + 520, y + 1080, 708, 445, assets.policy, "Generated editorial asset: institutional topology, policy corridors, and system pressure.")}
    ${sectionLabel("02", x + 14, y + 1640)}
    ${textBlock("Selected work across policy, risk, and prototypes.", x + width / 4 + 16, y + 1640, { width: 840, size: 64, lineHeight: 60, fill: "#050505", weight: 440, family: "Helvetica Neue, Arial, sans-serif", maxLines: 3 })}
    ${card(x + 14, y + 1860, 380, 330, "AI export controls / thesis", "The Epistemic Global City", "A SAIS thesis on corporate co-securitization in AI export controls using process tracing and lobbying data.")}
    ${card(x + 426, y + 1860, 380, 330, "AI governance / policy analysis", "CAIDP, BASI, Mercatus", "Work across AI policy clinic research, responsible scaling, compute governance, sovereign AI, and institutional resilience.")}
    ${card(x + 838, y + 1860, 390, 330, "geopolitical risk / South Asia", "Telophase analysis", "Intelligence-led analysis on Bangladesh, dual-use technology, cybersecurity platforms, 5G, and defense modernization.")}
  `;
}

function simplePage(page, x, y, width, height, assets) {
  const active = page.id === "page-home" ? "" : page.nav;
  const visual = page.visual === "impact" ? assets.impact : assets.policy;
  const cards = page.cards || [];
  return `
    ${header(x, y, width, active)}
    <text x="${x + width / 2}" y="${y + 338}" text-anchor="middle" font-family="Helvetica Neue, Arial, sans-serif" font-size="330" font-weight="620" fill="#050505" opacity="0.045">UZ</text>
    ${sectionLabel(page.nav, x + 14, y + 185)}
    ${textBlock(page.title, x + 14, y + 292, { width: 980, size: 82, lineHeight: 78, fill: "#ffae00", weight: 360, family: "Helvetica Neue, Arial, sans-serif", maxLines: 4 })}
    ${textBlock(page.body, x + width / 2 + 8, y + 610, { width: 560, size: 20, lineHeight: 29, fill: "#050505", weight: 520, maxLines: 4 })}
    ${sectionLabel("01", x + 14, y + 890)}
    ${textBlock(page.featureTitle, x + 14, y + 960, { width: 430, size: 56, lineHeight: 54, fill: "#050505", weight: 440, family: "Helvetica Neue, Arial, sans-serif", maxLines: 4 })}
    ${textBlock(page.featureBody, x + 14, y + 1185, { width: 420, size: 17, lineHeight: 25, fill: "#565656", maxLines: 6 })}
    ${visualFrame(x + 520, y + 900, 708, 445, visual, page.visualCaption)}
    ${sectionLabel("02", x + 14, y + 1500)}
    ${textBlock(page.sectionTitle, x + width / 4 + 16, y + 1500, { width: 850, size: 64, lineHeight: 60, fill: "#050505", weight: 440, family: "Helvetica Neue, Arial, sans-serif", maxLines: 3 })}
    ${cards
      .slice(0, 6)
      .map((item, index) => {
        const col = index % 3;
        const row = Math.floor(index / 3);
        return card(x + 14 + col * 406, y + 1720 + row * 360, 374, 318, item.eyebrow, item.title, item.body, item.tags);
      })
      .join("")}
    ${sectionLabel(page.contactNumber || "03", x + 14, y + height - 360)}
    ${textBlock(page.contactTitle, x + width / 4 + 16, y + height - 360, { width: 870, size: 64, lineHeight: 60, fill: "#050505", weight: 440, family: "Helvetica Neue, Arial, sans-serif", maxLines: 3 })}
    ${textBlock(page.contactBody, x + width / 2 + 8, y + height - 145, { width: 560, size: 18, lineHeight: 27, fill: "#565656", weight: 500, maxLines: 3 })}
  `;
}

function tokenBoard(x, y, assets) {
  const colors = [
    ["Ink", "#050505"],
    ["Canvas", "#ffffff"],
    ["Signal Gold", "#ffae00"],
    ["Pressed Gold", "#d89100"],
    ["Warm Brown", "#9b6829"],
    ["Muted Text", "#565656"],
    ["Rule", "#c9c9c9"],
    ["Surface", "#f7f7f7"],
  ];
  return `
    <g id="brand-system">
      <rect x="${x}" y="${y}" width="1256" height="900" rx="18" fill="#ffffff" stroke="#c9c9c9"/>
      <rect x="${x}" y="${y}" width="1256" height="900" rx="18" fill="url(#site-grid)"/>
      ${textBlock("Brand Book", x + 44, y + 95, { width: 500, size: 76, lineHeight: 72, fill: "#ffae00", weight: 360, family: "Helvetica Neue, Arial, sans-serif", maxLines: 2 })}
      ${textBlock("Muhammad Umar Zafar", x + 46, y + 165, { width: 420, size: 18, lineHeight: 26, fill: "#050505", weight: 760, family: "SFMono-Regular, Roboto Mono, monospace", maxLines: 1 })}
      ${textBlock("Editorial systems brand for AI governance, geopolitical risk, public writing, and field-built social impact.", x + 46, y + 230, { width: 530, size: 22, lineHeight: 31, fill: "#050505", weight: 520, maxLines: 4 })}
      <rect x="${x + 662}" y="${y + 72}" width="112" height="112" fill="#ffae00"/>
      <text x="${x + 690}" y="${y + 142}" font-family="SFMono-Regular, Roboto Mono, monospace" font-size="34" font-weight="760" fill="#050505">UZ</text>
      <text x="${x + 804}" y="${y + 118}" font-family="Helvetica Neue, Arial, sans-serif" font-size="42" font-weight="440" fill="#050505">umar zafar</text>
      <text x="${x + 806}" y="${y + 155}" font-family="SFMono-Regular, Roboto Mono, monospace" font-size="13" font-weight="760" fill="#565656">AI governance / geopolitical risk / public-interest systems</text>
      ${colors
        .map((color, index) => {
          const col = index % 4;
          const row = Math.floor(index / 4);
          const swatchX = x + 44 + col * 292;
          const swatchY = y + 350 + row * 134;
          return `
            <rect x="${swatchX}" y="${swatchY}" width="238" height="78" rx="8" fill="${color[1]}" stroke="#c9c9c9"/>
            <text x="${swatchX}" y="${swatchY + 105}" font-family="SFMono-Regular, Roboto Mono, monospace" font-size="12" font-weight="760" fill="#565656">${esc(color[0])} / ${color[1]}</text>
          `;
        })
        .join("")}
      ${textBlock("Typography", x + 44, y + 658, { width: 300, size: 16, lineHeight: 22, fill: "#050505", weight: 760, family: "SFMono-Regular, Roboto Mono, monospace", uppercase: true })}
      ${textBlock("Technical systems become political institutions.", x + 44, y + 735, { width: 600, size: 52, lineHeight: 50, fill: "#050505", weight: 360, family: "Helvetica Neue, Arial, sans-serif", maxLines: 2 })}
      ${textBlock("Mono labels carry proof, chronology, controls, and navigation. Body copy stays plain, dense, and readable.", x + 714, y + 710, { width: 440, size: 18, lineHeight: 27, fill: "#565656", weight: 500, maxLines: 4 })}
      ${pill("view work", x + 714, y + 800, 130, "#050505", "#050505")}
      <text x="${x + 731}" y="${y + 822}" font-family="SFMono-Regular, Roboto Mono, monospace" font-size="12" font-weight="760" fill="#ffffff">view work</text>
      ${pill("research theme", x + 865, y + 800, 150, "#fff4d6", "#d9c27a")}
      ${visualFrame(x + 1028, y + 675, 170, 130, assets.policy, "systems map")}
    </g>
  `;
}

function buildBrandBook() {
  return `# Muhammad Umar Zafar Brand Book

Generated: ${today}

## Brand Position

Muhammad Umar Zafar's site presents a public identity at the intersection of AI governance, geopolitical risk, public writing, technical prototypes, and field-built social impact. The brand should feel rigorous, institutional, and alive under pressure: less portfolio polish, more analytical command.

## Core Idea

**Technical systems become political institutions.**

This sentence is the center of the brand. It should guide page structure, visual rhythm, copy, and future assets.

## Personality

- Editorial, not promotional.
- Systems-literate, not abstract.
- Public-interest oriented, not corporate.
- Tense and analytical, not decorative.
- Human enough to carry writing and impact work without diluting the research profile.

## Visual System

The site uses a stark grid, column rules, oversized display type, mono labels, and a signal-gold accent. The visual metaphor is institutional pressure: lines, maps, signal bars, tabs, filters, and data-like panels.

### Color Tokens

| Token | Hex | Use |
| --- | --- | --- |
| Ink | \`#050505\` | Primary text, strong controls, page borders |
| Canvas | \`#ffffff\` | Main light background |
| Signal Gold | \`#ffae00\` | Brand mark, hero headline, active state, signal marks |
| Pressed Gold | \`#d89100\` | Pressed or active accent depth |
| Warm Brown | \`#9b6829\` | Accent text on soft gold tags |
| Muted Text | \`#565656\` | Body support and captions |
| Faint Text | \`#8a8a8a\` | Metadata and quiet labels |
| Rule | \`#c9c9c9\` | Grid, card, panel, and section separators |
| Surface | \`#f7f7f7\` | Secondary light surface |
| Dark Canvas | \`#050505\` | Dark-mode background |
| Dark Text | \`#f7f3ea\` | Dark-mode primary text |
| Dark Gold | \`#ffb31a\` | Dark-mode signal accent |

## Typography

Display typography uses the system Helvetica stack with large, tight, editorial sizing and zero letter-spacing. The homepage H1 is intentionally oversized and compressed in line-height. Mono typography carries navigation, labels, proof links, tags, readouts, controls, and section numbers.

Recommended CSS stacks:

\`\`\`css
--font-display: "Helvetica Neue", Helvetica, Arial, ui-sans-serif, system-ui, sans-serif;
--font-text: Inter, "Helvetica Neue", Helvetica, Arial, ui-sans-serif, system-ui, sans-serif;
--font-mono: "SFMono-Regular", "Roboto Mono", "Courier New", monospace;
\`\`\`

## Logo And Mark

The primary mark is a compact \`UZ\` monogram in a gold square. It should stay blunt and typographic. Do not soften it into a rounded app icon, badge, seal, or ornamental logo.

Rules:
- Keep the mark square.
- Use Signal Gold as the default fill.
- Pair with lowercase \`umar zafar\` in mono type.
- Let the large ghosted \`UZ\` operate as an environmental background mark on hero pages.

## Layout Principles

- Use four-column desktop structure with visible column rules.
- Treat each page as an editorial board, not a landing-page funnel.
- Use section numbers as navigation and pacing devices.
- Keep cards restrained: 8px radius, thin border, gold top rule.
- Keep buttons pill-shaped and mono, with minimal copy.
- Use visual assets as institutional maps or program architecture, not generic decoration.

## Component Guidance

### Header

Sticky, compact, mono, and utilitarian. Active navigation inverts to ink background and canvas text.

### Hero

Hero pages should combine a huge gold display headline, restrained explanatory copy, and a background ghost mark. The homepage may include signal controls or data-like panels.

### Cards

Cards should carry an eyebrow, strong display title, concise body copy, and optional tags. Hover states can lift slightly and shift strong text to gold.

### Proof Strip

Proof links are important for credibility. Keep them dense and mono, with direct external references where possible.

### Visual Frames

Use real assets from \`assets/\` or generated editorial images. Frames should have 8px radius, thin rules, and caption bars.

## Copy Voice

The voice should sound like institutional analysis under human pressure. Avoid generic portfolio claims. Prefer concrete domains, public proof, named systems, and clean sentences.

Good:
- "A public profile built around proof, not polish."
- "Programs built from trust before curriculum."
- "Writing for the space before consensus arrives."

Avoid:
- "Passionate multidisciplinary professional."
- "Innovative solutions for a changing world."
- "Leveraging technology to empower communities."

## Figma Import Package

The companion SVG board is at:

\`\`\`text
figma/umar-zafar-website-board.svg
\`\`\`

Import it into Figma with **File -> Place image** or drag it into the canvas. Text and vector shapes should remain inspectable; board-optimized copies of the two existing site assets are embedded as data images so the board travels as one file.
`;
}

function buildSpec() {
  return `# Brand Book And Figma SVG Design

Date: ${today}

## Goal

Create a brand book and one large Figma-importable SVG board for the existing static personal website in \`/Users/omar/Documents/Website\`.

## Source Of Truth

The design is grounded in the current site files:

- \`index.html\`
- \`about.html\`
- \`work.html\`
- \`writing.html\`
- \`impact.html\`
- \`styles.css\`
- \`assets/policy-systems-map.png\`
- \`assets/impact-systems-map.png\`

## Output

- \`brand-book.md\`
- \`figma/umar-zafar-website-board.svg\`
- \`figma/README.md\`
- \`figma/assets/policy-systems-map-board.jpg\`
- \`figma/assets/impact-systems-map-board.jpg\`

## Design Direction

The brand system uses a stark editorial grid, black/white/gold palette, mono labels, oversized Helvetica-stack display type, and institutional-systems imagery. The SVG board presents a brand-system panel plus five desktop page frames covering the complete website structure.

## Verification

- SVG must parse as XML.
- \`node --check script.js\` must pass.
- Existing site files must not be modified.
`;
}

function buildPlan() {
  return `# Brand Book And Figma SVG Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (\`- [ ]\`) syntax for tracking.

**Goal:** Build a repo-local brand book and one Figma-importable SVG board for the complete static website.

**Architecture:** A small Node generator stores the brand/page data and emits Markdown plus SVG artifacts. The generated SVG embeds the existing PNG assets as data URLs so the file can be imported into Figma without broken local image links.

**Tech Stack:** Static HTML/CSS source files, Node.js standard library, SVG, Markdown.

---

### Task 1: Generate Artifacts

**Files:**
- Create: \`tools/generate-brand-artifacts.cjs\`
- Create: \`brand-book.md\`
- Create: \`figma/README.md\`
- Create: \`figma/assets/policy-systems-map-board.jpg\`
- Create: \`figma/assets/impact-systems-map-board.jpg\`
- Create: \`figma/umar-zafar-website-board.svg\`

- [ ] **Step 1: Add generator**

Create \`tools/generate-brand-artifacts.cjs\` with page metadata, SVG helpers, and Markdown output functions.

- [ ] **Step 2: Create board thumbnail assets**

Run: \`mkdir -p figma/assets && sips -s format jpeg -s formatOptions 82 -Z 900 assets/policy-systems-map.png --out figma/assets/policy-systems-map-board.jpg && sips -s format jpeg -s formatOptions 82 -Z 900 assets/impact-systems-map.png --out figma/assets/impact-systems-map-board.jpg\`

Expected: creates lightweight JPG copies for the SVG board without modifying source assets.

- [ ] **Step 3: Run generator**

Run: \`node tools/generate-brand-artifacts.cjs\`

Expected: writes \`brand-book.md\`, \`figma/README.md\`, and \`figma/umar-zafar-website-board.svg\`. The SVG prefers board-optimized JPG copies under \`figma/assets/\` and falls back to source PNGs under \`assets/\` if those copies are missing.

### Task 2: Verify Artifacts

**Files:**
- Check: \`figma/umar-zafar-website-board.svg\`
- Check: \`script.js\`

- [ ] **Step 1: Parse SVG**

Run: \`python3 - <<'PY'\\nimport xml.etree.ElementTree as ET\\nET.parse('figma/umar-zafar-website-board.svg')\\nprint('svg ok')\\nPY\`

Expected: \`svg ok\`.

- [ ] **Step 2: Check JavaScript syntax**

Run: \`node --check script.js\`

Expected: no output and exit code 0.

- [ ] **Step 3: Confirm site files were not changed**

Run: \`git status --short\`

Expected: generated artifacts are new; pre-existing \`styles.css\` and \`design_resources.md\` changes remain untouched.
`;
}

function buildReadme() {
  return `# Figma Import Notes

\`umar-zafar-website-board.svg\` is a single large SVG board for Figma import.

Import options:

1. Drag the SVG into a Figma canvas.
2. Or use **File -> Place image** and select the SVG.

The board includes:

- Brand-system panel with logo, colors, typography, and component samples.
- Desktop frame for \`index.html\`.
- Desktop frame for \`about.html\`.
- Desktop frame for \`work.html\`.
- Desktop frame for \`writing.html\`.
- Desktop frame for \`impact.html\`.

Board-optimized copies of the existing site images from \`assets/\` are embedded as data URLs so the SVG remains portable.
`;
}

function buildSvg() {
  const assets = {
    policy: readFirstAssetData(["figma/assets/policy-systems-map-board.jpg", "assets/policy-systems-map.png"]),
    impact: readFirstAssetData(["figma/assets/impact-systems-map-board.jpg", "assets/impact-systems-map.png"]),
  };
  const width = 4100;
  const height = 7300;
  const frameWidth = 1256;
  const frameHeight = 2800;
  const pages = [
    {
      id: "page-home",
      label: "Homepage / index.html",
      render: (x, y) => homePage(x, y, frameWidth, frameHeight, assets),
    },
    {
      id: "page-about",
      nav: "about",
      label: "About / about.html",
      title: "A life organized around institutions, power, and public purpose.",
      body: "Muhammad Umar Zafar is a Washington, DC-based Pakistani writer and policy researcher working where AI governance, geopolitical risk, and social-impact institutions overlap.",
      featureTitle: "Bio.",
      featureBody: "I work where AI, geopolitics, and public-purpose institutions collide. The research gives language to systems, the writing keeps the human cost visible, and the prototypes test whether an idea can survive contact with use.",
      visual: "policy",
      visualCaption: "Policy systems visual anchor for institutional analysis.",
      sectionTitle: "Education and formation.",
      cards: [
        { eyebrow: "2024-2026", title: "Johns Hopkins SAIS", body: "MA in International Relations, Technology and Innovation Policy. Public Service Fellow Scholar.", tags: ["SAIS", "AI policy"] },
        { eyebrow: "2019-2023", title: "Forman Christian College", body: "BS in Political Science, Philosophy, and Sociology. Magna Cum Laude.", tags: ["politics", "philosophy"] },
        { eyebrow: "ongoing", title: "Intellectual anchors", body: "Postcolonial theory, international political economy, AI policy, cybersecurity, and infrastructure politics.", tags: ["theory", "IPE"] },
        { eyebrow: "policy", title: "AI governance", body: "Export controls, compute policy, trust and safety, democratic values, cybersecurity policy.", tags: ["compute", "safety"] },
        { eyebrow: "analysis", title: "Risk", body: "South Asia, MENA, digital governance, regional security, infrastructure and supply chains.", tags: ["MENA", "South Asia"] },
        { eyebrow: "technical", title: "Prototypes", body: "D3.js, Leaflet, FastAPI, data extraction, automation workflows, research tools.", tags: ["D3", "FastAPI"] },
      ],
      contactTitle: "For research, writing, and policy systems work.",
      contactBody: "The best conversations are about AI governance, geopolitical risk, public-interest infrastructure, or complex institutions.",
    },
    {
      id: "page-work",
      nav: "work",
      label: "Work / work.html",
      title: "Case studies in policy, risk, and usable systems.",
      body: "A selected portfolio: research that explains institutions, prototypes that make systems inspectable, and field programs that turned ideas into operations.",
      featureTitle: "The common method is systems legibility.",
      featureBody: "Whether the artifact is a thesis, a policy memo, a risk brief, or a working map, the goal is the same: turn diffuse institutional pressure into something a reader or team can inspect.",
      visual: "policy",
      visualCaption: "Generated editorial asset used as a policy-systems visual anchor.",
      sectionTitle: "Selected work.",
      cards: [
        { eyebrow: "MA thesis / AI export controls", title: "The Epistemic Global City", body: "Corporate actors such as Nvidia and Google as co-securitizers in U.S.-China AI export-control architecture.", tags: ["export controls", "AI"] },
        { eyebrow: "policy clinic", title: "CAIDP AI Policy Clinic", body: "Comprehensive AI policy program involving research, writing, policy analysis, and democratic values work.", tags: ["policy", "values"] },
        { eyebrow: "fellowship", title: "Mercatus and BASI", body: "Research and training across compute governance, responsible scaling, energy security, and frontier AI policy.", tags: ["compute", "RSPs"] },
        { eyebrow: "geopolitical risk", title: "Telophase analysis", body: "Intelligence-led briefs on Bangladesh, cybersecurity, 5G, dual-use technology, and defense modernization.", tags: ["risk", "5G"] },
        { eyebrow: "hackathon", title: "AIxBio early warning", body: "Waterborne pathogen early-warning engine using extraction, translation, geocoding, FastAPI, and Leaflet.", tags: ["biosecurity", "Leaflet"] },
        { eyebrow: "field program", title: "Daadras Foundation", body: "Education, relief, digital-literacy, and community programming through Daadras and Project Salam.", tags: ["education", "impact"] },
      ],
      contactTitle: "Need a clearer map of a messy policy system?",
      contactBody: "Available for research, prototypes, writing, and analysis around AI governance, infrastructure risk, and institutional design.",
    },
    {
      id: "page-writing",
      nav: "writing",
      label: "Writing / writing.html",
      title: "Writing for the space before consensus arrives.",
      body: "Essays, columns, and research that move from personal experience to structural argument without sanding down the contradiction.",
      featureTitle: "Voice.",
      featureBody: "The strongest writing begins with an image or contradiction, moves through lived experience, and ends by naming the structure behind it.",
      visual: "policy",
      visualCaption: "Systems image direction for essays about technology, institutions, and public power.",
      sectionTitle: "Research themes.",
      cards: [
        { eyebrow: "columns", title: "The Nation author page", body: "Public byline page for opinion columns published under Muhammad Umar Zafar.", tags: ["columns", "public"] },
        { eyebrow: "essay", title: "An Educative Tribute to Abdus Salam", body: "A SAIS Observer essay connecting Pakistan, education, class, and Project Salam.", tags: ["education", "class"] },
        { eyebrow: "AI and political economy", title: "Compute as a Public Good", body: "Research on HPC concentration, AI divides, and shared computing policy.", tags: ["compute", "public good"] },
        { eyebrow: "cybersecurity", title: "Pakistan's cyber-nuclear doctrine", body: "Strategic analysis of cyber doctrine through deterrence, legal control, and authoritarian consolidation.", tags: ["cyber", "doctrine"] },
        { eyebrow: "media systems", title: "The Algorithm is an Abyss", body: "Diary-based platform observation with theory on algorithmic power and codified reality.", tags: ["media", "platforms"] },
        { eyebrow: "law and empire", title: "TWAIL and institutional inheritance", body: "Postcolonial legal analysis of power, sovereignty, and whose knowledge counts.", tags: ["law", "empire"] },
      ],
      contactTitle: "For essays, policy writing, and argument development.",
      contactBody: "Reach out for writing, research briefs, or editorial work around AI, geopolitics, institutions, and public power.",
    },
    {
      id: "page-impact",
      nav: "impact",
      label: "Impact / impact.html",
      title: "Programs built from trust before curriculum.",
      body: "Daadras began as a grassroots response during COVID-19 and grew into education, relief, digital literacy, and peacebuilding work across communities in Pakistan.",
      featureTitle: "Daadras Foundation.",
      featureBody: "Founded in Lahore, Daadras works across education, technology, social-emotional learning, and humanitarian response.",
      visual: "impact",
      visualCaption: "Generated editorial asset for Daadras, Project Salam, and field-program architecture.",
      sectionTitle: "Public and local impact record.",
      cards: [
        { eyebrow: "foundation scale", title: "2,000+", body: "Beneficiaries across education, relief, and community programs.", tags: ["scale", "programs"] },
        { eyebrow: "Project Salam", title: "111+", body: "Children transformed across 3 partner organizations, as listed on the public Project Salam page.", tags: ["children", "partners"] },
        { eyebrow: "relief", title: "1,000+", body: "Families supported through ration, medicine, sanitary-product, and emergency relief work.", tags: ["relief", "families"] },
        { eyebrow: "Davis grant", title: "$10K", body: "Projects for Peace grant for theatre-based dialogue and youth peacebuilding in Lahore.", tags: ["peace", "grant"] },
        { eyebrow: "curriculum", title: "Project Salam", body: "Computers, chess, social-emotional learning, public speaking, creative technology, and mentorship.", tags: ["digital", "SEL"] },
        { eyebrow: "peacebuilding", title: "Theatre and dialogue", body: "Role reversal, performance, dialogue, and a guide for adaptation by schools and community organizations.", tags: ["theatre", "dialogue"] },
      ],
      contactNumber: "06",
      contactTitle: "For programs that need trust before scale.",
      contactBody: "Reach out for program design, impact storytelling, education-technology strategy, or research connecting field reality to policy design.",
    },
  ];

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title desc">
  <title id="title">Muhammad Umar Zafar Website Brand Book And Figma Board</title>
  <desc id="desc">One large Figma-importable SVG board containing brand tokens and desktop frames for the complete website.</desc>
  <defs>
    ${gridPattern("site-grid", "#050505", "0.052", 10)}
    ${gridPattern("major-grid", "#050505", "0.1", 50)}
    <filter id="soft-shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="24" stdDeviation="24" flood-color="#050505" flood-opacity="0.09"/>
    </filter>
  </defs>
  <rect width="${width}" height="${height}" fill="#ededed"/>
  <rect width="${width}" height="${height}" fill="url(#major-grid)"/>
  ${tokenBoard(80, 80, assets)}
  ${pageFrame(pages[0], 80, 1120, frameWidth, frameHeight, pages[0].render(80, 1120))}
  ${pageFrame(pages[1], 1460, 1120, frameWidth, frameHeight, simplePage(pages[1], 1460, 1120, frameWidth, frameHeight, assets))}
  ${pageFrame(pages[2], 2840, 1120, frameWidth, frameHeight, simplePage(pages[2], 2840, 1120, frameWidth, frameHeight, assets))}
  ${pageFrame(pages[3], 80, 4260, frameWidth, frameHeight, simplePage(pages[3], 80, 4260, frameWidth, frameHeight, assets))}
  ${pageFrame(pages[4], 1460, 4260, frameWidth, frameHeight, simplePage(pages[4], 1460, 4260, frameWidth, frameHeight, assets))}
  <g id="usage-notes">
    <rect x="2840" y="4260" width="1256" height="2800" rx="18" fill="#050505"/>
    <rect x="2840" y="4260" width="1256" height="2800" rx="18" fill="url(#major-grid)" opacity="0.3"/>
    ${textBlock("Usage Notes", 2890, 4380, { width: 620, size: 76, lineHeight: 72, fill: "#ffb31a", weight: 360, family: "Helvetica Neue, Arial, sans-serif", maxLines: 2 })}
    ${textBlock("Import this SVG into Figma as one board. The frames are intentionally desktop-first because the live site handles responsive behavior in CSS.", 2892, 4520, { width: 820, size: 24, lineHeight: 34, fill: "#f7f3ea", weight: 500, maxLines: 4 })}
    ${textBlock("Do", 2890, 4730, { width: 300, size: 18, lineHeight: 26, fill: "#ffb31a", weight: 760, family: "SFMono-Regular, Roboto Mono, monospace", uppercase: true })}
    ${textBlock("Keep the grid visible. Keep the UZ mark square. Use proof links and named institutions. Use generated map assets when a visual needs to explain system pressure.", 2890, 4790, { width: 900, size: 28, lineHeight: 39, fill: "#f7f3ea", weight: 440, maxLines: 5 })}
    ${textBlock("Avoid", 2890, 5120, { width: 300, size: 18, lineHeight: 26, fill: "#ffb31a", weight: 760, family: "SFMono-Regular, Roboto Mono, monospace", uppercase: true })}
    ${textBlock("Do not turn the site into a glossy startup landing page. Avoid generic gradients, stock illustrations, rounded app badges, vague portfolio copy, and decorative visuals that do not carry institutional meaning.", 2890, 5180, { width: 930, size: 28, lineHeight: 39, fill: "#f7f3ea", weight: 440, maxLines: 6 })}
    ${visualFrame(2890, 5680, 530, 335, assets.policy, "Policy systems asset")}
    ${visualFrame(3480, 5680, 530, 335, assets.impact, "Impact systems asset")}
  </g>
</svg>
`;
}

function writeFile(relativePath, content) {
  fs.writeFileSync(path.join(root, relativePath), content);
}

ensureDir("figma");
ensureDir("docs/superpowers/specs");
ensureDir("docs/superpowers/plans");

writeFile("brand-book.md", buildBrandBook());
writeFile("docs/superpowers/specs/2026-06-21-brand-book-figma-svg-design.md", buildSpec());
writeFile("docs/superpowers/plans/2026-06-21-brand-book-figma-svg.md", buildPlan());
writeFile("figma/README.md", buildReadme());
writeFile("figma/umar-zafar-website-board.svg", buildSvg());

console.log("Generated brand-book.md");
console.log("Generated docs/superpowers/specs/2026-06-21-brand-book-figma-svg-design.md");
console.log("Generated docs/superpowers/plans/2026-06-21-brand-book-figma-svg.md");
console.log("Generated figma/README.md");
console.log("Generated figma/umar-zafar-website-board.svg");
