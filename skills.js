// ======================
// Matter.js setup
// ======================
const { Engine, Render, Runner, Bodies, Composite, Mouse, MouseConstraint, Events, Body } = Matter;

// Create engine and world
const engine = Engine.create();
const world = engine.world;

// Get canvas
const canvas = document.getElementById("skillsCanvas");

// Create renderer
const render = Render.create({
  canvas: canvas,
  engine: engine,
  options: {
    width: window.innerWidth,
    height: window.innerHeight,
    wireframes: false,
    background: "transparent",
  },
});

Render.run(render);
Runner.run(Runner.create(), engine);

// ======================
// Constants and helpers
// ======================
const footerHeight = 50;
const wallThickness = 200;
const skillRadius = 60;
const topCutoff = window.innerHeight * 0.09; // top 9% blocked off
const sideCutoff = window.innerWidth * 0.10; // side 10% blocked off

const skills = [
  { 
    name: "HTML", 
    stars: "<span class='f_stars'>★ ★ ★ ★ ★</span><span class='e_stars'></span>" 
  },
  { 
    name: "CSS", 
    stars: "<span class='f_stars'>★ ★ ★ ★ ★</span><span class='e_stars'></span>" 
  },
  { 
    name: "JavaScript", 
    stars: "<span class='f_stars'>★ ★ ★ ★ ★</span><span class='e_stars'></span>" 
  },
  { 
    name: "Python", 
    stars: "<span class='f_stars'>★ ★ ★ ★ ★</span><span class='e_stars'></span>" 
  },
  { 
    name: "C++", 
    stars: "<span class='f_stars'>★ ★ ★</span><span class='e_stars'> ☆ ☆</span>" 
  },
  { 
    name: "C#", 
    stars: "<span class='f_stars'>★ ★ ★ ★</span><span class='e_stars'> ☆</span>" 
  },
  { 
    name: "Unity", 
    stars: "<span class='f_stars'>★ ★ ★ ★</span><span class='e_stars'> ☆</span>" 
  },
  { 
    name: "3D Modeling", 
    stars: "<span class='f_stars'>★ ★ ★</span><span class='e_stars'> ☆ ☆</span>" 
  },
  { 
    name: "Git", 
    stars: "<span class='f_stars'>★ ★ ★ ★</span><span class='e_stars'> ☆</span>" 
  },
  { 
    name: "MySQL", 
    stars: "<span class='f_stars'>★ ★ ★</span><span class='e_stars'> ☆ ☆</span>" 
  },
  { 
    name: "Graphic Design", 
    stars: "<span class='f_stars'>★ ★ ★ ★ ★</span><span class='e_stars'></span>" 
  },
  { 
    name: "Java", 
    stars: "<span class='f_stars'>★ ★ ★</span><span class='e_stars'> ☆ ☆</span>" 
  }
];


// Unique colors for each ball
const ballColors = [
  "#F16529", "#2965F1", "#F7DF1E", "#3472A6", "#00599C",
  "#61DBFB", "#8CC84B", "#56f52aff", "#9B59B6", "#68A063",
  "#E67E22", "#E74C3C"
];

// ======================
// Create invisible walls
// ======================
function createWalls() {
  const canvasWidth = window.innerWidth;
  const canvasHeight = window.innerHeight - footerHeight;

  const invisibleWallOptions = {
    isStatic: true,
    render: { visible: false },
  };

  const walls = [
    // Bottom wall
    Bodies.rectangle(
      canvasWidth / 2,
      canvasHeight + wallThickness * 0.1 / 2,
      canvasWidth - 2 * sideCutoff,
      wallThickness,
      invisibleWallOptions
    ),
    // Top wall
    Bodies.rectangle(
      canvasWidth / 2,
      topCutoff,
      canvasWidth - 2 * sideCutoff,
      wallThickness,
      invisibleWallOptions
    ),
    // Left wall
    Bodies.rectangle(
      -wallThickness / 2 + sideCutoff,
      canvasHeight / 2,
      wallThickness,
      canvasHeight,
      invisibleWallOptions
    ),
    // Right wall
    Bodies.rectangle(
      canvasWidth + wallThickness / 2 - sideCutoff,
      canvasHeight / 2,
      wallThickness,
      canvasHeight,
      invisibleWallOptions
    ),
  ];

  return walls;
}

