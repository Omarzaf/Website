(function () {
  document.documentElement.classList.add("js");

  const root = document.documentElement;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const canvas = document.querySelector("#signal-canvas");
  const context = canvas ? canvas.getContext("2d") : null;
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

    field.tension = tension;
    root.style.setProperty("--tension", tension.toFixed(3));
    root.style.setProperty("--grid-step", `${Math.max(7, 13 - tension * 5).toFixed(1)}px`);
    root.style.setProperty("--grid-major", `${Math.max(36, 65 - tension * 24).toFixed(1)}px`);

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
    setTension(24);

    window.addEventListener("resize", () => {
      resizeCanvas();
    });

    window.addEventListener("pointermove", (event) => {
      field.targetX = event.clientX;
      field.targetY = event.clientY;
      markSignalActive();
    });

    window.addEventListener("pointerleave", settleSignalField);
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

        tabList.dispatchEvent(new CustomEvent("site:tabchange", {
          bubbles: true,
          detail: { index, panel: panels[index] },
        }));
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

  const panelAnimationStates = new WeakMap();

  function cssValue(name) {
    return window.getComputedStyle(root).getPropertyValue(name).trim();
  }

  function clamp(value, min = 0, max = 1) {
    return Math.max(min, Math.min(max, value));
  }

  function easeOutCubic(value) {
    const t = clamp(value);
    return 1 - Math.pow(1 - t, 3);
  }

  function parseGraphData(panel) {
    const read = (raw) => {
      if (!raw) {
        return null;
      }

      try {
        const value = JSON.parse(raw);
        return Array.isArray(value) && value.length ? value : null;
      } catch (error) {
        return null;
      }
    };

    return {
      nodeData: read(panel.dataset.nodes),
      edgeData: read(panel.dataset.edges),
    };
  }

  function preparePanelCanvas(canvas) {
    if (!canvas) {
      return null;
    }

    const rect = canvas.getBoundingClientRect();
    const width = Math.max(1, rect.width);
    const height = Math.max(1, rect.height);
    const scale = Math.min(window.devicePixelRatio || 1, 2);
    const pixelWidth = Math.floor(width * scale);
    const pixelHeight = Math.floor(height * scale);
    const drawing = canvas.getContext("2d");

    if (!drawing) {
      return null;
    }

    if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
      canvas.width = pixelWidth;
      canvas.height = pixelHeight;
    }

    drawing.setTransform(scale, 0, 0, scale, 0, 0);
    return { drawing, width, height };
  }

  function makeWorkGraphState(panel) {
    const existing = panelAnimationStates.get(panel);

    if (existing) {
      return existing;
    }

    const canvasElement = panel.querySelector("canvas");
    const defaultNodes = [
      ["AI governance", 0.24, 0.32],
      ["export controls", 0.55, 0.22],
      ["geopolitics", 0.78, 0.42],
      ["institutions", 0.34, 0.66],
      ["systems", 0.58, 0.58],
      ["writing", 0.76, 0.75],
    ];
    const defaultEdges = [
      [0, 1, 1],
      [0, 3, 0.85],
      [1, 2, 0.78],
      [1, 4, 0.92],
      [2, 4, 0.7],
      [3, 4, 0.88],
      [3, 5, 0.58],
      [4, 5, 0.72],
    ];
    const parsed = parseGraphData(panel);
    const nodes = (parsed.nodeData || defaultNodes).map(([label, tx, ty], index) => ({
      label,
      tx,
      ty,
      x: 0.18 + ((index * 0.17) % 0.72),
      y: 0.2 + ((index * 0.23) % 0.56),
      vx: 0,
      vy: 0,
    }));
    const edges = parsed.edgeData || defaultEdges;
    const state = {
      active: false,
      canvas: canvasElement,
      edges,
      frame: 0,
      hover: -1,
      nodes,
      startedAt: 0,
      type: "work-graph",
    };

    if (canvasElement) {
      canvasElement.addEventListener("pointermove", (event) => {
        const rect = canvasElement.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        let hover = -1;
        let best = 28;

        state.nodes.forEach((node, index) => {
          const distance = Math.hypot(node.drawX - x, node.drawY - y);

          if (distance < best) {
            best = distance;
            hover = index;
          }
        });

        state.hover = hover;

        if (!state.active) {
          drawWorkGraph(state, window.performance.now(), false);
        }
      });

      canvasElement.addEventListener("pointerleave", () => {
        state.hover = -1;

        if (!state.active) {
          drawWorkGraph(state, window.performance.now(), false);
        }
      });
    }

    panelAnimationStates.set(panel, state);
    return state;
  }

  function drawWorkGraph(state, timestamp, schedule = true) {
    const prepared = preparePanelCanvas(state.canvas);

    if (!prepared) {
      return;
    }

    const { drawing, width, height } = prepared;
    const accent = cssValue("--accent") || "#ffae00";
    const rule = cssValue("--rule") || "rgba(5,5,5,0.18)";
    const text = cssValue("--text") || "#050505";
    const muted = cssValue("--muted") || "#565656";
    const elapsed = timestamp - state.startedAt;

    drawing.clearRect(0, 0, width, height);

    state.nodes.forEach((node, index) => {
      const targetX = node.tx * width;
      const targetY = node.ty * height;
      const settled = reduceMotion.matches || elapsed > 900;

      if (reduceMotion.matches) {
        node.x = node.tx;
        node.y = node.ty;
      } else if (settled) {
        const drift = Math.sin(timestamp * 0.001 + index) * 2.5;
        node.drawX = targetX + drift;
        node.drawY = targetY + Math.cos(timestamp * 0.001 + index) * 2.5;
        return;
      } else {
        node.vx += (node.tx - node.x) * 0.035;
        node.vy += (node.ty - node.y) * 0.035;
        node.vx *= 0.78;
        node.vy *= 0.78;
        node.x += node.vx;
        node.y += node.vy;
      }

      node.drawX = node.x * width;
      node.drawY = node.y * height;
    });

    drawing.save();
    drawing.lineCap = "round";

    state.edges.forEach(([from, to, weight]) => {
      const start = state.nodes[from];
      const end = state.nodes[to];
      const highlighted = state.hover === from || state.hover === to;

      drawing.beginPath();
      drawing.moveTo(start.drawX, start.drawY);
      drawing.lineTo(end.drawX, end.drawY);
      drawing.strokeStyle = highlighted ? accent : rule;
      drawing.globalAlpha = highlighted ? 0.95 : 0.44 + weight * 0.28;
      drawing.lineWidth = highlighted ? 2.4 : 0.8 + weight * 1.2;
      drawing.stroke();
    });

    drawing.globalAlpha = 1;
    drawing.font = `700 ${Math.max(11, Math.min(13, width * 0.022))}px ${cssValue("--font-mono") || "monospace"}`;
    drawing.textBaseline = "middle";

    state.nodes.forEach((node, index) => {
      const highlighted = state.hover === index;
      const radius = highlighted ? 8 : 5.5;
      const flip = node.drawX > width * 0.6;

      drawing.beginPath();
      drawing.arc(node.drawX, node.drawY, radius, 0, Math.PI * 2);
      drawing.fillStyle = highlighted ? accent : text;
      drawing.fill();
      drawing.fillStyle = highlighted ? text : muted;
      drawing.textAlign = flip ? "right" : "left";
      drawing.fillText(node.label, node.drawX + (flip ? -12 : 12), node.drawY);
    });

    drawing.textAlign = "left";
    drawing.restore();

    if (schedule && state.active && !reduceMotion.matches) {
      state.frame = window.requestAnimationFrame((next) => drawWorkGraph(state, next));
    }
  }

  function startWorkGraph(panel) {
    const state = makeWorkGraphState(panel);

    if (state.frame) {
      window.cancelAnimationFrame(state.frame);
    }

    state.active = true;
    state.startedAt = window.performance.now();

    if (reduceMotion.matches) {
      drawWorkGraph(state, state.startedAt, false);
      return;
    }

    state.frame = window.requestAnimationFrame((timestamp) => drawWorkGraph(state, timestamp));
  }

  function formatTerminalPanel(panel) {
    if (!panel) {
      return "";
    }

    const title = panel.querySelector("h3")?.textContent.trim() || "Research focus";
    const body = panel.querySelector("p")?.textContent.trim().replace(/\s+/g, " ") || "";
    const bullets = Array.from(panel.querySelectorAll("li")).map((item) => `- ${item.textContent.trim()}`);

    return [`$ open research_focus`, "", `# ${title}`, body, "", ...bullets].join("\n");
  }

  function makeTerminalState(panel) {
    const existing = panelAnimationStates.get(panel);

    if (existing) {
      return existing;
    }

    const output = panel.querySelector("[data-terminal-output]");
    const tabGroup = panel.closest("[data-tabs]");
    const sourcePanels = tabGroup ? Array.from(tabGroup.querySelectorAll("[data-tab-panel]")) : [];
    const state = {
      active: false,
      frame: 0,
      index: 0,
      output,
      panel,
      sourcePanels,
      text: "",
      timer: 0,
      type: "research-terminal",
    };

    if (tabGroup) {
      tabGroup.addEventListener("site:tabchange", (event) => {
        const nextText = formatTerminalPanel(event.detail.panel);

        if (state.active) {
          typeTerminalText(state, nextText);
        } else if (state.output) {
          state.output.textContent = nextText;
        }
      });
    }

    panelAnimationStates.set(panel, state);
    return state;
  }

  function typeTerminalText(state, text) {
    if (!state.output) {
      return;
    }

    if (state.timer) {
      window.clearTimeout(state.timer);
      state.timer = 0;
    }

    state.text = text;
    state.index = reduceMotion.matches ? text.length : 0;
    state.output.textContent = text.slice(0, state.index);

    function tick() {
      if (!state.active || reduceMotion.matches) {
        return;
      }

      state.index = Math.min(state.text.length, state.index + 2);
      state.output.textContent = state.text.slice(0, state.index);

      if (state.index < state.text.length) {
        state.timer = window.setTimeout(tick, 18);
      }
    }

    tick();
  }

  function startTerminal(panel) {
    const state = makeTerminalState(panel);
    const activePanel = state.sourcePanels.find((source) => !source.hidden) || state.sourcePanels[0];

    state.active = true;
    typeTerminalText(state, formatTerminalPanel(activePanel));
  }

  function makeDocumentState(panel) {
    const existing = panelAnimationStates.get(panel);

    if (existing) {
      return existing;
    }

    const canvasElement = panel.querySelector("canvas");
    const state = {
      active: false,
      canvas: canvasElement,
      frame: 0,
      lines: [0.88, 0.62, 0.76, 0.47, 0.81, 0.69, 0.9, 0.54, 0.73, 0.42, 0.84, 0.58],
      pulseUntil: 0,
      startedAt: 0,
      type: "writing-document",
    };

    if (canvasElement) {
      canvasElement.addEventListener("pointerenter", () => {
        state.pulseUntil = window.performance.now() + 220;

        if (!state.active) {
          drawDocumentLines(state, window.performance.now(), false);
        }
      });
    }

    panelAnimationStates.set(panel, state);
    return state;
  }

  function drawDocumentLines(state, timestamp, schedule = true) {
    const prepared = preparePanelCanvas(state.canvas);

    if (!prepared) {
      return;
    }

    const { drawing, width, height } = prepared;
    const text = cssValue("--text") || "#050505";
    const rule = cssValue("--rule") || "rgba(5,5,5,0.2)";
    const accent = cssValue("--accent") || "#ffae00";
    const progress = reduceMotion.matches ? 1 : easeOutCubic((timestamp - state.startedAt) / 680);
    const left = width * 0.12;
    const top = height * 0.16;
    const gap = Math.max(17, height * 0.052);
    const lineHeight = 2;
    const pulse = timestamp < state.pulseUntil;

    drawing.clearRect(0, 0, width, height);
    drawing.fillStyle = cssValue("--surface-solid") || "transparent";
    drawing.fillRect(width * 0.08, height * 0.1, width * 0.76, height * 0.78);
    drawing.strokeStyle = rule;
    drawing.lineWidth = 1;
    drawing.strokeRect(width * 0.08, height * 0.1, width * 0.76, height * 0.78);

    state.lines.forEach((lineWidth, index) => {
      const local = clamp((progress - index * 0.045) / 0.46);
      const y = top + index * gap;
      const fade = index >= state.lines.length - 3 ? 0.32 : 0.82;
      const breathe = 0.92 + Math.sin(timestamp * 0.002 + index) * 0.08;

      drawing.globalAlpha = fade * breathe;
      drawing.fillStyle = pulse ? accent : (index % 4 === 0 ? text : rule);
      drawing.fillRect(left, y, width * 0.68 * lineWidth * local, lineHeight);
    });

    drawing.globalAlpha = 1;

    if (schedule && state.active && !reduceMotion.matches) {
      state.frame = window.requestAnimationFrame((next) => drawDocumentLines(state, next));
    }
  }

  function startDocument(panel) {
    const state = makeDocumentState(panel);

    if (state.frame) {
      window.cancelAnimationFrame(state.frame);
    }

    state.active = true;
    state.startedAt = window.performance.now();

    if (reduceMotion.matches) {
      drawDocumentLines(state, state.startedAt, false);
      return;
    }

    state.frame = window.requestAnimationFrame((timestamp) => drawDocumentLines(state, timestamp));
  }

  function makeImpactBarsState(panel) {
    const existing = panelAnimationStates.get(panel);

    if (existing) {
      return existing;
    }

    const nodes = Array.from(panel.querySelectorAll("[data-impact-node]"));
    const state = {
      active: false,
      frame: 0,
      nodes,
      startedAt: 0,
      type: "impact-bars",
    };

    panelAnimationStates.set(panel, state);
    return state;
  }

  function targetNodeHeight(node) {
    const value = window.getComputedStyle(node).getPropertyValue("--node-height");
    return 38 + Math.max(0, Number.parseFloat(value) || 80);
  }

  function drawImpactBars(state, timestamp, schedule = true) {
    const elapsed = timestamp - state.startedAt;
    let complete = true;

    state.nodes.forEach((node, index) => {
      const target = targetNodeHeight(node);
      const progress = reduceMotion.matches ? 1 : easeOutCubic((elapsed - index * 80) / 580);
      const height = Math.max(4, target * progress);

      node.style.height = `${height.toFixed(1)}px`;

      if (progress < 1) {
        complete = false;
      }
    });

    if (schedule && state.active && !reduceMotion.matches && !complete) {
      state.frame = window.requestAnimationFrame((next) => drawImpactBars(state, next));
    }
  }

  function startImpactBars(panel) {
    const state = makeImpactBarsState(panel);

    if (!state.nodes.length) {
      return;
    }

    if (state.frame) {
      window.cancelAnimationFrame(state.frame);
    }

    state.active = true;
    state.startedAt = window.performance.now();
    state.nodes.forEach((node) => {
      node.style.height = "4px";
    });
    state.frame = window.requestAnimationFrame((timestamp) => drawImpactBars(state, timestamp));
  }

  function pausePanelAnimation(panel) {
    const state = panelAnimationStates.get(panel);

    if (!state) {
      return;
    }

    state.active = false;

    if (state.frame) {
      window.cancelAnimationFrame(state.frame);
      state.frame = 0;
    }

    if (state.timer) {
      window.clearTimeout(state.timer);
      state.timer = 0;
    }
  }

  function startPanelAnimation(panel, animation) {
    if (animation === "work-graph") {
      startWorkGraph(panel);
    } else if (animation === "research-terminal") {
      startTerminal(panel);
    } else if (animation === "writing-document") {
      startDocument(panel);
    } else if (animation === "impact-bars") {
      startImpactBars(panel);
    }
  }

  function initPanelAnimations() {
    const panels = Array.from(document.querySelectorAll("[data-animation]"));

    if (!panels.length) {
      return;
    }

    if (reduceMotion.matches || typeof IntersectionObserver !== "function") {
      panels.forEach((panel) => startPanelAnimation(panel, panel.dataset.animation));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const animation = entry.target.dataset.animation;

          if (entry.isIntersecting) {
            startPanelAnimation(entry.target, animation);
          } else {
            pausePanelAnimation(entry.target);
          }
        });
      },
      { threshold: 0.2 }
    );

    panels.forEach((panel) => observer.observe(panel));
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
  initSignalField();
  initReveals();
  initFilterGroups();
  initTabs();
  initImpactTimeline();
  initPanelAnimations();
  bindMotionSetting();
})();
