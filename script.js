// Wait until the page loads
window.addEventListener("DOMContentLoaded", () => {
  const returnBtn = document.getElementById("return");

  if (returnBtn){
    // Hover: change image
    returnBtn.addEventListener("mouseover", () => {
      returnBtn.style.width = "120px";
      returnBtn.style.transition = "width 0.3s ease"
      returnBtn.src = "img/return_red.png";
    });

    // Hover out: revert image
    returnBtn.addEventListener("mouseout", () => {
      returnBtn.style.width = "70px";
      returnBtn.style.transition = "width 0.3s ease";
      returnBtn.src = "img/arrow_nofill.png";
    });

    // Click: go back to home page
    returnBtn.addEventListener("click", () => {
      window.location.href = "index.html";
    });
  }
});

function setupCopyTooltips(selector) {
  const elements = document.querySelectorAll(selector);
  let currentTooltip = null;
  let hoverTimeout = null;

  elements.forEach(el => {
    const tooltip = el.querySelector(".tooltip-text");
    const textToCopy = el.dataset.copy;               // may be undefined
    const originalText = tooltip ? tooltip.textContent : "";

    // Hover: show original text and track current tooltip
    el.addEventListener("mouseenter", () => {
      if (!tooltip) return;
      if (currentTooltip && currentTooltip !== tooltip) {
        currentTooltip.classList.remove("show");
        clearTimeout(hoverTimeout);
      }
      tooltip.textContent = originalText; // ensure correct text on hover
      tooltip.classList.add("show");
      currentTooltip = tooltip;
      clearTimeout(hoverTimeout);
    });

    // Hover out: hide quickly
    el.addEventListener("mouseleave", () => {
      if (!tooltip) return;
      hoverTimeout = setTimeout(() => {
        tooltip.classList.remove("show");
        if (currentTooltip === tooltip) currentTooltip = null;
      }, 250);
    });

    // Click: only attempt copy if data-copy exists.
    el.addEventListener("click", async (event) => {
      if (!tooltip) return;
      clearTimeout(hoverTimeout);

      // If there's no data-copy, do nothing special: allow default link behavior
      // but show the original tooltip briefly for feedback.
      if (!textToCopy) {
        tooltip.textContent = originalText;
        tooltip.classList.add("show");
        setTimeout(() => {
          tooltip.classList.remove("show");
          if (currentTooltip === tooltip) currentTooltip = null;
        }, 1200);
        return; // do NOT preventDefault — link will open as normal
      }

      // For copyable items, prevent navigation and perform copy
      event.preventDefault();
      try {
        await navigator.clipboard.writeText(String(textToCopy));
        tooltip.textContent = "Copied!";
        tooltip.classList.add("show");
      } catch (err) {
        tooltip.textContent = "Error!";
        tooltip.classList.add("show");
      }

      // Restore original text
      setTimeout(() => {
        tooltip.textContent = originalText;
        tooltip.classList.remove("show");
        if (currentTooltip === tooltip) currentTooltip = null;
      }, 1500);
    });
  });
}


// Apply to all tooltip elements
setupCopyTooltips(".tooltip");

function runWhenVisible(elements, callback, options = {}) {
  const targets = Array.from(elements).filter(Boolean);
  if (!targets.length) return;

  if (!("IntersectionObserver" in window)) {
    targets.forEach(callback);
    return;
  }

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      callback(entry.target);
      obs.unobserve(entry.target);
    });
  }, {
    threshold: 0.25,
    rootMargin: "0px 0px -10% 0px",
    ...options
  });

  targets.forEach(target => observer.observe(target));
}

