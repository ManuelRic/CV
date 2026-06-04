const { Engine, Render, Runner, Bodies, Composite, Mouse, MouseConstraint, Events, Body } = Matter;

function ensureSplatterCanvas() {
  let sc = document.getElementById("splatterCanvas");
  if (!sc) {
    sc = document.createElement("canvas");
    sc.id = "splatterCanvas";
    const skills = document.getElementById("skillsCanvas");
    if (skills && skills.parentNode) skills.parentNode.insertBefore(sc, skills);
    else document.body.appendChild(sc);
    sc.style.position = "absolute";
    sc.style.left = "0";
    sc.style.top = "0";
    sc.style.pointerEvents = "none";
  }
  return sc;
}

const splatterCanvas = ensureSplatterCanvas();
const canvas = document.getElementById("skillsCanvas");
const skillsSection = document.getElementById("skills") || canvas.parentElement || document.body;
let sctx = splatterCanvas.getContext("2d");
let render = null;
const footerHeight = 50;
const wallThickness = 200;
const desktopSkillRadius = 60;
const desktopTopPlayInset = 170;
const mobileTopPlayInset = 150;
const desktopBottomPlayInset = 85;
const mobileBottomPlayInset = 64;
let skillRadius = getResponsiveSkillRadius();

function getResponsiveSkillRadius() {
  return Math.max(42, Math.min(desktopSkillRadius, window.innerWidth * 0.13));
}

function getSkillsBounds() {
  const rect = skillsSection.getBoundingClientRect();
  return {
    width: Math.max(1, Math.floor(rect.width || window.innerWidth)),
    height: Math.max(1, Math.floor(rect.height || window.innerHeight))
  };
}

function getPageInsetRatio() {
  const value = getComputedStyle(document.documentElement).getPropertyValue("--page-x").trim();
  if (value.endsWith("%")) return parseFloat(value) / 100;
  if (value.endsWith("px")) return parseFloat(value) / getSkillsBounds().width;
  return 0.1;
}

function getSideCutoff() {
  return getSkillsBounds().width * getPageInsetRatio();
}

function getTopCutoff() {
  return window.innerWidth <= 768 ? mobileTopPlayInset : desktopTopPlayInset;
}

function getBottomCutoff() {
  return window.innerWidth <= 768 ? mobileBottomPlayInset : desktopBottomPlayInset;
}

function getPlayableBounds() {
  const { width, height } = getSkillsBounds();

  return {
    left: getSideCutoff(),
    right: width - getSideCutoff(),
    top: getTopCutoff() + wallThickness / 2,
    bottom: height - getBottomCutoff()
  };
}

function resizeCanvases() {
  const dpr = window.devicePixelRatio || 1;
  const { width: w, height: h } = getSkillsBounds();

  canvas.style.width = w + "px";
  canvas.style.height = h + "px";
  canvas.width = Math.floor(w * dpr);
  canvas.height = Math.floor(h * dpr);

  const ctx = canvas.getContext("2d");
  if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  splatterCanvas.style.width = w + "px";
  splatterCanvas.style.height = h + "px";
  splatterCanvas.width = Math.floor(w * dpr);
  splatterCanvas.height = Math.floor(h * dpr);

  sctx = splatterCanvas.getContext("2d");
  if (sctx) sctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  if (render) {
    render.options.width = w;
    render.options.height = h;
    render.bounds.max.x = w;
    render.bounds.max.y = h;
  }

}

resizeCanvases();

const engine = Engine.create();
const world = engine.world;
engine.world.gravity.y = 0.02;
engine.world.gravity.x = 0;

render = Render.create({
  canvas: canvas,
  engine: engine,
  options: {
    width: getSkillsBounds().width,
    height: getSkillsBounds().height,
    wireframes: false,
    background: "transparent"
  }
});
Render.run(render);
Runner.run(Runner.create(), engine);

