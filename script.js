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

    // Hover out: hide after 2s
    el.addEventListener("mouseleave", () => {
      if (!tooltip) return;
      hoverTimeout = setTimeout(() => {
        tooltip.classList.remove("show");
        if (currentTooltip === tooltip) currentTooltip = null;
      }, 2000);
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

// Add a class when the slideInRight animation completes so hover transforms work reliably
document.querySelectorAll('.options h3').forEach(el => {
  el.addEventListener('animationend', (e) => {
    // Ensure we're responding to the expected keyframe animation
    if (e.animationName && e.animationName !== 'slideInRight') return;

    // Add the class (listener fires once per element by specifying { once: true } below)
    el.classList.add('animation-finished');
  }, { once: true });
});



