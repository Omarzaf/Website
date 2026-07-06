const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const themeBoot = fs.readFileSync(path.join(root, "theme-boot.js"), "utf8");
const script = fs.readFileSync(path.join(root, "script.js"), "utf8");
const vercelConfig = JSON.parse(fs.readFileSync(path.join(root, "vercel.json"), "utf8"));
const publicPages = [
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

assert.match(themeBoot, /uz-theme/, "theme boot should read the shared theme storage key");
assert.match(
  themeBoot,
  /prefers-color-scheme: dark/,
  "theme boot should fall back to the system color scheme"
);
assert.match(
  themeBoot,
  /document\.documentElement\.dataset\.theme/,
  "theme boot should set the html data-theme attribute before first paint"
);

for (const page of publicPages) {
  const source = fs.readFileSync(path.join(root, page), "utf8");
  const bootIndex = source.indexOf('src="theme-boot.js');
  const stylesIndex = source.indexOf('href="styles.css');

  assert.ok(bootIndex > -1, `${page} should load theme-boot.js`);
  assert.ok(stylesIndex > -1, `${page} should load styles.css`);
  assert.ok(bootIndex < stylesIndex, `${page} should load theme-boot.js before the stylesheet`);
  assert.doesNotMatch(
    source.slice(bootIndex, source.indexOf(">", bootIndex)),
    /defer|async/,
    `${page} theme-boot.js must stay render-blocking to avoid a theme flash`
  );
}

assert.match(
  script,
  /root\.dataset\.theme \|\| getStoredTheme\(\) \|\| getSystemTheme\(\)/,
  "script should keep the boot theme instead of forcing light mode"
);

const rootHeaders = new Map(
  (vercelConfig.headers.find((rule) => rule.source === "/(.*)")?.headers || []).map((header) => [
    header.key,
    header.value,
  ])
);

assert.ok(
  rootHeaders.get("Content-Security-Policy")?.includes("default-src 'self'"),
  "deploy config should ship a restrictive Content-Security-Policy"
);
assert.equal(rootHeaders.get("X-Frame-Options"), "DENY", "deploy config should deny framing");
assert.ok(
  rootHeaders.get("Strict-Transport-Security")?.includes("max-age="),
  "deploy config should ship HSTS"
);

console.log("theme boot ok");