const skillDescriptions = {
  "HTML": "Built semantic, accessible, and responsive web pages for modern web applications.",
  "CSS": "Designed layouts and styled interfaces using CSS, Flexbox, Grid, and animations.",
  "JavaScript": "Developed interactive web applications with integrated libraries and custom elements.",
  "Python": "Automated tasks and processed data using Python scripts and prototypes.",
  "C++": "Programmed hardware-connected projects using C++ on Arduino, ESP32, and Raspberry Pi platforms.",
  "C#": "Developed interactive applications and games using C# in Unity.",
  "Unity": "Created immersive 3D, 2D and VR games with interactive environments.",
  "3D Modeling": "Created 3D models using Onshape and OpenSCAD, and developed animations (as well as the assets animated) in Blender.",
  "Git": "Managed version control and collaborative development using Git.",
  "MySQL": "Designed databases and wrote queries for data-driven applications using MySQL.",
  "Graphic Design": "Produced unique visual designs (like the font on this page!) using programs like gimp, krita, procreate, aseprite and more.",
  "Java": "Built software applications and Android apps using Java and Android Studio."
};

const skills = Object.keys(skillDescriptions);

const skillImageMap = {
  "HTML": "img/skills/html_d.png",
  "CSS": "img/skills/css_d.png",
  "JavaScript": "img/skills/js_d.png",
  "Python": "img/skills/python_d.png",
  "C++": "img/skills/cpp_d.png",
  "C#": "img/skills/csharp_d.png",
  "Unity": "img/skills/unity_d.png",
  "3D Modeling": "img/skills/blender_d.png",
  "Git": "img/skills/git_d.png",
  "MySQL": "img/skills/mysql_d.png",
  "Graphic Design": "img/skills/gd_d.png",
  "Java": "img/skills/java_d.png"
};

const ballColors = [
  "#F16529", "#2965F1", "#F7DF1E", "#3472A6", "#00599C",
  "#61DBFB", "#8CC84B", "#56f52a", "#9B59B6", "#68A063",
  "#E67E22", "#E74C3C"
];

function createWalls() {
  const { width: w, height: sectionHeight } = getSkillsBounds();
  const h = sectionHeight - footerHeight;
  const bounds = getPlayableBounds();
  const opts = { isStatic: true, render: { visible: false } };
  return [
    Bodies.rectangle(w / 2, bounds.bottom + wallThickness / 2, bounds.right - bounds.left, wallThickness, opts), //bottom wall
    Bodies.rectangle(w / 2, getTopCutoff(), bounds.right - bounds.left, wallThickness, opts), //top wall
    Bodies.rectangle(bounds.left - wallThickness / 2, h / 2, wallThickness, h, opts), //left wall
    Bodies.rectangle(bounds.right + wallThickness / 2, h / 2, wallThickness, h, opts) //right wall
  ];
}
let walls = createWalls();
Composite.add(world, walls);

const loadedImages = {};
for (const [name, src] of Object.entries(skillImageMap)) {
  const img = new Image();
  img.src = src;
  loadedImages[name] = img;
}

const balls = skills.map((name, i) => {
  const bounds = getPlayableBounds();
  const xMin = bounds.left + skillRadius;
  const xMax = bounds.right - skillRadius;
  const yMin = bounds.top + skillRadius;
  const yMax = bounds.bottom - skillRadius;

  return Bodies.circle(
    xMin + Math.random() * (xMax - xMin),
    yMin + Math.random() * (yMax - yMin),
    skillRadius,
    {
      restitution: 0.7,
      frictionAir: 0.02,
      mass: 5,
      render: {
        fillStyle: ballColors[i % ballColors.length],
        strokeStyle: "#000",
        lineWidth: 0
      },
      label: name,
      plugin: { lastMotionTime: Date.now(), flipAngle: 0 }
    }
  );
});
Composite.add(world, balls);

function syncResponsiveBallSizes() {
  const nextRadius = getResponsiveSkillRadius();
  if (Math.abs(nextRadius - skillRadius) < 0.5) return;

  const scale = nextRadius / skillRadius;
  balls.forEach(body => Body.scale(body, scale, scale));
  skillRadius = nextRadius;
}

