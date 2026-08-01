function setupSkeletonLoader() {
  const skeleton = document.getElementById("home-skeleton");
  const home = document.getElementById("home");
  const root = document.documentElement;

  if (!skeleton) {
    root.classList.remove("is-skeleton-loading");
    window.siteIsReady = true;
    return;
  }

  const wait = duration => new Promise(resolve => window.setTimeout(resolve, duration));

  async function playDotLanding() {
    const orbit = skeleton.querySelector(".skeleton-welcome-orbit");
    const dot = skeleton.querySelector(".skeleton-welcome-dot");
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!orbit) return;

    skeleton.classList.add("is-intro-active");
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));

    if (prefersReducedMotion || typeof orbit.animate !== "function") {
      await wait(700);
      return;
    }

    const orbitAnimations = typeof orbit.getAnimations === "function" ? orbit.getAnimations() : [];
    const orbitAnimation = orbitAnimations.find(animation => {
      return animation.animationName === "skeletonWelcomeOrbit";
    }) || orbitAnimations[0];
    const landingAngle = 360;
    const orbitDuration = 1000;
    const bounceDuration = 520;
    orbit.classList.add("is-landing");

    if (orbitAnimation) {
      await Promise.race([
        orbitAnimation.finished.catch(() => {}),
        wait(orbitDuration + 300)
      ]);
    } else {
      const fallbackOrbit = orbit.animate([
        { transform: "rotate(0deg)" },
        { transform: `rotate(${landingAngle}deg)` }
      ], {
        duration: orbitDuration,
        easing: "cubic-bezier(0.24, 0.15, 0.8, 0.5)",
        fill: "forwards"
      });

      await fallbackOrbit.finished.catch(() => {});
      fallbackOrbit.cancel();
    }

    orbit.style.transform = `rotate(${landingAngle}deg)`;
    orbit.style.animation = "none";
    orbitAnimation?.cancel();

    const bounce = orbit.animate([
      {
        transform: `rotate(${landingAngle}deg)`,
        offset: 0,
        easing: "cubic-bezier(0.12, 0.8, 0.24, 1)"
      },
      {
        transform: `rotate(${landingAngle - 20}deg)`,
        offset: 0.2,
        easing: "cubic-bezier(0.3, 0, 0.2, 1)"
      },
      {
        transform: `rotate(${landingAngle + 9}deg)`,
        offset: 0.43,
        easing: "cubic-bezier(0.3, 0, 0.2, 1)"
      },
      {
        transform: `rotate(${landingAngle - 5}deg)`,
        offset: 0.64,
        easing: "cubic-bezier(0.3, 0, 0.2, 1)"
      },
      { transform: `rotate(${landingAngle + 2}deg)`, offset: 0.82 },
      { transform: `rotate(${landingAngle}deg)`, offset: 1 }
    ], {
      duration: bounceDuration,
      fill: "forwards"
    });

    const impact = dot && typeof dot.animate === "function"
      ? dot.animate([
          { transform: "scale(1)", offset: 0 },
          { transform: "scale(1.7, 0.58)", offset: 0.1 },
          { transform: "scale(0.78, 1.35)", offset: 0.27 },
          { transform: "scale(1.18, 0.86)", offset: 0.48 },
          { transform: "scale(0.94, 1.08)", offset: 0.7 },
          { transform: "scale(1)", offset: 1 }
        ], {
          duration: bounceDuration,
          easing: "cubic-bezier(0.22, 0.7, 0.3, 1)",
          fill: "forwards"
        })
      : null;

    const impactAnimationsFinished = [bounce.finished.catch(() => {})];
    if (impact) impactAnimationsFinished.push(impact.finished.catch(() => {}));

    await Promise.race([
      Promise.all(impactAnimationsFinished),
      wait(bounceDuration + 100)
    ]);

    orbit.style.transform = "rotate(0deg)";
    orbit.style.animation = "none";
    bounce.cancel();
    impact?.cancel();
    orbitAnimation?.cancel();
    orbit.classList.remove("is-landing");
  }

  async function finishIntro() {
    await playDotLanding();
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));

    root.classList.remove("is-skeleton-loading");
    skeleton.classList.add("is-hidden");
    skeleton.setAttribute("aria-hidden", "true");
    home?.setAttribute("aria-busy", "false");
    window.siteIsReady = true;
    window.dispatchEvent(new Event("site:ready"));

    skeleton.addEventListener("transitionend", () => skeleton.remove(), { once: true });
    window.setTimeout(() => skeleton.remove(), 500);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", finishIntro, { once: true });
  } else {
    finishIntro();
  }
}

setupSkeletonLoader();

