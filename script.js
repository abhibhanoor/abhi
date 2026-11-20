(() => {
  'use strict';
  const body = document.body;
  const preloader = document.getElementById('preloader');
  const header = document.getElementById('siteHeader');
  const menuButton = document.getElementById('menuButton');
  const menuOverlay = document.getElementById('menuOverlay');
  const progress = document.getElementById('scrollProgress');
  const cursor = document.getElementById('cursor');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let rafPending = false;

  const finishLoading = () => {
    if (preloader) preloader.classList.add('is-hidden');
    body.classList.add('is-ready');
  };
  if (reducedMotion) finishLoading();
  else {
    window.addEventListener('load', () => window.setTimeout(finishLoading, 600), { once: true });
    window.setTimeout(finishLoading, 1800);
  }

  const revealItems = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window && !reducedMotion) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -5% 0px' });
    revealItems.forEach(el => revealObserver.observe(el));
  } else {
    revealItems.forEach(el => el.classList.add('is-visible'));
  }

  const counters = document.querySelectorAll('[data-counter]');
  const runCounter = el => {
    const target = Number(el.dataset.counter);
    const start = performance.now();
    const duration = 900;
    const tick = now => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = String(Math.round(target * eased)).padStart(2, '0');
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  if ('IntersectionObserver' in window && !reducedMotion) {
    const counterObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          runCounter(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: .7 });
    counters.forEach(el => counterObserver.observe(el));
  }

  const closeMenu = () => {
    if (!menuOverlay || !menuButton) return;
    menuOverlay.classList.remove('open');
    menuOverlay.setAttribute('aria-hidden', 'true');
    menuButton.classList.remove('open');
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', 'Open navigation');
    body.classList.remove('locked');
    header?.classList.remove('menu-open');
  };
  if (menuButton && menuOverlay) {
    menuButton.addEventListener('click', () => {
      const isOpen = menuOverlay.classList.toggle('open');
      menuOverlay.setAttribute('aria-hidden', String(!isOpen));
      menuButton.classList.toggle('open', isOpen);
      menuButton.setAttribute('aria-expanded', String(isOpen));
      menuButton.setAttribute('aria-label', isOpen ? 'Close navigation' : 'Open navigation');
      header?.classList.toggle('menu-open', isOpen);
      body.classList.toggle('locked', isOpen);
    });
    menuOverlay.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
    menuOverlay.addEventListener('click', e => { if (e.target === menuOverlay) closeMenu(); });
  }

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeMenu();
    if (lightbox && lightbox.open) {
      if (e.key === 'ArrowRight') showLightbox(activeImage + 1);
      if (e.key === 'ArrowLeft') showLightbox(activeImage - 1);
    }
  });

  const updateScroll = () => {
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const current = maxScroll > 0 ? window.scrollY / maxScroll : 0;
    if (progress) progress.style.width = (current * 100).toFixed(2) + '%';
    if (header) header.classList.toggle('scrolled', window.scrollY > 25);
    if (!reducedMotion && window.matchMedia('(min-width: 761px)').matches) {
      document.querySelectorAll('.media-parallax').forEach(el => {
        const parent = el.closest('.hero-image,.build-image,.about-visual,.commission-backdrop');
        if (!parent) return;
        const rect = parent.getBoundingClientRect();
        if (rect.bottom < -100 || rect.top > window.innerHeight + 100) return;
        const offset = (rect.top + rect.height / 2 - window.innerHeight / 2) * -0.045;
        el.style.setProperty('--parallax-y', offset.toFixed(1) + 'px');
      });
    }
    rafPending = false;
  };
  const requestScrollUpdate = () => {
    if (!rafPending) {
      rafPending = true;
      requestAnimationFrame(updateScroll);
    }
  };
  window.addEventListener('scroll', requestScrollUpdate, { passive: true });
  window.addEventListener('resize', requestScrollUpdate);
  updateScroll();

  if (cursor && window.matchMedia('(pointer: fine)').matches && !reducedMotion) {
    const cursorLabel = document.getElementById('cursorLabel');
    let cursorX = window.innerWidth / 2;
    let cursorY = window.innerHeight / 2;
    let targetX = cursorX;
    let targetY = cursorY;
    document.addEventListener('mousemove', e => {
      targetX = e.clientX;
      targetY = e.clientY;
      cursor.classList.add('active');
    }, { passive: true });
    document.addEventListener('mouseleave', () => cursor.classList.remove('active'));
    const moveCursor = () => {
      cursorX += (targetX - cursorX) * .2;
      cursorY += (targetY - cursorY) * .2;
      cursor.style.left = cursorX + 'px';
      cursor.style.top = cursorY + 'px';
      requestAnimationFrame(moveCursor);
    };
    requestAnimationFrame(moveCursor);
    document.querySelectorAll('a,button,input,select,textarea').forEach(el => {
      el.addEventListener('mouseenter', () => cursor.classList.add('hover'));
      el.addEventListener('mouseleave', () => cursor.classList.remove('hover'));
    });
    document.querySelectorAll('[data-cursor]').forEach(el => {
      el.addEventListener('mouseenter', () => { cursorLabel.textContent = el.dataset.cursor; cursor.classList.add('labelled'); });
      el.addEventListener('mouseleave', () => cursor.classList.remove('labelled'));
    });
  }

  if (window.matchMedia('(pointer: fine)').matches && !reducedMotion) {
    document.querySelectorAll('[data-tilt]').forEach(card => {
      const image = card.querySelector('.build-image img');
      if (!image) return;
      card.addEventListener('pointermove', event => {
        const rect = card.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width - .5) * 11;
        const y = ((event.clientY - rect.top) / rect.height - .5) * 8;
        image.style.setProperty('--shift-x', x.toFixed(1) + 'px');
        image.style.setProperty('--shift-y', y.toFixed(1) + 'px');
      });
      card.addEventListener('pointerleave', () => { image.style.setProperty('--shift-x', '0px'); image.style.setProperty('--shift-y', '0px'); });
    });
    document.querySelectorAll('.magnetic').forEach(button => {
      button.addEventListener('mousemove', e => {
        const rect = button.getBoundingClientRect();
        const x = (e.clientX - rect.left - rect.width / 2) * .09;
        const y = (e.clientY - rect.top - rect.height / 2) * .12;
        button.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px)';
      });
      button.addEventListener('mouseleave', () => { button.style.transform = ''; });
    });
  }

  document.querySelectorAll('.service-arrow').forEach(link => {
    link.addEventListener('click', () => {
      const service = link.closest('.service-item')?.dataset.service;
      const select = document.querySelector('#commissionForm select[name="service"]');
      if (!service || !select) return;
      const options = { Protection: 'Paint protection film', Interior: 'Interior / seat changes', Exterior: 'Wrap / exterior styling', 'Wheels and stance': 'Wheels & stance', Performance: 'Performance upgrades' };
      const match = Array.from(select.options).find(option => option.text === options[service]);
      if (match) select.value = match.value;
    });
  });

  const galleryTiles = Array.from(document.querySelectorAll('[data-lightbox]'));
  const lightbox = document.getElementById('lightbox');
  const lightboxImage = document.getElementById('lightboxImage');
  const lightboxCaption = document.getElementById('lightboxCaption');
  const lightboxCount = document.getElementById('lightboxCount');
  const lightboxClose = document.getElementById('lightboxClose');
  let activeImage = 0;
  function showLightbox(index) {
    if (!galleryTiles.length || !lightbox) return;
    activeImage = (index + galleryTiles.length) % galleryTiles.length;
    const tile = galleryTiles[activeImage];
    const image = tile.querySelector('img');
    const label = tile.querySelector('.tile-index')?.textContent || 'TWIN TORQUE / GALLERY';
    lightboxImage.src = image.currentSrc || image.src;
    lightboxImage.alt = image.alt;
    lightboxCaption.textContent = label;
    lightboxCount.textContent = String(activeImage + 1).padStart(2, '0') + ' / ' + String(galleryTiles.length).padStart(2, '0');
    if (!lightbox.open) lightbox.showModal();
  }
  galleryTiles.forEach((tile, index) => tile.addEventListener('click', () => showLightbox(index)));
  document.getElementById('lightboxPrev')?.addEventListener('click', () => showLightbox(activeImage - 1));
  document.getElementById('lightboxNext')?.addEventListener('click', () => showLightbox(activeImage + 1));
  lightboxClose?.addEventListener('click', () => lightbox.close());
  lightbox?.addEventListener('click', e => { if (e.target === lightbox) lightbox.close(); });

  const legalDialog = document.getElementById('legalDialog');
  const legalTitle = document.getElementById('legalTitle');
  document.querySelectorAll('.legal-trigger').forEach(button => button.addEventListener('click', () => {
    legalTitle.textContent = button.dataset.legal;
    legalDialog.showModal();
  }));
  document.getElementById('legalClose')?.addEventListener('click', () => legalDialog.close());
  document.getElementById('legalOkay')?.addEventListener('click', () => legalDialog.close());
  legalDialog?.addEventListener('click', e => { if (e.target === legalDialog) legalDialog.close(); });

  const form = document.getElementById('commissionForm');
  const formStatus = document.getElementById('formStatus');
  form?.addEventListener('submit', e => {
    e.preventDefault();
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    const values = Object.fromEntries(data.entries());
    const name = values.name?.toString().trim() || 'Your';
    const message = [
      'TWIN TORQUE — PROJECT ENQUIRY',
      `Name: ${values.name || ''}`,
      `Email: ${values.email || ''}`,
      `Phone: ${values.phone || ''}`,
      `Vehicle: ${values.vehicle || ''}`,
      `Area of interest: ${values.service || ''}`,
      `Preferred contact: ${values.contact || ''}`,
      `Ideal time to talk: ${values.time || ''}`,
      `Project brief: ${values.message || 'Not provided'}`
    ].join('\n');
    const whatsappUrl = `https://wa.me/918501016665?text=${encodeURIComponent(message)}`;
    formStatus.replaceChildren(document.createTextNode(`${name}, your brief is ready. `));
    const sendLink = document.createElement('a');
    sendLink.href = whatsappUrl;
    sendLink.target = '_blank';
    sendLink.rel = 'noopener noreferrer';
    sendLink.textContent = 'Open WhatsApp to review and send ↗';
    formStatus.append(sendLink);
    formStatus.classList.add('show');
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    formStatus.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'nearest' });
  });

  document.getElementById('year').textContent = new Date().getFullYear();
})();

