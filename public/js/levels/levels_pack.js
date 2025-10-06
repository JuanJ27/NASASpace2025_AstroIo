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
const elementsL1 = global.ELEMENTS_L1 || [];
const loader = global?.PIXI?.Loader?.shared;
if (loader && elementsL1.length) {
  elementsL1.forEach(e => { if (!loader.resources[e.textureKey]) loader.add(e.textureKey, e.src); });
loader.load(() => {
// override getter + elements used by renderer
global._orig_ELEMENTS = global._orig_ELEMENTS || global.ELEMENTS;
global._orig_getTex = global._orig_getTex || global.getElementTextureSources;
global.ELEMENTS = elementsL1;
global.getElementTextureSources = () => elementsL1.map(e => ({ key: e.textureKey, src: e.src }));
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
this.transitionColor = 0x88ccff;
this._gfx = null;
this._band = null;          // {min,max} for (level 1, sub 3) ∪ (level 1, sub 4)
this._lastAllow = null;     // for cheap debug logging (optional)
}

onEnter() {
this.active = true;

// size->nm mapping (m..Mm)
const bounds = (global.game && typeof global.game.getBoundsForLevel === 'function')
? global.game.getBoundsForLevel(2)
: { min: 80, max: 119 };
const SZ0 = bounds.min, SZ1 = bounds.max;
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

const rend = global?.game?.renderer;
if (rend?.app?.renderer) rend.app.renderer.backgroundColor = this.bg;

// Create a dedicated hazards layer inside the world container
if (rend?.worldContainer && !this._gfx) {
// IMPORTANT: sortableChildren must be enabled on worldContainer (you already do this)
this._gfx = new PIXI.Graphics();
this._gfx.zIndex = 30;     // players ~20, names ~40 → we sit in the middle
this._gfx.visible = false; // toggled each frame by render()
rend.worldContainer.addChild(this._gfx);
}

// Build the union band from LEVELS_CONFIG: (level 1, sublevel 3) ∪ (level 1, sublevel 4)
try {
const cfg = (global.LEVELS_CONFIG || []);
const s3 = cfg.find(e => e.level === 1 && e.sublevel === 3);
const s4 = cfg.find(e => e.level === 1 && e.sublevel === 4);
if (s3 && s4) {
this._band = { min: Math.min(s3.min, s4.min), max: Math.max(s3.max, s4.max) };
} else {
this._band = { min: 27, max: 119 }; // fallback
}
} catch {
this._band = { min: 27, max: 119 };
}

this._lastAllow = null;
}

onExit() {
this.active = false;
delete global.overrideSizeToNanometers;
delete global.overrideFormatScale;
delete global.currentLevelNmBounds;

if (this._gfx) {
this._gfx.destroy(true);
this._gfx = null;
}
}

update() {} // no per-frame state here; drawing happens in render()

render(renderer, camera) {
if (!this.active || !renderer || !this._gfx) return;

const game = global.game;
if (!game || !game.clientGameState) return;
const me = game.clientGameState.players[game.myPlayerId];
if (!me) return;

// Visibility rule (client-side):
// Show hazards only while *you* are within (sub3 ∪ sub4); permanently hide if you pass max.
const band = this._band || { min: 27, max: 119 };
if (me.size > band.max) game._hazardsPermanentlyDisabled = true;
const blocked = !!game._hazardsPermanentlyDisabled;
const inBand = me.size >= band.min && me.size <= band.max;
const allow = inBand && !blocked;

// Toggle layer visibility and clear when hidden
this._gfx.visible = allow;
if (!allow) { this._gfx.clear(); return; }

// Draw hazards coming from the server
const hz = game.clientGameState.hazards;
if (!hz) { this._gfx.clear(); return; }

const { blackHole, whiteHole, asteroids } = hz;
const g = this._gfx;
g.clear();

// Asteroids (filled grey circles with a thin outline so they pop)
if (Array.isArray(asteroids) && asteroids.length) {
g.lineStyle(1, 0xFFFFFF, 0.6);
g.beginFill(0x888888, 0.95);
for (const a of asteroids) {
g.drawCircle(a.x, a.y, a.r);
}
g.endFill();
}

// Black hole: black fill + bright red outline
if (blackHole) {
g.lineStyle(4, 0xFF3333, 0.95);
g.beginFill(0x000000, 1.0);
g.drawCircle(blackHole.x, blackHole.y, blackHole.r);
g.endFill();
}

// White hole: white ring + inner blue core
if (whiteHole) {
g.lineStyle(3, 0xFFFFFF, 0.95);
g.beginFill(0xFFFFFF, 0.2);
g.drawCircle(whiteHole.x, whiteHole.y, whiteHole.r);
g.endFill();

g.beginFill(0x66CCFF, 0.75);
g.drawCircle(whiteHole.x, whiteHole.y, Math.max(4, whiteHole.r * 0.5));
g.endFill();
}

// (Optional) Tiny debug once per state change
if (allow !== this._lastAllow) {
this._lastAllow = allow;
console.log('[ThirdSolarLevel] hazards visible:', allow, 'inBand=', inBand, 'blocked=', blocked, 'me.size=', me.size);
}
}
}


  // ===== Level 3: GALAXY LEVEL (120-159) =====
  class GalaxyLevel {
    constructor() {
      this.key = 'galaxy';
      const band = bandByKey(this.key, { min: 120, max: 159, bg: 0x0a0515 });
      this.minSize = band.min; this.maxSize = band.max; this.bg = band.bg ?? 0x0a0515;
      this.active = false;
      this.transitionColor = 0xff00ff; // magenta
      this._gfx = null;
      
      // Trails para movimiento orbital (array de posiciones)
      this.blackHoleTrail = [];
      this.quasarTrail = [];
      this.MAX_TRAIL_LENGTH = 60; // 1 segundo a 60 FPS
    }

    onEnter() {
      this.active = true;

      // Size->nm mapping (Mm..Tm escala logarítmica)
      const bounds = (global.game && typeof global.game.getBoundsForLevel === 'function')
        ? global.game.getBoundsForLevel(3)
        : { min: 120, max: 159 };
      const SZ0 = bounds.min, SZ1 = bounds.max;
      const NM0 = 1e15, NM1 = 1e21; // 1 Mm .. 1 Tm
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
        name: 'Mm → Gm → Tm',
        nmMin: NM0,
        nmMax: NM1,
        accent: 'linear-gradient(90deg, rgba(255,0,255,0.95), rgba(138,43,226,0.9))'
      });

      const rend = global?.game?.renderer;
      if (rend?.app?.renderer) rend.app.renderer.backgroundColor = this.bg;

      // Crear layer de hazards (orbital black hole, quasar, dark matter)
      if (rend?.worldContainer && !this._gfx) {
        this._gfx = new PIXI.Graphics();
        this._gfx.zIndex = 30;
        this._gfx.visible = false;
        rend.worldContainer.addChild(this._gfx);
      }

      this.blackHoleTrail = [];
      this.quasarTrail = [];
      
      console.log('🌌 GalaxyLevel ENTERED (size 120-159)');
    }

    onExit() {
      this.active = false;
      delete global.overrideSizeToNanometers;
      delete global.overrideFormatScale;
      delete global.currentLevelNmBounds;

      if (this._gfx) {
        this._gfx.destroy(true);
        this._gfx = null;
      }

      this.blackHoleTrail = [];
      this.quasarTrail = [];
    }

    update() {} // Lógica de movimiento en server

    /**
     * Añadir punto al trail con fade-out
     */
    addToTrail(trail, x, y) {
      trail.push({ x, y });
      if (trail.length > this.MAX_TRAIL_LENGTH) {
        trail.shift();
      }
    }

    /**
     * Renderizar trail con gradiente de alpha
     */
    renderTrail(g, trail, color, alpha) {
      if (trail.length < 2) return;

      for (let i = 0; i < trail.length - 1; i++) {
        const t = i / trail.length; // 0 (viejo) → 1 (nuevo)
        const a = alpha * t; // fade-in desde 0 hasta alpha

        g.lineStyle(3, color, a);
        g.moveTo(trail[i].x, trail[i].y);
        g.lineTo(trail[i + 1].x, trail[i + 1].y);
      }
    }

    render(renderer, camera) {
      if (!this.active || !renderer || !this._gfx) {
        // DEBUG: check if level is active
        if (!this.active) console.log('[GalaxyLevel] Not rendering: level not active');
        if (!this._gfx) console.log('[GalaxyLevel] Not rendering: _gfx not created');
        return;
      }

      const game = global.game;
      if (!game || !game.clientGameState) {
        console.log('[GalaxyLevel] Not rendering: no game state');
        return;
      }

      const ghz = game.clientGameState.galaxyHazards;
      
      // DEBUG: Log galaxy hazards state
      console.log('[GalaxyLevel] galaxyHazards:', ghz);
      
      if (!ghz || !ghz.active) {
        console.log('[GalaxyLevel] Hazards not active, hiding graphics');
        this._gfx.visible = false;
        this._gfx.clear();
        return;
      }

      console.log('[GalaxyLevel] RENDERING Galaxy Hazards!');
      this._gfx.visible = true;
      const g = this._gfx;
      g.clear();

      // ========== 1. SUPERMASSIVE BLACK HOLE (CON TRAIL ORBITAL) ==========
      if (ghz.superMassiveBlackHole) {
        const bh = ghz.superMassiveBlackHole;

        // Añadir posición actual al trail
        this.addToTrail(this.blackHoleTrail, bh.x, bh.y);

        // Renderizar trail orbital (azul oscuro con fade)
        this.renderTrail(g, this.blackHoleTrail, 0x4444ff, 0.6);

        // Núcleo del agujero negro (negro con borde rojo brillante)
        g.lineStyle(6, 0xff0000, 1.0);
        g.beginFill(0x000000, 1.0);
        g.drawCircle(bh.x, bh.y, bh.r);
        g.endFill();

        // Horizonte de eventos (anillo rojo pulsante)
        const pulseAlpha = 0.3 + 0.2 * Math.sin(Date.now() * 0.005);
        g.lineStyle(2, 0xff4444, pulseAlpha);
        g.drawCircle(bh.x, bh.y, bh.killRadius);
      }

      // ========== 2. QUASAR (CON TRAIL CIRCULAR) ==========
      if (ghz.quasar) {
        const q = ghz.quasar;

        // Añadir posición al trail
        this.addToTrail(this.quasarTrail, q.x, q.y);

        // Renderizar trail (cyan con fade)
        this.renderTrail(g, this.quasarTrail, 0x00ffff, 0.5);

        // Núcleo del quasar (blanco brillante)
        g.lineStyle(3, 0xffffff, 0.9);
        g.beginFill(0xffffff, 0.8);
        g.drawCircle(q.x, q.y, q.r * 0.4);
        g.endFill();

        // Chorros rotatorios (jets)
        const angle = q.rotationAngle || 0;
        const jetLength = q.r * 2;

        g.lineStyle(4, 0x00ffff, 0.7);
        // Jet 1
        g.moveTo(q.x, q.y);
        g.lineTo(q.x + Math.cos(angle) * jetLength, q.y + Math.sin(angle) * jetLength);
        // Jet 2 (opuesto)
        g.moveTo(q.x, q.y);
        g.lineTo(q.x - Math.cos(angle) * jetLength, q.y - Math.sin(angle) * jetLength);

        // Anillo de acreción (cyan transparente)
        g.lineStyle(2, 0x00ffff, 0.5);
        g.drawCircle(q.x, q.y, q.r);
      }

      // ========== 3. DARK MATTER CLOUDS (NIEBLA PÚRPURA) ==========
      if (Array.isArray(ghz.darkMatter) && ghz.darkMatter.length) {
        for (const cloud of ghz.darkMatter) {
          // Nube semitransparente con borde difuso
          g.lineStyle(1, 0x8800ff, 0.3);
          g.beginFill(0x440088, 0.2);
          g.drawCircle(cloud.x, cloud.y, cloud.r);
          g.endFill();

          // Núcleo más denso
          g.beginFill(0x8800ff, 0.4);
          g.drawCircle(cloud.x, cloud.y, cloud.r * 0.5);
          g.endFill();
        }
      }
    }
  }


// export instances for main.js
global.FirstSolarLevel  = new FirstSolarLevel();
global.SecondSolarLevel = new SecondSolarLevel();
global.ThirdSolarLevel  = new ThirdSolarLevel();
  global.GalaxyLevel = new GalaxyLevel();

log('✅ levels_pack.js loaded');
  log('📦 Exported levels:', {
    FirstSolarLevel: !!global.FirstSolarLevel,
    SecondSolarLevel: !!global.SecondSolarLevel,
    ThirdSolarLevel: !!global.ThirdSolarLevel,
    GalaxyLevel: !!global.GalaxyLevel
  });
})(window);