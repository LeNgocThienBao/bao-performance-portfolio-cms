
/* ==================================================
   BAO LE — PERFORMANCE MARKETING PORTFOLIO
   FRONTEND V2
   ADVANCED MOTION & INTERACTION SYSTEM
================================================== */

(() => {

  "use strict";


  /* ==================================================
     01. CONFIGURATION
  ================================================== */

  const CONFIG = {

    headerScrollThreshold: 24,

    magneticStrength: 0.16,

    magneticMaxDistance: 8,

    staggerInterval: 35,

    staggerMaxDelay: 280,

    magneticSelector: [
      ".hero-actions .btn",
      ".hero-actions .button",
      ".nav-contact",
      ".cv-banner .btn",
      ".contact-panel .btn"
    ].join(", ")

  };


  /* ==================================================
     02. UTILITIES
  ================================================== */

  const $ = (selector, root = document) =>
    root.querySelector(selector);

  const $$ = (selector, root = document) =>
    Array.from(root.querySelectorAll(selector));

  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  );

  const finePointer = window.matchMedia(
    "(hover: hover) and (pointer: fine)"
  );

  const magneticBindings = new Map();

  let contentObserver = null;

  let refreshFrame = 0;

  let initialized = false;


  function clamp(value, min, max) {

    return Math.min(
      max,
      Math.max(min, value)
    );

  }


  function canUseMagnetic() {

    return (
      finePointer.matches &&
      !reducedMotion.matches
    );

  }


  /* ==================================================
     03. HEADER SCROLL STATE
  ================================================== */

  function initHeaderScroll() {

    const header = $(
      ".topbar, .site-header"
    );

    if (!header) return;

    let frame = 0;

    let previousState = null;


    function updateHeader() {

      frame = 0;

      const scrolled =
        window.scrollY >
        CONFIG.headerScrollThreshold;

      if (scrolled === previousState) {
        return;
      }

      header.classList.toggle(
        "is-scrolled",
        scrolled
      );

      previousState = scrolled;

    }


    function requestUpdate() {

      if (frame) return;

      frame = requestAnimationFrame(
        updateHeader
      );

    }


    window.addEventListener(
      "scroll",
      requestUpdate,
      { passive: true }
    );

    window.addEventListener(
      "resize",
      requestUpdate,
      { passive: true }
    );

    window.addEventListener(
      "pageshow",
      requestUpdate
    );

    updateHeader();

  }


  /* ==================================================
     04. MAGNETIC BUTTON
  ================================================== */

  function bindMagneticButton(element) {

    if (magneticBindings.has(element)) {
      return;
    }

    let frame = 0;

    let bounds = null;

    let targetX = 0;

    let targetY = 0;


    function applyPosition() {

      frame = 0;

      element.style.setProperty(
        "--magnetic-x",
        `${targetX}px`
      );

      element.style.setProperty(
        "--magnetic-y",
        `${targetY}px`
      );

    }


    function resetPosition() {

      if (frame) {

        cancelAnimationFrame(frame);

        frame = 0;

      }

      targetX = 0;

      targetY = 0;

      bounds = null;

      element.style.removeProperty(
        "--magnetic-x"
      );

      element.style.removeProperty(
        "--magnetic-y"
      );

    }


    function handleEnter(event) {

      if (
        !canUseMagnetic() ||
        event.pointerType !== "mouse"
      ) {
        return;
      }

      bounds =
        element.getBoundingClientRect();

    }


    function handleMove(event) {

      if (
        !canUseMagnetic() ||
        event.pointerType !== "mouse"
      ) {
        return;
      }

      if (!bounds) {

        bounds =
          element.getBoundingClientRect();

      }

      const centerX =
        bounds.left + bounds.width / 2;

      const centerY =
        bounds.top + bounds.height / 2;

      const max =
        CONFIG.magneticMaxDistance;

      targetX = clamp(
        (event.clientX - centerX) *
          CONFIG.magneticStrength,
        -max,
        max
      );

      targetY = clamp(
        (event.clientY - centerY) *
          CONFIG.magneticStrength,
        -max,
        max
      );

      if (!frame) {

        frame = requestAnimationFrame(
          applyPosition
        );

      }

    }


    element.classList.add(
      "motion-magnetic"
    );

    element.addEventListener(
      "pointerenter",
      handleEnter
    );

    element.addEventListener(
      "pointermove",
      handleMove,
      { passive: true }
    );

    element.addEventListener(
      "pointerleave",
      resetPosition
    );

    element.addEventListener(
      "pointercancel",
      resetPosition
    );

    element.addEventListener(
      "blur",
      resetPosition
    );


    function cleanup() {

      resetPosition();

      element.classList.remove(
        "motion-magnetic"
      );

      element.removeEventListener(
        "pointerenter",
        handleEnter
      );

      element.removeEventListener(
        "pointermove",
        handleMove
      );

      element.removeEventListener(
        "pointerleave",
        resetPosition
      );

      element.removeEventListener(
        "pointercancel",
        resetPosition
      );

      element.removeEventListener(
        "blur",
        resetPosition
      );

    }


    magneticBindings.set(
      element,
      {
        cleanup,
        reset: resetPosition
      }
    );

  }


  /* ==================================================
     05. MAGNETIC BUTTON MANAGEMENT
  ================================================== */

  function refreshMagneticButtons() {

    const enabled = canUseMagnetic();

    magneticBindings.forEach(
      (binding, element) => {

        if (
          !enabled ||
          !element.isConnected ||
          !element.matches(
            CONFIG.magneticSelector
          )
        ) {

          binding.cleanup();

          magneticBindings.delete(
            element
          );

        }

      }
    );

    if (!enabled) return;

    $$(CONFIG.magneticSelector)
      .forEach(bindMagneticButton);

  }


  function resetMagneticButtons() {

    magneticBindings.forEach(
      binding => binding.reset()
    );

  }


  /* ==================================================
     06. DYNAMIC STAGGER ANIMATION
  ================================================== */

  function applyStagger(
    container,
    selector
  ) {

    const items = $$(
      selector,
      container
    );

    items.forEach(
      (item, index) => {

        if (reducedMotion.matches) {

          item.style.removeProperty(
            "--item-delay"
          );

          return;

        }

        const delay = Math.min(

          index *
            CONFIG.staggerInterval,

          CONFIG.staggerMaxDelay

        );

        item.style.setProperty(
          "--item-delay",
          `${delay}ms`
        );

      }
    );

  }


  function initStaggerAnimations() {

    $$(".competency-card")
      .forEach(card => {

        applyStagger(
          card,
          ".competency-list li"
        );

      });

    $$(".tool-group")
      .forEach(group => {

        applyStagger(
          group,
          ".tool-chip"
        );

      });

  }


  /* ==================================================
     07. REFRESH DYNAMIC CONTENT
  ================================================== */

  function refreshInteractions() {

    refreshFrame = 0;

    initStaggerAnimations();

    refreshMagneticButtons();

  }


  function scheduleRefresh() {

    if (refreshFrame) return;

    refreshFrame =
      requestAnimationFrame(
        refreshInteractions
      );

  }


  /* ==================================================
     08. CMS CONTENT OBSERVER

     Observe DOM content changes only.

     The existing portfolio.js remains
     responsible for CMS data fetching
     and IntersectionObserver animations.
  ================================================== */

  function initContentObserver() {

    if (
      !("MutationObserver" in window)
    ) {
      return;
    }

    if (contentObserver) {

      contentObserver.disconnect();

    }

    const root = $("main") ||
      document.body;

    contentObserver =
      new MutationObserver(
        mutations => {

          const hasContentChanges =
            mutations.some(
              mutation =>
                mutation.type === "childList"
            );

          if (hasContentChanges) {

            scheduleRefresh();

          }

        }
      );

    contentObserver.observe(
      root,
      {
        childList: true,
        subtree: true
      }
    );

  }


  /* ==================================================
     09. MOTION PREFERENCE MANAGEMENT
  ================================================== */

  function handleMotionPreference() {

    resetMagneticButtons();

    scheduleRefresh();

  }


  function initMotionPreferences() {

    [reducedMotion, finePointer]
      .forEach(media => {

        if (
          typeof media.addEventListener
            === "function"
        ) {

          media.addEventListener(
            "change",
            handleMotionPreference
          );

        } else if (
          typeof media.addListener
            === "function"
        ) {

          media.addListener(
            handleMotionPreference
          );

        }

      });

  }


  /* ==================================================
     10. VIEWPORT INTERACTION MANAGEMENT
  ================================================== */

  function initViewportEvents() {

    let resetFrame = 0;

    function requestReset() {

      if (resetFrame) return;

      resetFrame =
        requestAnimationFrame(() => {

          resetFrame = 0;

          resetMagneticButtons();

        });

    }

    window.addEventListener(
      "resize",
      requestReset,
      { passive: true }
    );

    window.addEventListener(
      "scroll",
      requestReset,
      { passive: true }
    );

    window.addEventListener(
      "blur",
      resetMagneticButtons
    );

    document.addEventListener(
      "visibilitychange",
      () => {

        if (document.hidden) {

          resetMagneticButtons();

        }

      }
    );

  }


  /* ==================================================
     11. APPLICATION INITIALIZATION
  ================================================== */

  function init() {

    if (initialized) return;

    if (
      document.body.dataset.portfolioVersion
        !== "2"
    ) {
      return;
    }

    initialized = true;

    initHeaderScroll();

    initStaggerAnimations();

    refreshMagneticButtons();

    initContentObserver();

    initMotionPreferences();

    initViewportEvents();

  }


  if (
    document.readyState === "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      init,
      { once: true }
    );

  } else {

    init();

  }

})();


/* ==================================================
   END OF MOTION JAVASCRIPT
================================================== */
