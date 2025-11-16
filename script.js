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


window.addEventListener("load", () => {
  setTimeout(() => {
    document.getElementById("location_icon").classList.add("animate");
  }, 4500); // 4.5 second delay
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
      // force reflow so next animation starts freshly
      void dot.offsetWidth;
    }

    function playForward() {
      // cancel a running reverse
      if (reversePlaying) {
        reversePlaying = false;
        clearAndReflow();
      }

      reverseQueued = false;
      forwardPlaying = true;

      // start forward and keep final state with 'forwards'
      dot.style.animation = `moveUp ${DURATION}ms ease-in-out forwards`;
      trunk.style.animation = `moveTrunk ${DURATION}ms ease-in-out forwards`;

      // when forward ends, either trigger queued reverse or remain at 100%
      dot.addEventListener('animationend', function onFwdEnd() {
        forwardPlaying = false;
        dot.removeEventListener('animationend', onFwdEnd);
        if (reverseQueued) {
          reverseQueued = false;
          playReverse();
        }
        // otherwise leave the element at final keyframe (forwards)
      }, { once: true });
    }

    function playReverse() {
      // if forward is still running, just queue reverse
      if (forwardPlaying) {
        reverseQueued = true;
        return;
      }
      // if already reversing, do nothing
      if (reversePlaying) return;

      reversePlaying = true;
      clearAndReflow();

      // play the same keyframes in reverse and keep initial state with 'forwards'
      dot.style.animation = `moveUp ${DURATION}ms ease-in-out reverse forwards`;
      trunk.style.animation = `moveTrunk ${DURATION}ms ease-in-out reverse forwards`;

      dot.addEventListener('animationend', function onRevEnd() {
        reversePlaying = false;
        dot.removeEventListener('animationend', onRevEnd);
        // clear inline animations so next hover starts fresh
        dot.style.animation = '';
        trunk.style.animation = '';
      }, { once: true });
    }

    // event wiring
    container.addEventListener('mouseenter', () => {
      // immediately play forward (cancel reverse if happening)
      playForward();
    });

    container.addEventListener('mouseleave', () => {
      // if forward is running, queue the reverse, otherwise reverse now
      if (forwardPlaying) {
        reverseQueued = true;
      } else {
        playReverse();
      }
    });
  });
});