let walls = createWalls();
Composite.add(world, walls);

// ======================
// Skill Balls (fixed positions & unique colors)
// ======================
const balls = skills.map((skill, i) => {
  const canvasWidth = window.innerWidth;
  const canvasHeight = window.innerHeight - footerHeight;

  const xMin = sideCutoff + skillRadius;
  const xMax = canvasWidth - sideCutoff - skillRadius;
  const yMin = topCutoff + skillRadius;
  const yMax = canvasHeight - skillRadius;

  const ball = Bodies.circle(
    xMin + Math.random() * (xMax - xMin),
    yMin + Math.random() * (yMax - yMin),
    skillRadius,
    {
      restitution: 0.9,
      render: { fillStyle: ballColors[i % ballColors.length] },
      label: skill.name,
    }
  );

  ball.stars = skill.stars; // attach stars to the body
  return ball;
});

Composite.add(world, balls);

// ======================
// Mouse control
// ======================
const mouse = Mouse.create(render.canvas);
const mouseConstraint = MouseConstraint.create(engine, {
  mouse: mouse,
  constraint: { stiffness: 0.2, render: { visible: false } },
});
Composite.add(world, mouseConstraint);
render.mouse = mouse;

// ======================
// Drop held ball when mouse leaves play area
// ======================
Events.on(engine, "beforeUpdate", () => {
  const body = mouseConstraint.body;
  if (body) {
    const { x, y } = mouse.position;
    const w = window.innerWidth;
    const h = window.innerHeight - footerHeight;

    const minX = sideCutoff + skillRadius;
    const maxX = w - sideCutoff - skillRadius;
    const minY = topCutoff + skillRadius;
    const maxY = h - skillRadius;

    if (x < minX || x > maxX || y < minY || y > maxY) {
      mouseConstraint.constraint.bodyB = null;
    }
  }
});

// ======================
// Skill descriptions popup
// ======================
const skillDescriptions = {
  "HTML": "Built semantic, accessible, and responsive web pages for modern web applications.",
  "CSS": "Designed layouts and styled interfaces using CSS, Flexbox, Grid, and animations.",
  "JavaScript": "Developed interactive web applications with integrated libraries and custom elements.",
  "Python": "Automated tasks and processed data using Python scripts and prototypes.",
  "C++": "Programmed embedded systems (Arduino, ESP32, Raspberry Pi) implemented projects connecting hardware.",
  "C#": "Developed interactive applications and games using C# in Unity.",
  "Unity": "Created immersive 3D, 2D and VR games with interactive environments and gameplay mechanics.",
  "3D Modeling": "Designed 3D models and animations using Blender, 3D printing oriented using Onshape, and OpenSCAD for projects and prototypes.",
  "Git": "Managed version control and collaborative development using Git.",
  "MySQL": "Designed databases and wrote queries for data-driven applications using MySQL.",
  "Graphic Design": "Produced visual designs, branding assets, and UI elements for digital projects.",
  "Java": "Built software applications and Android apps using Java and Android Studio.",
};

let popupTimer;
let activePopupBall = null;

