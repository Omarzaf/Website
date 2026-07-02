(function () {
  document.documentElement.classList.add("js");

  const root = document.documentElement;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const canvas = document.querySelector("#signal-canvas");
  const context = canvas ? canvas.getContext("2d") : null;
  const themeToggles = Array.from(document.querySelectorAll("[data-theme-toggle]"));
  const themeStorageKey = "uz-theme";
  const policyGlobeStates = [];
  const contactFieldStates = [];
  const degree = Math.PI / 180;
  const contactFieldClusters = [
    { x: 0.56, y: 0.32, radius: 78, spokes: 34, color: "accent", phase: 0.1 },
    { x: 0.46, y: 0.53, radius: 88, spokes: 42, color: "muted", phase: 1.7 },
    { x: 0.67, y: 0.51, radius: 104, spokes: 28, color: "green", phase: 2.8 },
    { x: 0.55, y: 0.69, radius: 70, spokes: 16, color: "muted", phase: 4.2 },
  ];

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
    if (!canvas || !context || reduceMotion.matches || document.hidden || field.animationId) {
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

  function pauseSignalField() {
    clearSignalIdleTimer();
    field.active = false;

    if (!field.animationId) {
      return;
    }

    window.cancelAnimationFrame(field.animationId);
    field.animationId = 0;
  }

  function handleVisibilityChange() {
    if (document.hidden) {
      pauseSignalField();
      pausePolicyGlobes();
      pauseContactFields();
      return;
    }

    requestSignalFrame();
    restartPolicyGlobes();
    restartContactFields();
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
    restartContactFields();
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
    document.addEventListener("visibilitychange", handleVisibilityChange);
  }

  function applyRevealOrder(elements) {
    const groupCounts = new WeakMap();

    elements.forEach((element) => {
      const group = element.closest("section, header, footer, main") || document.body;
      const order = groupCounts.get(group) || 0;

      element.style.setProperty("--reveal-order", String(Math.min(order, 5)));
      groupCounts.set(group, order + 1);
    });
  }

  function initReveals() {
    const revealElements = Array.from(document.querySelectorAll(".reveal"));

    if (!revealElements.length) {
      return;
    }

    applyRevealOrder(revealElements);

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

  function initNavMenus() {
    const menus = Array.from(document.querySelectorAll(".nav-menu"));

    const closeMenu = (menu) => {
      const trigger = menu.querySelector(".nav-menu__trigger");

      menu.classList.remove("is-open");

      if (trigger) {
        trigger.setAttribute("aria-expanded", "false");
      }
    };

    const closeOtherMenus = (activeMenu) => {
      menus.forEach((menu) => {
        if (menu !== activeMenu) {
          closeMenu(menu);
        }
      });
    };

    menus.forEach((menu) => {
      const trigger = menu.querySelector(".nav-menu__trigger");

      if (!trigger) {
        return;
      }

      const setExpanded = (isExpanded) => {
        if (isExpanded) {
          closeOtherMenus(menu);
        }

        menu.classList.toggle("is-open", isExpanded);
        trigger.setAttribute("aria-expanded", String(isExpanded));
      };

      menu.addEventListener("mouseenter", () => setExpanded(true));
      menu.addEventListener("mouseleave", () => setExpanded(false));
      menu.addEventListener("focusin", () => setExpanded(true));
      menu.addEventListener("focusout", () => {
        window.setTimeout(() => {
          setExpanded(menu.contains(document.activeElement));
        }, 0);
      });

      trigger.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
          setExpanded(false);
          trigger.blur();
        }
      });
    });

    document.addEventListener("pointerdown", (event) => {
      if (menus.some((menu) => menu.contains(event.target))) {
        return;
      }

      menus.forEach(closeMenu);
    });
  }

  function initLogoBannerControls() {
    const banners = Array.from(document.querySelectorAll(".logo-banner"));

    banners.forEach((banner) => {
      const control = banner.querySelector("[data-logo-banner-toggle]");
      const track = banner.querySelector(".logo-banner__track");

      if (!control || !track) {
        return;
      }

      const setPaused = (isPaused) => {
        banner.classList.toggle("is-paused", isPaused);
        control.setAttribute("aria-pressed", String(isPaused));
        control.textContent = isPaused ? "play" : "pause";
      };

      control.addEventListener("click", () => {
        setPaused(!banner.classList.contains("is-paused"));
      });
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

  function initEducationMaps() {
    const maps = Array.from(document.querySelectorAll("[data-education-map]"));

    maps.forEach((map) => {
      const nodes = Array.from(map.querySelectorAll("[data-education-node]"));
      const panels = Array.from(map.querySelectorAll("[data-course-panel]"));

      if (!nodes.length || !panels.length) {
        return;
      }

      function activate(node) {
        const target = node.dataset.educationNode;

        nodes.forEach((control) => {
          const isActive = control === node;
          control.classList.toggle("is-active", isActive);
          control.setAttribute("aria-selected", String(isActive));
          control.tabIndex = isActive ? 0 : -1;
        });

        panels.forEach((panel) => {
          const isActive = panel.dataset.coursePanel === target;
          panel.classList.toggle("is-active", isActive);
          panel.hidden = !isActive;
        });
      }

      nodes.forEach((node, index) => {
        node.addEventListener("click", () => activate(node));
        node.addEventListener("keydown", (event) => {
          if (!["ArrowDown", "ArrowRight", "ArrowUp", "ArrowLeft", "Home", "End"].includes(event.key)) {
            return;
          }

          const direction = event.key === "ArrowDown" || event.key === "ArrowRight" ? 1 : -1;
          const next =
            event.key === "Home" ? 0 :
            event.key === "End" ? nodes.length - 1 :
            (index + direction + nodes.length) % nodes.length;

          activate(nodes[next]);
          nodes[next].focus();
        });
      });

      activate(nodes.find((node) => node.classList.contains("is-active")) || nodes[0]);
    });
  }

  function initAcademicProgressionCharts() {
    const charts = Array.from(document.querySelectorAll("[data-academic-progression]"));

    charts.forEach((chart) => {
      const keys = Array.from(chart.querySelectorAll("[data-progression-field]"));
      const series = Array.from(chart.querySelectorAll("[data-progression-series]"));
      const summary = chart.querySelector(".progression-summary");
      const defaultSummary = summary ? summary.textContent.trim() : "";
      let pinnedField = "";

      if (!keys.length || !series.length) {
        return;
      }

      function render(field) {
        chart.classList.toggle("has-active", Boolean(field));

        series.forEach((line) => {
          line.classList.toggle("is-active", line.dataset.progressionSeries === field);
        });

        keys.forEach((key) => {
          const isActive = key.dataset.progressionField === field;
          key.classList.toggle("is-active", isActive);
          key.setAttribute("aria-pressed", String(Boolean(pinnedField) && isActive));
        });

        if (summary) {
          const activeKey = keys.find((key) => key.dataset.progressionField === field);
          summary.textContent = activeKey?.dataset.progressionNote || defaultSummary;
        }
      }

      function preview(field) {
        render(field || pinnedField);
      }

      function clearPreview() {
        render(pinnedField);
      }

      keys.forEach((key) => {
        const field = key.dataset.progressionField || "";

        key.addEventListener("pointerenter", () => preview(field));
        key.addEventListener("focus", () => preview(field));
        key.addEventListener("pointerleave", clearPreview);
        key.addEventListener("blur", clearPreview);
        key.addEventListener("click", () => {
          pinnedField = pinnedField === field ? "" : field;
          render(pinnedField);
        });
      });

      render("");
    });
  }

  function initPhotoGallery() {
    const gallery = document.querySelector("[data-photo-gallery]");
    const dialog = document.querySelector("[data-photo-dialog]");

    if (!gallery || !dialog) {
      return;
    }

    const triggers = Array.from(gallery.querySelectorAll("[data-photo-trigger]"));
    const image = dialog.querySelector("[data-photo-full]");
    const caption = dialog.querySelector("[data-photo-caption]");
    const previous = dialog.querySelector("[data-photo-prev]");
    const next = dialog.querySelector("[data-photo-next]");
    const close = dialog.querySelector("[data-photo-close]");

    if (!triggers.length || !image || !caption || !previous || !next || !close) {
      return;
    }

    let activeIndex = 0;
    let fallbackOpen = false;
    let lastPhotoTrigger = null;

    function setActivePhoto(index) {
      activeIndex = (index + triggers.length) % triggers.length;

      const trigger = triggers[activeIndex];
      const thumbnail = trigger.querySelector("img");
      const fullWidth = Number.parseInt(trigger.dataset.fullWidth || "", 10);
      const fullHeight = Number.parseInt(trigger.dataset.fullHeight || "", 10);
      const fullSource = trigger.dataset.full || "";
      const nextCaption = trigger.dataset.caption || (thumbnail ? thumbnail.alt : "");

      if (fullSource) {
        image.src = fullSource;
      }

      if (thumbnail) {
        image.alt = thumbnail.alt;
      }

      if (Number.isFinite(fullWidth) && fullWidth > 0) {
        image.width = fullWidth;
      }

      if (Number.isFinite(fullHeight) && fullHeight > 0) {
        image.height = fullHeight;
      }

      caption.textContent = nextCaption;
    }

    function openPhoto(index) {
      setActivePhoto(index);

      if (typeof dialog.showModal === "function") {
        dialog.showModal();
      } else {
        fallbackOpen = true;
        dialog.setAttribute("open", "");
        document.addEventListener("keydown", onFallbackKeydown);
        close.focus();
      }
    }

    function closePhoto() {
      const wasFallbackOpen = fallbackOpen;

      if (typeof dialog.close === "function") {
        dialog.close();
      } else {
        dialog.removeAttribute("open");
      }

      if (wasFallbackOpen) {
        fallbackOpen = false;
        document.removeEventListener("keydown", onFallbackKeydown);
      }

      if (lastPhotoTrigger && typeof lastPhotoTrigger.focus === "function") {
        lastPhotoTrigger.focus();
      }
    }

    triggers.forEach((trigger, index) => {
      trigger.addEventListener("click", () => {
        lastPhotoTrigger = trigger;
        openPhoto(index);
      });
    });

    previous.addEventListener("click", () => setActivePhoto(activeIndex - 1));
    next.addEventListener("click", () => setActivePhoto(activeIndex + 1));
    close.addEventListener("click", closePhoto);

    function onFallbackKeydown(event) {
      if (!fallbackOpen) {
        return;
      }

      if (event.key === "Escape") {
        closePhoto();
      }
    }

    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) {
        closePhoto();
      }
    });

    dialog.addEventListener("keydown", (event) => {
      if (event.key === "ArrowLeft") {
        setActivePhoto(activeIndex - 1);
      } else if (event.key === "ArrowRight") {
        setActivePhoto(activeIndex + 1);
      } else if (event.key === "Escape") {
        closePhoto();
      }
    });
  }

  const globeLandmasses = [
    {
      name: "north-america",
      points: [
        [72, -168], [70, -150], [62, -140], [58, -125], [50, -124], [49, -115],
        [56, -104], [54, -90], [62, -82], [55, -62], [47, -52], [40, -70],
        [30, -80], [24, -96], [16, -93], [12, -86], [8, -80], [18, -73],
        [25, -80], [32, -82], [40, -75], [49, -67], [58, -78], [67, -98],
        [72, -128],
      ],
    },
    {
      name: "greenland",
      points: [
        [83, -52], [80, -24], [73, -18], [64, -28], [59, -43], [64, -62],
        [74, -72],
      ],
    },
    {
      name: "south-america",
      points: [
        [13, -81], [11, -70], [7, -60], [3, -50], [-8, -35], [-18, -39],
        [-22, -44], [-35, -52], [-55, -68], [-48, -75], [-32, -72],
        [-15, -76], [0, -80],
      ],
    },
    {
      name: "europe",
      points: [
        [72, -10], [71, 20], [66, 38], [58, 35], [54, 26], [50, 30],
        [45, 20], [42, 12], [36, 10], [37, -6], [45, -10], [55, -5],
        [62, -8],
      ],
    },
    {
      name: "asia",
      points: [
        [72, 25], [72, 70], [66, 95], [69, 125], [61, 170], [50, 155],
        [43, 135], [35, 128], [23, 121], [18, 106], [8, 103], [16, 96],
        [24, 88], [29, 78], [34, 70], [29, 58], [36, 48], [43, 34],
        [55, 38],
      ],
    },
    {
      name: "arabia",
      points: [
        [32, 35], [28, 50], [17, 57], [12, 48], [16, 41], [25, 36],
      ],
    },
    {
      name: "india",
      points: [
        [31, 68], [29, 78], [24, 88], [18, 86], [8, 78], [18, 72],
      ],
    },
    {
      name: "southeast-asia",
      points: [
        [24, 94], [22, 108], [14, 109], [7, 105], [1, 101], [7, 96],
      ],
    },
    {
      name: "africa",
      points: [
        [37, -17], [36, 10], [31, 31], [13, 43], [5, 40], [-5, 39],
        [-18, 35], [-35, 20], [-34, 15], [-23, 14], [-35, -16],
        [-15, -18], [5, -10], [12, -17], [25, -15],
      ],
    },
    {
      name: "australia",
      points: [
        [-11, 113], [-10, 153], [-24, 154], [-38, 146], [-44, 130],
        [-32, 114],
      ],
    },
    {
      name: "madagascar",
      points: [
        [-12, 48], [-25, 51], [-26, 44], [-15, 43],
      ],
    },
    {
      name: "japan",
      points: [
        [45, 140], [38, 143], [31, 131], [36, 129],
      ],
    },
  ];

  function normalizeLongitude(value) {
    let next = value;

    while (next > 180) {
      next -= 360;
    }

    while (next < -180) {
      next += 360;
    }

    return next;
  }

  function pointInPolygon(lat, lon, polygon) {
    const x = normalizeLongitude(lon);
    const y = lat;
    let inside = false;

    for (let index = 0, previous = polygon.length - 1; index < polygon.length; previous = index, index += 1) {
      const xi = normalizeLongitude(polygon[index][1]);
      const yi = polygon[index][0];
      const xj = normalizeLongitude(polygon[previous][1]);
      const yj = polygon[previous][0];
      const intersects = (yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;

      if (intersects) {
        inside = !inside;
      }
    }

    return inside;
  }

  function isLandPixel(lat, lon) {
    return globeLandmasses.some((landmass) => pointInPolygon(lat, lon, landmass.points));
  }

  function readPolicyGlobeMarkers(canvasElement) {
    const stage = canvasElement.closest(".work-globe__stage");
    const items = stage ? Array.from(stage.querySelectorAll("[data-lat][data-lon]")) : [];

    return items
      .map((item) => {
        const label = item.textContent.trim();
        const lat = Number.parseFloat(item.dataset.lat || "");
        const lon = Number.parseFloat(item.dataset.lon || "");
        const isField = /Islamabad|Lahore/.test(label);

        return {
          label,
          lat,
          lon,
          color: isField ? "#ffd452" : "#ef3340",
        };
      })
      .filter((marker) => Number.isFinite(marker.lat) && Number.isFinite(marker.lon));
  }

  function projectGlobePoint(lat, lon, centerLon, center, radius) {
    const phi = lat * degree;
    const lambda = normalizeLongitude(lon - centerLon) * degree;
    const cosPhi = Math.cos(phi);
    const x = cosPhi * Math.sin(lambda);
    const y = -Math.sin(phi);
    const z = cosPhi * Math.cos(lambda);

    if (z <= 0.03) {
      return null;
    }

    return {
      depth: z,
      x: center + x * radius,
      y: center + y * radius,
    };
  }

  function drawPolicyMarker(drawing, marker, projection, timestamp) {
    const pulse = reduceMotion.matches ? 0.5 : (Math.sin(timestamp * 0.006 + marker.lon) + 1) * 0.5;
    const size = marker.color === "#ffd452" ? 5 : 6;
    const x = Math.round(projection.x - size / 2);
    const y = Math.round(projection.y - size / 2);

    drawing.globalAlpha = 0.46 + projection.depth * 0.54;
    drawing.fillStyle = marker.color;
    drawing.fillRect(x, y, size, size);

    if (pulse > 0.62) {
      drawing.globalAlpha = 0.18 + pulse * 0.2;
      drawing.fillRect(x - 2, y - 2, size + 4, 2);
      drawing.fillRect(x - 2, y + size, size + 4, 2);
      drawing.fillRect(x - 2, y, 2, size);
      drawing.fillRect(x + size, y, 2, size);
    }

    drawing.globalAlpha = 1;
  }

  function drawPolicyGlobe(state, timestamp) {
    const drawing = state.context;
    const size = state.size;
    const center = size / 2;
    const radius = size * 0.44;
    const cell = 2;
    const elapsed = (timestamp - state.startedAt) / 1000;
    const centerLon = reduceMotion.matches ? 84 : normalizeLongitude(102 - elapsed * 24);

    state.frame = 0;

    if (!reduceMotion.matches && timestamp - state.lastDraw < 32) {
      state.frame = window.requestAnimationFrame((nextTimestamp) => drawPolicyGlobe(state, nextTimestamp));
      return;
    }

    state.lastDraw = timestamp;
    drawing.clearRect(0, 0, size, size);

    drawing.fillStyle = "#062f3b";
    drawing.beginPath();
    drawing.arc(center, center, radius + 4, 0, Math.PI * 2);
    drawing.fill();

    for (let y = Math.floor(center - radius); y <= center + radius; y += cell) {
      for (let x = Math.floor(center - radius); x <= center + radius; x += cell) {
        const nx = (x + cell * 0.5 - center) / radius;
        const ny = (y + cell * 0.5 - center) / radius;
        const distance = nx * nx + ny * ny;

        if (distance > 1) {
          continue;
        }

        const z = Math.sqrt(1 - distance);
        const lat = Math.asin(-ny) / degree;
        const lon = normalizeLongitude(centerLon + Math.atan2(nx, z) / degree);
        const land = isLandPixel(lat, lon);
        const edgeShade = Math.max(0, Math.min(1, z - Math.max(0, nx) * 0.14));
        const band = Math.sin((lon * 1.7 + lat * 2.6) * degree);

        if (land) {
          if (lat > 54) {
            drawing.fillStyle = edgeShade > 0.55 ? "#7fcf70" : "#4d9956";
          } else if (edgeShade < 0.34) {
            drawing.fillStyle = "#377f45";
          } else {
            drawing.fillStyle = edgeShade > 0.56 ? "#6fc266" : "#448f4a";
          }
        } else if (band > 0.28 && edgeShade > 0.42) {
          drawing.fillStyle = edgeShade > 0.52 ? "#4a91ce" : "#2e679b";
        } else {
          drawing.fillStyle = edgeShade > 0.52 ? "#3479b6" : "#255b89";
        }

        drawing.fillRect(x, y, cell, cell);
      }
    }

    drawing.lineWidth = 5;
    drawing.strokeStyle = "#06213a";
    drawing.beginPath();
    drawing.arc(center, center, radius + 3, 0, Math.PI * 2);
    drawing.stroke();

    drawing.lineWidth = 2;
    drawing.strokeStyle = "#0b5160";
    drawing.beginPath();
    drawing.arc(center, center, radius + 0.5, 0, Math.PI * 2);
    drawing.stroke();

    state.markers.forEach((marker) => {
      const projection = projectGlobePoint(marker.lat, marker.lon, centerLon, center, radius);

      if (projection) {
        drawPolicyMarker(drawing, marker, projection, timestamp);
      }
    });

    drawing.fillStyle = "rgba(230, 239, 238, 0.68)";
    drawing.fillRect(center - 4, center + radius - 1, 8, 3);

    if (!reduceMotion.matches && !document.hidden) {
      state.frame = window.requestAnimationFrame((nextTimestamp) => drawPolicyGlobe(state, nextTimestamp));
    }
  }

  function pausePolicyGlobes() {
    policyGlobeStates.forEach((state) => {
      if (!state.frame) {
        return;
      }

      window.cancelAnimationFrame(state.frame);
      state.frame = 0;
    });
  }

  function restartPolicyGlobes() {
    policyGlobeStates.forEach((state) => {
      if (state.frame) {
        window.cancelAnimationFrame(state.frame);
        state.frame = 0;
      }

      state.startedAt = window.performance.now();
      drawPolicyGlobe(state, state.startedAt);
    });
  }

  function initPolicyGlobes() {
    const globeCanvases = Array.from(document.querySelectorAll("[data-policy-globe]"));

    globeCanvases.forEach((globeCanvas) => {
      const drawing = globeCanvas.getContext("2d");

      if (!drawing) {
        return;
      }

      const state = {
        canvas: globeCanvas,
        context: drawing,
        frame: 0,
        lastDraw: 0,
        markers: readPolicyGlobeMarkers(globeCanvas),
        size: globeCanvas.width || 320,
        startedAt: window.performance.now(),
      };

      policyGlobeStates.push(state);
      drawPolicyGlobe(state, state.startedAt);
    });
  }

  function readContactFieldColors() {
    const styles = window.getComputedStyle(root);
    const read = (name, fallback) => styles.getPropertyValue(name).trim() || fallback;

    return {
      accent: read("--accent", "#ffb31a"),
      green: read("--availability-green", "#9fcd72"),
      line: read("--muted", "#aeb4ad"),
      muted: read("--faint", "#8a8a8a"),
      node: read("--text", "#f7f3ea"),
    };
  }

  function resizeContactField(state) {
    const rect = state.canvas.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const fallbackWidth = state.canvas.parentElement ? state.canvas.parentElement.clientWidth : 320;
    const fallbackHeight = state.canvas.parentElement ? state.canvas.parentElement.clientHeight : 360;

    state.width = Math.max(320, Math.round(rect.width || fallbackWidth || 320));
    state.height = Math.max(360, Math.round(rect.height || fallbackHeight || 360));
    state.canvas.width = Math.round(state.width * ratio);
    state.canvas.height = Math.round(state.height * ratio);
    state.context.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  function drawContactNode(drawing, x, y, size, color, alpha) {
    drawing.globalAlpha = alpha;
    drawing.fillStyle = color;
    drawing.beginPath();
    drawing.arc(x, y, size, 0, Math.PI * 2);
    drawing.fill();
  }

  function drawContactCluster(state, cluster, colors, elapsed) {
    const drawing = state.context;
    const scale = Math.min(state.width, state.height) / 900;
    const centerX = state.width * cluster.x + Math.sin(elapsed * 0.16 + cluster.phase) * 12;
    const centerY = state.height * cluster.y + Math.cos(elapsed * 0.13 + cluster.phase) * 10;
    const radius = cluster.radius * Math.max(0.76, Math.min(1.2, scale + 0.44));
    const clusterColor = colors[cluster.color] || colors.accent;

    drawContactNode(drawing, centerX, centerY, cluster.color === "accent" ? 6.5 : 5.5, colors.muted, 0.68);

    for (let index = 0; index < cluster.spokes; index += 1) {
      const unit = index / cluster.spokes;
      const angle = unit * Math.PI * 2 + elapsed * 0.08 + cluster.phase;
      const wobble = Math.sin(elapsed * 0.7 + index * 1.9) * 0.12;
      const distance = radius * (0.44 + ((index * 17) % 41) / 56 + wobble);
      const x = centerX + Math.cos(angle) * distance;
      const y = centerY + Math.sin(angle) * distance;
      const color = index % 5 === 0 ? colors.green : clusterColor;
      const alpha = cluster.color === "accent" ? 0.9 : 0.62;

      drawing.globalAlpha = 0.14;
      drawing.strokeStyle = colors.line;
      drawing.lineWidth = 1;
      drawing.beginPath();
      drawing.moveTo(centerX, centerY);
      drawing.lineTo(x, y);
      drawing.stroke();

      if (index % 4 === 0) {
        const nextAngle = angle + 0.54;
        const nextX = centerX + Math.cos(nextAngle) * distance * 0.86;
        const nextY = centerY + Math.sin(nextAngle) * distance * 0.86;

        drawing.globalAlpha = 0.12;
        drawing.beginPath();
        drawing.moveTo(x, y);
        drawing.lineTo(nextX, nextY);
        drawing.stroke();
      }

      drawContactNode(drawing, x, y, index % 7 === 0 ? 2.3 : 1.9, color, alpha);
    }
  }

  function drawContactField(state, timestamp) {
    if (!reduceMotion.matches && timestamp - state.lastDraw < 32) {
      state.frame = window.requestAnimationFrame((nextTimestamp) => drawContactField(state, nextTimestamp));
      return;
    }

    const drawing = state.context;
    const elapsed = reduceMotion.matches ? 4 : (timestamp - state.startedAt) / 1000;
    const colors = readContactFieldColors();

    state.frame = 0;
    state.lastDraw = timestamp;
    drawing.clearRect(0, 0, state.width, state.height);

    drawing.globalAlpha = 0.035;
    drawing.fillStyle = colors.accent;
    drawing.fillRect(state.width * 0.42, 0, state.width * 0.58, state.height);
    drawing.globalAlpha = 1;

    contactFieldClusters.forEach((cluster) => drawContactCluster(state, cluster, colors, elapsed));
    drawing.globalAlpha = 1;

    if (!reduceMotion.matches && !document.hidden) {
      state.frame = window.requestAnimationFrame((nextTimestamp) => drawContactField(state, nextTimestamp));
    }
  }

  function startContactField(state) {
    if (state.frame) {
      window.cancelAnimationFrame(state.frame);
      state.frame = 0;
    }

    resizeContactField(state);
    state.startedAt = window.performance.now();
    state.lastDraw = 0;
    drawContactField(state, state.startedAt);
  }

  function pauseContactFields() {
    contactFieldStates.forEach((state) => {
      if (!state.frame) {
        return;
      }

      window.cancelAnimationFrame(state.frame);
      state.frame = 0;
    });
  }

  function restartContactFields() {
    contactFieldStates.forEach(startContactField);
  }

  function initContactFields() {
    const contactCanvases = Array.from(document.querySelectorAll("[data-contact-field]"));

    contactCanvases.forEach((contactCanvas) => {
      const drawing = contactCanvas.getContext("2d");

      if (!drawing) {
        return;
      }

      const state = {
        canvas: contactCanvas,
        context: drawing,
        frame: 0,
        height: 0,
        lastDraw: 0,
        observer: null,
        startedAt: window.performance.now(),
        width: 0,
      };

      if (typeof ResizeObserver === "function") {
        state.observer = new ResizeObserver(() => startContactField(state));
        state.observer.observe(contactCanvas);
      }

      contactFieldStates.push(state);
      startContactField(state);
    });

    if (contactFieldStates.length && typeof ResizeObserver !== "function") {
      window.addEventListener("resize", restartContactFields);
    }
  }

  function bindMotionSetting() {
    const restart = () => {
      if (reduceMotion.matches && field.animationId) {
        window.cancelAnimationFrame(field.animationId);
        field.animationId = 0;
      } else if (!reduceMotion.matches && !field.animationId && canvas && context) {
        requestSignalFrame();
      }

      restartPolicyGlobes();
      restartContactFields();
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
  initNavMenus();
  initLogoBannerControls();
  initTabs();
  initEducationMaps();
  initAcademicProgressionCharts();
  initPhotoGallery();
  initPolicyGlobes();
  initContactFields();
  bindMotionSetting();
})();
