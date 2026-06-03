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
    const overlay = surface.querySelector(".project-doodle-img");
    if (!overlay) return;

    const trail = [];
    let rafId = null;
    let lastPoint = null;
    let pointerInside = false;
    const trailLife = 780;

    function setMask(mask) {
      overlay.style.maskImage = mask;
      overlay.style.webkitMaskImage = mask;
    }

    function updateTrail(time) {
      if (pointerInside && lastPoint && trail.length) {
        const activePoint = trail[trail.length - 1];
        activePoint.x = lastPoint.x;
        activePoint.y = lastPoint.y;
        activePoint.created = time;
      }

      for (let i = trail.length - 1; i >= 0; i--) {
        if (time - trail[i].created > trailLife) trail.splice(i, 1);
      }

      if (!trail.length) {
        setMask("radial-gradient(circle 0 at 50% 50%, #000 0, transparent 100%)");
        rafId = null;
        return;
      }

      const masks = trail.map(point => {
        const age = time - point.created;
        const strength = Math.max(0, 1 - age / trailLife);
        const radius = point.radius * (0.75 + strength * 0.45);
        return `radial-gradient(circle ${radius}px at ${point.x}px ${point.y}px, rgba(0,0,0,${strength}) 0%, rgba(0,0,0,${strength * 0.86}) 38%, rgba(0,0,0,0) 72%)`;
      });

      setMask(masks.join(", "));
      rafId = requestAnimationFrame(updateTrail);
    }

    function addTrailPoint(event) {
      const rect = surface.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      if (x < 0 || y < 0 || x > rect.width || y > rect.height) return;
      pointerInside = true;

      if (lastPoint && Math.hypot(x - lastPoint.x, y - lastPoint.y) < 7) {
        lastPoint = { x, y };
        if (!rafId) rafId = requestAnimationFrame(updateTrail);
        return;
      }

      lastPoint = { x, y };
      trail.push({
        x,
        y,
        created: performance.now(),
        radius: Math.max(200, Math.min(rect.width, rect.height) * 0.5)
      });

      if (trail.length > 18) trail.shift();
      if (!rafId) rafId = requestAnimationFrame(updateTrail);
    }

    surface.addEventListener("pointermove", addTrailPoint);
    surface.addEventListener("pointerleave", () => {
      pointerInside = false;
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
