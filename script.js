(function () {
  document.documentElement.classList.add("js");

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const canvas = document.querySelector("#signal-canvas");
  const context = canvas ? canvas.getContext("2d") : null;

  const pointer = {
    x: 0.62,
    y: 0.34,
    active: false,
  };

  let width = 0;
  let height = 0;
  let scale = 1;
  let nodes = [];
  let frame = 0;
  let animationId = 0;

  function createNodes() {
    const area = width * height;
    const count = Math.max(92, Math.min(260, Math.floor(area / 7200)));

    return Array.from({ length: count }, (_, index) => {
      const t = count <= 1 ? 0 : index / (count - 1);
      const lane = index % 5;
      const sweep = Math.sin(t * Math.PI * 2.15);
      const offset = Math.sin(index * 12.9898) * 0.07;

      return {
        baseX: width * (0.18 + t * 0.72 + offset),
        baseY: height * (0.17 + lane * 0.11 + sweep * 0.055),
        orbit: 5 + (index % 11) * 0.72,
        phase: index * 0.63,
        speed: 0.0014 + (index % 7) * 0.0002,
        size: 0.7 + (index % 4) * 0.22,
        alpha: 0.16 + (index % 6) * 0.035,
      };
    });
  }

  function resizeCanvas() {
    if (!canvas || !context) {
      return;
    }

    scale = Math.min(window.devicePixelRatio || 1, 2);
    width = Math.max(1, window.innerWidth);
    height = Math.max(1, window.innerHeight);
    canvas.width = Math.floor(width * scale);
    canvas.height = Math.floor(height * scale);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    context.setTransform(scale, 0, 0, scale, 0, 0);
    nodes = createNodes();
  }

  function drawBackground() {
    const gradient = context.createRadialGradient(
      width * 0.74,
      height * 0.2,
      0,
      width * 0.74,
      height * 0.2,
      width * 0.48
    );

    gradient.addColorStop(0, "rgba(217, 133, 79, 0.1)");
    gradient.addColorStop(0.48, "rgba(242, 180, 93, 0.04)");
    gradient.addColorStop(1, "rgba(7, 5, 4, 0)");

    context.fillStyle = gradient;
    context.fillRect(0, 0, width, height);
  }

  function drawSignalRibbon(time) {
    context.beginPath();
    context.strokeStyle = "rgba(247, 210, 171, 0.13)";
    context.lineWidth = 1;

    for (let i = 0; i < 96; i += 1) {
      const t = i / 95;
      const x = width * (0.1 + t * 0.82);
      const y = height * (0.28 + Math.sin(t * Math.PI * 2.4 + time * 0.0018) * 0.065);

      if (i === 0) {
        context.moveTo(x, y);
      } else {
        context.lineTo(x, y);
      }
    }

    context.stroke();
  }

  function drawField(time) {
    if (!context) {
      return;
    }

    context.clearRect(0, 0, width, height);
    drawBackground();

    const influenceX = (pointer.x - 0.5) * (pointer.active ? 22 : 8);
    const influenceY = (pointer.y - 0.5) * (pointer.active ? 16 : 5);
    const points = nodes.map((node) => {
      const drift = time * node.speed + node.phase;

      return {
        x: node.baseX + Math.cos(drift) * node.orbit + influenceX,
        y: node.baseY + Math.sin(drift * 1.35) * node.orbit + influenceY,
        size: node.size,
        alpha: node.alpha,
      };
    });

    for (let index = 0; index < points.length; index += 1) {
      const point = points[index];

      context.beginPath();
      context.fillStyle = `rgba(247, 210, 171, ${point.alpha})`;
      context.arc(point.x, point.y, point.size, 0, Math.PI * 2);
      context.fill();

      if (index % 3 !== 0) {
        continue;
      }

      const next = points[index + 9];
      if (!next) {
        continue;
      }

      const distance = Math.hypot(point.x - next.x, point.y - next.y);
      if (distance < 150) {
        context.beginPath();
        context.strokeStyle = `rgba(217, 133, 79, ${Math.max(0, 0.1 - distance / 1600)})`;
        context.lineWidth = 0.55;
        context.moveTo(point.x, point.y);
        context.lineTo(next.x, next.y);
        context.stroke();
      }
    }

    drawSignalRibbon(time);
  }

  function animate() {
    drawField(frame);
    frame += 1;
    animationId = window.requestAnimationFrame(animate);
  }

  function startCanvas() {
    if (!canvas || !context) {
      return;
    }

    window.cancelAnimationFrame(animationId);

    if (reduceMotion.matches) {
      drawField(0);
      return;
    }

    animate();
  }

  function initCanvas() {
    if (!canvas || !context) {
      return;
    }

    resizeCanvas();
    startCanvas();

    window.addEventListener("resize", () => {
      resizeCanvas();
      startCanvas();
    });

    window.addEventListener("pointermove", (event) => {
      pointer.x = event.clientX / Math.max(1, width);
      pointer.y = event.clientY / Math.max(1, height);
      pointer.active = true;
    });

    window.addEventListener("pointerleave", () => {
      pointer.active = false;
    });

    if (typeof reduceMotion.addEventListener === "function") {
      reduceMotion.addEventListener("change", startCanvas);
    } else if (typeof reduceMotion.addListener === "function") {
      reduceMotion.addListener(startCanvas);
    }
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
        rootMargin: "0px 0px -12% 0px",
        threshold: 0.12,
      }
    );

    revealElements.forEach((element) => observer.observe(element));
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
        detail: "governance capacity, markets, and institutional design",
        colors: ["#d6bd49", "#c89435", "#7b8d2f", "#44792f"],
      },
      southAmerica: {
        label: "South America",
        detail: "resource systems, development, and political economy",
        colors: ["#d1b344", "#d89336", "#8d8a2f", "#4f7a35"],
      },
      europe: {
        label: "Europe",
        detail: "regulation, standards, and alliance coordination",
        colors: ["#d9c34e", "#d79a3a", "#748a33", "#b07a31"],
      },
      africa: {
        label: "Africa",
        detail: "infrastructure, institutional capacity, and resilience",
        colors: ["#d4bd4a", "#d89238", "#9a8730", "#5e812f"],
      },
      asia: {
        label: "Asia",
        detail: "geopolitical competition and frontier technology systems",
        colors: ["#d8bd4a", "#db9836", "#839135", "#5c822f"],
      },
      oceania: {
        label: "Oceania",
        detail: "security partnerships and critical supply chains",
        colors: ["#d2aa42", "#c98a32", "#798b34", "#457334"],
      },
    };
    const regionOrder = Object.keys(regions);
    const patches = [
      ["northAmerica", 1, 8, 13, 4],
      ["northAmerica", 4, 11, 20, 7],
      ["northAmerica", 8, 18, 16, 7],
      ["northAmerica", 13, 25, 8, 3],
      ["northAmerica", 16, 28, 6, 4],
      ["northAmerica", 19, 31, 4, 5],
      ["northAmerica", 20, 6, 8, 4],
      ["northAmerica", 27, 3, 11, 5],
      ["northAmerica", 34, 2, 7, 4],
      ["southAmerica", 21, 24, 9, 5],
      ["southAmerica", 22, 28, 10, 6],
      ["southAmerica", 24, 33, 5, 4],
      ["europe", 41, 9, 7, 5],
      ["europe", 46, 7, 7, 5],
      ["europe", 49, 10, 5, 4],
      ["africa", 40, 15, 10, 5],
      ["africa", 42, 19, 11, 7],
      ["africa", 45, 25, 8, 8],
      ["africa", 49, 32, 4, 2],
      ["asia", 50, 8, 16, 5],
      ["asia", 55, 12, 22, 6],
      ["asia", 52, 18, 18, 6],
      ["asia", 60, 24, 10, 4],
      ["asia", 67, 17, 8, 5],
      ["asia", 70, 22, 5, 4],
      ["asia", 59, 3, 7, 3],
      ["asia", 64, 2, 4, 2],
      ["oceania", 64, 28, 5, 3],
      ["oceania", 68, 30, 9, 4],
      ["oceania", 76, 35, 2, 2],
      ["oceania", 71, 26, 3, 2],
    ];
    const tiles = new Map();

    patches.forEach(([region, startX, startY, width, height], patchIndex) => {
      for (let y = startY; y < startY + height; y += 1) {
        for (let x = startX; x < startX + width; x += 1) {
          const edge = x === startX || y === startY || x === startX + width - 1 || y === startY + height - 1;
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
      readout.textContent = region ? `${region.label}: ${region.detail}` : "Global systems map";
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

  function initResearchTabs() {
    const tabs = Array.from(document.querySelectorAll(".research-tab"));
    const panel = document.querySelector("#research-panel");

    if (!tabs.length || !panel) {
      return;
    }

    const content = [
      {
        body: "How institutions understand, constrain, and operationalize powerful AI systems when technical capacity, regulatory pressure, and organizational incentives are all moving at once.",
        items: [
          "AI governance research and technical-policy briefs",
          "Institutional risk mapping and strategic writing",
          "Frontier AI risk assessment and evaluation frameworks",
        ],
      },
      {
        body: "The geopolitics of AI development — where strategic competition, export controls, and alliance coordination shape which systems get built and by whom.",
        items: [
          "US-China technology competition and strategic dynamics",
          "Export control regimes and dual-use technology governance",
          "Alliance coordination and frontier AI standard-setting",
        ],
      },
      {
        body: "Why governance bodies fail to adapt to fast-moving technical change — the incentive structures, organizational constraints, and coordination problems that block effective oversight.",
        items: [
          "Regulatory capture and agency dynamics in AI oversight",
          "Coordination failure across national and international bodies",
          "Organizational capacity gaps in technical standard-setting",
        ],
      },
      {
        body: "Research tooling, data infrastructure, and workflow systems built for public-interest work — making complex institutions and datasets legible and inspectable.",
        items: [
          "Research tooling, workflow automation, and data visualization",
          "Local-first systems for independent researchers and analysts",
          "Prototypes that make institutional data inspectable",
        ],
      },
    ];

    const bodyEl = panel.querySelector("p");
    const listEl = panel.querySelector("ul");

    function activate(index) {
      tabs.forEach((tab, i) => {
        const isActive = i === index;
        tab.classList.toggle("active", isActive);
        tab.setAttribute("aria-selected", String(isActive));
        tab.setAttribute("tabindex", isActive ? "0" : "-1");
      });

      const data = content[index];

      if (bodyEl) {
        bodyEl.textContent = data.body;
      }

      if (listEl) {
        while (listEl.firstChild) {
          listEl.removeChild(listEl.firstChild);
        }
        data.items.forEach((text) => {
          const li = document.createElement("li");
          li.textContent = text;
          listEl.appendChild(li);
        });
      }
    }

    tabs.forEach((tab, index) => {
      tab.addEventListener("click", () => activate(index));
      tab.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          activate(index);
        } else if (event.key === "ArrowDown" || event.key === "ArrowRight") {
          event.preventDefault();
          const next = (index + 1) % tabs.length;
          activate(next);
          tabs[next].focus();
        } else if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
          event.preventDefault();
          const prev = (index - 1 + tabs.length) % tabs.length;
          activate(prev);
          tabs[prev].focus();
        }
      });
    });
  }

  initCanvas();
  initPixelMap();
  initReveals();
  initResearchTabs();
})();
