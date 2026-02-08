(() => {
  const SEGMENT_KEY = "koolred_segment";
  const DEFAULT_SEGMENT = "industrial";

  const getStoredSegment = () => {
    try {
      const value = localStorage.getItem(SEGMENT_KEY);
      return value === "industrial" || value === "comercial" ? value : DEFAULT_SEGMENT;
    } catch {
      return DEFAULT_SEGMENT;
    }
  };

  const applySegment = (segment) => {
    document.documentElement.setAttribute("data-segment", segment);

    document.querySelectorAll("[data-segment-text]").forEach((el) => {
      const value = el.getAttribute(`data-${segment}`);
      if (!value) {
        return;
      }
      if (el.hasAttribute("data-segment-html")) {
        el.innerHTML = value;
      } else {
        el.textContent = value;
      }
    });

    document.querySelectorAll(".segment-btn").forEach((btn) => {
      const isActive = btn.getAttribute("data-segment") === segment;
      btn.classList.toggle("is-active", isActive);
      btn.setAttribute("aria-pressed", isActive ? "true" : "false");
    });
  };

  const setSegment = (segment) => {
    applySegment(segment);
    try {
      localStorage.setItem(SEGMENT_KEY, segment);
    } catch {
      // ignore storage errors
    }
  };

  const initToggle = () => {
    const segment = getStoredSegment();
    applySegment(segment);

    document.querySelectorAll(".segment-toggle").forEach((toggle) => {
      toggle.querySelectorAll(".segment-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
          const next = btn.getAttribute("data-segment") || DEFAULT_SEGMENT;
          setSegment(next);
        });
      });
    });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initToggle);
  } else {
    initToggle();
  }
})();