canvas.addEventListener("dblclick", (event) => {
  const rect = canvas.getBoundingClientRect();
  const mousePosition = {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top
  };

  const popup = document.getElementById("skillPopup");
  const bodies = Composite.allBodies(world);

  for (let body of bodies) {
    if (body.circleRadius) {
      const dx = body.position.x - mousePosition.x;
      const dy = body.position.y - mousePosition.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance <= body.circleRadius) {
        activePopupBall = body;
        popup.style.display = "block";
        popup.innerHTML = `<strong>${body.label} ${body.stars || ""}</strong><br>${skillDescriptions[body.label] || "No description available."}`;

        if (popupTimer) clearTimeout(popupTimer);
        popupTimer = setTimeout(() => {
          popup.style.display = "none";
          popupTimer = null;
          activePopupBall = null;
        }, 5000);

        break;
      }
    }
  }
});

// Update popup position every frame
(function updatePopupPosition() {
  requestAnimationFrame(updatePopupPosition);
  if (activePopupBall) {
    const popup = document.getElementById("skillPopup");
    const rect = render.canvas.getBoundingClientRect();
    popup.style.left = `${activePopupBall.position.x + rect.left + 10}px`;
    popup.style.top = `${activePopupBall.position.y + rect.top + 10}px`;
  }
})();

// ======================
// Handle window resize
// ======================
window.addEventListener("resize", () => {
  render.canvas.width = window.innerWidth;
  render.canvas.height = window.innerHeight;

  Composite.remove(world, walls);
  walls = createWalls();
  Composite.add(world, walls);
});

// ======================
// Prevent balls from escaping
// ======================
setInterval(() => {
  const w = window.innerWidth;
  const h = window.innerHeight;

  Composite.allBodies(world).forEach((body) => {
    if (body.position.y > h + 1000 || body.position.x < -1000 || body.position.x > w + 1000) {
      Body.setPosition(body, {
        x: Math.random() * w,
        y: Math.random() * (h / 2),
      });
      Body.setVelocity(body, { x: 0, y: 0 });
    }
  });
}, 3000);

// ======================
// Drop the grabbed ball if mouse leaves window
// ======================
window.addEventListener("mouseleave", () => {
  mouseConstraint.constraint.bodyB = null;
});

// ======================
// Smooth angle helper
// ======================
function smoothSetAngle(body, targetAngle = 0, duration = 500) {
  const startAngle = body.angle;
  const startTime = performance.now();
  Matter.Body.setAngularVelocity(body, 0);

  function animate(time) {
    const elapsed = time - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easeOutCubic = t => 1 - Math.pow(1 - t, 3);
    const eased = easeOutCubic(progress);
    const newAngle = startAngle + (targetAngle - startAngle) * eased;
    Matter.Body.setAngle(body, newAngle);

    if (progress < 1) requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);
}

// ======================
// Straighten text if body is grounded for 2s
// ======================
const stillTimeMap = new Map();

Events.on(engine, "afterUpdate", () => {
  const now = performance.now();

  Composite.allBodies(world).forEach((body) => {
    if (!skills.some(s => s.name === body.label)) return;

    const speed = Math.sqrt(body.velocity.x ** 2 + body.velocity.y ** 2);
    const angularSpeed = Math.abs(body.angularVelocity);

    if (speed < 0.2 && angularSpeed < 0.2) {
      if (!stillTimeMap.has(body)) {
        stillTimeMap.set(body, now);
      } else {
        const timeStill = now - stillTimeMap.get(body);
        if (timeStill > 1000) {
          smoothSetAngle(body, 0, 500);
          stillTimeMap.delete(body);
        }
      }
    } else {
      stillTimeMap.delete(body);
    }
  });
});

// ======================
// Draw labels on top of balls
// ======================
(function drawLabels() {
  const context = render.context;
  requestAnimationFrame(drawLabels);

  context.font = "bold 18px MyFont, sans-serif";
  context.fillStyle = "#fff";
  context.textAlign = "center";
  context.textBaseline = "middle";

  Composite.allBodies(world).forEach((body) => {
    if (skills.some(s => s.name === body.label)) {
      context.save();
      context.translate(body.position.x, body.position.y);
      context.rotate(body.angle);
      context.fillText(body.label, 0, 0);
      context.restore();
    }
  });
})();
