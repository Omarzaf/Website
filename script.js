(function () {
  document.documentElement.classList.add("js");

  const root = document.documentElement;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const canvas = document.querySelector("#signal-canvas");
  const context = canvas ? canvas.getContext("2d") : null;
  const tensionControl = document.querySelector("#tension-control");
  const tensionValue = document.querySelector("#tension-value");
  const signalTitle = document.querySelector("#signal-title");
  const signalCopy = document.querySelector("#signal-copy");
  const themeToggles = Array.from(document.querySelectorAll("[data-theme-toggle]"));
  const themeStorageKey = "uz-theme";

  const field = {
    active: false,
    animationId: 0,
    goldHue: 40,
    goldLightness: 54,
    height: 0,
    idleTimeoutId: 0,
    intensity: 0,
    scale: 1,
    targetX: 0,
    targetY: 0,
    tension: 0.24,
    time: 0,
    width: 0,
    x: 0,
    y: 0,
  };

  const signalStates = [
    {
      max: 34,
      title: "technical systems",
      copy: "Move the control or pointer to bend the grid around code, capital, and regulation.",
    },
    {
      max: 68,
      title: "political institutions",
      copy: "The field tightens where incentives, jurisdictions, and infrastructure begin to shape each other.",
    },
    {
      max: 100,
      title: "decisions under pressure",
      copy: "At high pressure the map stops being neutral and starts showing where governance has to act.",
    },
  ];

  function requestSignalFrame() {
    if (!canvas || !context || reduceMotion.matches || field.animationId) {
      return;
    }

    field.animationId = window.requestAnimationFrame(drawSignalField);
  }

  function clearSignalIdleTimer() {
    if (!field.idleTimeoutId) {
      return;
    }

    window.clearTimeout(field.idleTimeoutId);
    field.idleTimeoutId = 0;
  }

  function settleSignalField() {
    clearSignalIdleTimer();
    field.active = false;
    requestSignalFrame();
  }

  function markSignalActive() {
    clearSignalIdleTimer();
    field.active = true;
    field.idleTimeoutId = window.setTimeout(() => {
      field.idleTimeoutId = 0;
      field.active = false;
      requestSignalFrame();
    }, 900);
    requestSignalFrame();
  }

  function getStoredTheme() {
    try {
      return window.localStorage.getItem(themeStorageKey);
    } catch {
      return null;
    }
  }

  function storeTheme(theme) {
    try {
      window.localStorage.setItem(themeStorageKey, theme);
    } catch {
      // localStorage can be unavailable in private or restricted browser contexts.
    }
  }

  function updateThemeControls(theme) {
    const isDark = theme === "dark";

    themeToggles.forEach((toggle) => {
      const label = toggle.querySelector("[data-theme-label]");

      toggle.setAttribute("aria-pressed", String(isDark));
      toggle.setAttribute("aria-label", `Switch to ${isDark ? "light" : "dark"} mode`);

      if (label) {
        label.textContent = isDark ? "light" : "dark";
      }
    });
  }

  function applyTheme(theme) {
    const nextTheme = theme === "dark" ? "dark" : "light";

    root.dataset.theme = nextTheme;
    updateThemeControls(nextTheme);
    updateCursorGold();
  }

  function initThemeToggle() {
    applyTheme(getStoredTheme() || "light");

    themeToggles.forEach((toggle) => {
      toggle.addEventListener("click", () => {
        const nextTheme = root.dataset.theme === "dark" ? "light" : "dark";

        applyTheme(nextTheme);
        storeTheme(nextTheme);
      });
    });
  }

  function setTension(value) {
    const raw = Math.max(0, Math.min(100, Number(value || 0)));
    const tension = raw / 100;
    const state = signalStates.find((item) => raw <= item.max) || signalStates[signalStates.length - 1];

    field.tension = tension;
    root.style.setProperty("--tension", tension.toFixed(3));
    root.style.setProperty("--grid-step", `${Math.max(7, 13 - tension * 5).toFixed(1)}px`);
    root.style.setProperty("--grid-major", `${Math.max(36, 65 - tension * 24).toFixed(1)}px`);

    if (tensionValue) {
      tensionValue.textContent = String(Math.round(raw));
    }

    if (signalTitle) {
      signalTitle.textContent = state.title;
    }

    if (signalCopy) {
      signalCopy.textContent = state.copy;
    }

    requestSignalFrame();
  }

  function updateCursorGold() {
    const xRatio = field.width ? Math.max(0, Math.min(1, field.x / field.width)) : 0.62;
    const yRatio = field.height ? Math.max(0, Math.min(1, field.y / field.height)) : 0.42;
    const isDark = root.dataset.theme === "dark";
    const hue = 35 + xRatio * 14 - yRatio * 3;
    const lightness = (isDark ? 56 : 43) + (1 - yRatio) * 8;
    const softAlpha = isDark ? 0.055 + field.intensity * 0.075 : 0.035 + field.intensity * 0.055;

    field.goldHue = hue;
    field.goldLightness = lightness;
    root.style.setProperty("--cursor-x", `${(xRatio * 100).toFixed(2)}%`);
    root.style.setProperty("--cursor-y", `${(yRatio * 100).toFixed(2)}%`);
    root.style.setProperty(
      "--cursor-gold-soft",
      `hsla(${hue.toFixed(1)}, 100%, ${lightness.toFixed(1)}%, ${softAlpha.toFixed(3)})`
    );
  }

  function goldStroke(alpha) {
    return `hsla(${field.goldHue.toFixed(1)}, 100%, ${field.goldLightness.toFixed(1)}%, ${alpha})`;
  }

  function gridStroke(alpha) {
    return root.dataset.theme === "dark" ? `rgba(255, 246, 228, ${alpha})` : `rgba(5, 5, 5, ${alpha})`;
  }

  function resizeCanvas() {
    if (!canvas || !context) {
      return;
    }

    field.scale = Math.min(window.devicePixelRatio || 1, 2);
    field.width = Math.max(1, window.innerWidth);
    field.height = Math.max(1, window.innerHeight);
    field.targetX = field.width * 0.62;
    field.targetY = field.height * 0.42;
    field.x = field.targetX;
    field.y = field.targetY;
    canvas.width = Math.floor(field.width * field.scale);
    canvas.height = Math.floor(field.height * field.scale);
    canvas.style.width = `${field.width}px`;
    canvas.style.height = `${field.height}px`;
    context.setTransform(field.scale, 0, 0, field.scale, 0, 0);
    updateCursorGold();
  }

  function smoothFalloff(distance, radius) {
    const t = Math.max(0, Math.min(1, 1 - distance / radius));
    return t * t * (3 - 2 * t);
  }

  function warpPoint(x, y, radius) {
    const dx = x - field.x;
    const dy = y - field.y;
    const distance = Math.hypot(dx, dy);
    const pull = smoothFalloff(distance, radius) * field.intensity * (0.45 + field.tension * 1.8);
    const wave = Math.sin(distance * 0.028 - field.time) * 5.5 * pull;

    return {
      x: x - dx * 0.18 * pull + (dy / Math.max(distance, 1)) * wave,
      y: y - dy * 0.18 * pull - (dx / Math.max(distance, 1)) * wave,
    };
  }

  function drawWarpedLine(base, min, max, radius, isVertical, tone, alpha) {
    if (!context) {
      return;
    }

    const step = 11;
    let previousPoint = null;
    let previousRaw = null;

    for (let value = min; value <= max; value += step) {
      const raw = isVertical ? { x: base, y: value } : { x: value, y: base };
      const point = isVertical ? warpPoint(base, value, radius) : warpPoint(value, base, radius);

      if (previousPoint && previousRaw) {
        const midX = (raw.x + previousRaw.x) * 0.5;
        const midY = (raw.y + previousRaw.y) * 0.5;
        const distance = Math.hypot(midX - field.x, midY - field.y);
        const fade = Math.pow(smoothFalloff(distance, radius), 1.45);
        const segmentAlpha = alpha * fade;

        if (segmentAlpha > 0.004) {
          context.strokeStyle = tone === "gold" ? goldStroke(segmentAlpha) : gridStroke(segmentAlpha);
          context.beginPath();
          context.moveTo(previousPoint.x, previousPoint.y);
          context.lineTo(point.x, point.y);
          context.stroke();
        }
      }

      previousPoint = point;
      previousRaw = raw;
    }
  }

  function drawSignalField() {
    if (!canvas || !context || reduceMotion.matches) {
      field.animationId = 0;
      return;
    }

    field.x += (field.targetX - field.x) * 0.1;
    field.y += (field.targetY - field.y) * 0.1;
    const idleIntensity = field.tension * 0.42;
    const targetIntensity = field.active ? 1 : idleIntensity;
    field.intensity += (targetIntensity - field.intensity) * 0.055;
    field.time += 0.03 + field.tension * 0.035;
    updateCursorGold();

    context.clearRect(0, 0, field.width, field.height);

    const radius = 128 + field.tension * 230 + field.intensity * 60;
    const minX = Math.max(0, field.x - radius * 1.08);
    const maxX = Math.min(field.width, field.x + radius * 1.08);
    const minY = Math.max(0, field.y - radius * 1.08);
    const maxY = Math.min(field.height, field.y + radius * 1.08);
    const step = Math.max(8, 16 - field.tension * 7);
    const alpha = 0.05 + field.intensity * 0.18;

    context.save();
    context.lineWidth = 0.9;
    context.lineCap = "round";
    context.lineJoin = "round";

    const glow = context.createRadialGradient(field.x, field.y, 0, field.x, field.y, radius);
    glow.addColorStop(0, goldStroke(0.11 * field.intensity));
    glow.addColorStop(0.58, goldStroke(0.035 * field.intensity));
    glow.addColorStop(1, goldStroke(0));
    context.fillStyle = glow;
    context.beginPath();
    context.arc(field.x, field.y, radius, 0, Math.PI * 2);
    context.fill();

    for (let x = Math.floor(minX / step) * step; x <= maxX; x += step) {
      drawWarpedLine(x, minY, maxY, radius, true, "gold", alpha);
    }

    for (let y = Math.floor(minY / step) * step; y <= maxY; y += step) {
      drawWarpedLine(y, minX, maxX, radius, false, "gold", alpha);
    }

    [field.width * 0.25, field.width * 0.5, field.width * 0.75].forEach((x) => {
      if (Math.abs(x - field.x) < radius) {
        drawWarpedLine(x, minY, maxY, radius, true, "grid", 0.08 + field.tension * 0.11);
      }
    });

    context.restore();

    const pointerSettled = Math.hypot(field.targetX - field.x, field.targetY - field.y) < 0.6;
    const intensitySettled = Math.abs(field.intensity - targetIntensity) < 0.003;

    if (!field.active && pointerSettled && intensitySettled) {
      field.animationId = 0;
      return;
    }

    field.animationId = window.requestAnimationFrame(drawSignalField);
  }

  function initSignalField() {
    if (!canvas || !context) {
      return;
    }

    resizeCanvas();
    setTension(tensionControl ? tensionControl.value : 24);

    window.addEventListener("resize", () => {
      resizeCanvas();
      setTension(tensionControl ? tensionControl.value : 24);
    });

    window.addEventListener("pointermove", (event) => {
      field.targetX = event.clientX;
      field.targetY = event.clientY;
      markSignalActive();
    });

    window.addEventListener("pointerleave", settleSignalField);
  }

  function initTensionControl() {
    if (!tensionControl) {
      return;
    }

    tensionControl.addEventListener("input", (event) => {
      setTension(event.target.value);
    });

    setTension(tensionControl.value);
  }

  function initReveals() {
    const revealElements = Array.from(document.querySelectorAll(".reveal"));

    if (!revealElements.length) {
      return;
    }

    if (reduceMotion.matches || typeof IntersectionObserver !== "function") {
      revealElements.forEach((element) => element.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }

          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      {
        rootMargin: "0px 0px -10% 0px",
        threshold: 0.12,
      }
    );

    revealElements.forEach((element) => observer.observe(element));
  }

  function initFilterGroups() {
    const groups = Array.from(document.querySelectorAll("[data-filter-group]"));

    groups.forEach((group) => {
      const controls = Array.from(group.querySelectorAll("[data-filter-control]"));
      const items = Array.from(group.querySelectorAll("[data-filter-item]"));
      const empty = group.querySelector("[data-filter-empty]");

      if (!controls.length || !items.length) {
        return;
      }

      function applyFilter(filter) {
        let visibleCount = 0;

        controls.forEach((control) => {
          const isActive = control.dataset.filterControl === filter;
          control.classList.toggle("is-active", isActive);
          control.setAttribute("aria-pressed", String(isActive));
        });

        items.forEach((item) => {
          const filters = (item.dataset.filterItem || "").split(" ");
          const isVisible = filter === "all" || filters.includes(filter);
          item.hidden = !isVisible;

          if (isVisible) {
            visibleCount += 1;
          }
        });

        if (empty) {
          empty.hidden = visibleCount > 0;
        }
      }

      controls.forEach((control) => {
        control.addEventListener("click", () => applyFilter(control.dataset.filterControl || "all"));
      });

      applyFilter(controls.find((control) => control.classList.contains("is-active"))?.dataset.filterControl || "all");
    });
  }

  function initTabs() {
    const tabLists = Array.from(document.querySelectorAll("[data-tabs]"));

    tabLists.forEach((tabList) => {
      const tabs = Array.from(tabList.querySelectorAll("[data-tab-control]"));
      const panels = Array.from(tabList.querySelectorAll("[data-tab-panel]"));

      if (!tabs.length || !panels.length) {
        return;
      }

      function activate(index) {
        tabs.forEach((tab, tabIndex) => {
          const isActive = tabIndex === index;
          tab.classList.toggle("is-active", isActive);
          tab.setAttribute("aria-selected", String(isActive));
          tab.tabIndex = isActive ? 0 : -1;
        });

        panels.forEach((panel, panelIndex) => {
          panel.hidden = panelIndex !== index;
        });
      }

      tabs.forEach((tab, index) => {
        tab.addEventListener("click", () => activate(index));
        tab.addEventListener("keydown", (event) => {
          if (!["ArrowDown", "ArrowRight", "ArrowUp", "ArrowLeft", "Home", "End"].includes(event.key)) {
            return;
          }

          event.preventDefault();

          const direction = event.key === "ArrowDown" || event.key === "ArrowRight" ? 1 : -1;
          const next =
            event.key === "Home" ? 0 :
            event.key === "End" ? tabs.length - 1 :
            (index + direction + tabs.length) % tabs.length;

          activate(next);
          tabs[next].focus();
        });
      });

      activate(Math.max(0, tabs.findIndex((tab) => tab.classList.contains("is-active"))));
    });
  }

  function hashCell(x, y, seed) {
    const value = Math.sin(x * 12.9898 + y * 78.233 + seed * 37.719) * 43758.5453;
    return value - Math.floor(value);
  }

  function initPixelMap() {
    const map = document.querySelector("#pixel-map");
    const readout = document.querySelector("#map-readout");

    if (!map || !readout) {
      return;
    }

    const columns = 80;
    const rows = 38;
    const regions = {
      northAmerica: {
        label: "North America",
        detail: "AI governance capacity, markets, and institutional design",
        colors: ["#ffae00", "#d89238", "#050505", "#737373"],
      },
      southAsia: {
        label: "South Asia",
        detail: "security policy, development practice, and field experience",
        colors: ["#ffae00", "#c97e2f", "#666666", "#050505"],
      },
      mena: {
        label: "MENA",
        detail: "geopolitical risk, digital governance, and regional institutions",
        colors: ["#f5bd54", "#db9836", "#8a8a8a", "#303030"],
      },
      europe: {
        label: "Europe",
        detail: "regulation, standards, and alliance coordination",
        colors: ["#ffae00", "#d79a3a", "#c8c8c8", "#050505"],
      },
      arctic: {
        label: "Arctic corridor",
        detail: "critical infrastructure, supply chains, and resilience",
        colors: ["#e5a332", "#c8c8c8", "#6e6e6e", "#050505"],
      },
    };
    const regionOrder = Object.keys(regions);
    const patches = [
      ["northAmerica", 3, 9, 19, 7],
      ["northAmerica", 9, 16, 15, 7],
      ["northAmerica", 15, 24, 7, 5],
      ["northAmerica", 27, 3, 12, 5],
      ["southAsia", 57, 16, 7, 5],
      ["southAsia", 61, 19, 8, 5],
      ["southAsia", 64, 23, 6, 4],
      ["mena", 45, 17, 9, 5],
      ["mena", 47, 22, 8, 6],
      ["europe", 42, 9, 11, 5],
      ["europe", 49, 7, 7, 4],
      ["arctic", 19, 5, 17, 4],
      ["arctic", 50, 4, 15, 4],
    ];
    const tiles = new Map();

    patches.forEach(([region, startX, startY, patchWidth, patchHeight], patchIndex) => {
      for (let y = startY; y < startY + patchHeight; y += 1) {
        for (let x = startX; x < startX + patchWidth; x += 1) {
          const edge = x === startX || y === startY || x === startX + patchWidth - 1 || y === startY + patchHeight - 1;
          const texture = hashCell(x, y, patchIndex);

          if ((edge && texture < 0.18) || (!edge && texture < 0.025)) {
            continue;
          }

          tiles.set(`${x}:${y}`, { region, x, y, seed: patchIndex });
        }
      }
    });

    const fragment = document.createDocumentFragment();
    const cells = [];

    Array.from(tiles.values()).forEach((tile) => {
      const cell = document.createElement("span");
      const region = regions[tile.region];
      const colorIndex = Math.floor(hashCell(tile.x, tile.y, tile.seed + 11) * region.colors.length);

      cell.className = "map-cell";
      cell.dataset.region = tile.region;
      cell.style.left = `${(tile.x / columns) * 100}%`;
      cell.style.top = `${(tile.y / rows) * 100}%`;
      cell.style.width = `${100 / columns}%`;
      cell.style.height = `${100 / rows}%`;
      cell.style.setProperty("--cell-color", region.colors[colorIndex]);
      fragment.appendChild(cell);
      cells.push(cell);
    });

    map.appendChild(fragment);

    let selectedRegion = "";
    let activeRegion = "";

    function describe(regionKey) {
      const region = regions[regionKey];
      readout.textContent = region ? `${region.label}: ${region.detail}` : "Focus map: AI governance, South Asia, MENA, and infrastructure corridors";
    }

    function paint(regionKey, selectedKey) {
      cells.forEach((cell) => {
        const isActive = cell.dataset.region === regionKey;
        const isSelected = cell.dataset.region === selectedKey;
        cell.classList.toggle("is-active", isActive);
        cell.classList.toggle("is-selected", isSelected);
      });
    }

    function activate(regionKey) {
      activeRegion = regionKey;
      describe(regionKey);
      paint(activeRegion, selectedRegion);
    }

    function select(regionKey) {
      selectedRegion = regionKey;
      activate(regionKey);
    }

    map.addEventListener("pointerover", (event) => {
      const cell = event.target.closest(".map-cell");

      if (cell) {
        activate(cell.dataset.region);
      }
    });

    map.addEventListener("pointerleave", () => {
      activeRegion = "";
      describe(selectedRegion);
      paint(activeRegion, selectedRegion);
    });

    map.addEventListener("click", (event) => {
      const cell = event.target.closest(".map-cell");

      if (cell) {
        select(cell.dataset.region);
      }
    });

    map.addEventListener("keydown", (event) => {
      if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Enter", " "].includes(event.key)) {
        return;
      }

      event.preventDefault();

      const existingIndex = regionOrder.indexOf(activeRegion || selectedRegion);
      const currentIndex = existingIndex >= 0 ? existingIndex : -1;
      const direction = event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1 : 1;
      const nextIndex = event.key === "Enter" || event.key === " " ? Math.max(0, currentIndex) : (currentIndex + direction + regionOrder.length) % regionOrder.length;
      const nextRegion = regionOrder[nextIndex];

      if (event.key === "Enter" || event.key === " ") {
        select(nextRegion);
      } else {
        activate(nextRegion);
      }
    });
  }

  function deferPixelMap() {
    const map = document.querySelector("#pixel-map");

    if (!map) {
      return;
    }

    let initialized = false;
    const initialize = () => {
      if (initialized) {
        return;
      }

      initialized = true;
      initPixelMap();
    };

    if (typeof IntersectionObserver !== "function") {
      initialize();
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) {
          return;
        }

        observer.disconnect();
        initialize();
      },
      { rootMargin: "240px 0px" }
    );

    observer.observe(map);
  }

  function initImpactTimeline() {
    const timeline = document.querySelector("[data-impact-timeline]");

    if (!timeline) {
      return;
    }

    const controls = Array.from(timeline.querySelectorAll("[data-impact-control]"));
    const nodes = Array.from(timeline.querySelectorAll("[data-impact-node]"));
    const title = timeline.querySelector("[data-impact-readout-title]");
    const body = timeline.querySelector("[data-impact-readout-body]");

    if (!controls.length || !nodes.length || !title || !body) {
      return;
    }

    function activate(index) {
      const active = controls[index];

      if (!active) {
        return;
      }

      controls.forEach((control, controlIndex) => {
        const isActive = controlIndex === index;
        control.classList.toggle("is-active", isActive);
        control.setAttribute("aria-pressed", String(isActive));
      });

      nodes.forEach((node, nodeIndex) => {
        node.classList.toggle("is-active", nodeIndex === index);
      });

      title.textContent = active.dataset.impactTitle || active.textContent.trim();
      body.textContent = active.dataset.impactBody || "";
    }

    controls.forEach((control, index) => {
      control.addEventListener("click", () => activate(index));
    });

    activate(Math.max(0, controls.findIndex((control) => control.classList.contains("is-active"))));
  }

  function bindMotionSetting() {
    const restart = () => {
      if (reduceMotion.matches && field.animationId) {
        window.cancelAnimationFrame(field.animationId);
        field.animationId = 0;
      } else if (!reduceMotion.matches && !field.animationId && canvas && context) {
        requestSignalFrame();
      }
    };

    if (typeof reduceMotion.addEventListener === "function") {
      reduceMotion.addEventListener("change", restart);
    } else if (typeof reduceMotion.addListener === "function") {
      reduceMotion.addListener(restart);
    }
  }

  initThemeToggle();
  initTensionControl();
  initSignalField();
  initReveals();
  initFilterGroups();
  initTabs();
  deferPixelMap();
  initImpactTimeline();
  bindMotionSetting();
})();
