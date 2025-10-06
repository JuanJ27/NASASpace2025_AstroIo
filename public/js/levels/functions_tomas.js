/* ==========================================================================
 * Tomás — Level Pack (Solar 1–3) with Level-specific Scale Rules & Orbs
 * - Level 0 (FirstSolarLevel): Quantum Tunnel + starfield + ELEMENTS (H, He, O…)
 * - Level 1 (SecondSolarLevel): Silicatos/Carbonáceos/Hielo/Óxidos (no starfield)
 * - Level 2 (ThirdSolarLevel): Asteroides C/S/M (no starfield)
 * Each level sets its own scale rule (shown via game.ui.setScaleRule if present)
 * and temporarily overrides ELEMENTS + getElementTextureSources(), restoring on exit.
 * ========================================================================== */
(function (global) {
  'use strict';

  // ---------- helpers -------------------------------------------------------
  const log = (...a) => console.log('[TomasLevels]', ...a);
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

  function readLevelBand(key, fallback) {
    if (typeof global.getLevelByKey === 'function') {
      const cfg = global.getLevelByKey(key);
      if (cfg && Number.isFinite(cfg.min) && Number.isFinite(cfg.max)) {
        return { min: cfg.min, max: cfg.max, backgroundColor: cfg.backgroundColor };
      }
    }
    return fallback;
  }

  // --- scale rule bridge (UI) ----------------------------------------------
  // Tries to set on HUD if supported; otherwise keeps a global for your UI.
  const ScaleBridge = {
    set(rule) {
      const ui = global?.game?.ui;
      if (ui && typeof ui.setScaleRule === 'function') {
        ui.setScaleRule(rule);
      } else {
        global.ACTIVE_SCALE_RULE = rule; // fallback for your UI
      }
    }
  };

  // --- scale override hooks (used by your HUD’s updateScalePanel patch) ----
  function clearScaleOverrides() {
    delete window.overrideSizeToNanometers;
    delete window.overrideFormatScale;
    delete window.overrideScaleProgress;
  }
  // format helpers
  function fmt_nm_um_A(nm) {
    if (nm < 1) return Math.round(nm * 10) + ' Å';
    if (nm < 1000) return Math.round(nm) + ' nm';
    return (nm / 1000).toFixed(2).replace(/\.00$/, '') + ' μm';
  }
  function fmt_mm_cm_m(nm) {
    const m = nm * 1e-9;
    if (m < 1e-3) { // < 1 mm
      const um = m * 1e6;
      if (um < 1000) return Math.round(um) + ' μm';
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

  // ---------- Starfield toggles (uses star1/star2 from main loader) --------
  function ensureStarfieldVisible() {
    const app = global?.game?.renderer?.app;
    const rend = global?.game?.renderer;
    if (!rend || !app) return;
    try {
      if (typeof rend.createStarryBackground === 'function') {
        rend.createStarryBackground();
      }
      if (rend.starryBackground) rend.starryBackground.visible = true;
      if (rend.bgStarsContainer) rend.bgStarsContainer.visible = true;
    } catch (e) {
      log('Starfield show failed (non-fatal):', e);
    }
  }
  function hideStarfield() {
    const rend = global?.game?.renderer;
    if (!rend) return;
    try {
      if (rend.starryBackground) rend.starryBackground.visible = false;
      if (rend.bgStarsContainer) rend.bgStarsContainer.visible = false;
    } catch (e) {
      log('Starfield hide failed (non-fatal):', e);
    }
  }

  // ---------- ELEMENTS / textures override layer ---------------------------
  // We override BOTH ELEMENTS and getElementTextureSources() and restore on exit.
  const ElementSwap = {
    _origElements: null,
    _origGetter: null,

    _makeGetterFromElements(list) {
      // main.js expects [{ key, src }] — keys must be unique
      return function () {
        return (list || []).map(e => ({ key: e.textureKey, src: e.src }));
      };
    },

    apply(elementsList) {
      if (!this._origElements) this._origElements = global.ELEMENTS;
      if (!this._origGetter)   this._origGetter   = global.getElementTextureSources;

      global.ELEMENTS = elementsList;
      global.getElementTextureSources = this._makeGetterFromElements(elementsList);
      log(`🔁 ELEMENTS overridden (${elementsList.length} items)`);
    },

    restore() {
      if (this._origElements) {
        global.ELEMENTS = this._origElements;
        this._origElements = null;
      }
      if (this._origGetter) {
        global.getElementTextureSources = this._origGetter;
        this._origGetter = null;
      }
      log('🔁 ELEMENTS restored to defaults');
    }
  };

  // --- tiny preloader for per-level element textures -----------------------
  function ensureTexturesForElements(elements, onDone) {
    try {
      const loader = (global.PIXI && global.PIXI.Loader) ? global.PIXI.Loader.shared : null;
      if (!loader || !Array.isArray(elements) || !elements.length) {
        onDone && onDone();
        return;
      }
      const toAdd = [];
      elements.forEach(e => {
        const k = e.textureKey;
        const src = e.src;
        if (!loader.resources[k]) {
          toAdd.push({ k, src });
          loader.add(k, src);
        }
      });
      if (toAdd.length === 0) {
        onDone && onDone();
      } else {
        loader.load(() => {
          log(`📦 Preloaded ${toAdd.length} textures for level`);
          onDone && onDone();
        });
      }
    } catch (err) {
      console.warn('ensureTexturesForElements error:', err);
      onDone && onDone();
    }
  }

  // ----------------------- Quantum Tunnel (self) service --------------------
  const QuantumTunnelService = {
    _timer: null,
    _enabled: false,

    INTERVAL_MS: 1000,          // once per second
    TRIGGER_THRESHOLD: 0.95,    // ~5% chance
    MIN_R: 30,

    _sampleRadius1OverR(rMin, rMax) {
      const u = Math.random();
      const ratio = rMax / rMin;
      return rMin * Math.pow(ratio, u);
    },
    _sampleOffset1OverR(rMin, rMax) {
      const r = this._sampleRadius1OverR(rMin, rMax);
      const theta = Math.random() * Math.PI * 2;
      return { dx: r * Math.cos(theta), dy: r * Math.sin(theta) };
    },

    _tick() {
      try {
        const game = global.game;
        if (!game || !game.clientGameState || !game.myPlayerId || !game.isGameActive) return;
        if (Math.random() <= this.TRIGGER_THRESHOLD) return;

        const myId = game.myPlayerId;
        const me = game.clientGameState.players[myId];
        if (!me || me.isAlive === false) return;

        const worldW = game.worldWidth || (game.camera && game.camera.worldWidth) || 2000;
        const worldH = game.worldHeight || (game.camera && game.camera.worldHeight) || 2000;

        const diag = Math.hypot(worldW, worldH);
        const R_MIN = this.MIN_R;
               const R_MAX = Math.max(R_MIN + 1, 0.5 * diag);

        const { dx, dy } = this._sampleOffset1OverR(R_MIN, R_MAX);
        const tx = clamp(me.x + dx, 0, worldW);
        const ty = clamp(me.y + dy, 0, worldH);

        // Local optimistic move
        game.clientGameState.players[myId] = { ...me, x: tx, y: ty };

        // Nudge server (so your position persists)
        if (game.socket?.socket?.emit) {
          game.socket.socket.emit('quantumTunnel', {
            playerId: myId,
            from: { x: me.x, y: me.y },
            to:   { x: tx, y: ty },
            reason: 'tomas_level0_quantum'
          });
        }
        if (typeof game.socket?.sendMove === 'function') {
          game.socket.sendMove(tx, ty);
        }

        // Small flash
        const renderer = game.renderer;
        if (renderer?.transitionOverlay && renderer?.app) {
          const overlay = renderer.transitionOverlay;
          const w = renderer.app.screen.width;
          const h = renderer.app.screen.height;
          overlay.clear();
          overlay.beginFill(0x000000, 0.3);
          overlay.drawRect(0, 0, w, h);
          overlay.endFill();
          setTimeout(() => overlay.clear(), 90);
        }
      } catch (err) {
        console.warn('[QuantumTunnelService] tick error:', err);
      }
    },

    start() {
      if (this._enabled) return;
      this._enabled = true;
      this._timer && clearInterval(this._timer);
      this._timer = setInterval(() => this._tick(), this.INTERVAL_MS);
      log('🌀 QuantumTunnelService: ENABLED (Solar 1).');
    },
    stop() {
      this._timer && clearInterval(this._timer);
      this._timer = null;
      this._enabled = false;
      log('🌀 QuantumTunnelService: DISABLED.');
    }
  };

  // ---------- ORB SETS (per level) -----------------------------------------
  // Level 1 (SecondSolarLevel): Silicatos / Carbonáceos / Hielo / Óxidos
  const ELEMENTS_LEVEL_1 = [
    {
      key: 'Si',
      name: 'Silicatos',
      weight: 0.50,
      points: 0.5,
      textureKey: 'texSilicatos',
      src: '/assets/silicatos.webp',
      color: '#a08f6c',
      miniColor: '#a08f6c'
    },
    {
      key: 'Cb',
      name: 'Carbonáceos',
      weight: 0.20,
      points: 2.0,
      textureKey: 'texCarbonaceo',
      src: '/assets/carbonaceo.webp',
      color: '#3b3b3b',
      miniColor: '#3b3b3b'
    },
    {
      key: 'Hi',
      name: 'Mantos de Hielo',
      weight: 0.12,
      points: 5.0,
      textureKey: 'texHielo',
      src: '/assets/bola_hielo.webp',
      color: '#9adfff',
      miniColor: '#9adfff'
    },
    {
      key: 'Ox',
      name: 'Óxidos y sulfuros metálicos',
      weight: 0.18,
      points: 3.0,
      textureKey: 'texOxidos',
      src: '/assets/oxidos.webp',
      color: '#8a9aa5',
      miniColor: '#8a9aa5'
    }
  ];

  // Level 2 (ThirdSolarLevel): Asteroides C / S / M
  const ELEMENTS_LEVEL_2 = [
    {
      key: 'AC',
      name: 'Asteroide tipo C',
      weight: 0.50,
      points: 1.0,
      textureKey: 'texAstC',
      src: '/assets/asteroide_C.webp',
      color: '#7f8c8d',
      miniColor: '#7f8c8d'
    },
    {
      key: 'AS',
      name: 'Asteroide tipo S',
      weight: 0.30,
      points: 2.0,
      textureKey: 'texAstS',
      src: '/assets/asteroide_S.webp',
      color: '#c0a16b',
      miniColor: '#c0a16b'
    },
    {
      key: 'AM',
      name: 'Asteroide tipo M',
      weight: 0.20,
      points: 4.0,
      textureKey: 'texAstM',
      src: '/assets/asteroides_M.webp',
      color: '#a7a7a7',
      miniColor: '#a7a7a7'
    }
  ];

  // ---------- SCALE RULES (per level) --------------------------------------
  const SCALE_LEVEL_0 = {
    name: 'Å → nm → μm',
    from: '1 Å',
    to:   '1 μm',
    ticks: [
      { at: 0.00, label: 'Å' },
      { at: 0.33, label: 'nm' },
      { at: 1.00, label: 'μm' }
    ]
  };

  const SCALE_LEVEL_1 = {
    name: 'μm → mm → cm → m',
    from: '1 μm',
    to:   '1 m',
    ticks: [
      { at: 0.00, label: 'μm' },
      { at: 0.25, label: 'mm' },
      { at: 0.60, label: 'cm' },
      { at: 1.00, label: 'm'  }
    ]
  };

  const SCALE_LEVEL_2 = {
    name: 'm → Km → Mm',
    from: '1 m',
    to:   '1 Mm',
    ticks: [
      { at: 0.00, label: 'm'  },
      { at: 0.20, label: 'Km' },
      { at: 1.00, label: 'Mm' }
    ]
  };

  // -------------------------- Level 0: FirstSolarLevel ----------------------
  class FirstSolarLevel {
    constructor() {
      this.name = 'Solar 1 (Quantum)';
      this.key  = 'amns-micr';
      const band = readLevelBand(this.key, { min: 1, max: 19, backgroundColor: 0x0a0a0f });
      this.minSize = band.min;
      this.maxSize = band.max;
      this.backgroundColor = band.backgroundColor ?? 0x0a0a0f;
      this.active = false;
      log(`☀️ FirstSolarLevel: ${this.minSize}-${this.maxSize}`);
    }

    onEnter() {
      this.active = true;

      // Scale HUD rule
      ScaleBridge.set(SCALE_LEVEL_0);

      // Scale overrides (size 1..19 → 0.1 nm .. 1000 nm)
      const SIZE_MIN = this.minSize;
      const SIZE_MAX = this.maxSize;
      const NM_MIN = 0.1;
      const NM_MAX = 1000;
      window.overrideSizeToNanometers = (size) => {
        const t = Math.max(0, Math.min(1, (size - SIZE_MIN) / (SIZE_MAX - SIZE_MIN)));
        return NM_MIN + t * (NM_MAX - NM_MIN);
      };
      window.overrideFormatScale = (nm) => fmt_nm_um_A(nm);
      window.overrideScaleProgress = (size) =>
        Math.max(0, Math.min(1, (size - SIZE_MIN) / (SIZE_MAX - SIZE_MIN)));

      // Starfield ON
      ensureStarfieldVisible();

      // Default ELEMENTS (from elements.js) — just sync getter
      ElementSwap.apply(global.ELEMENTS || []);

      // Background base
      const app = global?.game?.renderer?.app;
      if (app?.renderer) app.renderer.backgroundColor = this.backgroundColor;

      // Quantum ON
      QuantumTunnelService.start();

      this._message('SOLAR 1 — Quantum ON');
    }

    onExit() {
      this.active = false;
      clearScaleOverrides();
      ElementSwap.restore();
      hideStarfield();
      QuantumTunnelService.stop();
      const app = global?.game?.renderer?.app;
      if (app?.renderer) app.renderer.backgroundColor = 0x0a0a0f;
    }

    update() {}
    render() {}
    cleanup() { this.onExit?.(); }

    _message(text) {
      const div = document.createElement('div');
      div.textContent = text;
      Object.assign(div.style, {
        position: 'fixed',
        top: '20%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        fontSize: '32px',
        fontWeight: 'bold',
        color: '#00FFAA',
        textShadow: '0 0 16px #00FFAA',
        zIndex: 9999,
        pointerEvents: 'none',
        fontFamily: 'Arial, sans-serif'
      });
      document.body.appendChild(div);
      setTimeout(() => div.remove(), 1600);
    }
  }

  // -------------------------- Level 1: SecondSolarLevel ---------------------
  class SecondSolarLevel {
    constructor() {
      this.name = 'Solar 2 (Orbs)';
      this.key  = 'micr-m';
      const band = readLevelBand(this.key, { min: 20, max: 39, backgroundColor: 0x0a0a0f });
      this.minSize = band.min;
      this.maxSize = band.max;
      this.backgroundColor = band.backgroundColor ?? 0x0a0a0f;
      this.active = false;
      log(`☀️ SecondSolarLevel: ${this.minSize}-${this.maxSize}`);
    }

    onEnter() {
      this.active = true;

      // Scale HUD rule
      ScaleBridge.set(SCALE_LEVEL_1);

      // Scale overrides (size 20..39 → 1 μm .. 1 m) in log space
      const SIZE_MIN = this.minSize, SIZE_MAX = this.maxSize;
      const NM_MIN = 1e3, NM_MAX = 1e9; // 1 µm .. 1 m
      window.overrideSizeToNanometers = (size) => {
        const t = Math.max(0, Math.min(1, (size - SIZE_MIN) / (SIZE_MAX - SIZE_MIN)));
        const logMin = Math.log(NM_MIN), logMax = Math.log(NM_MAX);
        return Math.exp(logMin + t * (logMax - logMin));
      };
      window.overrideFormatScale = (nm) => fmt_mm_cm_m(nm);
      window.overrideScaleProgress = (size) =>
        Math.max(0, Math.min(1, (size - SIZE_MIN) / (SIZE_MAX - SIZE_MIN)));

      // No quantum, no starfield
      QuantumTunnelService.stop();
      hideStarfield();

      // Plain dark background
      const app = global?.game?.renderer?.app;
      if (app?.renderer) app.renderer.backgroundColor = 0x0a0a0f;

      // Apply L1 orbs (preload if needed)
      ensureTexturesForElements(ELEMENTS_LEVEL_1, () => {
        ElementSwap.apply(ELEMENTS_LEVEL_1);
      });

      this._message('SOLAR 2 — Silicatos/Carbonáceos/Hielo/Óxidos');
    }

    onExit() {
      this.active = false;
      clearScaleOverrides();
      ElementSwap.restore();
    }

    update() {}
    render() {}
    cleanup() {}

    _message(text) {
      const div = document.createElement('div');
      div.textContent = text;
      Object.assign(div.style, {
        position: 'fixed',
        top: '20%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        fontSize: '32px',
        fontWeight: 'bold',
        color: '#FFD84A',
        textShadow: '0 0 16px #FFD84A',
        zIndex: 9999,
        pointerEvents: 'none',
        fontFamily: 'Arial, sans-serif'
      });
      document.body.appendChild(div);
      setTimeout(() => div.remove(), 1600);
    }
  }

  // -------------------------- Level 2: ThirdSolarLevel ----------------------
  class ThirdSolarLevel {
    constructor() {
      this.name = 'Solar 3';
      this.key  = 'm-Mm';
      const band = readLevelBand(this.key, { min: 40, max: 59, backgroundColor: 0x0a0a0f });
      this.minSize = band.min;
      this.maxSize = band.max;
      this.backgroundColor = band.backgroundColor ?? 0x0a0a0f;
      this.active = false;
      log(`☀️ ThirdSolarLevel: ${this.minSize}-${this.maxSize}`);
    }

    onEnter() {
      this.active = true;

      // Scale HUD rule
      ScaleBridge.set(SCALE_LEVEL_2);

      // Scale overrides (size 40..59 → 1 m .. 1 Mm) in log space
      const SIZE_MIN = this.minSize, SIZE_MAX = this.maxSize;
      const NM_MIN = 1e9, NM_MAX = 1e15; // 1 m .. 1 Mm
      window.overrideSizeToNanometers = (size) => {
        const t = Math.max(0, Math.min(1, (size - SIZE_MIN) / (SIZE_MAX - SIZE_MIN)));
        const logMin = Math.log(NM_MIN), logMax = Math.log(NM_MAX);
        return Math.exp(logMin + t * (logMax - logMin));
      };
      window.overrideFormatScale = (nm) => fmt_m_km_Mm(nm);
      window.overrideScaleProgress = (size) =>
        Math.max(0, Math.min(1, (size - SIZE_MIN) / (SIZE_MAX - SIZE_MIN)));

      QuantumTunnelService.stop();
      hideStarfield();

      const app = global?.game?.renderer?.app;
      if (app?.renderer) app.renderer.backgroundColor = 0x0a0a0f;

      // Apply L2 orbs (preload if needed)
      ensureTexturesForElements(ELEMENTS_LEVEL_2, () => {
        ElementSwap.apply(ELEMENTS_LEVEL_2);
      });

      this._message('SOLAR 3 — Asteroides C/S/M');
    }

    onExit() {
      this.active = false;
      clearScaleOverrides();
      ElementSwap.restore();
    }

    update() {}
    render() {}
    cleanup() {}

    _message(text) {
      const div = document.createElement('div');
      div.textContent = text;
      Object.assign(div.style, {
        position: 'fixed',
        top: '20%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        fontSize: '32px',
        fontWeight: 'bold',
        color: '#88CCFF',
        textShadow: '0 0 16px #88CCFF',
        zIndex: 9999,
        pointerEvents: 'none',
        fontFamily: 'Arial, sans-serif'
      });
      document.body.appendChild(div);
      setTimeout(() => div.remove(), 1600);
    }
  }

  // Expose instances matching your main.registerCustomLevels()
  global.FirstSolarLevel  = new FirstSolarLevel();   // level 0 (1–19)
  global.SecondSolarLevel = new SecondSolarLevel();  // level 1 (20–39)
  global.ThirdSolarLevel  = new ThirdSolarLevel();   // level 2 (40–59)

  log('✅ functions_tomas.js loaded with per-level scale rules & orbs.');
})(window);
