/**
 * main.js — Tomatis Nicola S.r.l.
 * Script vanilla, nessuna dipendenza esterna.
 * Moduli: theme toggle, mobile menu, lang switch dropdown, header scroll state,
 * process carousel (drag/swipe + dots + freccie), process modal (lightbox).
 */

(function () {
  'use strict';

  /* ------------------------------------------------------------------ */
  /* Utility                                                             */
  /* ------------------------------------------------------------------ */
  function qs(selector, scope) { return (scope || document).querySelector(selector); }
  function qsa(selector, scope) { return Array.from((scope || document).querySelectorAll(selector)); }

  /* ------------------------------------------------------------------ */
  /* Anno corrente nel footer                                            */
  /* ------------------------------------------------------------------ */
  function initCurrentYear() {
    qsa('[data-current-year]').forEach(function (el) {
      el.textContent = new Date().getFullYear();
    });
  }

  /* ------------------------------------------------------------------ */
  /* Theme toggle (dark/light) con persistenza in localStorage           */
  /* ------------------------------------------------------------------ */
  function initThemeToggle() {
    var toggle = qs('[data-component="theme-toggle"]');
    if (!toggle) return;

    function applyTheme(theme, animate) {
      if (animate) {
        document.documentElement.classList.add('theme-transition');
        window.setTimeout(function () {
          document.documentElement.classList.remove('theme-transition');
        }, 300);
      }
      document.documentElement.setAttribute('data-theme', theme);
      toggle.setAttribute('aria-pressed', String(theme === 'dark'));
      try { localStorage.setItem('tomatis-theme', theme); } catch (e) { /* noop */ }
    }

    var current = document.documentElement.getAttribute('data-theme') || 'light';
    toggle.setAttribute('aria-pressed', String(current === 'dark'));

    toggle.addEventListener('click', function () {
      var next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      applyTheme(next, true);
    });
  }

  /* ------------------------------------------------------------------ */
  /* Header: stato "scrolled" per ombra/sfondo più opaco                 */
  /* ------------------------------------------------------------------ */
  function initHeaderScrollState() {
    var header = qs('[data-component="header"]');
    if (!header) return;
    var ticking = false;

    function update() {
      header.classList.toggle('is-scrolled', window.scrollY > 8);
      ticking = false;
    }
    window.addEventListener('scroll', function () {
      if (!ticking) {
        window.requestAnimationFrame(update);
        ticking = true;
      }
    }, { passive: true });
    update();
  }

  /* ------------------------------------------------------------------ */
  /* Mobile menu                                                         */
  /* ------------------------------------------------------------------ */
  function initMobileMenu() {
    var toggle = qs('[data-component="mobile-menu-toggle"]');
    var panel = qs('[data-component="mobile-nav"]');
    if (!toggle || !panel) return;

    function setOpen(open) {
      toggle.setAttribute('aria-expanded', String(open));
      panel.classList.toggle('is-open', open);
      panel.setAttribute('aria-hidden', String(!open));
      document.body.classList.toggle('has-mobile-nav-open', open);
    }

    toggle.addEventListener('click', function () {
      var isOpen = toggle.getAttribute('aria-expanded') === 'true';
      setOpen(!isOpen);
    });

    qsa('a', panel).forEach(function (link) {
      link.addEventListener('click', function () { setOpen(false); });
    });

    window.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') setOpen(false);
    });
  }

  /* ------------------------------------------------------------------ */
  /* Lang switch dropdown                                                */
  /* ------------------------------------------------------------------ */
  function initLangSwitch() {
    var widget = qs('[data-component="lang-switch"]');
    if (!widget) return;
    var trigger = qs('.lang-switch__trigger', widget);

    function setOpen(open) {
      widget.classList.toggle('is-open', open);
      trigger.setAttribute('aria-expanded', String(open));
    }

    trigger.addEventListener('click', function (e) {
      e.stopPropagation();
      setOpen(!widget.classList.contains('is-open'));
    });

    // Quando l'utente scegli attivamente una lingua, salviamo la
    // preferenza: da qui in avanti, ogni pagina caricata (anche tornando
    // alla home o aprendo il sito da un bookmark) applicherà subito quella
    // lingua, con lo stesso comportamento persistente del tema chiaro/scuro.
    qsa('a[data-lang-code]', widget).forEach(function (link) {
      link.addEventListener('click', function () {
        try { localStorage.setItem('tomatis-lang', link.getAttribute('data-lang-code')); } catch (e) { /* noop */ }
      });
    });

    document.addEventListener('click', function (e) {
      if (!widget.contains(e.target)) setOpen(false);
    });
    window.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') setOpen(false);
    });
  }

  /* ------------------------------------------------------------------ */
  /* Process carousel — "Come nasce uno stampo" (solo produzione.html)   */
  /* Scroll nativo + drag mouse + frecce + dots, nessuna libreria.       */
  /* ------------------------------------------------------------------ */
  function initProcessCarousel() {
    var root = qs('[data-component="carousel"]');
    if (!root) return;

    var track = qs('.process-carousel__track', root);
    var slides = qsa('.process-carousel__slide', track);
    var prevBtn = qs('[data-carousel-prev]', root);
    var nextBtn = qs('[data-carousel-next]', root);
    var dotsContainer = qs('[data-carousel-dots]', root);
    if (!track || slides.length === 0) return;

    // Costruisci i dot, uno per slide
    var dots = slides.map(function (_, index) {
      var dot = document.createElement('button');
      dot.type = 'button';
      dot.setAttribute('role', 'tab');
      dot.setAttribute('aria-label', 'Vai alla fase ' + (index + 1));
      dot.addEventListener('click', function () { scrollToSlide(index); });
      dotsContainer.appendChild(dot);
      return dot;
    });

    function visibleSlidesCount() {
      var slideWidth = slides[0].getBoundingClientRect().width;
      return Math.max(1, Math.round(track.clientWidth / (slideWidth + 20)));
    }

    function currentIndex() {
      var trackRect = track.getBoundingClientRect();
      var closest = 0;
      var closestDistance = Infinity;
      slides.forEach(function (slide, index) {
        var rect = slide.getBoundingClientRect();
        var distance = Math.abs(rect.left - trackRect.left);
        if (distance < closestDistance) {
          closestDistance = distance;
          closest = index;
        }
      });
      return closest;
    }

    function updateUI() {
      var index = currentIndex();
      dots.forEach(function (dot, i) { dot.classList.toggle('is-active', i === index); });
      prevBtn.disabled = track.scrollLeft <= 4;
      nextBtn.disabled = track.scrollLeft >= track.scrollWidth - track.clientWidth - 4;
    }

    function scrollToSlide(index) {
      var clamped = Math.max(0, Math.min(slides.length - 1, index));
      slides[clamped].scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
    }

    prevBtn.addEventListener('click', function () {
      scrollToSlide(currentIndex() - 1);
    });
    nextBtn.addEventListener('click', function () {
      scrollToSlide(currentIndex() + Math.max(1, visibleSlidesCount()));
    });

    var scrollTicking = false;
    track.addEventListener('scroll', function () {
      if (!scrollTicking) {
        window.requestAnimationFrame(function () { updateUI(); scrollTicking = false; });
        scrollTicking = true;
      }
    }, { passive: true });

    window.addEventListener('resize', updateUI);
    updateUI();

    // --- Drag-to-scroll col mouse (desktop), oltre al touch nativo ---
    var isDragging = false;
    var dragStartX = 0;
    var dragScrollStart = 0;

    track.addEventListener('mousedown', function (e) {
      isDragging = true;
      track.classList.add('is-dragging');
      dragStartX = e.pageX;
      dragScrollStart = track.scrollLeft;
      track.style.scrollSnapType = 'none';
    });
    window.addEventListener('mousemove', function (e) {
      if (!isDragging) return;
      var delta = e.pageX - dragStartX;
      track.scrollLeft = dragScrollStart - delta;
    });
    function stopDragging() {
      if (!isDragging) return;
      isDragging = false;
      track.classList.remove('is-dragging');
      track.style.scrollSnapType = 'x mandatory';
      scrollToSlide(currentIndex());
    }
    window.addEventListener('mouseup', stopDragging);
    track.addEventListener('mouseleave', function () { if (isDragging) stopDragging(); });

    return { scrollToSlide: scrollToSlide, getSlideCount: function () { return slides.length; } };
  }

  /* ------------------------------------------------------------------ */
  /* Process modal — lightbox di dettaglio per ogni fase di produzione   */
  /* ------------------------------------------------------------------ */
  function initProcessModal(carouselApi) {
    var modal = qs('[data-component="process-modal"]');
    var dataScript = qs('#process-steps-data');
    if (!modal || !dataScript) return;

    var steps;
    try {
      steps = JSON.parse(dataScript.textContent);
    } catch (e) {
      console.error('Impossibile leggere i dati delle fasi di produzione', e);
      return;
    }

    var assetPath = document.body.getAttribute('data-asset-path') || './';

    var currentStepIndex = 0;
    var lastFocusedElement = null;

    var pictureEl = qs('[data-modal-picture]', modal);
    var numberEl = qs('[data-modal-number]', modal);
    var titleEl = qs('[data-modal-title]', modal);
    var textEl = qs('[data-modal-text]', modal);
    var prevBtn = qs('[data-modal-prev]', modal);
    var nextBtn = qs('[data-modal-next]', modal);

    function renderStep(index) {
      var step = steps[index];
      if (!step) return;
      currentStepIndex = index;

      numberEl.textContent = String(index + 1).padStart(2, '0');
      titleEl.textContent = step.title;
      textEl.textContent = step.text;

      pictureEl.innerHTML =
        '<source srcset="' + assetPath + 'assets/img/produzione/' + step.img + '.webp" type="image/webp">' +
        '<img src="' + assetPath + 'assets/img/produzione/' + step.img + '.jpg" alt="' + step.title + '" loading="lazy" width="640" height="480">';

      prevBtn.disabled = index === 0;
      nextBtn.disabled = index === steps.length - 1;
    }

    function openModal(index) {
      lastFocusedElement = document.activeElement;
      renderStep(index);
      modal.classList.add('is-open');
      modal.setAttribute('aria-hidden', 'false');
      document.body.classList.add('has-mobile-nav-open');
      qs('.process-modal__close', modal).focus();
      if (carouselApi) carouselApi.scrollToSlide(index);
    }

    function closeModal() {
      modal.classList.remove('is-open');
      modal.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('has-mobile-nav-open');
      if (lastFocusedElement) lastFocusedElement.focus();
    }

    qsa('[data-open-modal]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        openModal(parseInt(btn.getAttribute('data-open-modal'), 10));
      });
    });

    qsa('[data-modal-close]', modal).forEach(function (el) {
      el.addEventListener('click', closeModal);
    });

    prevBtn.addEventListener('click', function () {
      if (currentStepIndex > 0) renderStep(currentStepIndex - 1);
      if (carouselApi) carouselApi.scrollToSlide(currentStepIndex);
    });
    nextBtn.addEventListener('click', function () {
      if (currentStepIndex < steps.length - 1) renderStep(currentStepIndex + 1);
      if (carouselApi) carouselApi.scrollToSlide(currentStepIndex);
    });

    window.addEventListener('keydown', function (e) {
      if (!modal.classList.contains('is-open')) return;
      if (e.key === 'Escape') closeModal();
      if (e.key === 'ArrowRight' && currentStepIndex < steps.length - 1) renderStep(currentStepIndex + 1);
      if (e.key === 'ArrowLeft' && currentStepIndex > 0) renderStep(currentStepIndex - 1);
    });

    // Trap del focus essenziale: mantieni Tab dentro il dialog quando aperto
    modal.addEventListener('keydown', function (e) {
      if (e.key !== 'Tab' || !modal.classList.contains('is-open')) return;
      var focusable = qsa('button, a[href]', modal).filter(function (el) { return !el.disabled; });
      if (focusable.length === 0) return;
      var first = focusable[0];
      var last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    });
  }

  /* ------------------------------------------------------------------ */
  /* Reveal-on-scroll leggero (IntersectionObserver) per sezioni/card    */
  /* ------------------------------------------------------------------ */
  function initScrollReveal() {
    var targets = qsa('.machinery-card, .mould-list__item, .timeline__item, .stats-grid__item, .values-grid__item');
    if (targets.length === 0 || !('IntersectionObserver' in window)) return;

    targets.forEach(function (el) { el.classList.add('is-reveal-pending'); });

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          entry.target.classList.remove('is-reveal-pending');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.05, rootMargin: '0px 0px -10px 0px' });

    targets.forEach(function (el) { observer.observe(el); });

    // Fallback di sicurezza: se per qualche motivo l'observer non rivela un
    // elemento (orientamenti/viewport non standard, crawler, edge case del
    // browser), evitiamo che resti invisibile per sempre.
    window.setTimeout(function () {
      qsa('.is-reveal-pending').forEach(function (el) {
        el.classList.add('is-revealed');
        el.classList.remove('is-reveal-pending');
      });
    }, 4000);
  }

  /* ------------------------------------------------------------------ */
  /* Bootstrap                                                           */
  /* ------------------------------------------------------------------ */
  document.addEventListener('DOMContentLoaded', function () {
    initCurrentYear();
    initThemeToggle();
    initHeaderScrollState();
    initMobileMenu();
    initLangSwitch();
    var carouselApi = initProcessCarousel();
    initProcessModal(carouselApi);
    initScrollReveal();
  });
})();
