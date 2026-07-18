function setupSiteLoader() {
  const loader = document.getElementById("site-loader");
  const root = document.documentElement;

  if (!loader) {
    root.classList.remove("is-loading");
    window.siteIsReady = true;
    return;
  }

  const maximumWaitTime = 12000;
  const wait = duration => new Promise(resolve => window.setTimeout(resolve, duration));

  async function playDotLanding() {
    const dot = loader.querySelector(".site-loader-orbit");
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!dot || prefersReducedMotion || typeof dot.animate !== "function") return;

    const dotAnimations = typeof dot.getAnimations === "function" ? dot.getAnimations() : [];
    const orbitAnimation = dotAnimations.find(animation => {
      return animation.animationName === "loaderDotOrbit";
    }) || dotAnimations[0];
    const landingAngle = 360;
    const landingSpeedMultiplier = 1.8;
    const bounceDuration = 380;
    let continuedOrbit = false;
    dot.classList.add("is-landing");

    if (orbitAnimation?.effect && typeof orbitAnimation.effect.updateTiming === "function") {
      try {
        const timing = orbitAnimation.effect.getComputedTiming();
        const currentIteration = Number.isFinite(timing.currentIteration)
          ? timing.currentIteration
          : 0;

        orbitAnimation.effect.updateTiming({
          iterations: currentIteration + 1,
          fill: "forwards"
        });

        if (typeof orbitAnimation.updatePlaybackRate === "function") {
          orbitAnimation.updatePlaybackRate(orbitAnimation.playbackRate * landingSpeedMultiplier);
        } else {
          orbitAnimation.playbackRate *= landingSpeedMultiplier;
        }

        await orbitAnimation.finished;
        continuedOrbit = true;
      } catch {
        continuedOrbit = false;
      }
    }

    if (!continuedOrbit) {
      dot.style.animationPlayState = "paused";
      orbitAnimation?.pause();

      try {
        orbitAnimation?.commitStyles();
      } catch {
        // Older mobile browsers use the frozen computed transform below.
      }

      const renderedTransform = getComputedStyle(dot).transform;
      const Matrix = window.DOMMatrixReadOnly || window.DOMMatrix || window.WebKitCSSMatrix;
      let startAngle = NaN;

      if (renderedTransform && renderedTransform !== "none") {
        try {
          const matrix = new Matrix(renderedTransform);
          startAngle = Math.atan2(matrix.b, matrix.a) * (180 / Math.PI);
        } catch {
          const matrixValues = renderedTransform.match(/^matrix\(([^)]+)\)$/)?.[1].split(",");
          if (matrixValues?.length >= 2) {
            startAngle = Math.atan2(Number(matrixValues[1]), Number(matrixValues[0])) * (180 / Math.PI);
          }
        }
      }

      startAngle = Number.isFinite(startAngle) ? (startAngle + 360) % 360 : 0;
      const degreesRemaining = Math.max(0, landingAngle - startAngle);
      const approachDuration = Math.max(
        40,
        1600 * (degreesRemaining / 360) / landingSpeedMultiplier
      );
      const startTransform = `rotate(${startAngle}deg)`;

      dot.style.transform = startTransform;
      dot.style.animation = "none";
      orbitAnimation?.cancel();

      const approach = dot.animate([
        { transform: startTransform },
        { transform: `rotate(${landingAngle}deg)` }
      ], {
        duration: approachDuration,
        easing: "linear",
        fill: "forwards"
      });

      await approach.finished.catch(() => {});
      dot.style.transform = `rotate(${landingAngle}deg)`;
      approach.cancel();
    }

    dot.style.transform = `rotate(${landingAngle}deg)`;
    dot.style.animation = "none";
    orbitAnimation?.cancel();

    const bounce = dot.animate([
      { transform: `rotate(${landingAngle}deg)`, offset: 0 },
      {
        transform: `rotate(${landingAngle - 11}deg)`,
        offset: 0.3,
        easing: "cubic-bezier(0.16, 0.8, 0.3, 1)"
      },
      { transform: `rotate(${landingAngle + 4}deg)`, offset: 0.55 },
      { transform: `rotate(${landingAngle - 1.5}deg)`, offset: 0.78 },
      { transform: `rotate(${landingAngle}deg)`, offset: 1 }
    ], {
      duration: bounceDuration,
      fill: "forwards"
    });

    await Promise.race([
      bounce.finished.catch(() => {}),
      wait(bounceDuration + 100)
    ]);

    dot.style.transform = "rotate(0deg)";
    dot.style.animation = "none";
    bounce.cancel();
    orbitAnimation?.cancel();
    dot.classList.remove("is-landing");
  }

  function waitForImage(image) {
    const loaded = image.complete
      ? Promise.resolve()
      : new Promise(resolve => {
          image.addEventListener("load", resolve, { once: true });
          image.addEventListener("error", resolve, { once: true });
        });

    return loaded.then(() => {
      if (!image.naturalWidth || typeof image.decode !== "function") return;
      return image.decode().catch(() => {});
    });
  }

  async function finishLoading() {
    const imagePromises = Array.from(document.images, waitForImage);
    const documentImagesReady = Promise.allSettled(imagePromises);
    const fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();
    const skillsReady = window.skillsAssetsReady || Promise.resolve();
    const assetsReady = Promise.allSettled([documentImagesReady, fontsReady, skillsReady]);

    await Promise.race([assetsReady, wait(maximumWaitTime)]);
    await playDotLanding();
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));

    root.classList.remove("is-loading");
    loader.classList.add("is-hidden");
    loader.setAttribute("aria-hidden", "true");
    window.siteIsReady = true;
    window.dispatchEvent(new Event("site:ready"));

    loader.addEventListener("transitionend", () => loader.remove(), { once: true });
    window.setTimeout(() => loader.remove(), 500);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", finishLoading, { once: true });
  } else {
    finishLoading();
  }
}

