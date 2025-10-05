/* ==========================================================================
 * Levels Pack (Solar 1–3) — unit-accurate scale rules + colorful transitions
 * L0: base ELEMENTS + Quantum Tunnel + starfield, Å→µm
 * L1: Silicatos/Carbonáceos/Hielo/Óxidos, µm→m (log span)
 * L2: Asteroides C/S/M, m→Mm (log span)
 * ========================================================================== */
(function (global) {
  'use strict';

  const log = (...a) => console.log('[levels_pack]', ...a);
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

  function bandByKey(key, fallback) {
    if (typeof global.getLevelByKey === 'function') {
      const cfg = global.getLevelByKey(key);
      if (cfg && Number.isFinite(cfg.min) && Number.isFinite(cfg.max)) {
        return { min: cfg.min, max: cfg.max, bg: cfg.backgroundColor };
      }
    }
    return fallback;
  }

  function setScaleRuleUI(rule) {
    const ui = global?.game?.ui;
    if (ui?.setScaleRule) ui.setScaleRule(rule);
  }
  function clearScaleOverrides() {
    delete global.overrideSizeToNanometers;
  }

  // Tell UI our current nm bounds (fallback channel used in updateScalePanel)
  function setCurrentNmBounds(min, max) {
    global.currentLevelNmBounds = { min, max };
  }

  // ===== Level 0: Å → µm =====
  class FirstSolarLevel {
    constructor() {
      this.key = 'amns-micr';
      const band = bandByKey(this.key, { min: 2, max: 19, bg: 0x0a0a0f });
      this.minSize = band.min; this.maxSize = band.max; this.bg = band.bg ?? 0x0a0a0f;
      this.active = false;
      this.transitionColor = 0x00ffaa; // mint
    }
    onEnter() {
        this.active = true;
        const bounds = (global.game && typeof global.game.getBoundsForLevel === 'function')
        ? global.game.getBoundsForLevel(0)
        : { min: 2, max: 39 };

        const SZ0 = bounds.min, SZ1 = bounds.max;
        // Map size → nm (linear): 0.1 nm .. 1000 nm
        const NM0 = 0.1, NM1 = 1e3;
        global.overrideSizeToNanometers = (size) => {
        const t = clamp((size - SZ0) / Math.max(1, (SZ1 - SZ0)), 0, 1);
        return NM0 + t * (NM1 - NM0);
        };
        // (We still provide nm bounds for labels; UI uses SIZE bounds for %)
        if (!global.currentLevelSizeBounds) global.currentLevelSizeBounds = {};
        global.currentLevelSizeBounds.min = SZ0;
        global.currentLevelSizeBounds.max = SZ1;
        setCurrentNmBounds(NM0, NM1);

        setScaleRuleUI({
        name: 'Å → nm → µm',
        nmMin: NM0,
        nmMax: NM1,
        accent: 'linear-gradient(90deg, rgba(138,43,226,0.9), rgba(0,200,255,0.9))'
        });



      // visuals
      const rend = global?.game?.renderer;
      if (rend?.app?.renderer) rend.app.renderer.backgroundColor = this.bg;
      try {
        if (!rend.stars?.length) rend.createStarryBackground();
        rend.starContainer.visible = true;
      } catch {}
      // ELEMENTS remain base; no swap needed
    }
    onExit() {
        delete global.overrideSizeToNanometers;
        delete global.overrideFormatScale;
        delete global.currentLevelNmBounds;
      this.active = false;
      clearScaleOverrides();
      const rend = global?.game?.renderer;
      if (rend?.starContainer) rend.starContainer.visible = false;
    }
    update() {}
    render() {}
  }

  // ===== Level 1: µm → m =====
  class SecondSolarLevel {
    constructor() {
      this.key = 'micr-m';
      const band = bandByKey(this.key, { min: 20, max: 39, bg: 0x0a0a0f });
      this.minSize = band.min; this.maxSize = band.max; this.bg = band.bg ?? 0x0a0a0f;
      this.active = false;
      this.transitionColor = 0xffd84a; // warm gold
    }
    onEnter() {
      this.active = true;
        // after you compute SZ0,SZ1, NM0=1e3, NM1=1e9 and set overrideSizeToNanometers…
        const bounds = (global.game && typeof global.game.getBoundsForLevel === 'function')
        ? global.game.getBoundsForLevel(1)
        : { min: 40, max: 79 };

        const SZ0 = bounds.min, SZ1 = bounds.max;
        // log mapping across 1 µm .. 1 m
        const NM0 = 1e3, NM1 = 1e9;
        const L0 = Math.log(NM0), L1 = Math.log(NM1);
        global.overrideSizeToNanometers = (size) => {
        const t = clamp((size - SZ0) / Math.max(1, (SZ1 - SZ0)), 0, 1);
        return Math.exp(L0 + t * (L1 - L0));
        };
        if (!global.currentLevelSizeBounds) global.currentLevelSizeBounds = {};
        global.currentLevelSizeBounds.min = SZ0;
        global.currentLevelSizeBounds.max = SZ1;
        setCurrentNmBounds(NM0, NM1);

        setScaleRuleUI({
        name: 'µm → mm → cm → m',
        nmMin: NM0,
        nmMax: NM1,
        accent: 'linear-gradient(90deg, rgba(255,216,74,0.95), rgba(255,105,180,0.9))'
        });


      // swap ELEMENTS to L1 set (if provided by elements.js)
      const L1 = global.ELEMENTS_L1 || [];
      const loader = global?.PIXI?.Loader?.shared;
      if (loader && L1.length) {
        L1.forEach(e => { if (!loader.resources[e.textureKey]) loader.add(e.textureKey, e.src); });
        loader.load(() => {
          // override getter + elements used by renderer
          global._orig_ELEMENTS = global._orig_ELEMENTS || global.ELEMENTS;
          global._orig_getTex = global._orig_getTex || global.getElementTextureSources;
          global.ELEMENTS = L1;
          global.getElementTextureSources = () => L1.map(e => ({ key: e.textureKey, src: e.src }));
        });
      }
      const rend = global?.game?.renderer;
      if (rend?.app?.renderer) rend.app.renderer.backgroundColor = this.bg;
      if (rend?.starContainer) rend.starContainer.visible = false;
    }
    onExit() {
        delete global.overrideSizeToNanometers;
        delete global.overrideFormatScale;
        delete global.currentLevelNmBounds;
      this.active = false;
      clearScaleOverrides();
      if (global._orig_ELEMENTS)  { global.ELEMENTS = global._orig_ELEMENTS; global._orig_ELEMENTS = null; }
      if (global._orig_getTex)    { global.getElementTextureSources = global._orig_getTex; global._orig_getTex = null; }
    }
    update() {}
    render() {}
  }

  // ===== Level 2: m → Mm =====
  class ThirdSolarLevel {
    constructor() {
      this.key = 'm-Mm';
      const band = bandByKey(this.key, { min: 40, max: 59, bg: 0x0a0a0f });
      this.minSize = band.min; this.maxSize = band.max; this.bg = band.bg ?? 0x0a0a0f;
      this.active = false;
      this.transitionColor = 0x88ccff; // cool blue
    }
    onEnter() {
      this.active = true;
        // after SZ0,SZ1, NM0=1e9, NM1=1e15 and overrideSizeToNanometers…
        const bounds = (global.game && typeof global.game.getBoundsForLevel === 'function')
        ? global.game.getBoundsForLevel(2)
        : { min: 80, max: 119 };

        const SZ0 = bounds.min, SZ1 = bounds.max;
        // log mapping 1 m .. 1 Mm
        const NM0 = 1e9, NM1 = 1e15;
        const L0 = Math.log(NM0), L1 = Math.log(NM1);
        global.overrideSizeToNanometers = (size) => {
        const t = clamp((size - SZ0) / Math.max(1, (SZ1 - SZ0)), 0, 1);
        return Math.exp(L0 + t * (L1 - L0));
        };
        if (!global.currentLevelSizeBounds) global.currentLevelSizeBounds = {};
        global.currentLevelSizeBounds.min = SZ0;
        global.currentLevelSizeBounds.max = SZ1;
        setCurrentNmBounds(NM0, NM1);

        setScaleRuleUI({
        name: 'm → km → Mm',
        nmMin: NM0,
        nmMax: NM1,
        accent: 'linear-gradient(90deg, rgba(0,200,255,0.95), rgba(138,43,226,0.9))'
        });


      const L2 = global.ELEMENTS_L2 || [];
      const loader = global?.PIXI?.Loader?.shared;
      if (loader && L2.length) {
        L2.forEach(e => { if (!loader.resources[e.textureKey]) loader.add(e.textureKey, e.src); });
        loader.load(() => {
          global._orig_ELEMENTS = global._orig_ELEMENTS || global.ELEMENTS;
          global._orig_getTex = global._orig_getTex || global.getElementTextureSources;
          global.ELEMENTS = L2;
          global.getElementTextureSources = () => L2.map(e => ({ key: e.textureKey, src: e.src }));
        });
      }
      const rend = global?.game?.renderer;
      if (rend?.app?.renderer) rend.app.renderer.backgroundColor = this.bg;
      if (rend?.starContainer) rend.starContainer.visible = false;
    }
    onExit() {
        delete global.overrideSizeToNanometers;
        delete global.overrideFormatScale;
        delete global.currentLevelNmBounds;
      this.active = false;
      clearScaleOverrides();
      if (global._orig_ELEMENTS)  { global.ELEMENTS = global._orig_ELEMENTS; global._orig_ELEMENTS = null; }
      if (global._orig_getTex)    { global.getElementTextureSources = global._orig_getTex; global._orig_getTex = null; }
    }
    update() {}
    render() {}
  }

  // export instances for main.js
  global.FirstSolarLevel  = new FirstSolarLevel();
  global.SecondSolarLevel = new SecondSolarLevel();
  global.ThirdSolarLevel  = new ThirdSolarLevel();

  log('✅ levels_pack.js loaded');
})(window);
