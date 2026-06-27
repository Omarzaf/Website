const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const source = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");

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

console.log("homepage section removals ok");