function keepBallsInsideBounds() {
  const bounds = getPlayableBounds();

  balls.forEach(body => {
    const r = body.circleRadius || skillRadius;
    const minX = bounds.left + r;
    const maxX = bounds.right - r;
    const minY = bounds.top + r;
    const maxY = bounds.bottom - r;

    Body.setPosition(body, {
      x: minX <= maxX ? clamp(body.position.x, minX, maxX) : (bounds.left + bounds.right) / 2,
      y: minY <= maxY ? clamp(body.position.y, minY, maxY) : (bounds.top + bounds.bottom) / 2
    });
  });
}

const mouse = Mouse.create(render.canvas);
canvas.removeEventListener("wheel", mouse.mousewheel);

const coarsePointerQuery = window.matchMedia("(pointer: coarse)");
const hoverPointerQuery = window.matchMedia("(hover: hover) and (pointer: fine)");

if (coarsePointerQuery.matches) {
  canvas.removeEventListener("touchstart", mouse.mousedown);
  canvas.removeEventListener("touchmove", mouse.mousemove);
  canvas.removeEventListener("touchend", mouse.mouseup);
}

const mouseConstraint = MouseConstraint.create(engine, {
  mouse: mouse,
  constraint: { stiffness: 0.15, damping: 0.15, render: { visible: false } }
});

let hoveredBall = null;

function checkMouseHover() {
  if (!hoverPointerQuery.matches) {
    if (hoveredBall) {
      animateFlip(hoveredBall, 0);
      hoveredBall = null;
    }
    requestAnimationFrame(checkMouseHover);
    return;
  }

  const mx = mouse.position.x;
  const my = mouse.position.y;

  let newHover = null;
  for (let b of balls) {
    const dx = b.position.x - mx;
    const dy = b.position.y - my;
    if (Math.sqrt(dx * dx + dy * dy) <= b.circleRadius) {
      newHover = b;
      break;
    }
  }

  // Mouse entered a new ball
  if (newHover && newHover !== hoveredBall) {
    if (hoveredBall) animateFlip(hoveredBall, 0); // Flip old one back
    animateFlip(newHover, Math.PI);               // Flip new one forward
    hoveredBall = newHover;
  }

  // Mouse left all balls
  if (!newHover && hoveredBall) {
    animateFlip(hoveredBall, 0);                  // Flip back
    hoveredBall = null;
  }

  requestAnimationFrame(checkMouseHover);
}

requestAnimationFrame(checkMouseHover);

Composite.add(world, mouseConstraint);
render.mouse = mouse;

Events.on(mouseConstraint, "mousemove", () => {
  if (mouseConstraint.body) {
    const body = mouseConstraint.body;
    const r = body.circleRadius;
    const bounds = getPlayableBounds();

    const minX = bounds.left + r;
    const maxX = bounds.right - r;
    const minY = bounds.top + r;
    const maxY = bounds.bottom - r;

    if (mouse.position.x < minX || mouse.position.x > maxX ||
        mouse.position.y < minY || mouse.position.y > maxY) {
      mouseConstraint.constraint.bodyB = null;
      return;
    }

    const dx = mouse.position.x - body.position.x;
    const dy = mouse.position.y - body.position.y;
    Body.applyForce(body, body.position, { x: dx * 0.00018, y: dy * 0.00018 });
    body.plugin.lastMotionTime = Date.now();
  }
});

function smoothSetAngle(body, targetAngle = 0, duration = 500) {
  const startAngle = body.angle;
  const startTime = performance.now();
  Body.setAngularVelocity(body, 0);

  function animate(time) {
    const elapsed = time - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easeOutCubic = t => 1 - Math.pow(1 - t, 3);
    const eased = easeOutCubic(progress);
    const newAngle = startAngle + (targetAngle - startAngle) * eased;
    Body.setAngle(body, newAngle);
    if (progress < 1) requestAnimationFrame(animate);
  }
  requestAnimationFrame(animate);
}

