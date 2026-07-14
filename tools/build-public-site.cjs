#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const dist = path.join(root, "dist");

const publicFiles = [
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
];

const publicDirs = ["assets", "photos"];
const ignoredNames = new Set([".DS_Store"]);

function copyFile(relativePath) {
  const source = path.join(root, relativePath);
  const target = path.join(dist, relativePath);

  if (!fs.existsSync(source)) {
    throw new Error(`Missing public file: ${relativePath}`);
  }

  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
}

function copyDir(relativePath) {
  const source = path.join(root, relativePath);

  if (!fs.existsSync(source)) {
    throw new Error(`Missing public directory: ${relativePath}`);
  }

  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    if (ignoredNames.has(entry.name)) {
      continue;
    }

    const child = path.join(relativePath, entry.name);

    if (entry.isDirectory()) {
      copyDir(child);
      continue;
    }

    if (entry.isFile()) {
      copyFile(child);
    }
  }
}

fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(dist, { recursive: true });

publicFiles.forEach(copyFile);
publicDirs.forEach(copyDir);

console.log(`Built public site with ${publicFiles.length} root files and ${publicDirs.length} asset directory.`);
