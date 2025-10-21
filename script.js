// Wait until the page loads
window.addEventListener("DOMContentLoaded", () => {
  const returnBtn = document.getElementById("return");

  if (returnBtn){
    // Hover: change image
    returnBtn.addEventListener("mouseover", () => {
      returnBtn.style.width = "120px";
      returnBtn.style.transition = "width 0.3s ease"
      returnBtn.src = "img/return_arrow_ex.png";
    });

    // Hover out: revert image
    returnBtn.addEventListener("mouseout", () => {
      returnBtn.style.width = "70px";
      returnBtn.style.transition = "width 0.3s ease";
      returnBtn.src = "img/return_fill.png";
    });

    // Click: go back to home page
    returnBtn.addEventListener("click", () => {
      window.location.href = "home_page.html";
    });
  }
});


function setupCopyTooltips(selector) {
  const elements = document.querySelectorAll(selector);
  let currentTooltip = null;  // tracks currently visible tooltip
  let hoverTimeout = null;     // tracks hover timeout globally

  elements.forEach(el => {
    const tooltip = el.querySelector(".tooltip-text");
    const textToCopy = el.dataset.copy;

    // Hover behavior
    el.addEventListener("mouseenter", () => {
      // Hide previous tooltip immediately
      if (currentTooltip && currentTooltip !== tooltip) {
        currentTooltip.classList.remove("show");
        clearTimeout(hoverTimeout);
      }

      tooltip.classList.add("show");
      currentTooltip = tooltip;
      clearTimeout(hoverTimeout);
    });

    // Hover out: hide tooltip after 2 seconds
    el.addEventListener("mouseleave", () => {
      hoverTimeout = setTimeout(() => {
        tooltip.classList.remove("show");
        if (currentTooltip === tooltip) currentTooltip = null;
      }, 2000);
    });

    // Click behavior: copy to clipboard
    el.addEventListener("click", async () => {
      clearTimeout(hoverTimeout); // prevent hover timeout from hiding tooltip
      try {
        await navigator.clipboard.writeText(textToCopy);
        tooltip.textContent = "Copied!";
        tooltip.classList.add("show");

        setTimeout(() => {
          tooltip.textContent = textToCopy;
          tooltip.classList.remove("show");
          if (currentTooltip === tooltip) currentTooltip = null;
        }, 1500);
      } catch (err) {
        tooltip.textContent = "Error!";
        tooltip.classList.add("show");
        setTimeout(() => {
          tooltip.textContent = textToCopy;
          tooltip.classList.remove("show");
          if (currentTooltip === tooltip) currentTooltip = null;
        }, 1500);
      }
    });
  });
}

// Apply to all tooltip elements
setupCopyTooltips(".tooltip");




