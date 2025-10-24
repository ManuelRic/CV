const { Engine, Render, Runner, Bodies, Composite, Mouse, MouseConstraint, Events, Body } = Matter;

// ----------------------
// Utility: ensure splatter canvas exists
// ----------------------
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
    sc.style.zIndex = "0";
  }
  return sc;
}

const splatterCanvas = ensureSplatterCanvas();
const canvas = document.getElementById("skillsCanvas");
let sctx = splatterCanvas.getContext("2d");

// ----------------------
// Resize canvases with DPR support
// ----------------------
function resizeCanvases() {
  const dpr = window.devicePixelRatio || 1;
  const w = Math.max(1, Math.floor(window.innerWidth));
  const h = Math.max(1, Math.floor(window.innerHeight));

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

  // Re-fetch context because width/height reset it
  sctx = splatterCanvas.getContext("2d");
  if (sctx) sctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

resizeCanvases();
window.addEventListener("resize", resizeCanvases);

// ----------------------
// Matter setup
// ----------------------
const engine = Engine.create();
const world = engine.world;

// Adjust gravity as needed
engine.world.gravity.y = 0.02; // no vertical gravity
engine.world.gravity.x = 0; // no horizontal gravity

const render = Render.create({
  canvas: canvas,
  engine: engine,
  options: {
    width: window.innerWidth,
    height: window.innerHeight,
    wireframes: false,
    background: "transparent"
  }
});
Render.run(render);
Runner.run(Runner.create(), engine);

// ======================
// Constants & data
// ======================
const footerHeight = 50;
const wallThickness = 200;
const skillRadius = 60;
const topCutoff = window.innerHeight * 0.09;
const sideCutoff = window.innerWidth * 0.10;

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
  "Graphic Design": "Produced visual designs, branding assets, and UI elements for digital projects (Like the font and other elements on this page!).",
  "Java": "Built software applications and Android apps using Java and Android Studio.",
};

const skills = Object.keys(skillDescriptions);

const ballColors = [
  "#F16529", "#2965F1", "#F7DF1E", "#3472A6", "#00599C",
  "#61DBFB", "#8CC84B", "#56f52a", "#9B59B6", "#68A063",
  "#E67E22", "#E74C3C"
];

// ----------------------
// invisible walls
// ----------------------
function createWalls() {
  const w = window.innerWidth;
  const h = window.innerHeight - footerHeight;
  const opts = { isStatic: true, render: { visible: false } };

  return [
    Bodies.rectangle(w / 2, h + wallThickness / 6, w - 2 * sideCutoff, wallThickness, opts),
    Bodies.rectangle(w / 2, topCutoff, w - 2 * sideCutoff, wallThickness, opts),
    Bodies.rectangle(-wallThickness / 2 + sideCutoff, h / 2, wallThickness, h, opts),
    Bodies.rectangle(w + wallThickness / 2 - sideCutoff, h / 2, wallThickness, h, opts)
  ];
}
let walls = createWalls();
Composite.add(world, walls);

// ----------------------
// create balls with black outline
// ----------------------
const balls = skills.map((name, i) => {
  const xMin = sideCutoff + skillRadius;
  const xMax = window.innerWidth - sideCutoff - skillRadius;
  const yMin = topCutoff + skillRadius;
  const yMax = window.innerHeight - footerHeight - skillRadius;

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
        strokeStyle: "#000", // black outline
        lineWidth: 4
      },
      label: name,
      plugin: { lastMotionTime: Date.now() }
    }
  );
});
Composite.add(world, balls);

// ----------------------
// mouse/drag control
// ----------------------
const mouse = Mouse.create(render.canvas);
const mouseConstraint = MouseConstraint.create(engine, {
  mouse: mouse,
  constraint: { stiffness: 0.15, damping: 0.15, render: { visible: false } }
});
Composite.add(world, mouseConstraint);
render.mouse = mouse;

