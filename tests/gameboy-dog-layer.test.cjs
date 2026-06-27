const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const sourcePath = path.join(__dirname, "..", "gameboy-dog-layer.js");
const sandbox = {
  console,
  globalThis: null,
  module: { exports: {} },
};

sandbox.globalThis = sandbox;
vm.runInNewContext(fs.readFileSync(sourcePath, "utf8"), sandbox, {
  filename: sourcePath,
});

const {
  clampPoint,
  computeThrowTarget,
  isCatchDistance,
  shouldReleaseDrag,
  moveToward,
  states,
} = sandbox.module.exports;

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

assert.deepEqual(
  plain(clampPoint({ x: -50, y: 1200 }, { width: 360, height: 640 }, 24)),
  { x: 24, y: 616 },
  "clampPoint keeps positions inside the viewport with padding"
);

assert.deepEqual(
  plain(moveToward({ x: 0, y: 0 }, { x: 30, y: 40 }, 10)),
  { x: 6, y: 8 },
  "moveToward advances by a fixed distance along the vector"
);

assert.deepEqual(
  plain(moveToward({ x: 0, y: 0 }, { x: 3, y: 4 }, 10)),
  { x: 3, y: 4 },
  "moveToward snaps to the target when it is within the step"
);

assert.deepEqual(
  plain(
    computeThrowTarget(
      { x: 120, y: 200 },
      { x: 8, y: -12 },
      { width: 320, height: 480 },
      32
    )
  ),
  { x: 320 - 32, y: 32 },
  "computeThrowTarget projects pointer velocity and clamps the throw"
);

assert.equal(
  isCatchDistance({ x: 10, y: 12 }, { x: 26, y: 24 }, 24),
  true,
  "isCatchDistance reports when the dog can catch the thrown ball"
);

assert.equal(
  isCatchDistance({ x: 10, y: 12 }, { x: 90, y: 24 }, 24),
  false,
  "isCatchDistance rejects distant thrown balls"
);

assert.equal(
  shouldReleaseDrag(states.held, { pointerId: 7 }, { pointerId: 7 }),
  true,
  "shouldReleaseDrag allows the active pointer to throw the held ball"
);

assert.equal(
  shouldReleaseDrag(states.held, { pointerId: 7 }, { pointerId: 9 }),
  false,
  "shouldReleaseDrag ignores release events from a different pointer"
);

const sourceText = fs.readFileSync(sourcePath, "utf8");

assert.match(
  sourceText,
  /globalScope\.addEventListener\("pointerup", releaseBone\)/,
  "releaseBone should be wired globally so releasing off the ball still throws"
);

assert.doesNotMatch(
  sourceText,
  /setAttribute\("tabindex"/,
  "aria-hidden dog layer controls should not be focusable"
);

assert.doesNotMatch(
  sourceText,
  /setAttribute\("role", "button"\)/,
  "aria-hidden dog layer should not expose interactive roles"
);

console.log("gameboy dog layer helpers ok");
