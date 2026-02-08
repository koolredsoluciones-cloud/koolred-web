(() => {
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  const reduced = prefersReduced.matches;
  document.documentElement.classList.toggle("reduce-motion", reduced);

  if (!reduced && window.Lenis) {
    const lenis = new Lenis({
      duration: 1.1,
      smoothWheel: true,
      smoothTouch: false,
    });
    window.lenis = lenis;

    const raf = (time) => {
      lenis.raf(time);
      window.requestAnimationFrame(raf);
    };

    window.requestAnimationFrame(raf);
  }

  const sections = Array.from(document.querySelectorAll(".cool-section"));
  if (sections.length && window.gsap && !reduced) {
    const revealSection = (section) => {
      const targets = section.querySelectorAll("[data-reveal]");
      const items = targets.length ? targets : [section];
      window.gsap.fromTo(
        items,
        { y: 24, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.7,
          ease: "power2.out",
          stagger: 0.08,
          overwrite: "auto",
        }
      );
    };

    const sectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }
          revealSection(entry.target);
          sectionObserver.unobserve(entry.target);
        });
      },
      { threshold: 0.2 }
    );

    sections.forEach((section) => sectionObserver.observe(section));
  }

  const servicesSection = document.querySelector("#servicios");
  if (servicesSection && window.gsap && !reduced) {
    const rows = [1, 2, 3].map((row) =>
      Array.from(
        servicesSection.querySelectorAll(`.service-card[data-row='${row}']`)
      )
    );
    const callout = servicesSection.querySelector(".services-callout");

    if (rows.some((row) => row.length)) {
      const animatedItems = rows.flat();
      if (callout) {
        animatedItems.push(callout);
      }

      window.gsap.set(animatedItems, { opacity: 0, y: 10 });

      const animateServices = () => {
        const tl = window.gsap.timeline({
          defaults: { duration: 0.15, ease: "power1.out" },
        });

        rows.forEach((row, index) => {
          if (!row.length) {
            return;
          }
          tl.fromTo(
            row,
            { y: 10, opacity: 0 },
            { y: 0, opacity: 1, stagger: 0.05 },
            index === 0 ? 0 : "+=0.06"
          );
        });

        if (callout) {
          tl.fromTo(
            callout,
            { y: 10, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.18 },
            "+=0.06"
          );
        }
      };

      const servicesObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) {
              return;
            }
            animateServices();
            servicesObserver.unobserve(entry.target);
          });
        },
        { threshold: 0.2 }
      );

      servicesObserver.observe(servicesSection);
    }
  }

  const industryMap = {
    corporativo: "UPS, tableros, soporte, continuidad",
    industrial: "VFD, PLC, SCADA, sensores",
    retail: "energia, redes, CCTV, operacion",
    clinico: "areas criticas, respaldo, control",
    educativo: "distribucion, modernizacion, mantenimiento",
    data: "energia critica, monitoreo, redundancia",
  };

  const chips = Array.from(document.querySelectorAll(".industry-chip"));
  const output = document.querySelector(".industry-output");

  if (chips.length && output) {
    const setActive = (chip) => {
      chips.forEach((btn) => {
        const isActive = btn === chip;
        btn.classList.toggle("is-active", isActive);
        btn.setAttribute("aria-pressed", isActive ? "true" : "false");
      });
      const key = chip.getAttribute("data-industry");
      const nextText = industryMap[key] || "";
      if (window.gsap && !reduced) {
        window.gsap.to(output, {
          opacity: 0,
          y: 4,
          duration: 0.15,
          onComplete: () => {
            output.textContent = nextText;
            window.gsap.to(output, { opacity: 1, y: 0, duration: 0.2 });
          },
        });
      } else {
        output.textContent = nextText;
      }
    };

    setActive(chips[0]);
    chips.forEach((chip) => {
      chip.addEventListener("click", () => setActive(chip));
    });
  }

  const steps = Array.from(document.querySelectorAll(".timeline-step"));
  if (steps.length) {
    const stepObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }
          entry.target.classList.add("is-active");
          if (window.gsap && !reduced) {
            window.gsap.fromTo(
              entry.target,
              { y: 16, opacity: 0 },
              { y: 0, opacity: 1, duration: 0.45, ease: "power2.out" }
            );
          }
          stepObserver.unobserve(entry.target);
        });
      },
      { threshold: 0.4 }
    );

    steps.forEach((step) => stepObserver.observe(step));
  }

  const intentChips = Array.from(document.querySelectorAll(".intent-chip"));
  if (intentChips.length) {
    const findCard = (key) =>
      document.querySelector(`.service-card[data-service='${key}']`);

    intentChips.forEach((chip) => {
      chip.addEventListener("click", (event) => {
        const target = chip.getAttribute("data-scroll");
        const highlight = chip.getAttribute("data-highlight");

        if (target) {
          event.preventDefault();
          const section = document.querySelector(target);
          if (section) {
            section.scrollIntoView({ behavior: reduced ? "auto" : "smooth" });
          }
        }

        if (highlight) {
          const card = findCard(highlight);
          if (card) {
            window.setTimeout(() => {
              card.classList.add("is-highlight");
              window.setTimeout(() => {
                card.classList.remove("is-highlight");
              }, 1800);
            }, 300);
          }
        }
      });
    });
  }
})();