setupSiteLoader();

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

const revealTiming = {
  duration: 1000,
  delayScale: 1,
  tipDuration: 8000
};

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function setupScrollResponsiveReveals() {
  let lastY = window.scrollY;
  let lastTime = performance.now();
  let rafId = null;

  function updateTiming() {
    rafId = null;
    const now = performance.now();
    const y = window.scrollY;
    const elapsed = Math.max(16, now - lastTime);
    const velocity = Math.abs(y - lastY) / elapsed;
    const fastness = clamp((velocity - 0.45) / 2.2, 0, 1);

    revealTiming.duration = Math.round(1000 - fastness * 560);
    revealTiming.delayScale = Number((1 - fastness * 0.72).toFixed(2));
    revealTiming.tipDuration = Math.round(8000 - fastness * 2600);

    document.documentElement.style.setProperty("--reveal-duration", `${revealTiming.duration}ms`);
    document.documentElement.style.setProperty("--reveal-delay-scale", revealTiming.delayScale);
    document.documentElement.style.setProperty("--tip-duration", `${revealTiming.tipDuration}ms`);

    lastY = y;
    lastTime = now;
  }

  function requestTimingUpdate() {
    if (rafId) return;
    rafId = requestAnimationFrame(updateTiming);
  }

  updateTiming();
  window.addEventListener("scroll", requestTimingUpdate, { passive: true });
}

function applyRevealTiming(element) {
  element.style.setProperty("--reveal-duration", `${revealTiming.duration}ms`);
  element.style.setProperty("--reveal-delay-scale", revealTiming.delayScale);
  element.style.setProperty("--tip-duration", `${revealTiming.tipDuration}ms`);
}

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
    threshold: 0.05,
    rootMargin: "0px 0px -10% 0px",
    ...options
  });

  targets.forEach(target => observer.observe(target));
}

