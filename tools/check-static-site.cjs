#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const dist = path.join(root, "dist");
const vercelConfigPath = path.join(root, "vercel.json");

const publicFiles = new Set([
  "index.html",
  "about.html",
  "work.html",
  "writing.html",
  "projects.html",
  "daadras.html",
  "davis-project.html",
  "think-tank.html",
  "rock-to-rack.html",
  "rock-to-rack.css",
  "photography.html",
  "styles.css",
  "cube-field.css",
  "cube-field.js",
  "theme-boot.js",
  "script.js",
  "gameboy-dog-layer.css",
  "gameboy-dog-layer.js",
]);

const htmlFiles = [...publicFiles].filter((file) => file.endsWith(".html"));
const allowedAssetExtensions = new Set([".png", ".jpg", ".jpeg", ".svg", ".webp", ".gif", ".pdf"]);
const publicRoots = ["assets", "photos"];
const errors = [];
const requiredVercelHeaders = {
  "/(.*)": {
    "Content-Security-Policy":
      "default-src 'self'; script-src 'self'; style-src 'self' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests",
    "X-Frame-Options": "DENY",
    "Strict-Transport-Security": "max-age=63072000; includeSubDomains",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  },
  "/assets/(.*)": {
    "Cache-Control": "public, max-age=31536000, immutable",
  },
  "/photos/(.*)": {
    "Cache-Control": "public, max-age=31536000, immutable",
  },
};

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
  const tagPattern = /<(a|link|script|img|button)\b[^>]*>/gi;
  const referencePattern = /\b(?:href|src|data-full)=["']([^"']+)["']/gi;
  let match;

  while ((match = tagPattern.exec(source)) !== null) {
    const tag = match[0];
    let referenceMatch;

    while ((referenceMatch = referencePattern.exec(tag)) !== null) {
      const reference = referenceMatch[1];
      const localReference = normalizeLocalReference(reference);

      if (localReference || reference.startsWith("#")) {
        checkLocalReference(relativePath, reference);
      }
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

    if (publicRoots.some((rootName) => file.startsWith(`${rootName}/`))) {
      if (file.startsWith("photos/") && !file.startsWith("photos/full/") && !file.startsWith("photos/thumb/")) {
        addError(`dist/: raw photo master leaked into public build: ${file}`);
      }

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

function checkVercelConfig() {
  if (!fs.existsSync(vercelConfigPath)) {
    addError("Missing vercel.json deploy config");
    return;
  }

  let config;

  try {
    config = JSON.parse(fs.readFileSync(vercelConfigPath, "utf8"));
  } catch (error) {
    addError(`vercel.json is not valid JSON: ${error.message}`);
    return;
  }

  if (config.buildCommand !== "node tools/build-public-site.cjs") {
    addError('vercel.json: buildCommand must be "node tools/build-public-site.cjs"');
  }

  if (config.outputDirectory !== "dist") {
    addError('vercel.json: outputDirectory must be "dist"');
  }

  const headerRules = Array.isArray(config.headers) ? config.headers : [];

  for (const [source, requiredHeaders] of Object.entries(requiredVercelHeaders)) {
    const rule = headerRules.find((entry) => entry && entry.source === source);

    if (!rule) {
      addError(`vercel.json: missing header rule for ${source}`);
      continue;
    }

    const headers = new Map(
      (Array.isArray(rule.headers) ? rule.headers : []).map((header) => [header.key, header.value]),
    );

    for (const [key, value] of Object.entries(requiredHeaders)) {
      if (headers.get(key) !== value) {
        addError(`vercel.json: ${source} must set ${key}: ${value}`);
      }
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
checkVercelConfig();

if (errors.length > 0) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log("static site checks ok");
