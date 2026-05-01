/* ==========================================================================
   AUTOPOST — Motion utilities
   IntersectionObserver entrance · cursor magnético · count-up · reduced-motion
   ========================================================================== */

(function () {
  'use strict';

  const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- ENTRANCE OBSERVER ---------- */
  const entranceObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          entranceObserver.unobserve(entry.target);
        }
      });
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.05 }
  );

  function registerEntrances(root = document) {
    root.querySelectorAll('.in-view').forEach((el) => entranceObserver.observe(el));
    root.querySelectorAll('.stagger').forEach((parent) => {
      Array.from(parent.children).forEach((child, i) => {
        child.style.setProperty('--stagger-i', i);
      });
    });
  }

  /* ---------- CURSOR MAGNÉTICO ---------- */
  function bindMagnetic(el, strength = 0.25) {
    if (REDUCED) return;
    let raf = null;
    let tx = 0, ty = 0;
    const onMove = (e) => {
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const dx = (e.clientX - cx) * strength;
      const dy = (e.clientY - cy) * strength;
      tx = dx; ty = dy;
      if (!raf) {
        raf = requestAnimationFrame(() => {
          el.style.transform = `translate(${tx}px, ${ty}px)`;
          raf = null;
        });
      }
    };
    const onLeave = () => {
      el.style.transform = '';
    };
    el.addEventListener('mousemove', onMove);
    el.addEventListener('mouseleave', onLeave);
  }

  function registerMagnetic(root = document) {
    root.querySelectorAll('[data-magnetic]').forEach((el) => {
      const s = parseFloat(el.getAttribute('data-magnetic')) || 0.25;
      bindMagnetic(el, s);
    });
  }

  /* ---------- COUNT-UP ---------- */
  function countUp(el, target, duration = 1600) {
    if (REDUCED) {
      el.textContent = formatNumber(target);
      return;
    }
    const start = 0;
    const startTime = performance.now();
    const ease = (t) => 1 - Math.pow(1 - t, 4); // ease-out-quart
    function tick(now) {
      const t = Math.min(1, (now - startTime) / duration);
      const v = start + (target - start) * ease(t);
      el.textContent = formatNumber(v, target);
      if (t < 1) requestAnimationFrame(tick);
      else el.textContent = formatNumber(target);
    }
    requestAnimationFrame(tick);
  }

  function formatNumber(v, target) {
    const ref = target !== undefined ? target : v;
    if (ref >= 1_000_000) return (v / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (ref >= 1_000)     return (v / 1_000).toFixed(1).replace(/\.0$/, '') + 'k';
    if (Number.isInteger(ref)) return Math.round(v).toString();
    return v.toFixed(1);
  }

  function registerCounters(root = document) {
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const target = parseFloat(entry.target.getAttribute('data-count'));
            countUp(entry.target, target);
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.5 }
    );
    root.querySelectorAll('[data-count]').forEach((el) => obs.observe(el));
  }

  /* ---------- TYPEWRITER (char-by-char) ---------- */
  function typewriter(el, text, speed = 28) {
    return new Promise((resolve) => {
      if (REDUCED) {
        el.textContent = text;
        resolve();
        return;
      }
      el.textContent = '';
      let i = 0;
      function tick() {
        if (i >= text.length) {
          resolve();
          return;
        }
        el.textContent += text[i];
        i++;
        setTimeout(tick, speed + Math.random() * 20);
      }
      tick();
    });
  }

  /* ---------- SCROLL PROGRESS ---------- */
  function bindScrollProgress(barSelector = '[data-scroll-progress]') {
    const bar = document.querySelector(barSelector);
    if (!bar) return;
    let ticking = false;
    function update() {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(100, (window.scrollY / max) * 100) : 0;
      bar.style.transform = `scaleX(${p / 100})`;
      ticking = false;
    }
    window.addEventListener(
      'scroll',
      () => {
        if (!ticking) {
          requestAnimationFrame(update);
          ticking = true;
        }
      },
      { passive: true }
    );
    update();
  }

  /* ---------- THEME TOGGLE ---------- */
  const THEME_KEY = 'autopost-theme';
  function applyTheme(t) {
    document.documentElement.setAttribute('data-theme', t);
    localStorage.setItem(THEME_KEY, t);
    document.querySelectorAll('[data-theme-toggle]').forEach((el) => {
      el.setAttribute('aria-pressed', t === 'light');
    });
  }
  function toggleTheme() {
    const cur = document.documentElement.getAttribute('data-theme') || 'dark';
    applyTheme(cur === 'dark' ? 'light' : 'dark');
  }
  function initTheme() {
    const stored = localStorage.getItem(THEME_KEY);
    applyTheme(stored === 'light' ? 'light' : 'dark');
  }

  /* ---------- TILT 3D ---------- */
  function bindTilt(el, max = 8) {
    if (REDUCED) return;
    let raf = null;
    el.addEventListener('mousemove', (e) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      const rx = (py - 0.5) * -max * 2;
      const ry = (px - 0.5) * max * 2;
      if (!raf) {
        raf = requestAnimationFrame(() => {
          el.style.transform = `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg)`;
          raf = null;
        });
      }
    });
    el.addEventListener('mouseleave', () => {
      el.style.transform = '';
    });
  }
  function registerTilt(root = document) {
    root.querySelectorAll('[data-tilt]').forEach((el) => {
      const m = parseFloat(el.getAttribute('data-tilt')) || 8;
      bindTilt(el, m);
    });
  }

  /* ---------- INIT ---------- */
  function init() {
    initTheme();
    registerEntrances();
    registerMagnetic();
    registerCounters();
    registerTilt();
    bindScrollProgress();

    document.querySelectorAll('[data-theme-toggle]').forEach((el) => {
      el.addEventListener('click', toggleTheme);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Public API
  window.MOTION = {
    registerEntrances,
    registerMagnetic,
    registerTilt,
    countUp,
    typewriter,
    toggleTheme,
    REDUCED,
  };
})();
