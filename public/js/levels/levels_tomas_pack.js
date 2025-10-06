/* ==========================================================================
 * Tomás — Level Pack (Solar 1–3) with level-specific Scale Rules & Orbs
 * - Level 0 (FirstSolarLevel): Quantum Tunnel + starfield + base ELEMENTS
 * - Level 1 (SecondSolarLevel): Silicatos/Carbonáceos/Hielo/Óxidos (no quantum)
 * - Level 2 (ThirdSolarLevel): Asteroides C/S/M (no quantum)
 * Scale ranges come from LEVELS_CONFIG if present; fallback to main.getLevelInfo bands.
 * ========================================================================== */
(function (global) {
  'use strict';

  const log = (...a) => console.log('[LevelsPack]', ...a);
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

  // ---------- read size bands ----------
  function bandFromKey(key, fallback) {
    if (typeof global.getLevelByKey === 'function') {
      const cfg = global.getLevelByKey(key);
      if (cfg && Number.isFinite(cfg.min) && Number.isFinite(cfg.max)) {
        return { min: cfg.min, max: cfg.max, bg: cfg.backgroundColor };
      }
    }
    return fallback;
  }

  // If shared config is missing, derive a band by probing main.getLevelInfo().
  function discoverBandByClientLevel(clientLevel, probeMax = 2000) {
    if (!global.game?.getLevelInfo) return null;
    let min = null, max = null;
    for (let s = 0; s <= probeMax; s++) {
      const info = global.game.getLevelInfo(s) || {};
      if (info.level === clientLevel) {
        if (min === null) min = s;
        max = s;
      } else if (min !== null && info.level !== clientLevel) {
        break;
      }
    }
    if (min === null) return null;
    return { min, max, bg: 0x0a0a0f };
  }

  // ---------- tiny starfield toggles ----------
  function starfieldOn() {
    const rend = global?.game?.renderer;
    if (!rend) return;
    try {
      if (!rend.stars || !rend.stars.length) rend.createStarryBackground();
      rend.starContainer.visible = true;
    } catch {}
  }
  function starfieldOff() {
    const rend = global?.game?.renderer;
    if (!rend) return;
    try { rend.starContainer.visible = false; } catch {}
  }

  // ---------- scale formatters ----------
  function fmt_nm_um_A(nm) {
    if (nm < 1) return Math.round(nm * 10) + ' Å';
    if (nm < 1000) return Math.round(nm) + ' nm';
    return (nm / 1000).toFixed(2).replace(/\.00$/, '') + ' µm';
  }
  function fmt_mm_cm_m(nm) {
    const m = nm * 1e-9;
    if (m < 1e-3) { // < 1 mm
      const um = m * 1e6;
      if (um < 1000) return Math.round(um) + ' µm';
      const mm = um / 1000;
      return mm.toFixed(2).replace(/\.00$/, '') + ' mm';
    }
    if (m < 0.1) {
      const mm = m * 1000;
      if (mm < 10) return mm.toFixed(1) + ' mm';
      const cm = m * 100;
      return cm.toFixed(1).replace(/\.0$/, '') + ' cm';
    }
    return m.toFixed(2).replace(/\.00$/, '') + ' m';
  }
  function fmt_m_km_Mm(nm) {
    const m = nm * 1e-9;
    if (m < 1000) return m.toFixed(2).replace(/\.00$/, '') + ' m';
    const km = m / 1000;
    if (km < 1000) return km.toFixed(2).replace(/\.00$/, '') + ' Km';
    const Mm = km / 1000;
    return Mm.toFixed(2).replace(/\.00$/, '') + ' Mm';
  }

  // ---------- ELEMENTS swap layer ----------
  const ElementSwap = {
    _origElements: null,
    _origGetter: null,

    _makeGetter(elements) {
      return function () {
        return (elements || []).map(e => ({ key: e.textureKey, src: e.src }));
      };
    },
    apply(elementsList) {
      if (!this._origElements) this._origElements = global.ELEMENTS;
      if (!this._origGetter)   this._origGetter   = global.getElementTextureSources;
      global.ELEMENTS = elementsList;
      global.getElementTextureSources = this._makeGetter(elementsList);
      log(`🔁 ELEMENTS overridden (${elementsList.length})`);
    },
    restore() {
      if (this._origElements) { global.ELEMENTS = this._origElements; this._origElements = null; }
      if (this._origGetter)   { global.getElementTextureSources = this._origGetter; this._origGetter = null; }
      log('🔁 ELEMENTS restored');
    }
  };

  function ensureLevelTextures(elements, onDone) {
    try {
      const loader = global?.PIXI?.Loader?.shared;
      if (!loader || !elements?.length) return onDone && onDone();
      const toAdd = [];
      elements.forEach(e => {
        if (!loader.resources[e.textureKey]) {
          toAdd.push(e.textureKey);
          loader.add(e.textureKey, e.src);
        }
      });
      if (!toAdd.length) return onDone && onDone();
      loader.load(() => onDone && onDone());
    } catch { onDone && onDone(); }
  }

  // ---------- scale bridge to UI ----------
  function setScaleRule(rule) {
    const ui = global?.game?.ui;
    if (ui?.setScaleRule) ui.setScaleRule(rule);
  }
  function clearScaleOverrides() {
    delete global.overrideSizeToNanometers;
    delete global.overrideFormatScale;
    delete global.overrideScaleProgress;
  }

  // ============================ Level 0 ============================
  class FirstSolarLevel {
    constructor() {
      this.key = 'amns-micr';
      const band = bandFromKey(this.key, { min: 2, max: 19, bg: 0x0a0a0f }) ||
                   discoverBandByClientLevel(0) || { min: 2, max: 19, bg: 0x0a0a0f };
      this.minSize = band.min; this.maxSize = band.max; this.bg = band.bg ?? 0x0a0a0f;
      this.active = false;
    }
    onEnter() {
      this.active = true;

      // Scale rule: Å → nm → µm
      setScaleRule({ name:'Å → nm → µm', from:'1 Å', to:'1 µm' });

      const SZ0 = this.minSize, SZ1 = this.maxSize;
      const NM0 = 0.1, NM1 = 1000; // 0.1..1000 nm
      global.overrideSizeToNanometers = (size) => {
        const t = clamp((size - SZ0) / Math.max(1, (SZ1 - SZ0)), 0, 1);
        return NM0 + t * (NM1 - NM0);
      };
      global.overrideFormatScale = (nm) => fmt_nm_um_A(nm);
      global.overrideScaleProgress = (size) => clamp((size - SZ0) / Math.max(1, (SZ1 - SZ0)), 0, 1);

      // Starfield ON
      starfieldOn();

      // Use base elements (ELEMENTS already loaded by elements.js)
      ElementSwap.apply(global.ELEMENTS || []);

      // Background
      const app = global?.game?.renderer?.app;
      if (app?.renderer) app.renderer.backgroundColor = this.bg;

      // NOTE: Quantum Tunnel for level 0 is toggled in main.js (see step 4)
      this._toast('SOLAR 1 — Quantum ON');
    }
    onExit() {
      this.active = false;
      clearScaleOverrides();
      ElementSwap.restore();
      starfieldOff();
    }
    update() {}
    render() {}
    _toast(txt) { this._msg(txt, '#00FFAA'); }
    _msg(text, color='#88CCFF') {
      const div = document.createElement('div');
      div.textContent = text;
      Object.assign(div.style, {
        position:'fixed', top:'20%', left:'50%', transform:'translate(-50%, -50%)',
        fontSize:'32px', fontWeight:'bold', color, textShadow:`0 0 16px ${color}`,
        zIndex:9999, pointerEvents:'none', fontFamily:'Arial, sans-serif'
      });
      document.body.appendChild(div); setTimeout(() => div.remove(), 1400);
    }
  }

  // ============================ Level 1 ============================
  class SecondSolarLevel {
    constructor() {
      this.key = 'micr-m';
      const band = bandFromKey(this.key, { min: 20, max: 39, bg: 0x0a0a0f }) ||
                   discoverBandByClientLevel(1) || { min: 20, max: 39, bg: 0x0a0a0f };
      this.minSize = band.min; this.maxSize = band.max; this.bg = band.bg ?? 0x0a0a0f;
      this.active = false;
    }
    onEnter() {
      this.active = true;

      setScaleRule({ name:'µm → mm → cm → m', from:'1 µm', to:'1 m' });

      const SZ0 = this.minSize, SZ1 = this.maxSize;
      const NM0 = 1e3, NM1 = 1e9; // 1 µm .. 1 m (log spaced)
      global.overrideSizeToNanometers = (size) => {
        const t = clamp((size - SZ0) / Math.max(1, (SZ1 - SZ0)), 0, 1);
        const L0 = Math.log(NM0), L1 = Math.log(NM1);
        return Math.exp(L0 + t * (L1 - L0));
      };
      global.overrideFormatScale = (nm) => fmt_mm_cm_m(nm);
      global.overrideScaleProgress = (size) => clamp((size - SZ0) / Math.max(1, (SZ1 - SZ0)), 0, 1);

      // No starfield, plain bg
      starfieldOff();
      const app = global?.game?.renderer?.app;
      if (app?.renderer) app.renderer.backgroundColor = this.bg;

      // Apply L1 orbs
      const L1 = global.ELEMENTS_L1 || [];
      ensureLevelTextures(L1, () => ElementSwap.apply(L1));

      this._toast('SOLAR 2 — Silicatos/Carbonáceos/Hielo/Óxidos');
    }
    onExit() { this.active = false; clearScaleOverrides(); ElementSwap.restore(); }
    update() {}
    render() {}
    _toast(txt) { this._msg(txt, '#FFD84A'); }
    _msg(text, color='#88CCFF') {
      const div = document.createElement('div');
      div.textContent = text;
      Object.assign(div.style, {
        position:'fixed', top:'20%', left:'50%', transform:'translate(-50%, -50%)',
        fontSize:'32px', fontWeight:'bold', color, textShadow:`0 0 16px ${color}`,
        zIndex:9999, pointerEvents:'none', fontFamily:'Arial, sans-serif'
      });
      document.body.appendChild(div); setTimeout(() => div.remove(), 1400);
    }
  }

  // ============================ Level 2 ============================
  class ThirdSolarLevel {
    constructor() {
      this.key = 'm-Mm';
      const band = bandFromKey(this.key, { min: 40, max: 59, bg: 0x0a0a0f }) ||
                   discoverBandByClientLevel(2) || { min: 40, max: 59, bg: 0x0a0a0f };
      this.minSize = band.min; this.maxSize = band.max; this.bg = band.bg ?? 0x0a0a0f;
      this.active = false;
    }
    onEnter() {
      this.active = true;

      setScaleRule({ name:'m → Km → Mm', from:'1 m', to:'1 Mm' });

      const SZ0 = this.minSize, SZ1 = this.maxSize;
      const NM0 = 1e9, NM1 = 1e15; // 1 m .. 1 Mm (log spaced)
      global.overrideSizeToNanometers = (size) => {
        const t = clamp((size - SZ0) / Math.max(1, (SZ1 - SZ0)), 0, 1);
        const L0 = Math.log(NM0), L1 = Math.log(NM1);
        return Math.exp(L0 + t * (L1 - L0));
      };
      global.overrideFormatScale = (nm) => fmt_m_km_Mm(nm);
      global.overrideScaleProgress = (size) => clamp((size - SZ0) / Math.max(1, (SZ1 - SZ0)), 0, 1);

      // No starfield
      starfieldOff();
      const app = global?.game?.renderer?.app;
      if (app?.renderer) app.renderer.backgroundColor = this.bg;

      // Apply L2 orbs
      const L2 = global.ELEMENTS_L2 || [];
      ensureLevelTextures(L2, () => ElementSwap.apply(L2));

      this._toast('SOLAR 3 — Asteroides C/S/M');
    }
    onExit() { this.active = false; clearScaleOverrides(); ElementSwap.restore(); }
    update() {}
    render() {}
    _toast(txt) { this._msg(txt, '#88CCFF'); }
    _msg(text, color='#88CCFF') {
      const div = document.createElement('div');
      div.textContent = text;
      Object.assign(div.style, {
        position:'fixed', top:'20%', left:'50%', transform:'translate(-50%, -50%)',
        fontSize:'32px', fontWeight:'bold', color, textShadow:`0 0 16px ${color}`,
        zIndex:9999, pointerEvents:'none', fontFamily:'Arial, sans-serif'
      });
      document.body.appendChild(div); setTimeout(() => div.remove(), 1400);
    }
  }

  // Expose instances so main.js can register them
  global.FirstSolarLevel  = new FirstSolarLevel();   // clientLevel 0
  global.SecondSolarLevel = new SecondSolarLevel();  // clientLevel 1
  global.ThirdSolarLevel  = new ThirdSolarLevel();   // clientLevel 2

  log('✅ levels_tomas_pack loaded');
})(window);
