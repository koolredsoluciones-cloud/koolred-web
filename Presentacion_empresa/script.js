(() => {
  'use strict';

  const slides = [...document.querySelectorAll('.slide')];
  const track = document.getElementById('track');
  const currentNumber = document.getElementById('currentNumber');
  const totalNumber = document.getElementById('totalNumber');
  const currentTitle = document.getElementById('currentTitle');
  const progressBar = document.getElementById('progressBar');
  const prevButton = document.getElementById('prevButton');
  const nextButton = document.getElementById('nextButton');
  const overview = document.getElementById('overview');
  const overviewButton = document.getElementById('overviewButton');
  const closeOverview = document.getElementById('closeOverview');
  const overviewList = document.getElementById('overviewList');
  const scrim = document.getElementById('scrim');
  const printButton = document.getElementById('printButton');
  const contactPrint = document.getElementById('contactPrint');
  const fullscreenButton = document.getElementById('fullscreenButton');
  const restartButton = document.getElementById('restartButton');
  const lightbox = document.getElementById('lightbox');
  const lightboxImage = document.getElementById('lightboxImage');
  const lightboxCaption = document.getElementById('lightboxCaption');
  const lightboxClose = document.getElementById('lightboxClose');
  let current = 0;
  let wheelLocked = false;
  let touchStartX = 0;
  let touchStartY = 0;

  const serviceNames = [
    'Ingeniería eléctrica', 'Cableado estructurado', 'Automatización y BMS',
    'HVAC técnico', 'CCTV y seguridad', 'Interventoría técnica',
    'Automatización digital', 'Soporte y mantenimiento',
    'Solar y electromovilidad', 'Red contra incendios', 'Tableros eléctricos'
  ];
  const serviceOrbitLabels = [...document.querySelectorAll('.service-token b')];
  let servicePhase = 0;

  if (serviceOrbitLabels.length && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    window.setInterval(() => {
      servicePhase = (servicePhase + 1) % serviceNames.length;
      serviceOrbitLabels.forEach(label => label.classList.add('changing'));
      window.setTimeout(() => {
        serviceOrbitLabels.forEach((label, index) => {
          label.textContent = serviceNames[(servicePhase + index * 4) % serviceNames.length];
          label.classList.remove('changing');
        });
      }, 190);
    }, 2800);
  }

  const pad = value => String(value).padStart(2, '0');

  slides.forEach((slide, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.innerHTML = `<span>${pad(index + 1)}</span><strong>${slide.dataset.title}</strong>`;
    button.addEventListener('click', () => {
      goTo(index);
      setOverview(false);
    });
    overviewList.appendChild(button);
  });

  const overviewItems = [...overviewList.querySelectorAll('button')];
  totalNumber.textContent = pad(slides.length);

  function goTo(index, announce = true) {
    const next = Math.max(0, Math.min(slides.length - 1, index));
    current = next;
    track.style.transform = `translate3d(${-current * 100}vw, 0, 0)`;
    slides.forEach((slide, i) => {
      slide.classList.toggle('active', i === current);
      slide.setAttribute('aria-hidden', i === current ? 'false' : 'true');
    });
    overviewItems.forEach((item, i) => item.classList.toggle('active', i === current));
    currentNumber.textContent = pad(current + 1);
    currentTitle.textContent = slides[current].dataset.title;
    progressBar.style.width = `${((current + 1) / slides.length) * 100}%`;
    prevButton.disabled = current === 0;
    nextButton.disabled = current === slides.length - 1;
    if (announce) history.replaceState(null, '', `#slide-${current + 1}`);
    window.scrollTo(0, 0);
  }

  function setOverview(open) {
    overview.classList.toggle('open', open);
    overview.setAttribute('aria-hidden', String(!open));
    overviewButton.setAttribute('aria-expanded', String(open));
    scrim.hidden = !open;
    if (open) closeOverview.focus(); else overviewButton.focus();
  }

  function next() { goTo(current + 1); }
  function previous() { goTo(current - 1); }

  prevButton.addEventListener('click', previous);
  nextButton.addEventListener('click', next);
  restartButton.addEventListener('click', () => goTo(0));
  overviewButton.addEventListener('click', () => setOverview(!overview.classList.contains('open')));
  closeOverview.addEventListener('click', () => setOverview(false));
  scrim.addEventListener('click', () => setOverview(false));
  printButton.addEventListener('click', () => window.print());
  contactPrint.addEventListener('click', () => window.print());

  fullscreenButton.addEventListener('click', async () => {
    try {
      if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
      else await document.exitFullscreen();
    } catch (_) {
      fullscreenButton.title = 'Pantalla completa no disponible en este navegador';
    }
  });

  document.addEventListener('keydown', event => {
    if (lightbox.open) {
      if (event.key === 'Escape') lightbox.close();
      return;
    }
    if (overview.classList.contains('open')) {
      if (event.key === 'Escape') setOverview(false);
      return;
    }
    if (['ArrowRight', 'ArrowDown', 'PageDown', ' '].includes(event.key)) {
      event.preventDefault(); next();
    } else if (['ArrowLeft', 'ArrowUp', 'PageUp'].includes(event.key)) {
      event.preventDefault(); previous();
    } else if (event.key === 'Home') {
      event.preventDefault(); goTo(0);
    } else if (event.key === 'End') {
      event.preventDefault(); goTo(slides.length - 1);
    }
  });

  document.addEventListener('wheel', event => {
    if (wheelLocked || overview.classList.contains('open') || lightbox.open || event.ctrlKey) return;
    const primaryDelta = Math.abs(event.deltaY) > Math.abs(event.deltaX) ? event.deltaY : event.deltaX;
    if (Math.abs(primaryDelta) < 28) return;
    event.preventDefault();
    wheelLocked = true;
    primaryDelta > 0 ? next() : previous();
    window.setTimeout(() => { wheelLocked = false; }, 720);
  }, { passive: false });

  document.addEventListener('touchstart', event => {
    if (event.touches.length !== 1) return;
    touchStartX = event.touches[0].clientX;
    touchStartY = event.touches[0].clientY;
  }, { passive: true });

  document.addEventListener('touchend', event => {
    if (!touchStartX || !touchStartY || event.changedTouches.length !== 1) return;
    const dx = event.changedTouches[0].clientX - touchStartX;
    const dy = event.changedTouches[0].clientY - touchStartY;
    touchStartX = 0; touchStartY = 0;
    if (Math.abs(dx) > 54 && Math.abs(dx) > Math.abs(dy) * 1.15) dx < 0 ? next() : previous();
  }, { passive: true });

  document.querySelectorAll('[data-full]').forEach(button => {
    button.addEventListener('click', () => {
      const image = button.querySelector('img');
      const caption = button.querySelector('span')?.textContent || image.alt;
      lightboxImage.src = button.dataset.full;
      lightboxImage.alt = image.alt;
      lightboxCaption.textContent = caption;
      lightbox.showModal();
    });
  });

  lightboxClose.addEventListener('click', () => lightbox.close());
  lightbox.addEventListener('click', event => {
    if (event.target === lightbox) lightbox.close();
  });
  lightbox.addEventListener('close', () => {
    lightboxImage.removeAttribute('src');
  });

  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  const hashMatch = location.hash.match(/^#slide-(\d+)$/);
  goTo(hashMatch ? Number(hashMatch[1]) - 1 : 0, false);
  requestAnimationFrame(() => window.scrollTo(0, 0));
})();
