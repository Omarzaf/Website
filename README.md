# Muhammad Umar Zafar Website

Static personal website with no runtime backend and no package dependencies. The source repo contains authoring notes and design artifacts, but the publishable site is built into `dist/` from an explicit allowlist.

## Source Layers

- `*.html`, `styles.css`, `script.js`: the public static site shell, styling, canvas background, dark mode, tabs, and interaction states.
- `gameboy-dog-layer.css`, `gameboy-dog-layer.js`: optional homepage interactive layer and its exported helper functions for tests.
- `assets/`: public images referenced by the HTML pages.
- `tests/`: Node assertion tests for stable interactive-layer helpers.
- `tools/`: local build, validation, and brand-artifact utilities.
- `docs/`, `figma/`, `DESIGN*.md`, `brand-book.md`, `journey-into-Website.md`: authoring and design context; these are not copied into `dist/`.

## Local Development

```bash
python3 -m http.server 8765 --bind 127.0.0.1
```

Open `http://127.0.0.1:8765/`.

## Verification

```bash
node --check script.js
node --check gameboy-dog-layer.js
node --check tools/generate-brand-artifacts.cjs
node --check tools/build-public-site.cjs
node --check tools/check-static-site.cjs
node tests/gameboy-dog-layer.test.cjs
node tools/build-public-site.cjs
node tools/check-static-site.cjs
```

Deploy only the generated `dist/` directory. `vercel.json` is configured to build that directory, and the GitHub Actions workflow runs the same syntax, test, build, and publish-surface checks.
