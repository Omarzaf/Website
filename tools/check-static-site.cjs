#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const dist = path.join(root, "dist");

const publicFiles = new Set([
  "index.html",
  "about.html",
  "work.html",
  "writing.html",
  "impact.html",
  "styles.css",
  "cube-field.css",
  "cube-field.js",
  "script.js",
  "gameboy-dog-layer.css",
  "gameboy-dog-layer.js",
]);

const htmlFiles = [...publicFiles].filter((file) => file.endsWith(".html"));
const allowedAssetExtensions = new Set([".png", ".jpg", ".jpeg", ".svg", ".webp", ".gif"]);
const publicRoots = ["assets"];
const errors = [];

const secretPatterns = [
  /-----BEGIN (?:RSA |OPENSSH |EC |DSA )?PRIVATE KEY-----/,
  /\bghp_[A-Za-z0-9_]{30,}\b/,
  /\bgithub_pat_[A-Za-z0-9_]{30,}\b/,
  /\bsk-[A-Za-z0-9]{20,}\b/,
  /\bAKIA[0-9A-Z]{16}\b/,
  /\bAIza[0-9A-Za-z_-]{30,}\b/,
  /\b(?:client_secret|access_token|refresh_token)\s*[:=]\s*['"][^'"]+['"]/i,
];

function addError(message) {
  errors.push(message);
}

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function normalizeLocalReference(reference) {
  if (
    !reference ||
    reference.startsWith("#") ||
    /^(?:https?:|mailto:|tel:|data:)/i.test(reference)
  ) {
    return null;
  }

  return reference.split(/[?#]/)[0];
}

function fileHasAnchor(relativePath, anchor) {
  if (!anchor) {
    return true;
  }

  const source = read(relativePath);
  const escaped = anchor.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`\\b(?:id|name)=["']${escaped}["']`).test(source);
}

function isPublicPath(relativePath) {
  return publicFiles.has(relativePath) || publicRoots.some((rootName) => relativePath.startsWith(`${rootName}/`));
}

function checkLocalReference(sourceFile, rawReference) {
  const [rawPath, anchor] = rawReference.split("#");
  const localPath = normalizeLocalReference(rawPath || rawReference);
  const targetPath = localPath || sourceFile;
  const resolved = path.normalize(path.join(path.dirname(sourceFile), targetPath));

  if (resolved.startsWith("..")) {
    addError(`${sourceFile}: reference escapes repo root: ${rawReference}`);
    return;
  }

  if (!fs.existsSync(path.join(root, resolved))) {
    addError(`${sourceFile}: missing local reference: ${rawReference}`);
    return;
  }

  if (!isPublicPath(resolved)) {
    addError(`${sourceFile}: references non-public file: ${rawReference}`);
  }

  if (anchor && resolved.endsWith(".html") && !fileHasAnchor(resolved, anchor)) {
    addError(`${sourceFile}: missing anchor #${anchor} in ${resolved}`);
  }
}

function checkHtml(relativePath) {
  const source = read(relativePath);
  const tagPattern = /<(a|link|script|img)\b[^>]*(?:href|src)=["']([^"']+)["'][^>]*>/gi;
  let match;

  while ((match = tagPattern.exec(source)) !== null) {
    const tag = match[0];
    const reference = match[2];
    const localReference = normalizeLocalReference(reference);

    if (localReference || reference.startsWith("#")) {
      checkLocalReference(relativePath, reference);
    }

    if (/<a\b/i.test(tag) && /\btarget=["']_blank["']/i.test(tag)) {
      const relMatch = tag.match(/\brel=["']([^"']+)["']/i);
      const relValues = relMatch ? relMatch[1].toLowerCase().split(/\s+/) : [];

      if (!relValues.includes("noopener") || !relValues.includes("noreferrer")) {
        addError(`${relativePath}: target=_blank link missing rel="noopener noreferrer"`);
      }
    }
  }
}

function walkFiles(baseDir, currentDir = baseDir) {
  const files = [];

  for (const entry of fs.readdirSync(currentDir, { withFileTypes: true })) {
    const absolute = path.join(currentDir, entry.name);

    if (entry.isDirectory()) {
      files.push(...walkFiles(baseDir, absolute));
      continue;
    }

    if (entry.isFile()) {
      files.push(path.relative(baseDir, absolute).split(path.sep).join("/"));
    }
  }

  return files.sort();
}

function checkSecrets(relativePath, baseDir = root) {
  const source = fs.readFileSync(path.join(baseDir, relativePath), "utf8");

  for (const pattern of secretPatterns) {
    if (pattern.test(source)) {
      addError(`${relativePath}: possible secret matched ${pattern}`);
    }
  }
}

function isAllowedAsset(file) {
  return allowedAssetExtensions.has(path.extname(file).toLowerCase());
}

function checkDist() {
  if (!fs.existsSync(dist)) {
    addError("dist/ does not exist; run node tools/build-public-site.cjs first");
    return;
  }

  const files = walkFiles(dist);

  for (const file of files) {
    const extension = path.extname(file).toLowerCase();

    if (file.startsWith(".") || file.includes("/.")) {
      addError(`dist/: hidden file leaked into public build: ${file}`);
    }

    if (file.startsWith("assets/")) {
      if (!isAllowedAsset(file)) {
        addError(`dist/: unexpected asset type: ${file}`);
      }
      continue;
    }

    if (!publicFiles.has(file)) {
      addError(`dist/: unexpected public file: ${file}`);
    }
  }
}

for (const file of publicFiles) {
  if (!fs.existsSync(path.join(root, file))) {
    addError(`Missing expected public source file: ${file}`);
  } else if (/\.(?:html|css|js)$/.test(file)) {
    checkSecrets(file);
  }
}

htmlFiles.forEach(checkHtml);
checkDist();

if (errors.length > 0) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log("static site checks ok");
