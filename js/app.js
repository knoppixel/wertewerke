/**
 * app.js — Bootstrap: smooth scroll (Lenis), anchor links, footer year.
 */

(function (window, document) {
  'use strict';

  const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let lenis = null;

  /** Lenis smooth scroll, driven by GSAP's ticker so ScrollTrigger stays in sync */
  function initLenis() {
    if (REDUCED || typeof Lenis === 'undefined') return;

    lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add((time) => lenis.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);
    } else {
      const raf = (time) => { lenis.raf(time); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
  }

  /** In-page anchors scroll smoothly (header offset aware) */
  function initAnchors() {
    document.querySelectorAll('a[href^="#"]').forEach((link) => {
      link.addEventListener('click', (e) => {
        const id = link.getAttribute('href');
        if (!id || id === '#') return;
        const target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        const offset = id === '#top' || id === '#team' ? 0 : -80;
        if (lenis) {
          lenis.scrollTo(target, { offset, duration: 1.4 });
        } else {
          const y = target.getBoundingClientRect().top + window.scrollY + offset;
          window.scrollTo({ top: y, behavior: REDUCED ? 'auto' : 'smooth' });
        }
        target.setAttribute('tabindex', '-1');
        target.focus({ preventScroll: true });
      });
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    initLenis();
    initAnchors();
    if (typeof window.initAnimations === 'function') window.initAnimations();
  });

})(window, document);