Events.on(mouseConstraint, "mousemove", () => {
  if (mouseConstraint.body) {
    const body = mouseConstraint.body;
    const r = body.circleRadius;

    const minX = sideCutoff + r;
    const maxX = window.innerWidth - sideCutoff - r;
    const minY = topCutoff + r;
    const maxY = window.innerHeight - footerHeight - r;

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

// ----------------------
// Smooth straighten function
// ----------------------
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

// ----------------------
// Straighten text for stationary balls not splattered
// ----------------------
const stillTimeMap = new Map();

// ----------------------
// Splatter
// ----------------------
const splatters = new Map();
function drawSplatterOnCanvas(body) {
  if (splatters.has(body)) return;

  const x = body.position.x;
  const y = body.position.y;
  const splatterColors = {
    "HTML": "#F16529", "CSS": "#2965F1", "JavaScript": "#F7DF1E", "Python": "#3472A6",
    "C++": "#00599C", "C#": "#61DBFB", "Unity": "#8CC84B", "3D Modeling": "#56f52a",
    "Git": "#9B59B6", "MySQL": "#68A063", "Graphic Design": "#E67E22", "Java": "#E74C3C"
  };
  const color = splatterColors[body.label] || "#000";

  const droplets = [];
  const numDroplets = 20 + Math.floor(Math.random() * 20);
  const maxDist = skillRadius * 1.8;
  const stretchedAreas = [];

  for (let i = 0; i < numDroplets; i++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = Math.pow(Math.random(), 0.6) * maxDist;
    const finalDx = Math.cos(angle) * dist;
    const finalDy = Math.sin(angle) * dist;
    const r = Math.random() * 8 + 3;
    const delay = Math.random() * 50;
    droplets.push({ finalDx, finalDy, r, angle, delay });
  }

  const start = performance.now();
  const duration = 80;
  const easeOut = t => 1 - Math.pow(1 - t, 2.5);

  function isInsideStretched(dx, dy, radius) {
    for (let area of stretchedAreas) {
      const nx = x + dx;
      const ny = y + dy;
      const cos = Math.cos(-area.angle);
      const sin = Math.sin(-area.angle);
      const tx = cos * (nx - area.ex) - sin * (ny - area.ey);
      const ty = sin * (nx - area.ex) + cos * (ny - area.ey);
      if ((tx*tx)/((area.rx + radius)*(area.rx + radius)) + 
          (ty*ty)/((area.ry + radius)*(area.ry + radius)) <= 1) {
        return true;
      }
    }
    return false;
  }

  function animate(time) {
    const progress = Math.min((time - start) / duration, 1);
    const eased = easeOut(progress);

    sctx.globalCompositeOperation = "source-over";
    sctx.globalAlpha = 0.95;

    for (let d of droplets) {
      if (time - start < d.delay) continue;
      const localP = Math.max(0, Math.min(1, (time - start - d.delay) / duration));
      const p = easeOut(localP);

      const dx = d.finalDx * p;
      const dy = d.finalDy * p;

      if (Math.random() < 0.25) {
        const ex = x + dx * 0.6;
        const ey = y + dy * 0.6;
        const rx = d.r * 7;
        const ry = d.r * 0.5;
        sctx.beginPath();
        sctx.ellipse(ex, ey, rx, ry, d.angle, 0, Math.PI * 2);
        sctx.fillStyle = color;
        sctx.fill();
        stretchedAreas.push({ ex, ey, rx, ry, angle: d.angle });
      } else {
        if (isInsideStretched(dx, dy, d.r)) continue;
        sctx.beginPath();
        sctx.fillStyle = color;
        sctx.arc(x + dx, y + dy, d.r * (0.6 + 0.4 * p), 0, Math.PI * 2);
        sctx.fill();
      }
    }

    sctx.beginPath();
    sctx.fillStyle = color;
    sctx.arc(x, y, skillRadius * 0.6 * eased, 0, Math.PI * 2);
    sctx.fill();

    if (progress < 1) requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);
  splatters.set(body, true);
}

// ----------------------
// Popup + click logic with outline removal and text straighten
// ----------------------
const popup = document.getElementById("skillPopup");
let activePopupBall = null;
let mouseDownPos = null;
let mouseMoved = false;
let popupTimer = null;

canvas.addEventListener("mousedown", e => {
  mouseDownPos = { x: e.clientX, y: e.clientY };
  mouseMoved = false;
});

canvas.addEventListener("mousemove", e => {
  if (!mouseDownPos) return;
  const dx = e.clientX - mouseDownPos.x;
  const dy = e.clientY - mouseDownPos.y;
  if (Math.sqrt(dx*dx + dy*dy) > 6) mouseMoved = true;
});

canvas.addEventListener("mouseup", e => {
  const rect = canvas.getBoundingClientRect();
  const mousePos = { x: e.clientX - rect.left, y: e.clientY - rect.top };

  if (mouseMoved) { mouseDownPos = null; mouseMoved = false; return; }

  const bodies = Composite.allBodies(world);
  let clickedBall = null;
  for (let b of bodies) {
    if (!b.circleRadius) continue;
    const dx = b.position.x - mousePos.x;
    const dy = b.position.y - mousePos.y;
    if (Math.sqrt(dx*dx + dy*dy) <= b.circleRadius) { clickedBall = b; break; }
  }

  if (!clickedBall) { 
    popup.style.display = "none"; 
    activePopupBall = null; 
    mouseDownPos = null; 
    mouseMoved = false; 
    return; 
  }

  activePopupBall = clickedBall;

  // remove outline on click
  clickedBall.render.lineWidth = 0;

  if (!splatters.has(clickedBall)) {
    Body.setStatic(clickedBall, true);
    drawSplatterOnCanvas(clickedBall);
    if (mouseConstraint.body === clickedBall) mouseConstraint.constraint.bodyB = null;
  }

  // straighten text immediately on click
  smoothSetAngle(clickedBall, 0, 500);

  // show popup
  popup.innerHTML = `<strong>${clickedBall.label}</strong><br>${skillDescriptions[clickedBall.label] || "No description available."}`;
  popup.style.display = "block";

  if (popupTimer) clearTimeout(popupTimer);
  popupTimer = setTimeout(() => {
    popup.style.display = "none";
    activePopupBall = null;
    popupTimer = null;
  }, 5500);

  mouseDownPos = null;
  mouseMoved = false;
});

// Update popup position each frame
(function updatePopupPosition(){
  requestAnimationFrame(updatePopupPosition);
  if (activePopupBall){
    const rect=render.canvas.getBoundingClientRect();
    popup.style.left=(activePopupBall.position.x + rect.left + 10) + "px";
    popup.style.top=(activePopupBall.position.y + rect.top + 10) + "px";
  }
})();

// ----------------------
// Handle resize (walls)
// ----------------------
window.addEventListener("resize", ()=> {
  resizeCanvases();
  Composite.remove(world, walls);
  walls = createWalls();
  Composite.add(world, walls);
});

// ----------------------
// Keep bodies on screen (fallback)
// ----------------------
setInterval(()=> {
  const w=window.innerWidth;
  const h=window.innerHeight;
  Composite.allBodies(world).forEach(body=>{
    if(!body.position) return;
    if(body.position.y>h+1000||body.position.x<-1000||body.position.x>w+1000){
      Body.setPosition(body,{x:Math.random()*w,y:Math.random()*(h/2)});
      Body.setVelocity(body,{x:0,y:0});
    }
  });
},3000);

// ----------------------
// Draw labels and ball outlines
// ----------------------
(function drawLabels(){
  const ctx=render.context;
  requestAnimationFrame(drawLabels);
  ctx.font="bold 18px MyFont, sans-serif";
  ctx.fillStyle="#fff";
  ctx.textAlign="center";
  ctx.textBaseline="middle";
  balls.forEach(body=>{
    ctx.save();
    ctx.translate(body.position.x, body.position.y);
    ctx.rotate(body.angle);
    ctx.fillText(body.label,0,0);
    ctx.restore();

    // draw outline if lineWidth > 0
    if(body.render.lineWidth > 0){
      ctx.beginPath();
      ctx.arc(body.position.x, body.position.y, body.circleRadius, 0, Math.PI*2);
      ctx.strokeStyle = body.render.strokeStyle || "#000";
      ctx.lineWidth = body.render.lineWidth;
      ctx.stroke();
    }
  });
})();

// ----------------------
// Straighten stationary balls
// ----------------------
Events.on(engine, "afterUpdate", () => {
  const now = performance.now();
  balls.forEach(body => {
    if (splatters.has(body)) return; // skip splattered
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
