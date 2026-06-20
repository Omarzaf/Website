# Repository Guidelines

## Project Structure & Module Organization

This repository is a static personal website. Keep the root simple:

- `index.html` contains the page structure, navigation anchors, content sections, and asset links.
- `styles.css` contains global variables, layout rules, responsive behavior, and visual treatments.
- `script.js` controls the animated canvas background and pointer interaction.
- `.codexignore` excludes generated or irrelevant files from agent context.

There is currently no build system, package manifest, test directory, or committed asset folder. Add new assets under a clearly named folder such as `assets/` only when the root starts becoming crowded.

## Build, Test, and Development Commands

Run locally with a static server:

```bash
python3 -m http.server 8765
```

Then open `http://127.0.0.1:8765/`.

Validate JavaScript syntax before shipping changes:

```bash
node --check script.js
```

For quick HTML/CSS review, load the page in a browser and check desktop and mobile widths. There is no compile step.

## Coding Style & Naming Conventions

Use two-space indentation in HTML, CSS, and JavaScript. Prefer semantic HTML sections with stable IDs for navigation, for example `#work`, `#writing`, and `#contact`. Keep CSS custom properties in `:root` and reuse them instead of duplicating colors or layout constants. Use kebab-case for CSS classes, descriptive function names in JavaScript, and `const` by default unless reassignment is required.

Avoid adding dependencies unless the static approach no longer fits the feature.

## Testing Guidelines

No automated test framework is configured. For every change, at minimum run `node --check script.js` and perform a browser smoke test. Verify that navigation links scroll correctly, the canvas renders without console errors, and the layout remains usable around mobile width (`320px`) and a desktop width.

## Commit & Pull Request Guidelines

This repository has no existing commits, so there is no local convention to preserve yet. Use concise Conventional Commit-style messages, such as `feat(site): add contact section` or `fix(canvas): handle resize state`.

Pull requests should include a short summary, screenshots for visual changes, verification steps run, and any known limitations. Link related issues when available.

## Security & Configuration Tips

Do not commit secrets, tokens, analytics keys, or personal credentials. If future configuration is needed, keep local-only values in ignored environment files and document required public settings separately.