function setupProjectCarousels() {
  document.querySelectorAll("[data-project-carousel]").forEach((carousel, carouselIndex) => {
    const viewport = carousel.querySelector(".project-carousel-viewport");
    const track = carousel.querySelector(".project-carousel-track");
    const slides = Array.from(carousel.querySelectorAll("[data-carousel-slide]"));
    const previousButton = carousel.querySelector(".project-carousel-prev");
    const nextButton = carousel.querySelector(".project-carousel-next");
    const dotsContainer = carousel.querySelector(".project-carousel-dots");
    const status = carousel.querySelector(".project-carousel-status");

    if (!viewport || !track || !previousButton || !nextButton || !dotsContainer || slides.length < 2) return;

    const carouselId = `project-carousel-${carouselIndex + 1}`;
    const autoplayDelay = 5000;
    const resumeDelay = 3000;
    const minimumAspectRatio = 1.5;
    const maximumAspectRatio = 2.5;
    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let currentIndex = 0;
    let pointerStartX = null;
    let autoplayTimer = null;
    let resumeTimer = null;
    let isHovered = false;
    let isFocusWithin = false;

    carousel.setAttribute("role", "region");
    carousel.setAttribute("aria-roledescription", "carousel");
    track.id = `${carouselId}-track`;
    previousButton.setAttribute("aria-controls", track.id);
    nextButton.setAttribute("aria-controls", track.id);

    if (carousel.hasAttribute("data-carousel-natural-size")) {
      const slideAspectRatios = slides
        .map(slide => slide.querySelector("img[width][height]"))
        .filter(Boolean)
        .map(image => {
          const naturalWidth = Number(image.getAttribute("width"));
          const naturalHeight = Number(image.getAttribute("height"));
          const naturalAspectRatio = naturalWidth / naturalHeight;

          return Math.min(
            maximumAspectRatio,
            Math.max(minimumAspectRatio, naturalAspectRatio)
          );
        })
        .filter(Number.isFinite);

      if (slideAspectRatios.length) {
        carousel.style.aspectRatio = String(Math.min(...slideAspectRatios));
      }
    }

    const dots = slides.map((slide, index) => {
      const slideNumber = index + 1;
      const slideId = `${carouselId}-slide-${slideNumber}`;
      const dot = document.createElement("button");

      slide.id = slideId;
      slide.setAttribute("role", "group");
      slide.setAttribute("aria-roledescription", "slide");
      slide.setAttribute("aria-label", `${slideNumber} of ${slides.length}`);
      slide.querySelectorAll("img").forEach(image => image.setAttribute("draggable", "false"));

      dot.className = "project-carousel-dot";
      dot.type = "button";
      dot.setAttribute("aria-label", `Show screenshot ${slideNumber} of ${slides.length}`);
      dot.setAttribute("aria-controls", slideId);
      dot.addEventListener("click", () => selectSlide(index));
      dotsContainer.appendChild(dot);

      return dot;
    });

    function showSlide(index, announce = true) {
      currentIndex = (index + slides.length) % slides.length;
      track.style.transform = `translateX(-${currentIndex * 100}%)`;

      slides.forEach((slide, slideIndex) => {
        slide.setAttribute("aria-hidden", String(slideIndex !== currentIndex));
      });

      dots.forEach((dot, dotIndex) => {
        if (dotIndex === currentIndex) {
          dot.setAttribute("aria-current", "true");
        } else {
          dot.removeAttribute("aria-current");
        }
      });

      if (announce && status) {
        status.textContent = `Showing screenshot ${currentIndex + 1} of ${slides.length}`;
      }
    }

    function stopAutoplay() {
      if (autoplayTimer !== null) {
        window.clearInterval(autoplayTimer);
        autoplayTimer = null;
      }

      if (resumeTimer !== null) {
        window.clearTimeout(resumeTimer);
        resumeTimer = null;
      }
    }

    function startAutoplay() {
      stopAutoplay();
      if (isHovered || isFocusWithin || document.hidden || reducedMotionQuery.matches) return;

      autoplayTimer = window.setInterval(() => {
        showSlide(currentIndex + 1, false);
      }, autoplayDelay);
    }

    function resumeAutoplayAfterDelay() {
      stopAutoplay();
      if (isHovered || isFocusWithin || document.hidden || reducedMotionQuery.matches) return;

      resumeTimer = window.setTimeout(() => {
        resumeTimer = null;
        if (isHovered || isFocusWithin || document.hidden || reducedMotionQuery.matches) return;
        showSlide(currentIndex + 1, false);
        startAutoplay();
      }, resumeDelay);
    }

    function selectSlide(index) {
      showSlide(index);
      startAutoplay();
    }

    previousButton.addEventListener("click", () => selectSlide(currentIndex - 1));
    nextButton.addEventListener("click", () => selectSlide(currentIndex + 1));

    carousel.addEventListener("keydown", event => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        selectSlide(currentIndex - 1);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        selectSlide(currentIndex + 1);
      } else if (event.key === "Home") {
        event.preventDefault();
        selectSlide(0);
      } else if (event.key === "End") {
        event.preventDefault();
        selectSlide(slides.length - 1);
      }
    });

    carousel.addEventListener("mouseenter", () => {
      isHovered = true;
      stopAutoplay();
    });

    carousel.addEventListener("mouseleave", () => {
      isHovered = false;
      resumeAutoplayAfterDelay();
    });

    carousel.addEventListener("focusin", event => {
      if (!event.target.matches(":focus-visible")) return;
      isFocusWithin = true;
      stopAutoplay();
    });

    carousel.addEventListener("focusout", event => {
      if (event.relatedTarget && carousel.contains(event.relatedTarget)) return;
      isFocusWithin = false;
      startAutoplay();
    });

    viewport.addEventListener("pointerdown", event => {
      if (event.pointerType === "mouse") return;
      stopAutoplay();
      pointerStartX = event.clientX;
    });

    viewport.addEventListener("pointerup", event => {
      if (pointerStartX === null) return;
      const distance = event.clientX - pointerStartX;
      pointerStartX = null;
      if (Math.abs(distance) >= 40) {
        showSlide(currentIndex + (distance < 0 ? 1 : -1));
      }
      startAutoplay();
    });

    viewport.addEventListener("pointercancel", () => {
      pointerStartX = null;
      startAutoplay();
    });

    document.addEventListener("visibilitychange", startAutoplay);
    reducedMotionQuery.addEventListener("change", startAutoplay);

    showSlide(0, false);
    carousel.classList.add("is-ready");
    startAutoplay();
  });
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
    let activePointerId = null;
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

    function drawImageFitted(targetCtx, image, fitImage = image) {
      if (!image.naturalWidth || !image.naturalHeight || !fitImage.naturalWidth || !fitImage.naturalHeight || !width || !height) return;

      const useCoverFit = surface.classList.contains("project-media-doodle");
      const surfaceRect = surface.getBoundingClientRect();
      const fitRect = fitImage.getBoundingClientRect();
      const scale = useCoverFit
        ? Math.max(fitRect.width / fitImage.naturalWidth, fitRect.height / fitImage.naturalHeight)
        : Math.min(fitRect.width / fitImage.naturalWidth, fitRect.height / fitImage.naturalHeight);
      const drawWidth = fitImage.naturalWidth * scale;
      const drawHeight = fitImage.naturalHeight * scale;
      const boxX = fitRect.left - surfaceRect.left;
      const boxY = fitRect.top - surfaceRect.top;
      const drawX = boxX + (fitRect.width - drawWidth) / 2;
      const drawY = useCoverFit
        ? boxY + fitRect.height - drawHeight
        : boxY + (fitRect.height - drawHeight) / 2;

      const targetAspectRatio = drawWidth / drawHeight;
      const sourceAspectRatio = image.naturalWidth / image.naturalHeight;
      let sourceX = 0;
      let sourceY = 0;
      let sourceWidth = image.naturalWidth;
      let sourceHeight = image.naturalHeight;

      if (sourceAspectRatio > targetAspectRatio) {
        sourceWidth = sourceHeight * targetAspectRatio;
        sourceX = (image.naturalWidth - sourceWidth) / 2;
      } else if (sourceAspectRatio < targetAspectRatio) {
        sourceHeight = sourceWidth / targetAspectRatio;
        sourceY = useCoverFit
          ? image.naturalHeight - sourceHeight
          : (image.naturalHeight - sourceHeight) / 2;
      }

      targetCtx.drawImage(
        image,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        drawX,
        drawY,
        drawWidth,
        drawHeight
      );
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

      drawImageFitted(ctx, overlay, baseImage || overlay);
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
      const canvasRect = canvas.getBoundingClientRect();
      const surfaceRect = surface.getBoundingClientRect();
      const x = event.clientX - canvasRect.left;
      const y = event.clientY - canvasRect.top;

      if (x < 0 || y < 0 || x > canvasRect.width || y > canvasRect.height) return;

      if (lastPoint && Math.hypot(x - lastPoint.x, y - lastPoint.y) < 5) {
        return;
      }

      const previousPoint = lastPoint || { x, y };
      const distance = Math.hypot(x - previousPoint.x, y - previousPoint.y);
      const steps = Math.max(1, Math.ceil(distance / 26));
      const radius = Math.max(86, Math.min(surfaceRect.width, surfaceRect.height) * 0.19);

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

    surface.addEventListener("pointerdown", event => {
      if (event.pointerType === "mouse") return;

      event.preventDefault();
      activePointerId = event.pointerId;
      lastPoint = null;
      surface.setPointerCapture?.(event.pointerId);
      addTrailPoint(event);
    }, { passive: false });

    surface.addEventListener("pointermove", event => {
      if (event.pointerType !== "mouse" && event.pointerId !== activePointerId) return;
      if (event.pointerType !== "mouse") event.preventDefault();
      addTrailPoint(event);
    }, { passive: false });

    function finishTouchReveal(event) {
      if (event.pointerId !== activePointerId) return;
      if (surface.hasPointerCapture?.(event.pointerId)) {
        surface.releasePointerCapture(event.pointerId);
      }
      activePointerId = null;
      lastPoint = null;
    }

    surface.addEventListener("pointerup", finishTouchReveal);
    surface.addEventListener("pointercancel", finishTouchReveal);
    surface.addEventListener("pointerleave", () => {
      lastPoint = null;
    });
  });
}

