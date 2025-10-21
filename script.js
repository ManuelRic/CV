// Wait until the page loads
window.addEventListener("DOMContentLoaded", () => {
  const returnBtn = document.getElementById("return");

  // Hover: change image
  returnBtn.addEventListener("mouseover", () => {
    returnBtn.style.width = "120px";
    returnBtn.style.transition = "width 0.3s ease"
    returnBtn.src = "img/return_arrow_ex.png";
  });

  // Hover out: revert image
  returnBtn.addEventListener("mouseout", () => {
    returnBtn.style.width = "70px";
    returnBtn.style.transition = "width 0.3s ease"
    returnBtn.src = "img/return_fill.png";
  });

  // Click: go back to home page
  returnBtn.addEventListener("click", () => {
    window.location.href = "home_page.html";
  });
});


function setupCopyTooltips(selector) {
const elements = document.querySelectorAll(selector);

elements.forEach(el => {
    const tooltip = el.querySelector(".tooltip-text");
    const textToCopy = el.dataset.copy;

    el.addEventListener("click", async () => {
    try {
        await navigator.clipboard.writeText(textToCopy);
        tooltip.textContent = "Copied!";
        tooltip.classList.add("show");

        // revert after 1.5s
        setTimeout(() => {
        tooltip.textContent = textToCopy;
        tooltip.classList.remove("show");
        }, 1500);
    } catch (err) {
        tooltip.textContent = "Error!";
        tooltip.classList.add("show");
        setTimeout(() => {
        tooltip.textContent = textToCopy;
        tooltip.classList.remove("show");
        }, 1500);
    }
    });
});
}

// apply to all tooltip elements
setupCopyTooltips(".tooltip");