function setupProgressiveImageSkeletons() {
  function trackImageGroup(container, images) {
    if (!images.length) return;

    container.classList.add("is-image-loading");
    let pendingImages = images.length;

    function settleImage(image) {
      if (image.dataset.loadSettled === "true") return;
      image.dataset.loadSettled = "true";
      pendingImages -= 1;

      if (pendingImages === 0) {
        images.forEach(groupImage => groupImage.classList.add("is-image-ready"));
        container.classList.remove("is-image-loading");
      }
    }

    images.forEach(image => {
      const loadPromise = image.complete
        ? Promise.resolve()
        : new Promise(resolve => {
            image.addEventListener("load", resolve, { once: true });
            image.addEventListener("error", resolve, { once: true });
          });

      loadPromise
        .then(() => typeof image.decode === "function" ? image.decode() : undefined)
        .catch(() => {})
        .then(() => settleImage(image));
    });
  }

  document.querySelectorAll(".project-media").forEach(media => {
    if (media.classList.contains("doodle-reveal")) {
      const visibleImage = media.querySelector(".project-img:not(.project-original-img)");
      trackImageGroup(media, visibleImage ? [visibleImage] : []);
      return;
    }

    const carouselSlides = Array.from(media.querySelectorAll(".project-carousel-slide"));

    if (carouselSlides.length) {
      const carouselImages = carouselSlides.flatMap(slide => {
        return Array.from(slide.querySelectorAll(".project-img"));
      });
      trackImageGroup(media, carouselImages);
      return;
    }

    trackImageGroup(media, Array.from(media.querySelectorAll(".project-img")));
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", setupProgressiveImageSkeletons, { once: true });
} else {
  setupProgressiveImageSkeletons();
}

// Wait until the page loads
window.addEventListener("DOMContentLoaded", () => {
  const returnBtn = document.getElementById("return");

  if (returnBtn){
    // Hover: change image
    returnBtn.addEventListener("mouseover", () => {
      returnBtn.style.width = "120px";
      returnBtn.style.transition = "width 0.3s ease"
      returnBtn.src = "img/ui/return-arrow.webp";
    });

    // Hover out: revert image
    returnBtn.addEventListener("mouseout", () => {
      returnBtn.style.width = "70px";
      returnBtn.style.transition = "width 0.3s ease";
      returnBtn.src = "img/ui/forward-arrow.webp";
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

    // Hide any click feedback when the pointer leaves.
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

      // If there's no data-copy, allow the link to open normally.
      if (!textToCopy) {
        return;
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

const scrollResponsiveAnimationNames = new Set([
  "slideInLeft",
  "slideInRight",
  "slideInUp"
]);

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function accelerateActiveReveals(section) {
  if (typeof section.getAnimations !== "function") return;

  let animations;

  try {
    animations = section.getAnimations({ subtree: true });
  } catch {
    animations = Array.from(section.querySelectorAll("*"))
      .flatMap(element => element.getAnimations?.() || []);
  }

  animations.forEach(animation => {
    if (!scrollResponsiveAnimationNames.has(animation.animationName)) return;

    const animationDuration = Number(animation.effect?.getTiming().duration);
    if (!Number.isFinite(animationDuration) || animationDuration <= 0) return;

    const targetRate = clamp(animationDuration / revealTiming.duration, 1, 3);
    if (targetRate <= Math.abs(animation.playbackRate)) return;

    if (typeof animation.updatePlaybackRate === "function") {
      animation.updatePlaybackRate(targetRate);
    } else {
      animation.playbackRate = targetRate;
    }
  });
}

function setupScrollResponsiveReveals() {
  let lastY = window.scrollY;
  let lastTime = performance.now();
  let rafId = null;

  function updateTiming() {
    rafId = null;
    const now = performance.now();
    const y = window.scrollY;
    // Cap idle time so the first large scroll after a pause is still treated as fast.
    const elapsed = clamp(now - lastTime, 16, 80);
    const velocity = Math.abs(y - lastY) / elapsed;
    const fastness = clamp((velocity - 0.3) / 1.8, 0, 1);

    revealTiming.duration = Math.round(1000 - fastness * 640);
    revealTiming.delayScale = Number((1 - fastness * 0.88).toFixed(2));
    revealTiming.tipDuration = Math.round(8000 - fastness * 3200);

    document.documentElement.style.setProperty("--reveal-duration", `${revealTiming.duration}ms`);
    document.documentElement.style.setProperty("--reveal-delay-scale", revealTiming.delayScale);
    document.documentElement.style.setProperty("--tip-duration", `${revealTiming.tipDuration}ms`);

    if (fastness > 0) {
      document.querySelectorAll(".page-section.is-visible")
        .forEach(accelerateActiveReveals);
    }

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

function setupSkillTipToggle() {
  const tip = document.getElementById("skill_tip");
  const skillsSection = tip?.closest(".skills-section");
  if (!tip || !skillsSection) return;

  const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const expandedDisplayTime = 7000;
  let collapseTimer = null;
  let morphAnimation = null;
  let initialCountdownStarted = false;

  function clearCollapseTimer() {
    if (!collapseTimer) return;
    clearTimeout(collapseTimer);
    collapseTimer = null;
  }

  function setCollapsed(collapsed) {
    if (tip.classList.contains("is-collapsed") === collapsed) return;

    clearCollapseTimer();
    const startRect = tip.getBoundingClientRect();
    morphAnimation?.cancel();
    tip.classList.toggle("is-collapsed", collapsed);
    tip.setAttribute("aria-expanded", String(!collapsed));
    tip.tabIndex = collapsed ? 0 : -1;

    if (collapsed) {
      tip.setAttribute("aria-label", "Show the sphere interaction tip");
      tip.title = "Show tip";
    } else {
      tip.removeAttribute("aria-label");
      tip.title = "";
    }

    const endRect = tip.getBoundingClientRect();
    if (reducedMotionQuery.matches || typeof tip.animate !== "function") return;

    morphAnimation = tip.animate([
      {
        width: `${startRect.width}px`,
        height: `${startRect.height}px`,
        offset: 0
      },
      {
        width: `${startRect.width}px`,
        height: `${startRect.height}px`,
        offset: 0.28,
        easing: "cubic-bezier(.22, 1, .36, 1)"
      },
      {
        width: `${endRect.width}px`,
        height: `${endRect.height}px`,
        offset: 1
      }
    ], {
      duration: 540,
      easing: "linear"
    });
    morphAnimation.addEventListener("finish", () => {
      morphAnimation = null;
    }, { once: true });
  }

  function scheduleCollapse(delay = expandedDisplayTime) {
    clearCollapseTimer();
    collapseTimer = setTimeout(() => setCollapsed(true), delay);
  }

  function startInitialCountdown() {
    if (initialCountdownStarted) return;
    initialCountdownStarted = true;
    const revealDelay = 700 * revealTiming.delayScale;
    scheduleCollapse(revealTiming.tipDuration + revealDelay);
  }

  tip.addEventListener("click", () => {
    if (!tip.classList.contains("is-collapsed")) return;
    setCollapsed(false);
    scheduleCollapse();
  });

  tip.addEventListener("keydown", event => {
    if (event.key !== "Escape" || tip.classList.contains("is-collapsed")) return;
    setCollapsed(true);
  });

  if (skillsSection.classList.contains("is-visible")) {
    startInitialCountdown();
    return;
  }

  const visibilityObserver = new MutationObserver(() => {
    if (!skillsSection.classList.contains("is-visible")) return;
    startInitialCountdown();
    visibilityObserver.disconnect();
  });
  visibilityObserver.observe(skillsSection, { attributes: true, attributeFilter: ["class"] });
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
    let isCarouselReady = false;
    let trackIndex = 1;
    let isTransitioning = false;
    let pendingSelection = null;

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

    function createLoopClone(slide) {
      const clone = slide.cloneNode(true);

      clone.classList.add("project-carousel-clone");
      clone.classList.remove("is-image-loading");
      clone.removeAttribute("data-carousel-slide");
      clone.removeAttribute("id");
      clone.removeAttribute("aria-label");
      clone.removeAttribute("aria-roledescription");
      clone.setAttribute("aria-hidden", "true");
      clone.setAttribute("role", "presentation");
      clone.querySelectorAll("[id]").forEach(element => element.removeAttribute("id"));
      clone.querySelectorAll("img").forEach(image => {
        image.alt = "";
        image.setAttribute("draggable", "false");
      });

      return clone;
    }

    const leadingClone = createLoopClone(slides[slides.length - 1]);
    const trailingClone = createLoopClone(slides[0]);
    track.prepend(leadingClone);
    track.append(trailingClone);

    function setTrackPosition(index, instant = false) {
      trackIndex = index;

      if (instant) track.classList.add("is-resetting");
      track.style.transform = `translateX(-${trackIndex * 100}%)`;

      if (instant) {
        void track.offsetWidth;
        track.classList.remove("is-resetting");
      }
    }

    function updateSlideState(announce) {
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

    function showSlide(index, announce = true, direction = 0) {
      const normalizedIndex = (index + slides.length) % slides.length;

      if (isTransitioning) {
        pendingSelection = { index: normalizedIndex, announce, direction };
        return;
      }

      const previousIndex = currentIndex;
      let nextTrackIndex = normalizedIndex + 1;

      if (previousIndex === slides.length - 1 && normalizedIndex === 0 && direction >= 0) {
        nextTrackIndex = slides.length + 1;
      } else if (previousIndex === 0 && normalizedIndex === slides.length - 1 && direction <= 0) {
        nextTrackIndex = 0;
      }

      currentIndex = normalizedIndex;
      isTransitioning = nextTrackIndex !== trackIndex;
      setTrackPosition(nextTrackIndex);
      updateSlideState(announce);
    }

    track.addEventListener("transitionend", event => {
      if (event.target !== track || event.propertyName !== "transform") return;

      if (trackIndex === 0) {
        setTrackPosition(slides.length, true);
      } else if (trackIndex === slides.length + 1) {
        setTrackPosition(1, true);
      }

      isTransitioning = false;

      if (pendingSelection) {
        const selection = pendingSelection;
        pendingSelection = null;
        showSlide(selection.index, selection.announce, selection.direction);
      }
    });

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
      if (!isCarouselReady || isHovered || isFocusWithin || document.hidden || reducedMotionQuery.matches) return;

      autoplayTimer = window.setInterval(() => {
        showSlide(currentIndex + 1, false, 1);
      }, autoplayDelay);
    }

    function resumeAutoplayAfterDelay() {
      stopAutoplay();
      if (!isCarouselReady || isHovered || isFocusWithin || document.hidden || reducedMotionQuery.matches) return;

      resumeTimer = window.setTimeout(() => {
        resumeTimer = null;
        if (!isCarouselReady || isHovered || isFocusWithin || document.hidden || reducedMotionQuery.matches) return;
        showSlide(currentIndex + 1, false, 1);
        startAutoplay();
      }, resumeDelay);
    }

    function selectSlide(index, direction = 0) {
      showSlide(index, true, direction);
      startAutoplay();
    }

    previousButton.addEventListener("click", () => selectSlide(currentIndex - 1, -1));
    nextButton.addEventListener("click", () => selectSlide(currentIndex + 1, 1));

    carousel.addEventListener("keydown", event => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        selectSlide(currentIndex - 1, -1);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        selectSlide(currentIndex + 1, 1);
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
        const direction = distance < 0 ? 1 : -1;
        showSlide(currentIndex + direction, true, direction);
      }
      startAutoplay();
    });

    viewport.addEventListener("pointercancel", () => {
      pointerStartX = null;
      startAutoplay();
    });

    document.addEventListener("visibilitychange", startAutoplay);
    reducedMotionQuery.addEventListener("change", startAutoplay);

    setTrackPosition(1, true);
    showSlide(0, false);

    const carouselImages = slides.flatMap(slide => Array.from(slide.querySelectorAll(".project-img")));
    carouselImages.forEach(image => { image.loading = "eager"; });

    Promise.all(carouselImages.map(image => {
      const loadPromise = image.complete
        ? Promise.resolve()
        : new Promise(resolve => {
            image.addEventListener("load", resolve, { once: true });
            image.addEventListener("error", resolve, { once: true });
          });

      return loadPromise
        .then(() => typeof image.decode === "function" ? image.decode() : undefined)
        .catch(() => {});
    })).then(() => {
      isCarouselReady = true;
      carousel.classList.add("is-ready");
      startAutoplay();
    });
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

const designStickerVisibleHitTests = new WeakMap();

function setupInkSketchReveals() {
  function waitForImage(image) {
    const loadPromise = image.complete
      ? Promise.resolve()
      : new Promise(resolve => {
          image.addEventListener("load", resolve, { once: true });
          image.addEventListener("error", resolve, { once: true });
        });

    return loadPromise
      .then(() => typeof image.decode === "function" ? image.decode() : undefined)
      .catch(() => {});
  }

  document.querySelectorAll("[data-ink-sketch-reveal]").forEach(surface => {
    const inkImage = surface.querySelector(".design-ink-art");
    const sketchImage = surface.querySelector(".design-sketch-source");
    if (!inkImage || !sketchImage) return;

    const canvas = document.createElement("canvas");
    const maskCanvas = document.createElement("canvas");
    const sketchCanvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const maskCtx = maskCanvas.getContext("2d");
    const sketchCtx = sketchCanvas.getContext("2d");
    if (!ctx || !maskCtx || !sketchCtx) return;

    const strokes = [];
    const trailLife = 1500;
    let width = 0;
    let height = 0;
    let dpr = 1;
    let rafId = null;
    let lastPoint = null;
    let activePointerId = null;
    let pointerStart = null;
    let ignoreNextClick = false;
    let inkReady = false;
    let sketchReady = false;
    let showCompleteSketch = false;
    let tiltRafId = null;
    let tiltPointer = null;
    let inkAlphaMap = null;
    const hostSticker = surface.closest(".design-sticker");
    const hoverTiltQuery = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const inkStickerFilter = [
      "drop-shadow(3px 0px 0px rgba(255, 255, 255, 0.96))",
      "drop-shadow(-3px 0px 0px rgba(255, 255, 255, 0.96))",
      "drop-shadow(0px 3px 0px rgba(255, 255, 255, 0.96))",
      "drop-shadow(0px -3px 0px rgba(255, 255, 255, 0.96))",
      "drop-shadow(0px 10px 8px rgba(72, 28, 34, 0.18))"
    ].join(" ");

    canvas.className = "ink-sketch-canvas";
    canvas.setAttribute("aria-hidden", "true");
    surface.appendChild(canvas);
    surface.classList.add("is-image-loading");

    waitForImage(inkImage).then(() => {
      inkReady = Boolean(inkImage.naturalWidth && inkImage.naturalHeight);
      if (inkReady) {
        inkImage.classList.add("is-image-ready");
        buildInkAlphaMap();
      }
      surface.classList.remove("is-image-loading");
      renderReveal(performance.now());
    });

    waitForImage(sketchImage).then(() => {
      sketchReady = Boolean(sketchImage.naturalWidth && sketchImage.naturalHeight);
      renderReveal(performance.now());
    });

    function resizeCanvas() {
      const rect = surface.getBoundingClientRect();
      width = surface.clientWidth || rect.width;
      height = surface.clientHeight || rect.height;
      dpr = Math.min(window.devicePixelRatio || 1, 2.5);

      [canvas, maskCanvas, sketchCanvas].forEach(item => {
        item.width = Math.max(1, Math.round(width * dpr));
        item.height = Math.max(1, Math.round(height * dpr));
      });

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      maskCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
      sketchCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      maskCtx.imageSmoothingEnabled = true;
      maskCtx.imageSmoothingQuality = "high";
      sketchCtx.imageSmoothingEnabled = true;
      sketchCtx.imageSmoothingQuality = "high";
    }

    function getLocalPointerPosition(clientX, clientY) {
      const rect = surface.getBoundingClientRect();
      const localWidth = surface.clientWidth || width || rect.width;
      const localHeight = surface.clientHeight || height || rect.height;

      if (typeof surface.getBoxQuads === "function") {
        const quad = surface.getBoxQuads()[0];

        if (quad) {
          const horizontal = {
            x: quad.p2.x - quad.p1.x,
            y: quad.p2.y - quad.p1.y
          };
          const vertical = {
            x: quad.p4.x - quad.p1.x,
            y: quad.p4.y - quad.p1.y
          };
          const pointer = {
            x: clientX - quad.p1.x,
            y: clientY - quad.p1.y
          };
          const determinant = horizontal.x * vertical.y - horizontal.y * vertical.x;

          if (Math.abs(determinant) > 0.0001) {
            const horizontalProgress = (pointer.x * vertical.y - pointer.y * vertical.x) / determinant;
            const verticalProgress = (horizontal.x * pointer.y - horizontal.y * pointer.x) / determinant;

            return {
              x: horizontalProgress * localWidth,
              y: verticalProgress * localHeight,
              width: localWidth,
              height: localHeight
            };
          }
        }
      }

      const sticker = surface.closest(".design-sticker");
      const transform = sticker ? getComputedStyle(sticker).transform : "none";

      if (transform !== "none" && typeof DOMMatrixReadOnly === "function") {
        const matrix = new DOMMatrixReadOnly(transform);
        const determinant = matrix.a * matrix.d - matrix.b * matrix.c;

        if (Math.abs(determinant) > 0.0001) {
          const offsetX = clientX - (rect.left + rect.width / 2);
          const offsetY = clientY - (rect.top + rect.height / 2);

          return {
            x: localWidth / 2 + (matrix.d * offsetX - matrix.c * offsetY) / determinant,
            y: localHeight / 2 + (-matrix.b * offsetX + matrix.a * offsetY) / determinant,
            width: localWidth,
            height: localHeight
          };
        }
      }

      return {
        x: (clientX - rect.left) * (localWidth / rect.width),
        y: (clientY - rect.top) * (localHeight / rect.height),
        width: localWidth,
        height: localHeight
      };
    }

    function drawContainedImage(targetCtx, image) {
      if (!image.naturalWidth || !image.naturalHeight || !width || !height) return;

      const scale = Math.min(width / image.naturalWidth, height / image.naturalHeight);
      const drawWidth = image.naturalWidth * scale;
      const drawHeight = image.naturalHeight * scale;
      const drawX = (width - drawWidth) / 2;
      const drawY = (height - drawHeight) / 2;

      targetCtx.drawImage(image, drawX, drawY, drawWidth, drawHeight);
    }

    function buildInkAlphaMap() {
      const sampleLimit = 720;
      const scale = Math.min(1, sampleLimit / Math.max(inkImage.naturalWidth, inkImage.naturalHeight));
      const mapWidth = Math.max(1, Math.round(inkImage.naturalWidth * scale));
      const mapHeight = Math.max(1, Math.round(inkImage.naturalHeight * scale));
      const alphaCanvas = document.createElement("canvas");
      const alphaContext = alphaCanvas.getContext("2d", { willReadFrequently: true });
      if (!alphaContext) return;

      alphaCanvas.width = mapWidth;
      alphaCanvas.height = mapHeight;
      alphaContext.drawImage(inkImage, 0, 0, mapWidth, mapHeight);

      try {
        inkAlphaMap = {
          width: mapWidth,
          height: mapHeight,
          pixels: alphaContext.getImageData(0, 0, mapWidth, mapHeight).data
        };
      } catch (error) {
        inkAlphaMap = null;
      }
    }

    function isPointOverVisibleInk(pointer) {
      if (!inkAlphaMap || !inkImage.naturalWidth || !inkImage.naturalHeight) return false;

      const imageScale = Math.min(pointer.width / inkImage.naturalWidth, pointer.height / inkImage.naturalHeight);
      const displayedWidth = inkImage.naturalWidth * imageScale;
      const displayedHeight = inkImage.naturalHeight * imageScale;
      const displayedX = (pointer.width - displayedWidth) / 2;
      const displayedY = (pointer.height - displayedHeight) / 2;
      const normalizedX = (pointer.x - displayedX) / displayedWidth;
      const normalizedY = (pointer.y - displayedY) / displayedHeight;

      if (normalizedX < 0 || normalizedX > 1 || normalizedY < 0 || normalizedY > 1) return false;

      const mapX = Math.min(inkAlphaMap.width - 1, Math.max(0, Math.floor(normalizedX * inkAlphaMap.width)));
      const mapY = Math.min(inkAlphaMap.height - 1, Math.max(0, Math.floor(normalizedY * inkAlphaMap.height)));
      return inkAlphaMap.pixels[(mapY * inkAlphaMap.width + mapX) * 4 + 3] > 64;
    }

    if (hostSticker) {
      designStickerVisibleHitTests.set(hostSticker, (clientX, clientY) => {
        const pointer = getLocalPointerPosition(clientX, clientY);
        if (
          pointer.x < 0 ||
          pointer.y < 0 ||
          pointer.x > pointer.width ||
          pointer.y > pointer.height
        ) return false;

        return isPointOverVisibleInk(pointer);
      });
    }

    function drawInkBlot(targetCtx, stroke, alpha) {
      const { x1, y1, x2: x, y2: y, radius, seed } = stroke;
      const direction = Math.atan2(y - y1, x - x1);
      const noise = offset => {
        const value = Math.sin(seed * 12.9898 + offset * 78.233) * 43758.5453;
        return value - Math.floor(value);
      };

      targetCtx.save();
      targetCtx.fillStyle = `rgba(255,255,255,${alpha})`;
      targetCtx.translate(x, y);
      targetCtx.rotate(direction + (noise(1) - 0.5) * 0.22);

      // One continuous uneven pool keeps the edge organic without detached marks.
      const edgePoints = Array.from({ length: 12 }, (_, index) => {
        const angle = index * (Math.PI * 2 / 12);
        const variation = 0.78 + noise(index + 2) * 0.34;

        return {
          x: Math.cos(angle) * radius * 0.46 * variation,
          y: Math.sin(angle) * radius * 0.35 * variation
        };
      });
      const midpoint = (first, second) => ({
        x: (first.x + second.x) / 2,
        y: (first.y + second.y) / 2
      });
      const startingPoint = midpoint(edgePoints[edgePoints.length - 1], edgePoints[0]);

      targetCtx.beginPath();
      targetCtx.moveTo(startingPoint.x, startingPoint.y);
      edgePoints.forEach((point, index) => {
        const nextPoint = edgePoints[(index + 1) % edgePoints.length];
        const nextMidpoint = midpoint(point, nextPoint);
        targetCtx.quadraticCurveTo(point.x, point.y, nextMidpoint.x, nextMidpoint.y);
      });
      targetCtx.closePath();
      targetCtx.fill();

      targetCtx.restore();
    }

    function renderReveal(time) {
      if (!width || !height) resizeCanvas();

      if (!showCompleteSketch) {
        for (let index = strokes.length - 1; index >= 0; index--) {
          if (time - strokes[index].created > trailLife) strokes.splice(index, 1);
        }
      }

      ctx.clearRect(0, 0, width, height);
      maskCtx.clearRect(0, 0, width, height);
      sketchCtx.clearRect(0, 0, width, height);
      if (!inkReady || !sketchReady) {
        rafId = null;
        return;
      }

      if (showCompleteSketch) {
        maskCtx.fillStyle = "#fff";
        maskCtx.fillRect(0, 0, width, height);
      } else {
        maskCtx.lineCap = "round";
        maskCtx.lineJoin = "round";

        strokes.forEach(stroke => {
          const age = time - stroke.created;
          const fadeStart = trailLife * 0.55;
          const fadeProgress = age <= fadeStart
            ? 1
            : Math.max(0, 1 - (age - fadeStart) / (trailLife - fadeStart));
          const alpha = fadeProgress * fadeProgress * (3 - 2 * fadeProgress);

          maskCtx.save();
          maskCtx.strokeStyle = `rgba(255,255,255,${alpha})`;
          maskCtx.lineWidth = stroke.radius * 0.62;
          maskCtx.beginPath();
          maskCtx.moveTo(stroke.x1, stroke.y1);
          maskCtx.lineTo(stroke.x2, stroke.y2);
          maskCtx.stroke();
          maskCtx.restore();

          drawInkBlot(maskCtx, stroke, alpha);
        });

      }

      ctx.save();
      ctx.filter = inkStickerFilter;
      drawContainedImage(ctx, inkImage);
      ctx.restore();

      if (showCompleteSketch || strokes.length) {
        ctx.globalCompositeOperation = "destination-out";
        ctx.drawImage(maskCanvas, 0, 0, width, height);
        ctx.globalCompositeOperation = "source-over";

        drawContainedImage(sketchCtx, sketchImage);
        sketchCtx.globalCompositeOperation = "destination-in";
        sketchCtx.drawImage(maskCanvas, 0, 0, width, height);
        sketchCtx.globalCompositeOperation = "source-over";

        ctx.drawImage(sketchCanvas, 0, 0, width, height);
      }

      surface.classList.add("is-canvas-composited");

      if (!showCompleteSketch && strokes.length) {
        rafId = requestAnimationFrame(renderReveal);
      } else {
        rafId = null;
      }
    }

    function setCompleteSketch(shouldShow) {
      showCompleteSketch = shouldShow;
      strokes.length = 0;
      surface.setAttribute("aria-pressed", String(shouldShow));

      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }

      renderReveal(performance.now());
    }

    function addTrailPoint(event) {
      if (!sketchReady) return;
      if (surface.closest(".design-sticker")?.matches(".is-drag-pending, .is-dragging")) return;
      if (showCompleteSketch) setCompleteSketch(false);

      const pointer = getLocalPointerPosition(event.clientX, event.clientY);
      const { x, y } = pointer;
      if (x < 0 || y < 0 || x > pointer.width || y > pointer.height) return;

      if (lastPoint && Math.hypot(x - lastPoint.x, y - lastPoint.y) < 4) return;

      const previousPoint = lastPoint || { x, y };
      const distance = Math.hypot(x - previousPoint.x, y - previousPoint.y);
      const steps = Math.max(1, Math.ceil(distance / 18));
      const radius = Math.max(36, Math.min(76, Math.min(pointer.width, pointer.height) * 0.105));
      const created = performance.now();

      for (let index = 1; index <= steps; index++) {
        const startProgress = (index - 1) / steps;
        const endProgress = index / steps;

        strokes.push({
          x1: previousPoint.x + (x - previousPoint.x) * startProgress,
          y1: previousPoint.y + (y - previousPoint.y) * startProgress,
          x2: previousPoint.x + (x - previousPoint.x) * endProgress,
          y2: previousPoint.y + (y - previousPoint.y) * endProgress,
          radius,
          created,
          seed: (strokes.length + 1) * 2.37
        });
      }

      lastPoint = { x, y };
      if (strokes.length > 130) strokes.splice(0, strokes.length - 130);
      if (rafId === null) rafId = requestAnimationFrame(renderReveal);
    }

    function updateDrawingTilt(event) {
      if (
        event.pointerType !== "mouse" ||
        !hoverTiltQuery.matches ||
        reducedMotionQuery.matches
      ) return;

      tiltPointer = { x: event.clientX, y: event.clientY };
      if (tiltRafId !== null) return;

      tiltRafId = requestAnimationFrame(() => {
        tiltRafId = null;
        if (!tiltPointer) return;

        const pointer = getLocalPointerPosition(tiltPointer.x, tiltPointer.y);
        const relativeX = Math.max(-1, Math.min(1, pointer.x / pointer.width * 2 - 1));
        const relativeY = Math.max(-1, Math.min(1, pointer.y / pointer.height * 2 - 1));

        surface.style.setProperty("--drawing-tilt-x", `${(-relativeY * 7).toFixed(2)}deg`);
        surface.style.setProperty("--drawing-tilt-y", `${(relativeX * 9).toFixed(2)}deg`);
        surface.classList.add("is-tilting");
      });
    }

    function resetDrawingTilt() {
      tiltPointer = null;
      if (tiltRafId !== null) {
        cancelAnimationFrame(tiltRafId);
        tiltRafId = null;
      }

      surface.classList.remove("is-tilting");
      surface.style.setProperty("--drawing-tilt-x", "0deg");
      surface.style.setProperty("--drawing-tilt-y", "0deg");
    }

    resizeCanvas();

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

    surface.addEventListener("designstickerdragstart", event => {
      const pointerId = event.detail?.pointerId;

      if (pointerId != null && surface.hasPointerCapture?.(pointerId)) {
        surface.releasePointerCapture(pointerId);
      }

      pointerStart = null;
      activePointerId = null;
      lastPoint = null;
      ignoreNextClick = true;
      resetDrawingTilt();
    });

    surface.addEventListener("pointerdown", event => {
      if (event.pointerType === "mouse" && event.button !== 0) return;

      pointerStart = {
        id: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        moved: false
      };

      if (event.pointerType !== "mouse") {
        event.preventDefault();
        activePointerId = event.pointerId;
        surface.setPointerCapture?.(event.pointerId);
        lastPoint = null;
        addTrailPoint(event);
      }
    }, { passive: false });

    surface.addEventListener("pointermove", event => {
      if (pointerStart?.id === event.pointerId) {
        const distance = Math.hypot(event.clientX - pointerStart.x, event.clientY - pointerStart.y);
        if (distance > 10) pointerStart.moved = true;
      }

      updateDrawingTilt(event);
      if (event.pointerType !== "mouse" && event.pointerId !== activePointerId) return;
      if (event.pointerType !== "mouse") event.preventDefault();
      addTrailPoint(event);
    }, { passive: false });

    function finishPointer(event) {
      if (pointerStart?.id === event.pointerId) {
        ignoreNextClick = pointerStart.moved;
        pointerStart = null;
      }

      if (event.pointerId !== activePointerId) return;
      if (surface.hasPointerCapture?.(event.pointerId)) {
        surface.releasePointerCapture(event.pointerId);
      }
      activePointerId = null;
      lastPoint = null;
    }

    surface.addEventListener("pointerup", finishPointer);
    surface.addEventListener("pointercancel", finishPointer);
    surface.addEventListener("pointerleave", () => {
      lastPoint = null;
      resetDrawingTilt();
    });

    surface.addEventListener("click", () => {
      if (ignoreNextClick) {
        ignoreNextClick = false;
        return;
      }
      setCompleteSketch(!showCompleteSketch);
    });

    surface.addEventListener("keydown", event => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      setCompleteSketch(!showCompleteSketch);
    });
  });
}

function setupDraggableDesignStickers() {
  const sheet = document.querySelector(".sticker-sheet");
  const stickers = sheet ? Array.from(sheet.querySelectorAll(".design-sticker")) : [];
  if (!sheet || !stickers.length) return;

  const dragThreshold = 7;
  const restickDuration = 440;
  const restickTimers = new WeakMap();
  let activeDrag = null;
  let resizeRafId = null;
  let topStickerZIndex = stickers.reduce((highest, sticker) => {
    const zIndex = Number.parseInt(getComputedStyle(sticker).zIndex, 10);
    return Number.isFinite(zIndex) ? Math.max(highest, zIndex) : highest;
  }, 10);

  function getStickerLocalPointer(sticker, clientX, clientY) {
    const rect = sticker.getBoundingClientRect();
    const localWidth = sticker.offsetWidth || rect.width;
    const localHeight = sticker.offsetHeight || rect.height;

    if (typeof sticker.getBoxQuads === "function") {
      const quad = sticker.getBoxQuads()[0];

      if (quad) {
        const horizontalX = quad.p2.x - quad.p1.x;
        const horizontalY = quad.p2.y - quad.p1.y;
        const verticalX = quad.p4.x - quad.p1.x;
        const verticalY = quad.p4.y - quad.p1.y;
        const pointerX = clientX - quad.p1.x;
        const pointerY = clientY - quad.p1.y;
        const determinant = horizontalX * verticalY - horizontalY * verticalX;

        if (Math.abs(determinant) > 0.0001) {
          return {
            x: (pointerX * verticalY - pointerY * verticalX) / determinant * localWidth,
            y: (horizontalX * pointerY - horizontalY * pointerX) / determinant * localHeight,
            width: localWidth,
            height: localHeight
          };
        }
      }
    }

    const transform = getComputedStyle(sticker).transform;
    if (transform !== "none" && typeof DOMMatrixReadOnly === "function") {
      const matrix = new DOMMatrixReadOnly(transform);
      const determinant = matrix.a * matrix.d - matrix.b * matrix.c;

      if (Math.abs(determinant) > 0.0001) {
        const offsetX = clientX - (rect.left + rect.width / 2);
        const offsetY = clientY - (rect.top + rect.height / 2);

        return {
          x: localWidth / 2 + (matrix.d * offsetX - matrix.c * offsetY) / determinant,
          y: localHeight / 2 + (-matrix.b * offsetX + matrix.a * offsetY) / determinant,
          width: localWidth,
          height: localHeight
        };
      }
    }

    return {
      x: (clientX - rect.left) * (localWidth / rect.width),
      y: (clientY - rect.top) * (localHeight / rect.height),
      width: localWidth,
      height: localHeight
    };
  }

  function registerStickerAlphaHitTest(sticker) {
    if (designStickerVisibleHitTests.has(sticker)) return;

    const image = sticker.querySelector(":scope > img");
    if (!image) return;
    let alphaMap = null;

    const buildAlphaMap = () => {
      if (!image.naturalWidth || !image.naturalHeight) return;

      const sampleLimit = 720;
      const scale = Math.min(1, sampleLimit / Math.max(image.naturalWidth, image.naturalHeight));
      const mapWidth = Math.max(1, Math.round(image.naturalWidth * scale));
      const mapHeight = Math.max(1, Math.round(image.naturalHeight * scale));
      const alphaCanvas = document.createElement("canvas");
      const alphaContext = alphaCanvas.getContext("2d", { willReadFrequently: true });
      if (!alphaContext) return;

      alphaCanvas.width = mapWidth;
      alphaCanvas.height = mapHeight;
      alphaContext.drawImage(image, 0, 0, mapWidth, mapHeight);

      try {
        alphaMap = {
          width: mapWidth,
          height: mapHeight,
          pixels: alphaContext.getImageData(0, 0, mapWidth, mapHeight).data
        };
      } catch (error) {
        alphaMap = null;
      }
    };

    designStickerVisibleHitTests.set(sticker, (clientX, clientY) => {
      if (!alphaMap || !image.naturalWidth || !image.naturalHeight) return false;

      const pointer = getStickerLocalPointer(sticker, clientX, clientY);
      if (
        pointer.x < 0 ||
        pointer.y < 0 ||
        pointer.x > pointer.width ||
        pointer.y > pointer.height
      ) return false;

      const imageScale = Math.min(pointer.width / image.naturalWidth, pointer.height / image.naturalHeight);
      const displayedWidth = image.naturalWidth * imageScale;
      const displayedHeight = image.naturalHeight * imageScale;
      const displayedX = (pointer.width - displayedWidth) / 2;
      const displayedY = (pointer.height - displayedHeight) / 2;
      const normalizedX = (pointer.x - displayedX) / displayedWidth;
      const normalizedY = (pointer.y - displayedY) / displayedHeight;
      if (normalizedX < 0 || normalizedX > 1 || normalizedY < 0 || normalizedY > 1) return false;

      const mapX = Math.min(alphaMap.width - 1, Math.max(0, Math.floor(normalizedX * alphaMap.width)));
      const mapY = Math.min(alphaMap.height - 1, Math.max(0, Math.floor(normalizedY * alphaMap.height)));
      return alphaMap.pixels[(mapY * alphaMap.width + mapX) * 4 + 3] > 64;
    });

    if (image.complete && image.naturalWidth) buildAlphaMap();
    else image.addEventListener("load", buildAlphaMap, { once: true });
  }

  function getTopmostVisibleSticker(clientX, clientY) {
    const seen = new Set();

    for (const element of document.elementsFromPoint(clientX, clientY)) {
      const sticker = element.closest?.(".design-sticker");
      if (!sticker || !sheet.contains(sticker) || seen.has(sticker)) continue;
      seen.add(sticker);

      const hitTest = designStickerVisibleHitTests.get(sticker);
      if (!hitTest || hitTest(clientX, clientY)) return sticker;
    }

    return null;
  }

  stickers.forEach(registerStickerAlphaHitTest);

  function clamp(value, minimum, maximum) {
    return Math.min(maximum, Math.max(minimum, value));
  }

  function clearRestick(sticker) {
    const timer = restickTimers.get(sticker);
    if (timer) window.clearTimeout(timer);
    restickTimers.delete(sticker);
    sticker.classList.remove("is-resticking");
  }

  function prepareDrag(sticker, event) {
    if (activeDrag || event.isPrimary === false) return;
    if (event.pointerType === "mouse" && event.button !== 0) return;

    clearRestick(sticker);
    sticker.classList.add("is-drag-pending");
    activeDrag = {
      sticker,
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startLeft: 0,
      startTop: 0,
      dragging: false
    };
  }

  function beginDrag(drag) {
    const { sticker } = drag;
    drag.startLeft = sticker.offsetLeft;
    drag.startTop = sticker.offsetTop;
    drag.dragging = true;
    topStickerZIndex += 1;

    sticker.style.left = `${drag.startLeft}px`;
    sticker.style.top = `${drag.startTop}px`;
    sticker.style.right = "auto";
    sticker.style.bottom = "auto";
    sticker.style.zIndex = String(topStickerZIndex);
    sticker.classList.add("is-dragging");

    const revealSurface = sticker.querySelector("[data-ink-sketch-reveal]");
    revealSurface?.dispatchEvent(new CustomEvent("designstickerdragstart", {
      detail: { pointerId: drag.pointerId }
    }));
  }

  function moveDrag(event) {
    const drag = activeDrag;
    if (!drag || event.pointerId !== drag.pointerId) return;

    const deltaX = event.clientX - drag.startClientX;
    const deltaY = event.clientY - drag.startClientY;

    if (!drag.dragging) {
      if (Math.hypot(deltaX, deltaY) < dragThreshold) return;
      beginDrag(drag);
    }

    const stickerWidth = drag.sticker.offsetWidth;
    const stickerHeight = drag.sticker.offsetHeight;
    const horizontalOverhang = Math.min(34, stickerWidth * 0.12);
    const verticalOverhang = Math.min(26, stickerHeight * 0.1);
    const maximumLeft = Math.max(
      -horizontalOverhang,
      sheet.clientWidth - stickerWidth + horizontalOverhang
    );
    const maximumTop = Math.max(
      -verticalOverhang,
      sheet.clientHeight - stickerHeight + verticalOverhang
    );

    drag.sticker.style.left = `${clamp(
      drag.startLeft + deltaX,
      -horizontalOverhang,
      maximumLeft
    )}px`;
    drag.sticker.style.top = `${clamp(
      drag.startTop + deltaY,
      -verticalOverhang,
      maximumTop
    )}px`;

    if (event.cancelable) event.preventDefault();
  }

  function finishDrag(event) {
    const drag = activeDrag;
    if (!drag || (event && event.pointerId !== drag.pointerId)) return;
    activeDrag = null;

    drag.sticker.classList.remove("is-drag-pending");
    if (!drag.dragging) return;

    if (event?.cancelable) event.preventDefault();
    drag.sticker.classList.remove("is-dragging");
    drag.sticker.classList.add("is-resticking");

    const timer = window.setTimeout(() => {
      drag.sticker.classList.remove("is-resticking");
      restickTimers.delete(drag.sticker);
    }, restickDuration);
    restickTimers.set(drag.sticker, timer);
  }

  stickers.forEach(sticker => {
    sticker.addEventListener("pointerdown", event => {
      const visibleSticker = getTopmostVisibleSticker(event.clientX, event.clientY);
      if (visibleSticker) prepareDrag(visibleSticker, event);
    }, { capture: true });
    sticker.addEventListener("dragstart", event => event.preventDefault());
  });

  document.addEventListener("pointermove", moveDrag, { passive: false });
  document.addEventListener("pointerup", finishDrag);
  document.addEventListener("pointercancel", finishDrag);
  window.addEventListener("blur", () => finishDrag(null));

  window.addEventListener("resize", () => {
    if (activeDrag) finishDrag(null);
    if (resizeRafId !== null) cancelAnimationFrame(resizeRafId);

    resizeRafId = requestAnimationFrame(() => {
      resizeRafId = null;
      stickers.forEach(sticker => {
        clearRestick(sticker);
        sticker.classList.remove("is-drag-pending", "is-dragging");
        sticker.style.removeProperty("left");
        sticker.style.removeProperty("top");
        sticker.style.removeProperty("right");
        sticker.style.removeProperty("bottom");
      });
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
  const activeImagePointers = new Map();
  let zoomScale = 1;
  let panX = 0;
  let panY = 0;
  let singlePointerStart = null;
  let pinchStart = null;
  let gestureUsedPinch = false;

  function getProjectImages(media) {
    if (media.matches("[data-project-carousel]")) {
      return Array.from(media.querySelectorAll("[data-carousel-slide] .project-img"));
    }

    if (media.classList.contains("doodle-reveal")) {
      return Array.from(media.querySelectorAll(".project-img"));
    }

    const image = media.querySelector(".project-img:not(.project-original-img)");
    return image ? [image] : [];
  }

  function applyImageTransform() {
    if (zoomScale <= 1.001 && Math.abs(panX) < 0.5 && Math.abs(panY) < 0.5) {
      lightboxImage.style.removeProperty("transform");
      lightboxImage.classList.remove("is-zoomed");
      return;
    }

    lightboxImage.style.transform = `translate3d(${panX}px, ${panY}px, 0) scale(${zoomScale})`;
    lightboxImage.classList.toggle("is-zoomed", zoomScale > 1.001);
  }

  function constrainImagePan() {
    if (zoomScale <= 1) {
      panX = 0;
      panY = 0;
      return;
    }

    const scaledWidth = lightboxImage.clientWidth * zoomScale;
    const scaledHeight = lightboxImage.clientHeight * zoomScale;
    const maximumPanX = Math.max(0, (scaledWidth - window.innerWidth) / 2);
    const maximumPanY = Math.max(0, (scaledHeight - window.innerHeight) / 2);
    panX = clamp(panX, -maximumPanX, maximumPanX);
    panY = clamp(panY, -maximumPanY, maximumPanY);
  }

  function resetImageGesture() {
    activeImagePointers.clear();
    zoomScale = 1;
    panX = 0;
    panY = 0;
    singlePointerStart = null;
    pinchStart = null;
    gestureUsedPinch = false;
    applyImageTransform();
  }

  function beginPinchGesture() {
    const pointers = Array.from(activeImagePointers.values()).slice(0, 2);
    if (pointers.length < 2) return;

    const [firstPointer, secondPointer] = pointers;
    const midpointX = (firstPointer.x + secondPointer.x) / 2;
    const midpointY = (firstPointer.y + secondPointer.y) / 2;
    const imageRect = lightboxImage.getBoundingClientRect();

    pinchStart = {
      distance: Math.max(1, Math.hypot(secondPointer.x - firstPointer.x, secondPointer.y - firstPointer.y)),
      scale: zoomScale,
      panX,
      panY,
      midpointX,
      midpointY,
      imageCenterX: imageRect.left + imageRect.width / 2 - panX,
      imageCenterY: imageRect.top + imageRect.height / 2 - panY
    };
  }

  function showLightboxImage(index) {
    if (!lightboxImages.length) return;

    resetImageGesture();
    currentImageIndex = (index + lightboxImages.length) % lightboxImages.length;
    const image = lightboxImages[currentImageIndex];
    const hasMultipleImages = lightboxImages.length > 1;
    const imageLabel = image.dataset.lightboxLabel?.trim();

    lightboxImage.src = image.currentSrc || image.src;
    lightboxImage.alt = image.dataset.lightboxAlt || image.alt || "Expanded project image";
    previousButton.hidden = !hasMultipleImages;
    nextButton.hidden = !hasMultipleImages;
    status.hidden = !hasMultipleImages;
    status.textContent = hasMultipleImages
      ? `${imageLabel ? `${imageLabel} · ` : ""}${currentImageIndex + 1} / ${lightboxImages.length}`
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
    resetImageGesture();
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
    activeImagePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    lightboxImage.setPointerCapture?.(event.pointerId);

    if (activeImagePointers.size === 1) {
      gestureUsedPinch = false;
      singlePointerStart = {
        id: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        panX,
        panY,
        scale: zoomScale
      };
    } else if (activeImagePointers.size >= 2) {
      gestureUsedPinch = true;
      singlePointerStart = null;
      beginPinchGesture();
    }
  });

  lightboxImage.addEventListener("pointermove", event => {
    if (!activeImagePointers.has(event.pointerId)) return;
    event.preventDefault();
    activeImagePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (activeImagePointers.size >= 2) {
      if (!pinchStart) beginPinchGesture();
      const pointers = Array.from(activeImagePointers.values()).slice(0, 2);
      if (!pinchStart || pointers.length < 2) return;

      const [firstPointer, secondPointer] = pointers;
      const midpointX = (firstPointer.x + secondPointer.x) / 2;
      const midpointY = (firstPointer.y + secondPointer.y) / 2;
      const distance = Math.max(1, Math.hypot(
        secondPointer.x - firstPointer.x,
        secondPointer.y - firstPointer.y
      ));
      const nextScale = clamp(pinchStart.scale * (distance / pinchStart.distance), 1, 4);
      const scaleRatio = nextScale / pinchStart.scale;

      zoomScale = nextScale;
      panX = midpointX - pinchStart.imageCenterX
        - scaleRatio * (pinchStart.midpointX - pinchStart.imageCenterX - pinchStart.panX);
      panY = midpointY - pinchStart.imageCenterY
        - scaleRatio * (pinchStart.midpointY - pinchStart.imageCenterY - pinchStart.panY);
      constrainImagePan();
      applyImageTransform();
      return;
    }

    if (zoomScale > 1 && singlePointerStart?.id === event.pointerId) {
      panX = singlePointerStart.panX + event.clientX - singlePointerStart.x;
      panY = singlePointerStart.panY + event.clientY - singlePointerStart.y;
      constrainImagePan();
      applyImageTransform();
    }
  });

  function finishImagePointer(event, allowSwipe) {
    if (!activeImagePointers.has(event.pointerId)) return;

    const pointerStart = singlePointerStart?.id === event.pointerId
      ? singlePointerStart
      : null;
    activeImagePointers.delete(event.pointerId);

    if (activeImagePointers.size >= 2) {
      beginPinchGesture();
      return;
    }

    if (activeImagePointers.size === 1) {
      const [remainingPointerId, remainingPointer] = activeImagePointers.entries().next().value;
      singlePointerStart = {
        id: remainingPointerId,
        x: remainingPointer.x,
        y: remainingPointer.y,
        panX,
        panY,
        scale: zoomScale
      };
      pinchStart = null;
      return;
    }

    if (zoomScale <= 1.001) {
      zoomScale = 1;
      panX = 0;
      panY = 0;
      applyImageTransform();
    }

    if (allowSwipe && !gestureUsedPinch && pointerStart?.scale <= 1.001) {
      const deltaX = event.clientX - pointerStart.x;
      const deltaY = event.clientY - pointerStart.y;

      if (lightboxImages.length > 1 && Math.abs(deltaX) >= 45 && Math.abs(deltaX) >= Math.abs(deltaY)) {
        showLightboxImage(currentImageIndex + (deltaX < 0 ? 1 : -1));
      }
    }

    singlePointerStart = null;
    pinchStart = null;
    gestureUsedPinch = false;
  }

  lightboxImage.addEventListener("pointerup", event => {
    finishImagePointer(event, true);
  });

  lightboxImage.addEventListener("pointercancel", event => {
    finishImagePointer(event, false);
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
  setupSkillTipToggle();

  function revealSection(el) {
    applyRevealTiming(el);
    el.classList.add("is-visible");
    requestAnimationFrame(() => accelerateActiveReveals(el));
  }

  runWhenVisible(document.querySelectorAll(".page-section"), el => {
    if (el.id === "home" && !window.siteIsReady) {
      window.addEventListener("site:ready", () => revealSection(el), { once: true });
      return;
    }

    revealSection(el);
  });

  setupProjectCarousels();
  setupDoodleReveal();
  setupInkSketchReveals();
  setupDraggableDesignStickers();
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