function setupProjectLightbox() {
  const lightbox = document.getElementById("project-lightbox");
  const lightboxImage = lightbox?.querySelector(".project-lightbox-image");
  const closeButton = lightbox?.querySelector(".project-lightbox-close");
  const previousButton = lightbox?.querySelector(".project-lightbox-prev");
  const nextButton = lightbox?.querySelector(".project-lightbox-next");
  const status = lightbox?.querySelector(".project-lightbox-status");
  if (!lightbox || !lightboxImage || !closeButton || !previousButton || !nextButton || !status) return;

  const root = document.documentElement;
  const movementLimit = 10;
  let returnFocusTo = null;
  let closeTimer = null;
  let lightboxImages = [];
  let currentImageIndex = 0;
  let swipeStart = null;

  function getProjectImages(media) {
    if (media.matches("[data-project-carousel]")) {
      return Array.from(media.querySelectorAll("[data-carousel-slide] .project-img"));
    }

    const image = media.querySelector(".project-img:not(.project-original-img)");
    return image ? [image] : [];
  }

  function showLightboxImage(index) {
    if (!lightboxImages.length) return;

    currentImageIndex = (index + lightboxImages.length) % lightboxImages.length;
    const image = lightboxImages[currentImageIndex];
    const hasMultipleImages = lightboxImages.length > 1;

    lightboxImage.src = image.currentSrc || image.src;
    lightboxImage.alt = image.alt || "Expanded project image";
    previousButton.hidden = !hasMultipleImages;
    nextButton.hidden = !hasMultipleImages;
    status.hidden = !hasMultipleImages;
    status.textContent = hasMultipleImages
      ? `${currentImageIndex + 1} / ${lightboxImages.length}`
      : "";
  }

  function openLightbox(media, trigger) {
    lightboxImages = getProjectImages(media);
    if (!lightboxImages.length) return;

    if (closeTimer !== null) {
      window.clearTimeout(closeTimer);
      closeTimer = null;
    }

    returnFocusTo = trigger;
    const visibleImage = media.matches("[data-project-carousel]")
      ? media.querySelector('[data-carousel-slide][aria-hidden="false"] .project-img')
      : lightboxImages[0];
    const visibleImageIndex = lightboxImages.indexOf(visibleImage);
    showLightboxImage(visibleImageIndex >= 0 ? visibleImageIndex : 0);
    lightbox.hidden = false;
    lightbox.setAttribute("aria-hidden", "false");
    root.classList.add("project-lightbox-open");

    requestAnimationFrame(() => {
      lightbox.classList.add("is-open");
      closeButton.focus({ preventScroll: true });
    });
  }

  function finishClosing() {
    if (lightbox.classList.contains("is-open")) return;
    lightbox.hidden = true;
    lightboxImage.removeAttribute("src");
    lightboxImages = [];
    currentImageIndex = 0;
    root.classList.remove("project-lightbox-open");
    returnFocusTo?.focus({ preventScroll: true });
    returnFocusTo = null;
    closeTimer = null;
  }

  function closeLightbox() {
    if (lightbox.hidden || !lightbox.classList.contains("is-open")) return;
    lightbox.classList.remove("is-open");
    lightbox.setAttribute("aria-hidden", "true");
    closeTimer = window.setTimeout(finishClosing, 240);
  }

  document.querySelectorAll(".project-media").forEach(media => {
    const trigger = media.matches("[data-project-carousel]")
      ? media.querySelector(".project-carousel-viewport")
      : media;
    if (!trigger) return;

    const projectName = media.closest(".project-card")?.querySelector(".project-info h2")?.textContent?.trim();
    trigger.classList.add("project-expand-trigger");
    trigger.setAttribute("role", "button");
    trigger.setAttribute("tabindex", "0");
    trigger.setAttribute("aria-label", `Expand ${projectName || "project"} image`);

    let pointerStart = null;

    trigger.addEventListener("pointerdown", event => {
      if (event.pointerType === "mouse" && event.button !== 0) return;
      pointerStart = {
        id: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        moved: false
      };
    });

    trigger.addEventListener("pointermove", event => {
      if (!pointerStart || event.pointerId !== pointerStart.id) return;
      const distance = Math.hypot(event.clientX - pointerStart.x, event.clientY - pointerStart.y);
      if (distance > movementLimit) pointerStart.moved = true;
    });

    trigger.addEventListener("pointerup", event => {
      if (!pointerStart || event.pointerId !== pointerStart.id) return;
      const shouldOpen = !pointerStart.moved;
      pointerStart = null;
      if (shouldOpen) openLightbox(media, trigger);
    });

    trigger.addEventListener("pointercancel", () => {
      pointerStart = null;
    });

    trigger.addEventListener("keydown", event => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      openLightbox(media, trigger);
    });
  });

  previousButton.addEventListener("click", () => {
    showLightboxImage(currentImageIndex - 1);
  });

  nextButton.addEventListener("click", () => {
    showLightboxImage(currentImageIndex + 1);
  });

  lightboxImage.addEventListener("pointerdown", event => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    event.preventDefault();
    swipeStart = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY
    };
    lightboxImage.setPointerCapture?.(event.pointerId);
  });

  lightboxImage.addEventListener("pointerup", event => {
    if (!swipeStart || event.pointerId !== swipeStart.id) return;

    const deltaX = event.clientX - swipeStart.x;
    const deltaY = event.clientY - swipeStart.y;
    swipeStart = null;

    if (lightboxImages.length < 2 || Math.abs(deltaX) < 45 || Math.abs(deltaX) < Math.abs(deltaY)) return;
    showLightboxImage(currentImageIndex + (deltaX < 0 ? 1 : -1));
  });

  lightboxImage.addEventListener("pointercancel", () => {
    swipeStart = null;
  });

  closeButton.addEventListener("click", closeLightbox);
  lightbox.addEventListener("click", event => {
    if (event.target === lightbox) closeLightbox();
  });

  document.addEventListener("keydown", event => {
    if (lightbox.hidden) return;

    if (event.key === "Escape") {
      event.preventDefault();
      closeLightbox();
    } else if (event.key === "ArrowLeft" && lightboxImages.length > 1) {
      event.preventDefault();
      showLightboxImage(currentImageIndex - 1);
    } else if (event.key === "ArrowRight" && lightboxImages.length > 1) {
      event.preventDefault();
      showLightboxImage(currentImageIndex + 1);
    } else if (event.key === "Tab") {
      event.preventDefault();
      const controls = [closeButton, previousButton, nextButton].filter(control => !control.hidden);
      const currentControlIndex = controls.indexOf(document.activeElement);
      const direction = event.shiftKey ? -1 : 1;
      const nextControlIndex = currentControlIndex < 0
        ? 0
        : (currentControlIndex + direction + controls.length) % controls.length;
      controls[nextControlIndex].focus();
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  setupScrollResponsiveReveals();

  runWhenVisible(document.querySelectorAll(".page-section"), el => {
    applyRevealTiming(el);
    el.classList.add("is-visible");
  });

  setupProjectCarousels();
  setupDoodleReveal();
  setupProjectLightbox();

  const locationIcon = document.getElementById("location_icon");

  function playLocationPinAnimation() {
    if (!locationIcon) return;
    locationIcon.classList.remove("animate");
    void locationIcon.offsetWidth;
    locationIcon.classList.add("animate");
  }

  if (locationIcon) {
    locationIcon.setAttribute("role", "button");
    locationIcon.setAttribute("tabindex", "0");
    locationIcon.setAttribute("aria-label", "Animate location pin");

    locationIcon.addEventListener("click", playLocationPinAnimation);
    locationIcon.addEventListener("keydown", event => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      playLocationPinAnimation();
    });

    locationIcon.addEventListener("animationend", event => {
      if (event.animationName !== "bounce") return;
      locationIcon.classList.remove("animate");
    });
  }

  function scheduleLocationPinAnimation() {
    window.setTimeout(playLocationPinAnimation, 4000);
  }

  if (window.siteIsReady) {
    scheduleLocationPinAnimation();
  } else {
    window.addEventListener("site:ready", scheduleLocationPinAnimation, { once: true });
  }

  const footer = document.querySelector("footer");
  const backToTop = document.getElementById("back-to-top");

  function updateFooterVisibility() {
    if (!footer) return;
    const scrollBottom = window.scrollY + window.innerHeight;
    const pageBottom = document.documentElement.scrollHeight;
    const footerIsVisible = scrollBottom >= pageBottom - 8;

    footer.classList.toggle("footer-visible", footerIsVisible);
  }

  updateFooterVisibility();
  window.addEventListener("scroll", updateFooterVisibility, { passive: true });
  window.addEventListener("resize", updateFooterVisibility);

  if (backToTop) {
    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const mobileBackToTopQuery = window.matchMedia("(max-width: 768px)");

    function updateBackToTopPosition() {
      if (mobileBackToTopQuery.matches) {
        backToTop.style.setProperty("--scroll-offset", "0px");
      } else {
        const maximumScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
        const scrollProgress = Math.min(1, Math.max(0, window.scrollY / maximumScroll));
        const startingTop = Number.parseFloat(getComputedStyle(backToTop).top) || 16;
        const footerHeight = footer ? footer.offsetHeight : 0;
        const footerGap = 12;
        const maximumTravel = Math.max(
          0,
          window.innerHeight - (startingTop * 2) - backToTop.offsetHeight - footerHeight - footerGap
        );

        backToTop.style.setProperty("--scroll-offset", `${scrollProgress * maximumTravel}px`);
      }

      const visibilityThreshold = mobileBackToTopQuery.matches ? window.innerHeight : 8;
      backToTop.classList.toggle("is-visible", window.scrollY > visibilityThreshold);
    }

    backToTop.addEventListener("click", () => {
      window.scrollTo({
        top: 0,
        behavior: reducedMotionQuery.matches ? "auto" : "smooth"
      });
    });

    updateBackToTopPosition();
    window.addEventListener("scroll", updateBackToTopPosition, { passive: true });
    window.addEventListener("resize", updateBackToTopPosition);
  }
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
