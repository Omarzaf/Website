(function (globalScope) {
  "use strict";

  const DEFAULT_PADDING = 32;
  const THROW_POWER = 26;
  const states = {
    intro: "intro",
    presenting: "presenting",
    held: "held",
    thrown: "thrown",
    fetching: "fetching",
    returning: "returning",
    ready: "ready",
    sleeping: "sleeping",
  };

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function clampPoint(point, viewport, padding = DEFAULT_PADDING) {
    const width = Math.max(padding * 2, viewport.width || 0);
    const height = Math.max(padding * 2, viewport.height || 0);

    return {
      x: clamp(point.x, padding, width - padding),
      y: clamp(point.y, padding, height - padding),
    };
  }

  function computeThrowTarget(origin, velocity, viewport, padding = DEFAULT_PADDING) {
    const projected = {
      x: origin.x + velocity.x * THROW_POWER,
      y: origin.y + velocity.y * THROW_POWER,
    };

    return clampPoint(projected, viewport, padding);
  }

  function moveToward(current, target, step) {
    const dx = target.x - current.x;
    const dy = target.y - current.y;
    const distance = Math.hypot(dx, dy);

    if (distance <= step || distance === 0) {
      return { x: target.x, y: target.y };
    }

    return {
      x: current.x + (dx / distance) * step,
      y: current.y + (dy / distance) * step,
    };
  }

  function isCatchDistance(dogPoint, ballPoint, radius = 34) {
    return Math.hypot(ballPoint.x - dogPoint.x, ballPoint.y - dogPoint.y) <= radius;
  }

  function isCurrentDragPointer(drag, event) {
    return !drag || event.pointerId === undefined || drag.pointerId === event.pointerId;
  }

  function shouldReleaseDrag(mode, drag, event) {
    return mode === states.held && Boolean(drag) && isCurrentDragPointer(drag, event);
  }

  function easeOutCubic(value) {
    const t = clamp(value, 0, 1);
    return 1 - Math.pow(1 - t, 3);
  }

  const api = {
    clampPoint,
    computeThrowTarget,
    isCatchDistance,
    moveToward,
    shouldReleaseDrag,
    states,
  };

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  if (!globalScope || !globalScope.document) {
    return;
  }

  const { document, matchMedia, requestAnimationFrame, cancelAnimationFrame } = globalScope;
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)");

  const voxelColors = {
    black: "#201815",
    blue: "#8bd4e8",
    cream: "#ffe6bd",
    dark: "#6b341c",
    gold: "#ffc83d",
    orange: "#d87525",
    orangeDark: "#9e4823",
    orangeLight: "#f4a33c",
    pink: "#d94f55",
    red: "#ee3f35",
    redDark: "#8f1515",
    white: "#fff7e9",
  };

  const dogVoxels = [
    { group: "gb-tail", x: 6, y: 36, z: -4, w: 20, h: 14, d: 16, color: "orangeLight" },
    { group: "gb-tail", x: 8, y: 23, z: -3, w: 18, h: 16, d: 16, color: "cream" },
    { group: "gb-tail", x: 18, y: 15, z: -2, w: 18, h: 12, d: 14, color: "orangeLight" },
    { group: "gb-tail", x: 28, y: 24, z: -2, w: 14, h: 12, d: 12, color: "orange" },
    { group: "gb-tail", x: 18, y: 37, z: -1, w: 22, h: 10, d: 12, color: "orange" },
    { group: "gb-body", x: 22, y: 39, z: 0, w: 48, h: 27, d: 24, color: "orange" },
    { group: "gb-body", x: 28, y: 34, z: 6, w: 40, h: 10, d: 20, color: "orangeLight" },
    { group: "gb-body", x: 52, y: 36, z: 8, w: 18, h: 28, d: 22, color: "cream" },
    { group: "gb-body", x: 37, y: 54, z: 9, w: 30, h: 12, d: 18, color: "dark" },
    { group: "gb-body", x: 42, y: 48, z: 20, w: 20, h: 5, d: 8, color: "blue" },
    { group: "gb-leg gb-leg--back", x: 26, y: 62, z: 2, w: 11, h: 28, d: 12, color: "orangeDark" },
    { group: "gb-leg gb-leg--back", x: 24, y: 84, z: 4, w: 16, h: 8, d: 12, color: "cream" },
    { group: "gb-leg gb-leg--mid", x: 43, y: 62, z: -2, w: 10, h: 26, d: 11, color: "dark" },
    { group: "gb-leg gb-leg--front", x: 64, y: 58, z: 8, w: 12, h: 32, d: 13, color: "cream" },
    { group: "gb-leg gb-leg--front", x: 63, y: 86, z: 10, w: 19, h: 8, d: 13, color: "white" },
    { group: "gb-head", x: 60, y: 17, z: 8, w: 34, h: 30, d: 26, color: "orange" },
    { group: "gb-head", x: 65, y: 23, z: 22, w: 25, h: 24, d: 12, color: "cream" },
    { group: "gb-head", x: 84, y: 31, z: 24, w: 18, h: 12, d: 14, color: "cream" },
    { group: "gb-head", x: 99, y: 34, z: 27, w: 6, h: 7, d: 8, color: "black" },
    { group: "gb-head", x: 76, y: 28, z: 25, w: 5, h: 6, d: 5, color: "black", extraClass: "gb-eyes--open" },
    { group: "gb-head", x: 77, y: 29, z: 29, w: 2, h: 2, d: 2, color: "white", extraClass: "gb-eyes--open" },
    { group: "gb-head", x: 76, y: 31, z: 25, w: 7, h: 3, d: 3, color: "black", extraClass: "gb-eyes--closed" },
    { group: "gb-head", x: 93, y: 39, z: 28, w: 7, h: 4, d: 5, color: "black" },
    { group: "gb-head", x: 64, y: 42, z: 23, w: 10, h: 5, d: 4, color: "pink" },
    { group: "gb-ear gb-ear--l", x: 62, y: 4, z: 10, w: 12, h: 17, d: 12, color: "orange" },
    { group: "gb-ear gb-ear--l", x: 65, y: 8, z: 20, w: 7, h: 10, d: 5, color: "pink" },
    { group: "gb-ear gb-ear--r", x: 82, y: 2, z: 11, w: 12, h: 19, d: 12, color: "orangeLight" },
    { group: "gb-ear gb-ear--r", x: 85, y: 7, z: 21, w: 7, h: 11, d: 5, color: "pink" },
    { group: "gb-collar", x: 56, y: 45, z: 25, w: 21, h: 6, d: 5, color: "dark" },
    { group: "gb-collar", x: 67, y: 49, z: 29, w: 5, h: 6, d: 4, color: "gold" },
  ];

  const ballVoxels = [
    { x: 5, y: 0, z: 2, w: 9, h: 4, d: 8, color: "red" },
    { x: 2, y: 4, z: 1, w: 15, h: 6, d: 10, color: "red" },
    { x: 0, y: 10, z: 0, w: 17, h: 6, d: 10, color: "redDark" },
    { x: 4, y: 16, z: 1, w: 9, h: 4, d: 8, color: "redDark" },
    { x: 4, y: 4, z: 8, w: 5, h: 5, d: 4, color: "white" },
    { x: 9, y: 1, z: 9, w: 3, h: 3, d: 3, color: "orangeLight" },
  ];

  function createCuboid(part) {
    if (!globalScope.UZCubeField || typeof globalScope.UZCubeField.createCube !== "function") {
      throw new Error("UZCubeField.createCube is unavailable");
    }

    return globalScope.UZCubeField.createCube(part, { colors: voxelColors });
  }

  function isHomepage() {
    const page = globalScope.location.pathname.split("/").pop();
    return page === "" || page === "index.html";
  }

  function viewport() {
    return {
      width: Math.max(320, globalScope.innerWidth || 320),
      height: Math.max(320, globalScope.innerHeight || 320),
    };
  }

  function rounded(point) {
    return {
      x: Number(point.x.toFixed(2)),
      y: Number(point.y.toFixed(2)),
    };
  }

  function createVoxelDog() {
    const scene = document.createElement("div");
    const rig = document.createElement("div");
    const groups = new Map();

    scene.className = "gb-voxel-dog";
    rig.className = "gb-voxel-dog__rig";
    scene.appendChild(rig);

    dogVoxels.forEach(function (part) {
      const key = part.group;
      let group = groups.get(key);

      if (!group) {
        group = document.createElement("div");
        group.className = `gb-voxel-group ${key}`;
        groups.set(key, group);
        rig.appendChild(group);
      }

      group.appendChild(createCuboid(part));
    });

    return scene;
  }

  function createVoxelBall() {
    const ball = document.createElement("div");

    ball.className = "gb-voxel-ball";
    ballVoxels.forEach(function (part) {
      ball.appendChild(createCuboid(part));
    });

    return ball;
  }

  function createLayer() {
    const layer = document.createElement("div");

    layer.id = "gameboy-dog-layer";
    layer.className = "gb-dog-layer";
    layer.setAttribute("aria-hidden", "true");

    const arc = document.createElement("div");
    arc.className = "gb-dog-layer__arc";
    arc.setAttribute("data-gb-dog-arc", "");

    const shadow = document.createElement("div");
    shadow.className = "gb-dog-layer__shadow";
    shadow.setAttribute("data-gb-dog-shadow", "");

    const dog = document.createElement("div");
    dog.className = "gb-dog-layer__dog";
    dog.setAttribute("data-gb-dog-sprite", "");
    dog.appendChild(createVoxelDog());

    const ball = document.createElement("div");
    ball.className = "gb-dog-layer__ball";
    ball.setAttribute("data-gb-dog-bone", "");
    ball.appendChild(createVoxelBall());

    const zzz = document.createElement("div");
    zzz.className = "gb-dog-layer__zzz";
    zzz.setAttribute("data-gb-dog-zzz", "");
    zzz.setAttribute("aria-hidden", "true");
    ["z", "z", "z"].forEach(function (letter) {
      const s = document.createElement("span");
      s.textContent = letter;
      zzz.appendChild(s);
    });

    const bubble = document.createElement("div");
    bubble.className = "gb-dog-layer__bubble";
    bubble.setAttribute("data-gb-dog-bubble", "");
    bubble.setAttribute("aria-hidden", "true");
    bubble.textContent = "throw it!";

    layer.appendChild(arc);
    layer.appendChild(shadow);
    layer.appendChild(dog);
    layer.appendChild(ball);
    layer.appendChild(zzz);
    layer.appendChild(bubble);

    document.body.appendChild(layer);
    return layer;
  }

  function bootLayer() {
    if (!isHomepage() || document.querySelector("#gameboy-dog-layer")) {
      return;
    }

    const layer = createLayer();
    const dog = layer.querySelector("[data-gb-dog-sprite]");
    const bone = layer.querySelector("[data-gb-dog-bone]");
    const shadow = layer.querySelector("[data-gb-dog-shadow]");
    const arc = layer.querySelector("[data-gb-dog-arc]");
    const bubble = layer.querySelector("[data-gb-dog-bubble]");
    const zzz = layer.querySelector("[data-gb-dog-zzz]");
    const model = {
      bone: { x: 0, y: 0, rotation: 0, target: { x: 0, y: 0 } },
      dog: { x: 0, y: 0, face: -1, carrying: true, introScale: 0.3 },
      drag: null,
      frame: 0,
      introStartDist: null,
      lastPointer: null,
      mode: states.intro,
      presentingUntil: 0,
      sleepTimer: 0,
      throw: null,
      viewport: viewport(),
    };

    function setMode(mode) {
      model.mode = mode;
      layer.dataset.state = mode;
    }

    function cancelSleepTimer() {
      if (model.sleepTimer) {
        globalScope.clearTimeout(model.sleepTimer);
        model.sleepTimer = 0;
      }
    }

    // Once the pup is idle with the ball ready, drift it off to sleep after a
    // random beat. Poking (or grabbing the ball) wakes it again.
    function scheduleSleep() {
      cancelSleepTimer();
      if (reduceMotion.matches) {
        return;
      }
      const delay = 7000 + Math.random() * 9000;
      model.sleepTimer = globalScope.setTimeout(function () {
        model.sleepTimer = 0;
        if (model.mode === states.ready && !model.drag) {
          fallAsleep();
        }
      }, delay);
    }

    function fallAsleep() {
      cancelSleepTimer();
      model.dog.face = 1;
      setMode(states.sleeping);
      bubble.textContent = "poke me";
      render();
    }

    function wake() {
      if (model.mode !== states.sleeping) {
        return;
      }
      cancelSleepTimer();
      model.dog.face = 1;
      bubble.textContent = "throw it!";
      dog.classList.add("is-happy");
      globalScope.setTimeout(function () {
        dog.classList.remove("is-happy");
      }, 900);
      becomeReady(globalScope.performance.now());
    }

    function getVisitorPoint() {
      const isSmallScreen = model.viewport.width <= 520;
      const safeY = Math.max(260, model.viewport.height * 0.72);
      const fallback = isSmallScreen
        ? {
          x: Math.min(model.viewport.width - 78, 348),
          y: Math.max(236, Math.min(342, model.viewport.height - 180, model.viewport.height * 0.45)),
        }
        : {
          x: model.viewport.width * 0.82,
          y: Math.min(model.viewport.height - 144, safeY),
        };
      const pointer = model.lastPointer || fallback;

      return clampPoint(
        {
          x: pointer.x - 28,
          y: Math.max(isSmallScreen ? 126 : 170, pointer.y + (isSmallScreen && !model.lastPointer ? 0 : 24)),
        },
        model.viewport,
        Math.min(68, model.viewport.width * 0.12)
      );
    }

    function dogHomePoint() {
      const point = getVisitorPoint();
      const lift = model.viewport.width <= 520 ? 172 : 150;

      return clampPoint(
        {
          x: point.x - 24,
          y: point.y - lift,
        },
        model.viewport,
        46
      );
    }

    function dogMouthPoint() {
      const faceOffset = model.dog.face === 1 ? 98 : 14;

      return {
        x: model.dog.x + faceOffset,
        y: model.dog.y + 44,
      };
    }

    function readyBonePoint() {
      const mouth = dogMouthPoint();

      return clampPoint(
        {
          x: mouth.x + (model.dog.face === 1 ? 10 : -12),
          y: mouth.y + 12,
        },
        model.viewport,
        34
      );
    }

    function updateDogVisual() {
      const moving = [states.intro, states.thrown, states.fetching, states.returning].includes(model.mode);

      dog.style.setProperty("--gb-dog-x", `${model.dog.x}px`);
      dog.style.setProperty("--gb-dog-y", `${model.dog.y}px`);
      dog.style.setProperty("--gb-dog-face", String(model.dog.face));
      layer.style.setProperty("--gb-intro-scale", String(model.dog.introScale || 1));
      dog.classList.toggle("is-running", moving && !reduceMotion.matches);
      dog.classList.toggle("is-carrying", model.dog.carrying);
      dog.classList.toggle("is-catching", model.mode === states.thrown);
      dog.classList.toggle("is-presenting", model.mode === states.presenting);
      dog.classList.toggle("is-sleeping", model.mode === states.sleeping);
      shadow.style.setProperty("--gb-shadow-x", `${model.dog.x + 48}px`);
      shadow.style.setProperty("--gb-shadow-y", `${model.dog.y + 94}px`);
    }

    function updateBoneVisual() {
      const isCarried = model.dog.carrying && ![states.held, states.thrown].includes(model.mode);
      const point = isCarried ? dogMouthPoint() : model.bone;

      bone.style.setProperty("--gb-bone-x", `${point.x}px`);
      bone.style.setProperty("--gb-bone-y", `${point.y}px`);
      bone.style.setProperty("--gb-bone-rotate", `${model.bone.rotation}deg`);
      bone.classList.toggle("is-ready", model.mode === states.ready);
      bone.classList.toggle("is-held", model.mode === states.held);
      bone.classList.toggle("is-carried", isCarried);
    }

    function updateBubbleVisual() {
      const bx = model.dog.x + (model.dog.face === 1 ? 6 : 30);
      const by = model.dog.y - 30;
      bubble.style.setProperty("--gb-bubble-x", `${bx}px`);
      bubble.style.setProperty("--gb-bubble-y", `${by}px`);

      const zx = model.dog.x + 54;
      const zy = model.dog.y - 4;
      zzz.style.setProperty("--gb-zzz-x", `${zx}px`);
      zzz.style.setProperty("--gb-zzz-y", `${zy}px`);
    }

    function updateArc(from, to, visible) {
      if (!visible) {
        arc.classList.remove("is-visible");
        return;
      }

      const dx = to.x - from.x;
      const dy = to.y - from.y;
      const length = Math.hypot(dx, dy);

      arc.style.setProperty("--gb-arc-x", `${from.x}px`);
      arc.style.setProperty("--gb-arc-y", `${from.y}px`);
      arc.style.setProperty("--gb-arc-width", `${length}px`);
      arc.style.setProperty("--gb-arc-angle", `${Math.atan2(dy, dx)}rad`);
      arc.classList.add("is-visible");
    }

    function render() {
      updateDogVisual();
      updateBoneVisual();
      updateBubbleVisual();
    }

    function schedule() {
      if (model.frame) {
        return;
      }

      model.frame = requestAnimationFrame(tick);
    }

    function becomeReady(timestamp) {
      model.dog.carrying = false;
      model.bone = { ...model.bone, ...readyBonePoint(), rotation: 0 };
      model.presentingUntil = timestamp + 1;
      setMode(states.ready);
      updateArc({ x: 0, y: 0 }, { x: 0, y: 0 }, false);
      render();
      scheduleSleep();
    }

    function finishPresentation(timestamp) {
      if (!model.presentingUntil) {
        model.presentingUntil = timestamp + 560;
        return false;
      }

      if (timestamp < model.presentingUntil) {
        return false;
      }

      becomeReady(timestamp);
      return true;
    }

    function tick(timestamp) {
      model.frame = 0;

      if (model.mode === states.intro) {
        const target = dogHomePoint();
        const previousX = model.dog.x;

        model.dog = { ...model.dog, ...rounded(moveToward(model.dog, target, 7.2)) };
        model.dog.face = model.dog.x >= previousX ? 1 : -1;

        const currentDist = Math.hypot(model.dog.x - target.x, model.dog.y - target.y);
        if (!model.introStartDist) {
          model.introStartDist = Math.max(currentDist, 1);
        }
        const introProgress = clamp(1 - currentDist / model.introStartDist, 0, 1);
        model.dog.introScale = 0.28 + 0.72 * easeOutCubic(introProgress);

        if (currentDist < 1) {
          model.dog.face = 1;
          model.dog.introScale = 1;
          model.presentingUntil = timestamp + 540;
          setMode(states.presenting);
        }

        render();
        schedule();
        return;
      }

      if (model.mode === states.presenting) {
        if (!finishPresentation(timestamp)) {
          render();
          schedule();
        }

        return;
      }

      if (model.mode === states.thrown && model.throw) {
        const progress = clamp((timestamp - model.throw.startedAt) / model.throw.duration, 0, 1);
        const eased = easeOutCubic(progress);
        const arcLift = Math.sin(progress * Math.PI) * Math.min(86, 34 + model.throw.distance * 0.14);
        const previousX = model.dog.x;

        model.bone.x = model.throw.from.x + (model.throw.to.x - model.throw.from.x) * eased;
        model.bone.y = model.throw.from.y + (model.throw.to.y - model.throw.from.y) * eased - arcLift;
        model.bone.rotation += 14;

        const chaseTarget = clampPoint(
          {
            x: model.bone.x - (model.dog.face === 1 ? 90 : 18),
            y: model.bone.y - 42,
          },
          model.viewport,
          42
        );
        model.dog = { ...model.dog, ...rounded(moveToward(model.dog, chaseTarget, 12.4)) };
        model.dog.face = model.dog.x >= previousX ? 1 : -1;

        if (progress > 0.32 && isCatchDistance(dogMouthPoint(), model.bone, 54)) {
          model.throw = null;
          model.dog.carrying = true;
          model.presentingUntil = 0;
          setMode(states.returning);
          render();
          schedule();
          return;
        }

        if (progress >= 1) {
          model.bone = { ...model.bone, ...model.throw.to, rotation: 0 };
          model.throw = null;
          model.dog = { ...model.dog, ...rounded(chaseTarget) };
          model.dog.carrying = true;
          setMode(states.returning);
        }

        render();
        schedule();
        return;
      }

      if (model.mode === states.fetching) {
        const target = clampPoint(
          {
            x: model.bone.x - 18,
            y: model.bone.y - 26,
          },
          model.viewport,
          42
        );
        const previousX = model.dog.x;

        model.dog = { ...model.dog, ...rounded(moveToward(model.dog, target, 8.1)) };
        model.dog.face = model.dog.x >= previousX ? 1 : -1;

        if (Math.hypot(model.dog.x - target.x, model.dog.y - target.y) < 3) {
          model.dog.carrying = true;
          setMode(states.returning);
        }

        render();
        schedule();
        return;
      }

      if (model.mode === states.returning) {
        const target = dogHomePoint();
        const previousX = model.dog.x;

        model.dog = { ...model.dog, ...rounded(moveToward(model.dog, target, 7.6)) };
        model.dog.face = model.dog.x >= previousX ? 1 : -1;

        if (Math.hypot(model.dog.x - target.x, model.dog.y - target.y) < 2) {
          model.dog.face = 1;
          model.presentingUntil = timestamp + 420;
          setMode(states.presenting);
        }

        render();
        schedule();
      }
    }

    function handlePointerMove(event) {
      const now = globalScope.performance.now();
      const current = { x: event.clientX, y: event.clientY, time: now };
      const previous = model.lastPointer;

      if (previous) {
        const elapsed = Math.max(16, now - previous.time);
        current.velocity = {
          x: ((current.x - previous.x) / elapsed) * 16,
          y: ((current.y - previous.y) / elapsed) * 16,
        };
      } else {
        current.velocity = { x: 0, y: 0 };
      }

      model.lastPointer = current;

      if (model.mode !== states.held || !model.drag || !isCurrentDragPointer(model.drag, event)) {
        return;
      }

      model.bone.x = event.clientX - model.drag.offsetX;
      model.bone.y = event.clientY - model.drag.offsetY;
      model.bone.rotation = clamp((model.bone.x - model.drag.start.x) * 0.18, -28, 28);

      const projected = computeThrowTarget(model.bone, current.velocity, model.viewport, 34);

      updateArc(model.drag.start, projected, true);
      render();
    }

    function releaseBone(event) {
      if (!shouldReleaseDrag(model.mode, model.drag, event)) {
        return;
      }

      event.preventDefault();
      if (
        event.pointerId !== undefined &&
        typeof bone.hasPointerCapture === "function" &&
        bone.hasPointerCapture(event.pointerId)
      ) {
        bone.releasePointerCapture(event.pointerId);
      }
      document.body.classList.remove("gb-dog-layer-is-dragging");

      const velocity = model.lastPointer?.velocity || { x: 0, y: 0 };
      const fallbackVelocity = Math.hypot(velocity.x, velocity.y) < 1 ? { x: 5.6, y: -4.4 } : velocity;
      const target = computeThrowTarget(model.bone, fallbackVelocity, model.viewport, 34);
      const distance = Math.hypot(target.x - model.bone.x, target.y - model.bone.y);

      model.throw = {
        distance,
        duration: clamp(360 + distance * 1.3, 430, 920),
        from: { x: model.bone.x, y: model.bone.y },
        startedAt: globalScope.performance.now(),
        to: target,
      };
      model.drag = null;
      model.dog.carrying = false;
      setMode(states.thrown);
      updateArc(model.throw.from, model.throw.to, false);
      schedule();
    }

    function grabBone(event) {
      if (model.mode === states.sleeping) {
        wake();
      }
      if (model.mode !== states.ready) {
        return;
      }

      cancelSleepTimer();
      event.preventDefault();
      const rect = bone.getBoundingClientRect();

      model.drag = {
        offsetX: event.clientX - rect.left,
        offsetY: event.clientY - rect.top,
        pointerId: event.pointerId,
        start: { x: model.bone.x, y: model.bone.y },
      };
      model.lastPointer = {
        time: globalScope.performance.now(),
        velocity: { x: 0, y: 0 },
        x: event.clientX,
        y: event.clientY,
      };
      bone.setPointerCapture(event.pointerId);
      document.body.classList.add("gb-dog-layer-is-dragging");
      setMode(states.held);
      render();
    }

    function pokeDog(event) {
      if (model.mode === states.sleeping) {
        event.preventDefault();
        wake();
        return;
      }
      if (model.mode === states.ready) {
        // A happy little wag and a fresh nap timer when the awake pup is poked.
        dog.classList.add("is-happy");
        globalScope.setTimeout(function () {
          dog.classList.remove("is-happy");
        }, 900);
        scheduleSleep();
      }
    }

    function handleResize() {
      model.viewport = viewport();
      model.dog = { ...model.dog, ...clampPoint(model.dog, model.viewport, 42) };
      model.bone = { ...model.bone, ...clampPoint(model.bone, model.viewport, 34) };
      render();
    }

    function initPositions() {
      const home = dogHomePoint();

      model.dog.x = model.viewport.width + 96;
      model.dog.y = Math.max(128, home.y - 60);
      model.dog.face = -1;
      model.dog.introScale = 0.28;
      model.introStartDist = null;
      model.bone = { ...model.bone, ...dogMouthPoint(), rotation: 0 };

      if (reduceMotion.matches) {
        model.dog.x = home.x;
        model.dog.y = home.y;
        model.dog.face = 1;
        model.dog.introScale = 1;
        becomeReady(globalScope.performance.now());
        layer.classList.add("prefers-reduced-motion");
        return;
      }

      setMode(states.intro);
      render();
      schedule();
    }

    globalScope.addEventListener("pointermove", handlePointerMove, { passive: true });
    globalScope.addEventListener("pointerup", releaseBone);
    globalScope.addEventListener("pointercancel", releaseBone);
    globalScope.addEventListener("resize", handleResize);
    bone.addEventListener("pointerdown", grabBone);
    bone.addEventListener("pointerup", releaseBone);
    bone.addEventListener("pointercancel", releaseBone);
    bone.addEventListener("lostpointercapture", releaseBone);
    dog.addEventListener("pointerdown", pokeDog);

    if (typeof reduceMotion.addEventListener === "function") {
      reduceMotion.addEventListener("change", () => {
        if (model.frame) {
          cancelAnimationFrame(model.frame);
          model.frame = 0;
        }
        cancelSleepTimer();

        layer.classList.toggle("prefers-reduced-motion", reduceMotion.matches);
        initPositions();
      });
    }

    initPositions();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootLayer, { once: true });
  } else {
    bootLayer();
  }
})(typeof window !== "undefined" ? window : globalThis);
