const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.join(__dirname, "..");
const cubeSourcePath = path.join(root, "cube-field.js");
const dogSourcePath = path.join(root, "gameboy-dog-layer.js");
const cubeCssPath = path.join(root, "cube-field.css");

assert.ok(fs.existsSync(cubeSourcePath), "cube-field.js should define the shared cube module");
assert.ok(fs.existsSync(cubeCssPath), "cube-field.css should define shared cube styles");

function createElement(tagName) {
  return {
    tagName,
    children: [],
    className: "",
    dataset: {},
    ownerDocument: documentStub,
    style: {
      values: {},
      setProperty(name, value) {
        this.values[name] = value;
      },
    },
    appendChild(child) {
      this.children.push(child);
      return child;
    },
    classList: {
      values: new Set(),
      add(...tokens) {
        tokens.forEach((token) => this.values.add(token));
      },
      remove(...tokens) {
        tokens.forEach((token) => this.values.delete(token));
      },
    },
    setAttribute(name, value) {
      this[name] = value;
    },
    replaceChildren(...children) {
      this.children = children;
    },
  };
}

const documentStub = {
  createElement,
};

const sandbox = {
  document: documentStub,
  module: { exports: {} },
  window: null,
};

sandbox.window = sandbox;
vm.runInNewContext(fs.readFileSync(cubeSourcePath, "utf8"), sandbox, {
  filename: cubeSourcePath,
});

const { createCube, mountCubeField } = sandbox.module.exports;

const cube = createCube(
  { x: 7, y: 11, z: 13, w: 17, h: 19, d: 23, color: "gold", extraClass: "test-cube" },
  { colors: { gold: "#ffae00" } }
);

assert.equal(cube.className, "cube test-cube", "createCube uses the neutral cube class");
assert.equal(cube.children.length, 6, "createCube renders six faces");
assert.deepEqual(
  cube.children.map((child) => child.className),
  [
    "cube__face cube__face--front",
    "cube__face cube__face--back",
    "cube__face cube__face--right",
    "cube__face cube__face--left",
    "cube__face cube__face--top",
    "cube__face cube__face--bottom",
  ],
  "createCube renders the expected face classes"
);
assert.equal(cube.style.values["--cube-x"], "7px");
assert.equal(cube.style.values["--cube-d2"], "11.5px");
assert.equal(cube.style.values["--cube-color"], "#ffae00");

const container = createElement("div");
const field = mountCubeField(container, {
  scene: "test",
  cubes: [
    { x: 0, y: 0, z: 0, w: 8, h: 8, d: 8, color: "#111" },
    { x: 18, y: 4, z: 6, w: 10, h: 10, d: 10, color: "#222" },
  ],
});

assert.equal(container.dataset.cubeScene, "test", "mountCubeField stores the scene name");
assert.equal(container.children.length, 2, "mountCubeField renders all layout cubes");
field.setDepth(42);
assert.equal(container.style.values["--cube-field-depth"], "42px", "setDepth writes a CSS depth var");
field.activate();
assert.ok(container.classList.values.has("is-active"), "activate marks the field active");
field.destroy();
assert.equal(container.children.length, 0, "destroy clears mounted cubes");

const dogSource = fs.readFileSync(dogSourcePath, "utf8");
assert.match(
  dogSource,
  /UZCubeField\.createCube/,
  "gameboy dog layer should consume the shared cube primitive"
);
assert.doesNotMatch(
  dogSource,
  /gb-cuboid__face--front/,
  "gameboy dog layer should not keep its own cube face renderer"
);

const cubeCss = fs.readFileSync(cubeCssPath, "utf8");
assert.match(cubeCss, /\.cube__face--front/, "cube-field.css should own cube face styles");
assert.match(cubeCss, /--ink/, "cube-field.css should reference the site ink token for cube edge tone");

console.log("cube field helpers ok");
