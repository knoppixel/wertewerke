/**
 * animations.js — GSAP / ScrollTrigger interactions for Wertewerk
 *
 * Interactions from the Paper wireframe ("Bright apple" → "Desktop - 1"):
 *  - Team: side-way scroll. Images float freely, on scroll they get grouped
 *    moving to the right, transitioning to the next sections which scroll in
 *    from the side. When the section ends, vertical scrolling resumes.
 *
 * Supporting interactions:
 *  - Header wordmark shrinks on scroll
 *  - Hero line reveal, intro word-by-word reveal
 *  - Services: connector lines draw in, hover/focus/autoplay swaps the center figure
 *  - Contact: line reveal + magnetic email link
 */

(function (window, document) {
  'use strict';

  if (typeof gsap === 'undefined') {
    console.warn('GSAP not loaded – animations disabled.');
    window.initAnimations = function () {};
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp01 = gsap.utils.clamp(0, 1);
  const lerp = (a, b, t) => a + (b - a) * t;
  const easeInOut = gsap.parseEase('power2.inOut');
  const easeOut = gsap.parseEase('power3.out');

  /* ------------------------------------------------------------------
     Header — scrolled state
     ------------------------------------------------------------------ */
  function initHeader() {
    const header = document.querySelector('[data-header]');
    if (!header) return;

    ScrollTrigger.create({
      start: 40,
      end: 'max',
      onToggle: (self) => header.classList.toggle('is-scrolled', self.isActive),
    });
  }

  /* ------------------------------------------------------------------
     Hero intro + cursor image trail
     ------------------------------------------------------------------ */
  const HERO_TRAIL_IMAGES = [
    'assets/hero/hero-1.jpg',
    'assets/hero/hero-2.jpg',
    'assets/hero/hero-3.jpg',
    'assets/hero/hero-4.jpg',
    'assets/hero/hero-5.jpg',
  ];

  function initHero() {
    const lines = document.querySelectorAll('.hero .line__inner');
    const header = document.querySelector('[data-header]');
    const logo = document.querySelector('[data-logo]');
    const nav = document.querySelector('.header__nav');
    if (REDUCED) return;

    // Preload images during the intro animation so they are ready when it completes
    HERO_TRAIL_IMAGES.forEach((src) => {
      const img = new Image();
      img.src = src;
    });

    const tl = gsap.timeline({
      defaults: { ease: 'power4.out' },
    });
    tl.from(lines, { yPercent: 110, duration: 1.2, stagger: 0.14 }, 0)
      .add(initHeroTrail)
      .from(header, { yPercent: -100, opacity: 0, duration: 0.8 }, '<')
      .from([logo, nav], { y: -12, opacity: 0, duration: 0.7, stagger: 0.08 }, '<0.1')
      .from('.hero__scroll-cta', { opacity: 0, y: 12, duration: 0.8 }, '<');
  }

  function initHeroTrail() {
    const hero = document.querySelector('[data-hero]');
    const trail = document.querySelector('[data-hero-trail]');
    if (!hero || !trail || !window.matchMedia('(hover: hover)').matches) return;

    const threshold = 135; // minimum cursor travel distance (px) before spawning next image
    const minInterval = 140; // minimum time (ms) between spawns
    let lastX = 0;
    let lastY = 0;
    let lastTime = 0;
    let hasLast = false;
    let imgIndex = 0;
    let zCounter = 1;

    hero.addEventListener('pointermove', (e) => {
      const rect = hero.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      if (!hasLast) {
        lastX = x;
        lastY = y;
        hasLast = true;
        return;
      }

      const dx = x - lastX;
      const dy = y - lastY;
      const dist = Math.hypot(dx, dy);
      const now = performance.now();

      if (dist < threshold || now - lastTime < minInterval) return;

      const spawnX = lastX;
      const spawnY = lastY;
      lastX = x;
      lastY = y;
      lastTime = now;

      const el = document.createElement('img');
      el.className = 'hero__trail-img';
      el.src = HERO_TRAIL_IMAGES[imgIndex % HERO_TRAIL_IMAGES.length];
      el.alt = '';
      el.style.zIndex = String(++zCounter);
      trail.appendChild(el);
      imgIndex++;

      const driftX = gsap.utils.clamp(-45, 45, dx * 0.25);
      const driftY = gsap.utils.clamp(-45, 45, dy * 0.25);
      const rotStart = gsap.utils.random(-6, 6);
      const rotEnd = rotStart + gsap.utils.random(-4, 4);

      gsap.set(el, {
        xPercent: -50,
        yPercent: -50,
        x: spawnX,
        y: spawnY,
        scale: 0.45,
        opacity: 0,
        rotation: rotStart,
      });

      gsap.timeline({ onComplete: () => el.remove() })
        .to(el, {
          x: spawnX + driftX,
          y: spawnY + driftY,
          scale: 1,
          opacity: 1,
          rotation: rotEnd,
          duration: 0.75,
          ease: 'power3.out',
        })
        .to(el, {
          scale: 0.88,
          opacity: 0,
          y: spawnY + driftY + 20,
          duration: 0.9,
          ease: 'power2.inOut',
        }, '+=0.45');
    });

    hero.addEventListener('pointerleave', () => {
      hasLast = false;
    });
  }

  /* ------------------------------------------------------------------
     Generic reveals
     ------------------------------------------------------------------ */
  function initReveals() {
    if (REDUCED) return;

    gsap.utils.toArray('[data-reveal]').forEach((el) => {
      gsap.from(el, {
        y: 40, opacity: 0, duration: 1, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 88%' },
      });
    });

    // Word-by-word reveal tied to scroll
    gsap.utils.toArray('[data-word-reveal]').forEach((el) => {
      const words = el.textContent.trim().split(/\s+/);
      el.innerHTML = words.map((w) => `<span class="word">${w}</span>`).join(' ');
      gsap.to(el.querySelectorAll('.word'), {
        opacity: 1, ease: 'none', stagger: 0.1,
        scrollTrigger: { trigger: el, start: 'top 80%', end: 'bottom 45%', scrub: true },
      });
    });

    // Contact heading
    gsap.from('.contact .line__inner', {
      yPercent: 110, duration: 1.2, ease: 'power4.out',
      scrollTrigger: { trigger: '.contact', start: 'top 75%' },
    });
    gsap.from('.contact__email', {
      y: 30, opacity: 0, duration: 1, ease: 'power3.out', delay: 0.15,
      scrollTrigger: { trigger: '.contact', start: 'top 75%' },
    });
  }

  /* ------------------------------------------------------------------
     Team — pinned side-way scroll with floating → grouped images
     ------------------------------------------------------------------ */

  // Free-floating start positions inside the intro panel (fractions of viewport, top-left of card).
  // Laid out around the centered "Entdecke unser Team" headline, mirroring the wireframe.
  const SCATTER = [
    [0.07, 0.15], [0.40, 0.11], [0.79, 0.14], [0.27, 0.27], [0.62, 0.24],
    [0.03, 0.62], [0.17, 0.70], [0.42, 0.68], [0.70, 0.60], [0.88, 0.45],
  ];

  function initTeam() {
    const section = document.querySelector('[data-team]');
    if (!section) return;

    const mm = gsap.matchMedia();

    mm.add('(min-width: 900px) and (prefers-reduced-motion: no-preference)', () => {
      const viewport = section.querySelector('.team__viewport');
      const track = section.querySelector('[data-team-track]');
      const layer = section.querySelector('[data-team-floaters]');
      const groups = Array.from(section.querySelectorAll('[data-group]'));
      const slots = Array.from(section.querySelectorAll('[data-slot]'))
        .sort((a, b) => a.dataset.slot - b.dataset.slot);

      section.classList.add('is-horizontal');

      // Build floaters from each slot's photo
      const cards = slots.map((slot, i) => {
        const photo = slot.querySelector('.member__photo');
        const el = document.createElement('div');
        el.className = 'floater';
        el.setAttribute('style', photo.getAttribute('style') || '');
        el.innerHTML = photo.innerHTML;
        layer.appendChild(el);
        const group = Number(slot.closest('[data-group]').dataset.group);
        const indexInGroup = Array.from(slot.closest('.team__members').children)
          .indexOf(slot.closest('.member'));
        return {
          el, slot, group, i, j: indexInGroup,
          rot: gsap.utils.random(-8, 8),
          phase: Math.random() * Math.PI * 2,
          speed: gsap.utils.random(0.6, 1.1),
          setX: gsap.quickSetter(el, 'x', 'px'),
          setY: gsap.quickSetter(el, 'y', 'px'),
          setS: gsap.quickSetter(el, 'scale'),
          setR: gsap.quickSetter(el, 'rotation', 'deg'),
          // measured
          sx: 0, sy: 0, w: 0, h: 0,
        };
      });

      let vw = 0, vh = 0, distance = 1, settleEnd = 0.25;

      function measure() {
        vw = viewport.clientWidth;
        vh = viewport.clientHeight;
        distance = Math.max(1, track.scrollWidth - vw);
        const firstGroupLeft = groups[0] ? groups[0].offsetLeft : vw;
        settleEnd = clamp01((firstGroupLeft - 0.12 * vw) / distance);

        const trackRect = track.getBoundingClientRect();

        cards.forEach((c) => {
          const r = c.slot.getBoundingClientRect();
          c.sx = r.left - trackRect.left;      // slot position in track space
          c.sy = r.top - trackRect.top;
          c.w = r.width;
          c.h = r.height;
          c.el.style.width = c.w + 'px';
          c.el.style.height = c.h + 'px';
        });
      }

      measure();

      const hTween = gsap.to(track, {
        x: () => -distance,
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: () => '+=' + distance,
          pin: true,
          scrub: 1,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onRefreshInit: measure,
          onRefresh: measure,
        },
      });

      // Group texts slide in from the side as each panel enters
      groups.forEach((g) => {
        gsap.from(g.querySelectorAll('.team__group-text > *, .member__name'), {
          x: 120, opacity: 0, stagger: 0.06, ease: 'power2.out',
          scrollTrigger: {
            trigger: g, containerAnimation: hTween,
            start: 'left 95%', end: 'left 45%', scrub: true,
          },
        });
      });

      // Intro title drifts & fades as images move into place
      gsap.to('.team__title, .team__hint', {
        xPercent: -15, opacity: 0, ease: 'none',
        scrollTrigger: {
          trigger: section.querySelector('[data-team-intro]'), containerAnimation: hTween,
          start: 'left left', end: 'center left', scrub: true,
        },
      });

      // Per-frame placement of floaters
      function render(time) {
        const trackX = gsap.getProperty(track, 'x') || 0;
        const p = clamp01(-trackX / distance);
        const a = easeInOut(clamp01(p / settleEnd));

        for (const c of cards) {
          // 1) floating freely (screen-fixed)
          const fx = SCATTER[c.i % SCATTER.length][0] * vw;
          const fy = SCATTER[c.i % SCATTER.length][1] * vh;

          // 2) final slot (moves with the track)
          const tx = c.sx + trackX;
          const ty = c.sy;

          const bob = (1 - a) * 10;
          const t = time * c.speed + c.phase;

          c.setX(lerp(fx, tx, a) + Math.cos(t) * bob * 0.6);
          c.setY(lerp(fy, ty, a) + Math.sin(t) * bob);
          c.setS(1);
          c.setR(lerp(c.rot, 0, a));
        }
      }

      gsap.ticker.add(render);

      return () => {
        gsap.ticker.remove(render);
        layer.innerHTML = '';
        section.classList.remove('is-horizontal');
        gsap.set(track, { clearProps: 'transform' });
      };
    });
  }

  /* ------------------------------------------------------------------
     Magnetic email link
     ------------------------------------------------------------------ */
  function initMagnetic() {
    if (REDUCED || !window.matchMedia('(hover: hover)').matches) return;
    document.querySelectorAll('[data-magnetic]').forEach((el) => {
      const xTo = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'power3.out' });
      const yTo = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'power3.out' });
      el.addEventListener('mousemove', (e) => {
        const r = el.getBoundingClientRect();
        xTo((e.clientX - (r.left + r.width / 2)) * 0.12);
        yTo((e.clientY - (r.top + r.height / 2)) * 0.25);
      });
      el.addEventListener('mouseleave', () => { xTo(0); yTo(0); });
    });
  }

  /* ------------------------------------------------------------------
     Public entry
     ------------------------------------------------------------------ */
  window.initAnimations = function () {
    initHeader();
    initHero();
    initReveals();
    initTeam();
    initMagnetic();

    // Re-measure once web fonts have settled (affects widths of the horizontal track)
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => ScrollTrigger.refresh());
    }
  };

})(window, document);