function animateFlip(body, targetAngle, duration = 600) {
  // Cancel previous animation if it exists
  if (body.plugin.flipAnimationFrame) cancelAnimationFrame(body.plugin.flipAnimationFrame);

  const startAngle = body.plugin.flipAngle || 0;
  const startTime = performance.now();

  function step(time) {
    const elapsed = time - startTime;
    const progress = Math.min(elapsed / duration, 1);

    // Smooth cubic ease in/out
    const easeInOut = t => t < 0.5
      ? 4 * t * t * t
      : 1 - Math.pow(-2 * t + 2, 3) / 2;

    body.plugin.flipAngle = startAngle + (targetAngle - startAngle) * easeInOut(progress);

    if (progress < 1) {
      body.plugin.flipAnimationFrame = requestAnimationFrame(step);
    } else {
      body.plugin.flipAngle = targetAngle; // Snap exactly to target
      body.plugin.flipAnimationFrame = null;
    }
  }

  body.plugin.flipAnimationFrame = requestAnimationFrame(step);
}


const stillTimeMap = new Map();

const splatters = new Map();

function getPaintBounds() {
  const bounds = getPlayableBounds();
  const outlineOffset = 2;
  return {
    left: bounds.left - outlineOffset,
    right: bounds.right + outlineOffset,
    top: bounds.top - outlineOffset,
    bottom: bounds.bottom + outlineOffset
  };
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function tracePaintDroplet(x, y, angle, distance, radius, bounds) {
  const dx = Math.cos(angle) * distance;
  const dy = Math.sin(angle) * distance;
  const targetX = x + dx;
  const targetY = y + dy;
  const minX = bounds.left + radius;
  const maxX = bounds.right - radius;
  const minY = bounds.top + radius;
  const maxY = bounds.bottom - radius;

  if (targetX >= minX && targetX <= maxX && targetY >= minY && targetY <= maxY) {
    return { x: targetX, y: targetY, wall: null };
  }

  let hitT = 1;
  let wall = null;

  if (dx < 0) {
    const t = (minX - x) / dx;
    if (t >= 0 && t < hitT) { hitT = t; wall = "left"; }
  } else if (dx > 0) {
    const t = (maxX - x) / dx;
    if (t >= 0 && t < hitT) { hitT = t; wall = "right"; }
  }

  if (dy < 0) {
    const t = (minY - y) / dy;
    if (t >= 0 && t < hitT) { hitT = t; wall = "top"; }
  } else if (dy > 0) {
    const t = (maxY - y) / dy;
    if (t >= 0 && t < hitT) { hitT = t; wall = "bottom"; }
  }

  const overflow = distance * Math.max(0, 1 - hitT);
  let hitX = x + dx * hitT;
  let hitY = y + dy * hitT;

  if (wall === "left" || wall === "right") {
    hitY = clamp(hitY + Math.sin(angle) * overflow * 0.28, minY, maxY);
    hitX = wall === "left" ? minX : maxX;
  } else if (wall === "top" || wall === "bottom") {
    hitX = clamp(hitX + Math.cos(angle) * overflow * 0.28, minX, maxX);
    hitY = wall === "top" ? minY : maxY;
  } else {
    hitX = clamp(targetX, minX, maxX);
    hitY = clamp(targetY, minY, maxY);
  }

  return { x: hitX, y: hitY, wall };
}

function drawEllipse(ctx, cx, cy, rx, ry, angle, color, alpha = 0.95) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.beginPath();
  ctx.ellipse(cx, cy, Math.max(1, rx), Math.max(1, ry), angle, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
}

function drawTaperedStreak(ctx, x1, y1, x2, y2, width, color, alpha = 0.9) {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const nx = Math.cos(angle + Math.PI / 2);
  const ny = Math.sin(angle + Math.PI / 2);

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.beginPath();
  ctx.moveTo(x1 + nx * width, y1 + ny * width);
  ctx.lineTo(x1 - nx * width, y1 - ny * width);
  ctx.lineTo(x2, y2);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
}

function drawWallSplat(ctx, droplet, color, bounds) {
  const verticalWall = droplet.wall === "left" || droplet.wall === "right";
  const normalRadius = droplet.r * (0.35 + Math.random() * 0.25);
  const desiredLong = droplet.r * (2.4 + Math.random() * 2.2);
  let cx = droplet.x;
  let cy = droplet.y;
  let rx = normalRadius;
  let ry = desiredLong;

  if (verticalWall) {
    cx = droplet.wall === "left" ? bounds.left + normalRadius : bounds.right - normalRadius;
    cy = clamp(cy, bounds.top + normalRadius, bounds.bottom - normalRadius);
    ry = Math.min(desiredLong, Math.max(1, Math.min(cy - bounds.top, bounds.bottom - cy)));
  } else {
    cy = droplet.wall === "top" ? bounds.top + normalRadius : bounds.bottom - normalRadius;
    cx = clamp(cx, bounds.left + normalRadius, bounds.right - normalRadius);
    rx = Math.min(desiredLong, Math.max(1, Math.min(cx - bounds.left, bounds.right - cx)));
    ry = normalRadius;
  }

  drawEllipse(ctx, cx, cy, rx, ry, 0, color);

  for (let i = 0; i < 4; i++) {
    const dotR = droplet.r * (0.22 + Math.random() * 0.45);
    const tangentJitter = (Math.random() - 0.5) * desiredLong * 1.4;
    const normalDepth = dotR + Math.random() * droplet.r * 1.6;
    const px = verticalWall
      ? (droplet.wall === "left" ? bounds.left + normalDepth : bounds.right - normalDepth)
      : clamp(cx + tangentJitter, bounds.left + dotR, bounds.right - dotR);
    const py = verticalWall
      ? clamp(cy + tangentJitter, bounds.top + dotR, bounds.bottom - dotR)
      : (droplet.wall === "top" ? bounds.top + normalDepth : bounds.bottom - normalDepth);
    drawEllipse(ctx, px, py, dotR, dotR, 0, color, 0.9);
  }
}

function drawSplatterRay(ctx, originX, originY, ray, color, bounds) {
  const end = tracePaintDroplet(originX, originY, ray.angle, ray.length, ray.tipRadius, bounds);
  const startDist = ray.start;
  const startX = originX + Math.cos(ray.angle) * startDist;
  const startY = originY + Math.sin(ray.angle) * startDist;
  const hitWall = Boolean(end.wall);
  const endX = end.x;
  const endY = end.y;

  if (!hitWall) {
    if (ray.kind === "needle") {
      drawTaperedStreak(ctx, startX, startY, endX, endY, ray.width, color, 0.88);
    } else {
      const midX = (startX + endX) / 2;
      const midY = (startY + endY) / 2;
      const length = Math.hypot(endX - startX, endY - startY);
      drawEllipse(ctx, midX, midY, length / 2, ray.width, ray.angle, color, 0.88);
    }

    if (Math.random() < 0.72) {
      drawInteriorSplat(ctx, { x: endX, y: endY, r: ray.tipRadius }, color, bounds);
    }
    return;
  }

  const safeEndX = clamp(endX, bounds.left + ray.tipRadius, bounds.right - ray.tipRadius);
  const safeEndY = clamp(endY, bounds.top + ray.tipRadius, bounds.bottom - ray.tipRadius);
  drawTaperedStreak(ctx, startX, startY, safeEndX, safeEndY, Math.max(1, ray.width * 0.75), color, 0.78);
  drawWallSplat(ctx, { x: safeEndX, y: safeEndY, r: ray.tipRadius * 1.15, wall: end.wall }, color, bounds);
}

function drawInteriorSplat(ctx, droplet, color, bounds) {
  const r = droplet.r;
  const x = clamp(droplet.x, bounds.left + r, bounds.right - r);
  const y = clamp(droplet.y, bounds.top + r, bounds.bottom - r);
  const elongated = Math.random() < 0.28;
  const angle = droplet.angle || Math.random() * Math.PI * 2;

  drawEllipse(
    ctx,
    x,
    y,
    r * (elongated ? 1.4 + Math.random() * 1.5 : 0.85 + Math.random() * 0.55),
    r * (elongated ? 0.35 + Math.random() * 0.35 : 0.85 + Math.random() * 0.55),
    angle,
    color
  );

  const satellites = Math.random() < 0.35 ? 2 : 1;
  for (let i = 0; i < satellites; i++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = r * (0.8 + Math.random() * 1.8);
    const sr = r * (0.18 + Math.random() * 0.35);
    drawEllipse(
      ctx,
      clamp(x + Math.cos(angle) * dist, bounds.left + sr, bounds.right - sr),
      clamp(y + Math.sin(angle) * dist, bounds.top + sr, bounds.bottom - sr),
      sr,
      sr,
      0,
      color,
      0.85
    );
  }
}

function drawCoreSplat(ctx, x, y, radius, color, bounds) {
  const coreRadius = radius * 0.55;
  drawEllipse(ctx, x, y, coreRadius, coreRadius, 0, color);

  const rays = 26 + Math.floor(Math.random() * 14);
  for (let i = 0; i < rays; i++) {
    const angle = Math.random() * Math.PI * 2;
    const longRay = Math.random() < 0.35;
    drawSplatterRay(ctx, x, y, {
      angle,
      start: coreRadius * (0.55 + Math.random() * 0.45),
      length: radius * (0.9 + Math.random() * (longRay ? 3.4 : 1.8)),
      width: radius * (longRay ? 0.018 + Math.random() * 0.035 : 0.035 + Math.random() * 0.07),
      tipRadius: radius * (longRay ? 0.035 + Math.random() * 0.08 : 0.055 + Math.random() * 0.13),
      kind: longRay ? "needle" : "smear"
    }, color, bounds);
  }

  for (let i = 0; i < 18; i++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = coreRadius * (0.35 + Math.random() * 1.5);
    const r = radius * (0.035 + Math.random() * 0.12);
    drawInteriorSplat(ctx, {
      x: x + Math.cos(angle) * dist,
      y: y + Math.sin(angle) * dist,
      r
    }, color, bounds);
  }
}

function drawSplatterOnCanvas(body) {
  if (splatters.has(body)) return;

  const x = body.position.x;
  const y = body.position.y;
  const paintBounds = getPaintBounds();
  const splatterColors = {
    "HTML": "#F16529", "CSS": "#2965F1", "JavaScript": "#F7DF1E", "Python": "#3472A6",
    "C++": "#00599C", "C#": "#61DBFB", "Unity": "#8CC84B", "3D Modeling": "#56f52a",
    "Git": "#9B59B6", "MySQL": "#68A063", "Graphic Design": "#E67E22", "Java": "#E74C3C"
  };
  const color = splatterColors[body.label] || "#000";

  const droplets = [];
  const numDroplets = 24 + Math.floor(Math.random() * 18);
  const maxDist = skillRadius * 5;

  for (let i = 0; i < numDroplets; i++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = Math.pow(Math.random(), 0.6) * maxDist;
    const r = Math.random() * 8 + 3;
    const delay = Math.random() * 50;
    const target = tracePaintDroplet(
      x,
      y,
      angle,
      dist,
      r,
      paintBounds
    );

    droplets.push({
      x: target.x,
      y: target.y,
      r,
      angle,
      delay,
      wall: target.wall
    });
  }

  const start = performance.now();
  const duration = 170;
  let coreDrawn = false;

  function animate(time) {
    const progress = Math.min((time - start) / duration, 1);
    sctx.globalCompositeOperation = "source-over";

    if (!coreDrawn) {
      drawCoreSplat(sctx, x, y, body.circleRadius, color, paintBounds);
      coreDrawn = true;
    }

    for (let d of droplets) {
      if (d.drawn || time - start < d.delay) continue;
      if (d.wall) drawWallSplat(sctx, d, color, paintBounds);
      else drawInteriorSplat(sctx, d, color, paintBounds);
      d.drawn = true;
    }

    if (progress < 1) requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);
  splatters.set(body, true);
}

const popup = document.getElementById("skillPopup");
let activePopupBall = null;
let pointerDownPos = null;
let pointerMoved = false;
let activePointerId = null;
let touchDragBall = null;
let lastTouchPoint = null;
let lastTouchTime = 0;
let touchDragVelocity = { x: 0, y: 0 };
let popupTimer = null;

function resetPointerState() {
  pointerDownPos = null;
  pointerMoved = false;
  activePointerId = null;
  touchDragBall = null;
  lastTouchPoint = null;
  lastTouchTime = 0;
  touchDragVelocity = { x: 0, y: 0 };
}

function getCanvasPointFromEvent(e) {
  const rect = canvas.getBoundingClientRect();
  const bounds = getSkillsBounds();
  const scaleX = bounds.width / Math.max(1, rect.width);
  const scaleY = bounds.height / Math.max(1, rect.height);

  return {
    x: (e.clientX - rect.left) * scaleX,
    y: (e.clientY - rect.top) * scaleY
  };
}

function findBallAt(point) {
  for (let b of balls) {
    const dx = b.position.x - point.x;
    const dy = b.position.y - point.y;
    if (Math.sqrt(dx * dx + dy * dy) <= b.circleRadius) return b;
  }

  return null;
}

function handleSkillClick(clickedBall) {
  if (!clickedBall) {
    popup.style.display = "none";
    activePopupBall = null;
    return;
  }

  activePopupBall = clickedBall;

  clickedBall.render.lineWidth = 0;

  if (!splatters.has(clickedBall)) {
    Body.scale(clickedBall, 0.9, 0.9);
    clickedBall.circleRadius *= 0.9;

    Body.setStatic(clickedBall, true);
    drawSplatterOnCanvas(clickedBall);
    if (mouseConstraint.body === clickedBall) mouseConstraint.constraint.bodyB = null;
  }

  smoothSetAngle(clickedBall, 0, 500);

  popup.innerHTML = `<strong>${clickedBall.label}</strong><br>${skillDescriptions[clickedBall.label] || "No description available."}`;
  popup.style.display = "block";

  if (popupTimer) clearTimeout(popupTimer);
  popupTimer = setTimeout(() => {
    popup.style.display = "none";
    activePopupBall = null;
    popupTimer = null;
  }, 5500);
}

canvas.addEventListener("pointerdown", e => {
  pointerDownPos = { x: e.clientX, y: e.clientY, type: e.pointerType };
  pointerMoved = false;
  activePointerId = e.pointerId;

  if (e.pointerType === "touch") {
    const point = getCanvasPointFromEvent(e);
    const ball = findBallAt(point);
    touchDragBall = ball && !splatters.has(ball) ? ball : null;
    lastTouchPoint = point;
    lastTouchTime = performance.now();
    touchDragVelocity = { x: 0, y: 0 };
  }
});

canvas.addEventListener("pointermove", e => {
  if (!pointerDownPos || e.pointerId !== activePointerId) return;

  const dx = e.clientX - pointerDownPos.x;
  const dy = e.clientY - pointerDownPos.y;
  const moveLimit = pointerDownPos.type === "touch" ? 14 : 6;
  if (Math.sqrt(dx * dx + dy * dy) > moveLimit) pointerMoved = true;

  if (pointerDownPos.type === "touch" && pointerMoved && touchDragBall && lastTouchPoint) {
    const point = getCanvasPointFromEvent(e);
    const now = performance.now();
    const dt = Math.max(16, now - lastTouchTime);
    const bounds = getPlayableBounds();
    const r = touchDragBall.circleRadius || skillRadius;
    const nextPoint = {
      x: clamp(point.x, bounds.left + r, bounds.right - r),
      y: clamp(point.y, bounds.top + r, bounds.bottom - r)
    };

    touchDragVelocity = {
      x: ((nextPoint.x - lastTouchPoint.x) / dt) * 16,
      y: ((nextPoint.y - lastTouchPoint.y) / dt) * 16
    };

    Body.setPosition(touchDragBall, nextPoint);
    Body.setVelocity(touchDragBall, touchDragVelocity);
    Body.setAngularVelocity(touchDragBall, touchDragVelocity.x * 0.01);
    touchDragBall.plugin.lastMotionTime = Date.now();
    lastTouchPoint = nextPoint;
    lastTouchTime = now;
  }
});

canvas.addEventListener("pointerup", e => {
  if (!pointerDownPos || e.pointerId !== activePointerId) return;

  if (pointerMoved) {
    if (touchDragBall) Body.setVelocity(touchDragBall, touchDragVelocity);
    resetPointerState();
    return;
  }

  const clickedBall = findBallAt(getCanvasPointFromEvent(e));
  handleSkillClick(clickedBall);
  resetPointerState();
});

canvas.addEventListener("pointercancel", resetPointerState);

(function updatePopupPosition(){
  requestAnimationFrame(updatePopupPosition);
  if (activePopupBall){
    const bounds = getSkillsBounds();
    const popupWidth = popup.offsetWidth || 300;
    const popupHeight = popup.offsetHeight || 120;
    const left = clamp(activePopupBall.position.x + 12, 8, bounds.width - popupWidth - 8);
    const top = clamp(activePopupBall.position.y + 12, 8, bounds.height - popupHeight - 8);
    popup.style.left = left + "px";
    popup.style.top = top + "px";
  }
})();

window.addEventListener("resize", ()=> {
  resizeCanvases();
  syncResponsiveBallSizes();
  Composite.remove(world, walls);
  walls = createWalls();
  Composite.add(world, walls);
  keepBallsInsideBounds();
});

setInterval(()=> {
  const { width: w, height: h } = getSkillsBounds();
  Composite.allBodies(world).forEach(body=>{
    if(!body.position) return;
    if(body.position.y>h+1000||body.position.x<-1000||body.position.x>w+1000){
      Body.setPosition(body,{x:Math.random()*w,y:Math.random()*(h/2)});
      Body.setVelocity(body,{x:0,y:0});
    }
  });
},3000);

canvas.addEventListener("mousemove", e => {
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;

  balls.forEach(b => {
    const dx = b.position.x - mx;
    const dy = b.position.y - my;
    const dist = Math.sqrt(dx * dx + dy * dy);
  });
});

(function drawLabels(){
  const ctx = render.context;
  requestAnimationFrame(drawLabels);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.font="bold 18px MyFont, sans-serif";
  ctx.fillStyle="#fff";
  ctx.textAlign="center";
  ctx.textBaseline="middle";

  balls.forEach(body=>{
    const img = loadedImages[body.label];
    const flip = body.plugin.flipAngle;
    const flipped = flip > Math.PI / 2;
    const scaleX = Math.cos(flip);

    ctx.save();
    ctx.translate(body.position.x, body.position.y);
    ctx.rotate(body.angle);

    ctx.beginPath();
    ctx.arc(0, 0, body.circleRadius, 0, Math.PI * 2);
    ctx.fillStyle = body.render.fillStyle;
    ctx.fill();

    ctx.scale(scaleX, 1);

    if (!flipped && img) {
      const size = body.circleRadius * 1.6;
      const aspect = (img.naturalWidth || img.width) / (img.naturalHeight || img.height || 1);
      let drawW, drawH;
      if (aspect > 1) {
        drawW = size;
        drawH = size / aspect;
      } else {
        drawH = size;
        drawW = size * aspect;
      }
      ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
    } else if (flipped) {
      ctx.save();
      if (scaleX < 0) ctx.scale(-1, 1);
      ctx.fillStyle = "#fff";
      ctx.font = "bold 20px MyFont, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(body.label, 0, 0);
      ctx.restore();
    }

    ctx.restore();

    if (body.render.lineWidth > 0) {
      ctx.beginPath();
      ctx.arc(body.position.x, body.position.y, body.circleRadius, 0, Math.PI*2);
      ctx.strokeStyle = body.render.strokeStyle || "#000";
      ctx.lineWidth = body.render.lineWidth;
      ctx.stroke();
    }
  });
})();

Events.on(engine, "afterUpdate", () => {
  const now = performance.now();
  balls.forEach(body => {
    if (splatters.has(body)) return;
    const speed = Math.sqrt(body.velocity.x**2 + body.velocity.y**2);
    const angularSpeed = Math.abs(body.angularVelocity);

    if (speed < 0.2 && angularSpeed < 0.2) {
      if (!stillTimeMap.has(body)) stillTimeMap.set(body, now);
      else if (now - stillTimeMap.get(body) > 1000) {
        smoothSetAngle(body, 0, 500);
        stillTimeMap.delete(body);
      }
    } else stillTimeMap.delete(body);
  });
});