function setupDoodleReveal() {
  document.querySelectorAll(".doodle-reveal").forEach(surface => {
    const baseImage = surface.querySelector(".project-img:not(.project-original-img)");
    const overlay = surface.querySelector(".project-original-img");
    if (!overlay) return;

    const canvas = document.createElement("canvas");
    const maskCanvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const maskCtx = maskCanvas.getContext("2d");
    const strokes = [];
    let rafId = null;
    let lastPoint = null;
    let width = 0;
    let height = 0;
    let dpr = 1;
    const strokeLife = 940;

    canvas.className = "doodle-canvas";
    overlay.style.display = "none";
    surface.appendChild(canvas);

    function resizeCanvas() {
      const rect = surface.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      dpr = Math.min(window.devicePixelRatio || 1, 3);

      [canvas, maskCanvas].forEach(item => {
        item.width = Math.max(1, Math.round(width * dpr));
        item.height = Math.max(1, Math.round(height * dpr));
      });

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      maskCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      maskCtx.imageSmoothingEnabled = true;
      maskCtx.imageSmoothingQuality = "high";
    }

    function drawImageContain(targetCtx, image, fitImage = image) {
      if (!image.naturalWidth || !image.naturalHeight || !fitImage.naturalWidth || !fitImage.naturalHeight || !width || !height) return;

      const scale = Math.min(width / fitImage.naturalWidth, height / fitImage.naturalHeight);
      const drawWidth = fitImage.naturalWidth * scale;
      const drawHeight = fitImage.naturalHeight * scale;
      const drawX = (width - drawWidth) / 2;
      const drawY = (height - drawHeight) / 2;

      targetCtx.drawImage(image, drawX, drawY, drawWidth, drawHeight);
    }

    function drawSoftEllipse(targetCtx, x, y, radiusX, radiusY, rotation, alpha) {
      targetCtx.save();
      targetCtx.translate(x, y);
      targetCtx.rotate(rotation);
      targetCtx.scale(radiusX, radiusY);

      const gradient = targetCtx.createRadialGradient(0, 0, 0, 0, 0, 1);
      gradient.addColorStop(0, `rgba(255,255,255,${alpha})`);
      gradient.addColorStop(0.5, `rgba(255,255,255,${alpha * 0.82})`);
      gradient.addColorStop(1, "rgba(255,255,255,0)");

      targetCtx.fillStyle = gradient;
      targetCtx.beginPath();
      targetCtx.arc(0, 0, 1, 0, Math.PI * 2);
      targetCtx.fill();
      targetCtx.restore();
    }

    function renderReveal(time) {
      if (!width || !height) resizeCanvas();

      for (let i = strokes.length - 1; i >= 0; i--) {
        if (time - strokes[i].created > strokeLife) strokes.splice(i, 1);
      }

      ctx.clearRect(0, 0, width, height);
      maskCtx.clearRect(0, 0, width, height);
      maskCtx.globalCompositeOperation = "source-over";
      maskCtx.lineCap = "round";
      maskCtx.lineJoin = "round";

      strokes.forEach(stroke => {
        const age = time - stroke.created;
        const progress = Math.max(0, 1 - age / strokeLife);
        const strength = progress * progress * (3 - 2 * progress);
        const alpha = strength * 0.95;
        const radius = stroke.radius;
        const wobbleX = Math.cos(stroke.seed) * radius * 0.16;
        const wobbleY = Math.sin(stroke.seed * 1.3) * radius * 0.16;

        maskCtx.save();
        maskCtx.globalCompositeOperation = "source-over";
        maskCtx.shadowBlur = radius * 0.26;
        maskCtx.shadowColor = `rgba(255,255,255,${alpha * 0.55})`;
        maskCtx.strokeStyle = `rgba(255,255,255,${alpha})`;
        maskCtx.lineWidth = radius * 0.42;
        maskCtx.beginPath();
        maskCtx.moveTo(stroke.x1, stroke.y1);
        maskCtx.lineTo(stroke.x2, stroke.y2);
        maskCtx.stroke();
        maskCtx.restore();

        maskCtx.globalCompositeOperation = "source-over";
        drawSoftEllipse(maskCtx, stroke.x2, stroke.y2, radius * 0.56, radius * 0.34, stroke.angle, alpha * 0.82);
        drawSoftEllipse(maskCtx, stroke.x2 + radius * 0.26 + wobbleX, stroke.y2 - radius * 0.16, radius * 0.26, radius * 0.18, stroke.angle + 0.8, alpha * 0.58);
        drawSoftEllipse(maskCtx, stroke.x2 - radius * 0.22, stroke.y2 + radius * 0.2 + wobbleY, radius * 0.22, radius * 0.28, stroke.angle - 0.65, alpha * 0.5);
        drawSoftEllipse(maskCtx, stroke.x2 - radius * 0.34 + wobbleX, stroke.y2 - radius * 0.24 + wobbleY, radius * 0.14, radius * 0.18, stroke.angle + 1.4, alpha * 0.42);
        maskCtx.globalCompositeOperation = "source-over";
      });

      drawImageContain(ctx, overlay, baseImage || overlay);
      ctx.globalCompositeOperation = "destination-in";
      ctx.drawImage(maskCanvas, 0, 0, width, height);
      ctx.globalCompositeOperation = "source-over";

      if (strokes.length) {
        rafId = requestAnimationFrame(renderReveal);
      } else {
        rafId = null;
      }
    }

    function addTrailPoint(event) {
      const rect = surface.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      if (x < 0 || y < 0 || x > rect.width || y > rect.height) return;

      if (lastPoint && Math.hypot(x - lastPoint.x, y - lastPoint.y) < 5) {
        return;
      }

      const previousPoint = lastPoint || { x, y };
      const distance = Math.hypot(x - previousPoint.x, y - previousPoint.y);
      const steps = Math.max(1, Math.ceil(distance / 26));
      const radius = Math.max(86, Math.min(rect.width, rect.height) * 0.19);

      for (let i = 1; i <= steps; i++) {
        const t1 = (i - 1) / steps;
        const t2 = i / steps;
        const x1 = previousPoint.x + (x - previousPoint.x) * t1;
        const y1 = previousPoint.y + (y - previousPoint.y) * t1;
        const x2 = previousPoint.x + (x - previousPoint.x) * t2;
        const y2 = previousPoint.y + (y - previousPoint.y) * t2;
        const angle = Math.atan2(y2 - y1, x2 - x1);

        strokes.push({
          x1,
          y1,
          x2,
          y2,
          angle,
          radius,
          created: performance.now(),
          seed: (strokes.length + 1) * 2.37
        });
      }

      lastPoint = { x, y };
      if (strokes.length > 110) strokes.splice(0, strokes.length - 110);
      if (!rafId) rafId = requestAnimationFrame(renderReveal);
    }

    resizeCanvas();
    if (overlay.complete) {
      renderReveal(performance.now());
    }

    if (!overlay.complete) {
      overlay.addEventListener("load", () => {
        renderReveal(performance.now());
      }, { once: true });
    }

    if ("ResizeObserver" in window) {
      const observer = new ResizeObserver(() => {
        resizeCanvas();
        renderReveal(performance.now());
      });
      observer.observe(surface);
    } else {
      window.addEventListener("resize", () => {
        resizeCanvas();
        renderReveal(performance.now());
      });
    }

    surface.addEventListener("pointermove", addTrailPoint);
    surface.addEventListener("pointerleave", () => {
      lastPoint = null;
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  runWhenVisible(document.querySelectorAll(".page-section"), el => {
    el.classList.add("is-visible");
  });

  setupDoodleReveal();

  runWhenVisible([document.getElementById("location_icon")], locationIcon => {
    setTimeout(() => locationIcon.classList.add("animate"), 1200);
  }, { threshold: 1 });

  const footer = document.querySelector("footer");
  function updateFooterVisibility() {
    if (!footer) return;
    const scrollBottom = window.scrollY + window.innerHeight;
    const pageBottom = document.documentElement.scrollHeight;
    footer.classList.toggle("footer-visible", scrollBottom >= pageBottom - 8);
  }

  updateFooterVisibility();
  window.addEventListener("scroll", updateFooterVisibility, { passive: true });
  window.addEventListener("resize", updateFooterVisibility);
});

// Add a class when the slideInRight animation completes so hover transforms work reliably
document.querySelectorAll('.options h3').forEach(el => {
  el.addEventListener('animationend', (e) => {
    // Ensure we're responding to the expected keyframe animation
    if (e.animationName && e.animationName !== 'slideInRight') return;

    // Add the class (listener fires once per element by specifying { once: true } below)
    el.classList.add('animation-finished');
  }, { once: true });
});





document.addEventListener('DOMContentLoaded', () => {
  const DURATION = 1000; // match keyframe duration (ms)

  document.querySelectorAll('.letter-container').forEach(container => {
    const dot = container.querySelector('.dot');
    const trunk = container.querySelector('.dot_trunk');
    if (!dot || !trunk) return;

    let forwardPlaying = false;
    let reversePlaying = false;
    let reverseQueued = false;

    function clearAndReflow() {
      dot.style.animation = 'none';
      trunk.style.animation = 'none';
      void dot.offsetWidth; // force reflow
    }

    function playForward() {
      if (reversePlaying) {
        reversePlaying = false;
        clearAndReflow();
      }
      reverseQueued = false;
      forwardPlaying = true;

      dot.style.animation = `moveUp ${DURATION}ms ease-in-out forwards`;
      trunk.style.animation = `moveTrunk ${DURATION}ms ease-in-out forwards`;

      dot.addEventListener('animationend', function onFwdEnd() {
        forwardPlaying = false;
        dot.removeEventListener('animationend', onFwdEnd);
        if (reverseQueued) {
          reverseQueued = false;
          playReverse();
        }
      }, { once: true });
    }

    function playReverse() {
      if (forwardPlaying) {
        reverseQueued = true;
        return;
      }
      if (reversePlaying) return;

      reversePlaying = true;
      clearAndReflow();

      dot.style.animation = `moveUp ${DURATION}ms ease-in-out reverse forwards`;
      trunk.style.animation = `moveTrunk ${DURATION}ms ease-in-out reverse forwards`;

      dot.addEventListener('animationend', function onRevEnd() {
        reversePlaying = false;
        dot.removeEventListener('animationend', onRevEnd);
        dot.style.animation = '';
        trunk.style.animation = '';
      }, { once: true });
    }

    // Hover events
    container.addEventListener('mouseenter', playForward);
    container.addEventListener('mouseleave', () => {
      if (forwardPlaying) reverseQueued = true;
      else playReverse();
    });

    runWhenVisible([container], () => {
      setTimeout(playForward, 1500);
      setTimeout(playReverse, 2500);
    }, { threshold: 0.8 });
  });
});
