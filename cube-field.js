(function (globalScope) {
  "use strict";

  function resolveDocument() {
    if (!globalScope || !globalScope.document) {
      return null;
    }

    return globalScope.document;
  }

  function setStyleValue(element, name, value) {
    element.style.setProperty(name, value);
  }

  function resolveColor(partColor, colors) {
    if (partColor && colors && Object.prototype.hasOwnProperty.call(colors, partColor)) {
      return colors[partColor];
    }

    if (partColor) {
      return partColor;
    }

    if (colors && colors.default) {
      return colors.default;
    }

    return "var(--accent, #ffae00)";
  }

  function createFace(document, face) {
    const side = document.createElement("span");
    side.className = `cube__face cube__face--${face}`;
    return side;
  }

  function finiteNumber(value) {
    return typeof value === "number" && Number.isFinite(value);
  }

  function requireDimensions(part) {
    if (!finiteNumber(part.w) || !finiteNumber(part.h) || !finiteNumber(part.d)) {
      throw new Error("createCube requires finite numeric w, h, and d");
    }
  }

  function createCube(part, opts) {
    const document = resolveDocument();

    if (!document) {
      throw new Error("createCube requires a document");
    }

    requireDimensions(part || {});

    const options = opts || {};
    const colors = options.colors || {};
    const cube = document.createElement("span");
    const extraClass = part.extraClass ? ` ${part.extraClass}` : "";

    cube.className = `cube${extraClass}`;
    setStyleValue(cube, "--cube-x", `${part.x || 0}px`);
    setStyleValue(cube, "--cube-y", `${part.y || 0}px`);
    setStyleValue(cube, "--cube-z", `${part.z || 0}px`);
    setStyleValue(cube, "--cube-w", `${part.w}px`);
    setStyleValue(cube, "--cube-h", `${part.h}px`);
    setStyleValue(cube, "--cube-d", `${part.d}px`);
    setStyleValue(cube, "--cube-d2", `${part.d / 2}px`);
    setStyleValue(cube, "--cube-color", resolveColor(part.color, colors));

    ["front", "back", "right", "left", "top", "bottom"].forEach(function (face) {
      cube.appendChild(createFace(document, face));
    });

    return cube;
  }

  function clearChildren(element) {
    if (typeof element.replaceChildren === "function") {
      element.replaceChildren();
      return;
    }

    while (element.firstChild) {
      element.removeChild(element.firstChild);
    }
  }

  function normalizeLayout(layout, opts) {
    if (Array.isArray(layout)) {
      return {
        cubes: layout,
        scene: opts && opts.scene,
      };
    }

    return layout || {};
  }

  function mountCubeField(container, layout, opts) {
    const document = resolveDocument();

    if (!document) {
      throw new Error("mountCubeField requires a document");
    }

    if (!container) {
      throw new Error("mountCubeField requires a container");
    }

    const options = opts || {};
    const descriptor = normalizeLayout(layout, options);
    const cubes = Array.isArray(descriptor.cubes) ? descriptor.cubes : [];
    const colors = options.colors || descriptor.colors || {};
    const scene = descriptor.scene || options.scene || "";

    if (container.classList && typeof container.classList.add === "function") {
      container.classList.add("cube-field");
    } else if (typeof container.className === "string") {
      container.className = `${container.className} cube-field`.trim();
    }

    if (container.dataset) {
      container.dataset.cubeScene = scene;
    }

    clearChildren(container);

    cubes.forEach(function (part) {
      container.appendChild(createCube(part, { colors }));
    });

    return {
      setDepth(z) {
        const depth = typeof z === "number" ? `${z}px` : String(z);
        setStyleValue(container, "--cube-field-depth", depth);
      },
      activate() {
        if (container.classList && typeof container.classList.add === "function") {
          container.classList.add("is-active");
        }
      },
      destroy() {
        clearChildren(container);

        if (container.classList && typeof container.classList.remove === "function") {
          container.classList.remove("is-active");
          container.classList.remove("cube-field");
        }

        if (container.dataset) {
          delete container.dataset.cubeScene;
        }

        if (container.style && typeof container.style.removeProperty === "function") {
          container.style.removeProperty("--cube-field-depth");
        }
      },
    };
  }

  const api = {
    createCube,
    mountCubeField,
  };

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  globalScope.UZCubeField = api;
})(typeof globalThis !== "undefined" ? globalThis : window);
