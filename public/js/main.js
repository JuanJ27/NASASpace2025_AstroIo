/**
 * ============================================
 * AstroIo - Main Game Client (UNIFIED VERSION)
 * Sistema de plugins para niveles personalizados
 * Compatible con todos los developers
 * ============================================
 */
class AstroIoGame {
  constructor() {
    this.socket = null;
    this.renderer = null;
    this.camera = null;
    this.ui = null;
    this.cardsManager = null; // ← NEW
    
    this.myPlayerId = null;
    this.myPlayerName = '';
    this.worldWidth = 2000;
    this.worldHeight = 2000;
    this.isGameActive = false;
    this.finalSize = 0;
    
    this.clientGameState = {
      players: {},
      orbs: new Map(),
      hazards: { blackHole: null, whiteHole: null, asteroids: [] },
      galaxyHazards: { active: false } // ← NEW
    };

    this.lastLevelTier = -1;
    this.isTransition = false;
    
    // ========== NUEVO: Variables para sistema de niveles ==========
    this.currentLevel = null;
    this.lastUpdateTime = performance.now();
    this.customLevels = {}; // Registro de niveles personalizados
    // ==============================================================

    // ⭐ FLAGS PARA EVENTOS ESPECIALES
    this._supercumuloBotsRequested = false;
    this._gravitationalPullActive = false;
    this._finalScreenShown = false; // ⭐ NUEVO: Flag para pantalla final

    // ===== Quantum Tunnel (client emitter) =====
    this.QT_INTERVAL_MS = 1000;       // check once per second
    this.QT_TRIGGER_THRESHOLD = 0.95; // ~5% chance
    this.QT_MIN_R = 30;               // min radius around current pos
    this._qtTimer = null;
    this._hazardsPermanentlyDisabled = false;
    this._hazardRange = this._computeHazardRange();
  }

  /**
   * Inicializar juego
   */
  async init() {
    console.log('🎮 Initializing AstroIo (Unified System)...');
    
    this.ui = new GameUI();
    this.cardsManager = new FloatingCardsManager(); // ← NEW
    window.game = this; // Exponer globalmente
    
    // ========== NUEVO: Registrar niveles personalizados ==========
    this.registerCustomLevels();
    // =============================================================
  }

  // Compute once from LEVELS_CONFIG: union of (level 1, sublevel 3) and (level 1, sublevel 4)
  _computeHazardRange() {
    const cfg = (typeof window !== 'undefined' ? window.LEVELS_CONFIG : null) || [];
    const s3 = cfg.find(e => e.level === 1 && e.sublevel === 3);
    const s4 = cfg.find(e => e.level === 1 && e.sublevel === 4);
    if (s3 && s4) {
      return { min: Math.min(s3.min, s4.min), max: Math.max(s3.max, s4.max) };
    }
    const c2 = cfg.find(e => e.clientLevel === 2);
    const c3 = cfg.find(e => e.clientLevel === 3);
    if (c2 && c3) {
      return { min: Math.min(c2.min, c3.min), max: Math.max(c2.max, c3.max) };
    }
    return { min: 27, max: 119 }; // fallback only
  }

  _ensureLevelTitleBanner() {
    let el = document.getElementById('levelTitleBanner');
    if (!el) {
      el = document.createElement('div');
      el.id = 'levelTitleBanner';
      Object.assign(el.style, {
        position: 'fixed',
        top: '18%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        padding: '12px 22px',
        borderRadius: '10px',
        fontSize: '28px',
        fontWeight: '900',
        letterSpacing: '1px',
        color: '#fff',
        background: 'rgba(0,0,0,0.35)',
        border: '2px solid #88CCFF',
        textShadow: '0 0 12px #88CCFF',
        zIndex: 99999,
        pointerEvents: 'none',
        fontFamily: 'Orbitron, Arial, sans-serif',
        opacity: '0',
        transition: 'opacity 180ms ease-out'
      });
      document.body.appendChild(el);
    }
    return el;
  }

  _showLevelTitle(text, borderColorHex = 0x88ccff) {
    const el = this._ensureLevelTitleBanner();
    el.textContent = text;
    const hex = '#'+borderColorHex.toString(16).padStart(6,'0');
    el.style.borderColor = hex;
    el.style.textShadow = `0 0 12px ${hex}`;
    // fade in/out
    el.style.opacity = '1';
    clearTimeout(el._hideTimer);
    el._hideTimer = setTimeout(() => { el.style.opacity = '0'; }, 1200);
  }

  /**
   * ============================================
   * SISTEMA DE REGISTRO DE NIVELES PERSONALIZADOS
   * Cada developer puede registrar su nivel aquí
   * ============================================
   */
  registerCustomLevels() {
    const levelRegistry = [
      // ThirdSolarLevel must be active for level 2 *and* 3 so you see hazards
      { level: 3, instance: window.ThirdSolarLevel,  name: 'Solar 3B' },
      { level: 2, instance: window.ThirdSolarLevel,  name: 'Solar 3A' },

      { level: 1, instance: window.SecondSolarLevel, name: 'Solar 2' },
      { level: 0, instance: window.FirstSolarLevel,  name: 'Solar 1' }
    ];
    levelRegistry.forEach(({ level, instance, name }) => {
      if (instance) this.customLevels[level] = instance;
    });
  }

  _toggleQuantumByLevel(currentLevel) {
    if (currentLevel === 0) this._startQuantumTunnel();
    else this._stopQuantumTunnel();
  }


  /**
   * Iniciar juego con nombre de jugador
   */
  startGame(playerName) {
    this.myPlayerName = playerName;
    console.log(`🚀 Starting game as: ${playerName}`);

    this.ui.hideNameModal();
    this.ui.showHUD(playerName);
    this.ui.showError('Loading game assets...');

    if (!window.getElementTextureSources) {
      console.error('❌ Elements module not loaded!');
      this.ui.showError('Failed to load game configuration');
      return;
    }

    const loader = PIXI.Loader.shared;

    if (loader.loading) {
      console.warn('⚠️ Loader already in progress, waiting...');
      return;
    }

    // Cargar texturas de estrellas (Nivel 1: 4 tipos)
    if (!loader.resources['star1']) {
      loader.add('star1', '/assets/star1.webp');
    }
    if (!loader.resources['star2']) {
      loader.add('star2', '/assets/star2.webp');
    }
    if (!loader.resources['star_3']) {
      loader.add('star_3', '/assets/star_3.webp');
    }
    if (!loader.resources['star_4']) {
      loader.add('star_4', '/assets/star_4.webp');
    }

    // Cargar texturas de jugadores según niveles
    // Nivel 1 Subnivel 1-2: Nebula (átomo/grano)
    if (!loader.resources['nebula']) {
      loader.add('nebula', '/assets/nebula.webp');
    }
    
    // Nivel 1 Subnivel 3: Roca (asteroide)
    if (!loader.resources['roca']) {
      loader.add('roca', '/assets/roca.webp');
    }
    
    // Nivel 1 Subnivel 4: Planetas
    if (!loader.resources['LaTierra']) {
      loader.add('LaTierra', '/assets/LaTierra.webp');
    }
    if (!loader.resources['planeta_anillo']) {
      loader.add('planeta_anillo', '/assets/planeta_anillo.webp');
    }
    
    // Nivel 1 Final / Transición: Sol
    if (!loader.resources['sol']) {
      loader.add('sol', '/assets/sol.webp');
    }
    if (!loader.resources['sol2']) {
      loader.add('sol2', '/assets/sol2.webp');
    }
    if (!loader.resources['sol3']) {
      loader.add('sol3', '/assets/sol3.webp');
    }
    
    // Nivel 2: Galaxias
    if (!loader.resources['via_lactea']) {
      loader.add('via_lactea', '/assets/via_lactea.webp');
    }
    if (!loader.resources['andromeda']) {
      loader.add('andromeda', '/assets/andromeda.webp');
    }
    
// ⭐ AGREGAR ESTAS TEXTURAS PARA LOS BOTS:
    if (!loader.resources['exotic_galaxy']) {
      loader.add('exotic_galaxy', '/assets/exotic_galaxy.webp');
    }

    // ========== FONDOS DE NIVEL ==========
    // Meteoros para Nivel 1
    if (!loader.resources['meteoro1']) {
      loader.add('meteoro1', '/assets/meteoro1.webp');
    }
    if (!loader.resources['meteoro2']) {
      loader.add('meteoro2', '/assets/meteoro2.webp');
    }
    if (!loader.resources['meteoro_azul']) {
      loader.add('meteoro_azul', '/assets/meteoro_azul.webp');
    }

    // Galaxias para fondo de Nivel 2 (no usadas como elementos)
    if (!loader.resources['galaxia_04']) {
      loader.add('galaxia_04', '/assets/galaxia_04.webp');
    }
    if (!loader.resources['galaxia_05']) {
      loader.add('galaxia_05', '/assets/galaxia_05.webp');
    }
    if (!loader.resources['galaxia_06']) {
      loader.add('galaxia_06', '/assets/galaxia_06.webp');
    }
    if (!loader.resources['galaxia_agujero']) {
      loader.add('galaxia_agujero', '/assets/galaxia_agujero.webp');
    }
    if (!loader.resources['brazos_azules']) {
      loader.add('brazos_azules', '/assets/brazos_azules.webp');
    }

    // Agujeros negros para Nivel 2
    if (!loader.resources['agujero_negro1']) {
      loader.add('agujero_negro1', '/assets/agujero_negro1.webp');
    }
    if (!loader.resources['agujero_negro2']) {
      loader.add('agujero_negro2', '/assets/agujero_negro2.webp');
    }
    if (!loader.resources['agujero_negro3']) {
      loader.add('agujero_negro3', '/assets/agujero_negro3.webp');
    }
    // AGN activo para white hole
    if (!loader.resources['agn_activo2']) {
      loader.add('agn_activo2', '/assets/agn_activo2.webp');
    }

    // Imagen final para Nivel 3
    if (!loader.resources['final']) {
      loader.add('final', '/assets/final.webp');
    }

    // Cargar texturas de elementos
    const elementTextures = window.getElementTextureSources();
    console.log('📦 Loading element textures:', elementTextures);
    
    elementTextures.forEach(({ key, src }) => {
      if (!loader.resources[key]) {
        console.log(`  → Adding ${key}: ${src}`);
        loader.add(key, src);
      } else {
        console.log(`  ✓ Already loaded: ${key}`);
      }
    });

    loader.onComplete.once(() => {
      console.log('✅ All textures loaded successfully');
      console.log('📋 Loaded resources:', Object.keys(loader.resources));
      this.onAssetsLoaded();
    });

    loader.onError.once((error, loaderInstance, resource) => {
      console.error('❌ Error loading resource:', resource.name, error);
      this.ui.showError(`Failed to load: ${resource.name}`);
    });

    if (!loader.loading) {
      loader.load();
    }
  }

  onAssetsLoaded() {
    console.log('🎨 Initializing renderer...');
    
    // ========== CONFIGURAR MODO PIXELADO PARA PIXEL ART ==========
    console.log('🖼️ Configurando modo pixelado para texturas (NEAREST)...');
    PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;
    
    // Asegurar que todas las texturas ya cargadas usen NEAREST
    Object.values(PIXI.Loader.shared.resources).forEach(resource => {
      if (resource.texture && resource.texture.baseTexture) {
        resource.texture.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;
        console.log(`  ✅ Pixel mode enabled: ${resource.name}`);
      }
    });
    console.log('✅ Modo pixelado activado para todas las texturas');
    // =============================================================
    
    this.renderer = new GameRenderer();
    this.camera = new GameCamera(this.worldWidth, this.worldHeight);
    
    if (!this.renderer.initialize()) {
      this.ui.showError('Failed to initialize renderer');
      return;
    }

    this.renderer.createStarryBackground();
    this.renderer.elementTexturesLoaded = true;
    console.log('✅ Element textures marked as loaded');

    const elementTextures = window.getElementTextureSources();
    const allLoaded = elementTextures.every(({ key }) => {
      const loaded = !!PIXI.Loader.shared.resources[key]?.texture;
      if (!loaded) {
        console.error(`❌ Missing texture: ${key}`);
      }
      return loaded;
    });

    if (!allLoaded) {
      console.error('❌ Some element textures failed to load');
      this.ui.showError('Failed to load all textures');
      return;
    }

    console.log('✅ All element textures verified');

    this.setupInputHandlers();
    this.connectToServer();
    
    this.ui.showError('');
    console.log('🎮 Game ready!');
  }

  connectToServer() {
    this.socket = new GameSocket();
    this.socket.connect();

    this.socket.on('init', (data) => {
      this.myPlayerId = data.playerId;
      this.worldWidth = data.worldWidth;
      this.worldHeight = data.worldHeight;
      this.isGameActive = true;
      
      this.camera = new GameCamera(this.worldWidth, this.worldHeight);
      
      console.log(`✅ Initialized as player ${this.myPlayerId}`);
    });

    this.socket.on('gameFull', (data) => {
      console.warn('⚠️ Game is full');
      this.ui.showError(data.message);
      setTimeout(() => location.reload(), 3000);
    });

    this.socket.on('gameOver', (data) => {
      console.log(`💀 Game over: ${data.message}`);
      this.isGameActive = false;

      // >>> STOP Quantum Tunnel when game ends
      this._stopQuantumTunnel();

      this.ui.showGameOver(data, this.finalSize, this.myPlayerName);
    });

    this.socket.on('gameState', (delta) => {
      if (this.isGameActive) {
        this.updateGameState(delta);
      }
    });

    // ========== Escuchar respuesta de spawn de bots ==========
    this.socket.on('supercumuloBotsSpawned', (data) => {
      if (data.success) {
        console.log(`✨ ${data.message}`);
        console.log('📍 Bots spawned:', data.bots);
        console.log('📍 Corner:', data.corner);
        
        // Mostrar mensaje en pantalla
        if (this.ui && typeof this.ui.showError === 'function') {
          this.ui.showError(`🌌 4 Cluster Bots appeared at ${data.corner.name}!`);
          setTimeout(() => this.ui.showError(''), 5000);
        }
      } else {
        console.error('❌ Failed to spawn Supercumulo bots:', data.error);
      }
    });
    // ==========================================================

    // ⭐ NUEVO: Escuchar evento de atracción gravitacional
    this.socket.on('gravitationalPull', (data) => {
      console.log('🌀 GRAVITATIONAL PULL EVENT!', data);
      this._gravitationalPullActive = true;
      
      // Mostrar mensaje dramático
      if (this.ui && typeof this.ui.showError === 'function') {
        this.ui.showError(data.message);
      }

      // Desactivar después de la duración y mostrar mensaje de congelación
      setTimeout(() => {
        this._gravitationalPullActive = false;
        if (this.ui && typeof this.ui.showError === 'function') {
          this.ui.showError('🔒 Systems frozen. Cannot move.');
        }
      }, data.duration);
    });
    // ==========================================================

    this.socket.on('disconnect', () => {
      console.warn('⚠️ Disconnected from server');
    });

    this.socket.setName(this.myPlayerName);
  }

  setupMouseInput() {
    let pending = null;
    let sending = false;

    const sendLoop = () => {
      if (!sending) return;
      
      // ⭐ NUEVO: Bloquear input durante evento gravitacional
      if (this._gravitationalPullActive) {
        pending = null;
        requestAnimationFrame(sendLoop);
        return;
      }

      if (pending && this.socket && this.isGameActive && this.myPlayerId && this.camera) {
        const { x, y } = pending;
        this.socket.sendMove(x, y);
        pending = null;
      }
      requestAnimationFrame(sendLoop);
    };

    document.addEventListener('mousemove', (event) => {
      if (!this.camera) return;
      
      // ⭐ NUEVO: Ignorar movimientos durante evento gravitacional
      if (this._gravitationalPullActive) {
        return;
      }

      const worldPos = this.camera.screenToWorld(event.clientX, event.clientY);
      pending = worldPos;
      if (!sending) {
        sending = true;
        requestAnimationFrame(sendLoop);
      }
    });
  }

  setupKeyboardInput() {
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && this.isGameActive) {
        // Menú de pausa, etc.
      }
    });
  }

  setupTouchInput() {
    let pending = null;
    let sending = false;

    const sendLoop = () => {
      if (!sending) return;
      
      // ⭐ NUEVO: Bloquear input táctil durante evento gravitacional
      if (this._gravitationalPullActive) {
        pending = null;
        requestAnimationFrame(sendLoop);
        return;
      }

      if (pending && this.socket && this.isGameActive && this.myPlayerId && this.camera) {
        const { x, y } = pending;
        this.socket.sendMove(x, y);
        pending = null;
      }
      requestAnimationFrame(sendLoop);
    };

    document.addEventListener('touchmove', (event) => {
      if (!this.camera) return;
      
      // ⭐ NUEVO: Ignorar toques durante evento gravitacional
      if (this._gravitationalPullActive) {
        return;
      }

      const t = event.touches[0];
      pending = this.camera.screenToWorld(t.clientX, t.clientY);
      if (!sending) {
        sending = true;
        requestAnimationFrame(sendLoop);
      }
      event.preventDefault(); // avoid scroll
    }, { passive: false });
  }

  setupInputHandlers() {
    this.setupMouseInput();
    this.setupKeyboardInput();
    this.setupTouchInput();
    console.log('✅ Input handlers configured');
  }

  updateGameState(delta) {
    try {
      if (delta.players) {
        Object.entries(delta.players).forEach(([id, player]) => {
          this.clientGameState.players[id] = player;
        });
      }

      if (delta.removedPlayers) {
        delta.removedPlayers.forEach(id => {
          delete this.clientGameState.players[id];
          this.renderer.removePlayer(id);
        });
      }

      if (delta.orbs) {
        delta.orbs.forEach(orb => {
          this.clientGameState.orbs.set(orb.id, orb);
        });
      }

      if (delta.removedOrbs) {
        delta.removedOrbs.forEach(orbId => {
          this.clientGameState.orbs.delete(orbId);
          this.renderer.removeOrb(orbId);
        });
      }

      if (delta.hazards) {
        // Copy incoming hazards
        const hz = { ...delta.hazards };

        // Decide if hazards should be allowed for *me* right now
        const me = this.clientGameState.players[this.myPlayerId];
        const r = this._hazardRange;
        const inBand = me && r && Number.isFinite(r.min) && Number.isFinite(r.max)
          ? (me.size >= r.min && me.size <= r.max)
          : false;
        const allow = inBand && !this._hazardsPermanentlyDisabled;

        // If not allowed, strip them so there’s no “hidden” black hole anywhere
        if (!allow) {
          hz.blackHole = null;
          hz.whiteHole = null;
          hz.asteroids = [];
        }

        this.clientGameState.hazards = hz;
      }

      if (delta.galaxyHazards) {
        this.clientGameState.galaxyHazards = delta.galaxyHazards; // ← NEW
      }

      this.render();
    } catch (error) {
      console.error('❌ Error updating game state:', error);
    }
  }

  /**
   * ============================================
   * RENDERIZADO MEJORADO CON SOPORTE PARA NIVELES PERSONALIZADOS
   * ============================================
   */
  render() {
    // Renderizar jugadores
    Object.values(this.clientGameState.players).forEach(player => {
      const isMe = player.id === this.myPlayerId;
      this.renderer.renderPlayer(player, isMe, this.myPlayerId);
    });

    // Calcular el tamaño máximo de jugador para determinar elementos disponibles
    const maxPlayerSize = Math.max(
      ...Object.values(this.clientGameState.players).map(p => p.size || 10),
      10
    );

    // Renderizar orbes (pasando maxPlayerSize para progresión de niveles)
    this.clientGameState.orbs.forEach(orb => {
      this.renderer.renderOrb(orb, maxPlayerSize);
    });

    // ========== NUEVO: Renderizar niveles personalizados activos ==========
    Object.entries(this.customLevels).forEach(([level, levelInstance]) => {
      if (levelInstance && levelInstance.active && levelInstance.render) {
        levelInstance.render(this.renderer, this.camera);
      }
    });
    // ======================================================================

    if (this.myPlayerId && this.clientGameState.players[this.myPlayerId]) {
      const myPlayer = this.clientGameState.players[this.myPlayerId];

      // (existing camera + UI updates stay the same)
      this.camera.update(
        myPlayer,
        this.renderer.app.screen.width,
        this.renderer.app.screen.height,
        this.renderer.worldContainer
      );

      this.renderer.updateStarParallax(this.camera.x, this.camera.y);

      // >>> NEW: decide if hazards should be visible for me and draw them
      const r = this._hazardRange;
      const inBand = r && Number.isFinite(r.min) && Number.isFinite(r.max)
        ? (myPlayer.size >= r.min && myPlayer.size <= r.max)
        : false;
      const allow = inBand && !this._hazardsPermanentlyDisabled;

      this.renderer.renderHazards(this.clientGameState.hazards, allow);
      // <<< NEW

      // (existing HUD / scale / transitions / minimap code continues)
      this.ui.updateHUD(myPlayer, Object.keys(this.clientGameState.players).length);
      this.ui.updateScalePanel(myPlayer.size);
      this.finalSize = Math.floor(myPlayer.size);

      // ⭐ AGREGAR ESTE BLOQUE COMPLETO AQUÍ: lo puso darwin
      // ========== Detectar cuando llega a tamaño 200 (Supercúmulo) ==========
      if (myPlayer.size >= 900 && !this._supercumuloBotsRequested) {
        console.log('🌌 Reached size 200! Requesting Supercumulo bots...');
        this._supercumuloBotsRequested = true;
        
        // Enviar evento al servidor
        if (this.socket && this.socket.socket) {
          this.socket.socket.emit('reachedSupercumulo', {
            size: myPlayer.size,
            x: myPlayer.x,
            y: myPlayer.y
          });
        }
      }
      // ======================================================================

      // ========== NUEVO: Sistema de transición mejorado ==========
      this.maybeRunLevelTransition(myPlayer.size);

      if (this.cardsManager) {
        this.cardsManager.checkAndShowCard(myPlayer.size); // Using size as points for now
      }

      this.renderer.drawMinimap(
        this.clientGameState.players,
        this.clientGameState.orbs,
        this.camera,
        this.worldWidth,
        this.worldHeight
      );
    } else {
      // Clear hazards layer when we don't have a focused player yet
      this.renderer.renderHazards(this.clientGameState.hazards, false);

      this.renderer.drawMinimap(
        this.clientGameState.players,
        this.clientGameState.orbs,
        this.camera,
        this.worldWidth,
        this.worldHeight
      );
    }

    this.ui.updateLeaderboard(this.clientGameState.players, this.myPlayerId);
  }

  /**
   * ============================================
   * OBTENER INFORMACIÓN DEL NIVEL SEGÚN TAMAÑO
   * Sincronizado con LEVELS_CONFIG del servidor
   * ============================================
   */
  // Exact size bands that match getLevelInfo() thresholds
  getBoundsForLevel(level) {
    switch (level) {
      case 0: return { min: 2,   max: 199  }; // Nivel 1 Subnivel 1: Átomos
      case 1: return { min: 200,  max: 399  }; // Nivel 1 Subnivel 2: Granos
      case 2: return { min: 400,  max: 499  }; // Nivel 1 Subnivel 3: Asteroides
      case 3: return { min: 500,  max: 599 }; // Nivel 1 Subnivel 4: Sistema Solar
      case 4: return { min: 600, max: 799 }; // Nivel 2: Galaxias
      case 5: return { min: 800, max: 1000 }; // Nivel 3: Supercúmulo
      default: return { min: 1,  max: 200 };
    }
  }

  // --- Helpers for hazard bands (use getBoundsForLevel so nothing is hard-coded) ---
  _inHazardLevels(levelIndex) {
    // Hazards visible during Level 1 Sub-3 AND Sub-4
    return levelIndex === 2 || levelIndex === 3;
  }
  _getHazardBandMax() {
    const b = this.getBoundsForLevel(3); // Sublevel 4 "upper" band
    return (b && Number.isFinite(b.max)) ? b.max : 119; // safe fallback
  }


  // Big, animated level title banner (replaces your existing _showLevelBanner)
  _showLevelBanner(text, color = '#00FFAA', opts = {}) {
    try {
      // Remove any previous banner so they don't stack
      const old = document.getElementById('levelTitleBanner');
      if (old) old.remove();

      const div = document.createElement('div');
      div.id = 'levelTitleBanner';
      div.textContent = text || 'LEVEL UP';

      // Options
      const {
        seconds = 1.8,             // how long it stays fully visible
        fontSize = 72,             // BIG title
        blurGlow = 22,             // glow strength
        topPct = 32,               // vertical position (percent)
        border = true
      } = opts;

      const borderCSS = border ? `4px solid ${color}` : 'none';

      Object.assign(div.style, {
        position: 'fixed',
        top: `${topPct}%`,
        left: '50%',
        transform: 'translate(-50%, -50%) scale(0.92)',
        padding: '18px 32px',
        borderRadius: '16px',
        fontSize: `${fontSize}px`,
        fontWeight: '900',
        lineHeight: '1.1',
        letterSpacing: '1.5px',
        color: '#ffffff',
        background: 'rgba(0,0,0,0.35)',
        border: borderCSS,
        textShadow: `0 0 ${blurGlow}px ${color}, 0 0 ${Math.round(blurGlow*0.6)}px ${color}`,
        zIndex: 99999,
        pointerEvents: 'none',
        fontFamily: 'Orbitron, Arial, sans-serif',
        opacity: '0',
        transition: 'transform 220ms ease-out, opacity 220ms ease-out',
        boxShadow: `0 0 24px rgba(0,0,0,0.45), inset 0 0 24px ${color}66`
      });

      document.body.appendChild(div);

      // Fade/scale in
      requestAnimationFrame(() => {
        div.style.opacity = '1';
        div.style.transform = 'translate(-50%, -50%) scale(1.0)';
      });

      // Fade out after visible time
      const totalMs = Math.max(600, seconds * 1000);
      setTimeout(() => {
        div.style.opacity = '0';
        div.style.transform = 'translate(-50%, -50%) scale(0.98)';
        setTimeout(() => div.remove(), 260);
      }, totalMs);
    } catch {}
  }

  getLevelInfo(size) {
    // Nivel 1 - Subnivel 1: Átomos
    if (size >= 2 && size < 199) {
      return { 
        level: 0, 
        mainLevel: 1, 
        sublevel: 1, 
        name: 'Nivel 1: Átomos', 
        key: 'atomos', 
        range: '2-13',
        description: 'Hidrógeno, Helio, Oxígeno, Carbono, Neón'
      };
    } 
    // Nivel 1 - Subnivel 2: Granos de Polvo
    else if (size >= 200 && size < 399) {
      return { 
        level: 1, 
        mainLevel: 1, 
        sublevel: 2, 
        name: 'Nivel 1: Granos de Polvo', 
        key: 'granos', 
        range: '14-26',
        description: 'Silicatos, Carbonáceos, Hielo, Óxidos'
      };
    } 
    // Nivel 1 - Subnivel 3: Asteroides
    else if (size >= 400 && size < 499) {
      return { 
        level: 2, 
        mainLevel: 1, 
        sublevel: 3, 
        name: 'Nivel 1: Asteroides', 
        key: 'asteroides', 
        range: '27-39',
        description: 'Asteroides tipo C, S y M'
      };
    } 
    // Nivel 1 - Subnivel 4: Sistema Solar
    else if (size >= 500 && size < 599) {
      return { 
        level: 3, 
        mainLevel: 1, 
        sublevel: 4, 
        name: 'Nivel 1: Sistema Solar', 
        key: 'sistema-solar', 
        range: '40-119',
        description: 'Planetas y Estrellas'
      };
    } 
    // Nivel 2: Galaxias
    else if (size >= 600 && size < 799) {
      return { 
        level: 4, 
        mainLevel: 2, 
        sublevel: 1, 
        name: 'Nivel 2: Galaxias', 
        key: 'galaxias', 
        range: '120-159',
        description: 'Enanas Irregulares, Cúmulos, Espirales'
      };
    } 
    // Nivel 3: Supercúmulo
    else if (size >= 800 && size <= 1000) {
      return { 
        level: 5, 
        mainLevel: 3, 
        sublevel: 1, 
        name: 'Nivel 3: Supercúmulo', 
        key: 'supercumulo', 
        range: '160-200',
        description: 'Elípticas, BCG'
      };
    } 
    else {
      return { 
        level: 6, 
        mainLevel: 3, 
        sublevel: 2, 
        name: 'Más Allá del Universo Observable', 
        key: 'beyond', 
        range: '200+',
        description: 'El Gran Atractor'
      };
    }
  }

  /**
   * ============================================
   * SISTEMA DE TRANSICIÓN DE NIVELES MEJORADO
   * Soporta niveles personalizados de todos los developers
   * ============================================
   */

  _toggleQuantumByLevel(currentLevel) {
    if (currentLevel === 0) {
      this._startQuantumTunnel();
    } else {
      this._stopQuantumTunnel();
    }
  }
  maybeRunLevelTransition(size) {
    // 1) Figure out current level by size
    const levelInfo = this.getLevelInfo(size);
    const currentLevel = levelInfo.level;

    // 2) Update per-player hazard visibility gates from config
    if (size > this._hazardRange.max) {
      this._hazardsPermanentlyDisabled = true;
    }
    const third = this.customLevels[2]; // same instance also registered as level 3
    if (third) {
      const inBand = size >= this._hazardRange.min && size <= this._hazardRange.max;
      third._shouldRenderHazards = inBand && !this._hazardsPermanentlyDisabled;
    }

    // 2) If we crossed a band and we're not already animating, switch level
    if (currentLevel !== this.lastLevelTier && !this.isTransition) {
      const oldLevel = this.lastLevelTier;
      const oldLevelInfo = oldLevel >= 0
        ? this.getLevelInfo(this.getSizeForLevel(oldLevel))
        : { name: 'None', range: '-' };

      this.lastLevelTier = currentLevel;

      // --- Fallback: if the level didn't set the scale rule, set it here ---
      if (!this.ui._activeScaleRule) {
        // nm spans per level - Actualizado para nueva progresión
        const nmBands = {
          0: { nmMin: 0.1,    nmMax: 1e3,   name: 'Nivel 1.1: Átomos (Å → µm)' },
          1: { nmMin: 1e3,    nmMax: 1e6,   name: 'Nivel 1.2: Granos (µm → mm)' },
          2: { nmMin: 1e6,    nmMax: 1e9,   name: 'Nivel 1.3: Asteroides (mm → m)' },
          3: { nmMin: 1e9,    nmMax: 1e15,  name: 'Nivel 1.4: Sistema Solar (m → Mm)' },
          4: { nmMin: 3e19,   nmMax: 3e22,  name: 'Nivel 2: Galaxias (Kpc)' },
          5: { nmMin: 3e22,   nmMax: 3e25,  name: 'Nivel 3: Supercúmulo (Mpc)' },
        };
        const band = nmBands[currentLevel] || nmBands[0];
        if (this.ui?.setScaleRule) {
          this.ui.setScaleRule({
            name: levelInfo.name || band.name,
            nmMin: band.nmMin,
            nmMax: band.nmMax
          });
        }
      }


      // Provide SIZE bounds for the scale bar normalization
      const bounds = this.getBoundsForLevel(currentLevel);
      window.currentLevelSizeBounds = { ...bounds };
      // Exit/enter level packs (textures/backgrounds/etc.)
      this.exitCustomLevel(oldLevel);
      this.enterCustomLevel(currentLevel);

      // inside maybeRunLevelTransition(size), right after computing transitionColor:
      const lvlInstance = this.customLevels[currentLevel];
      const transitionColor = (lvlInstance && lvlInstance.transitionColor) || 0x00ffaa;

      // Show BIG level title
      const hex = '#' + transitionColor.toString(16).padStart(6, '0');
      this._showLevelBanner(levelInfo.name || `Level ${currentLevel}`, hex, {
        seconds: 2.0,
        fontSize: 72,
        blurGlow: 28,
        topPct: 30,
        border: true
      });

      // ========== TRANSICIÓN DE FONDOS ==========
      // Determinar el fondo visual según el nivel principal
      let backgroundLevel = 1;
      if (levelInfo.mainLevel === 2) {
        backgroundLevel = 2;
      } else if (levelInfo.mainLevel === 3) {
        backgroundLevel = 3;
      }
      
      // Transicionar al nuevo fondo
      if (this.renderer && this.renderer.transitionToLevel) {
        this.renderer.transitionToLevel(backgroundLevel, size);
      }
      
      this.runZoomTransition(transitionColor);
      this._toggleQuantumByLevel(currentLevel);
    }
      // Si llegamos al final del juego (size > 902), mostrar pantalla final
  // ⭐⭐⭐ MOVER ESTE BLOQUE AQUÍ (FUERA DEL IF) ⭐⭐⭐
  // Si llegamos al final del juego (size >= 902), mostrar pantalla final
  // IMPORTANTE: Esto debe ejecutarse AUNQUE NO HAYA CAMBIO DE NIVEL
  if (size >= 902 && this.renderer && this.renderer.showFinalScreen) {
    // Flag para ejecutar solo una vez
    if (!this._finalScreenShown) {
      this._finalScreenShown = true;
      console.log('🌌 Size reached 902! Showing final screen...');
      setTimeout(() => {
        this.renderer.showFinalScreen();
      }, 3000); // Esperar 3 segundos antes de mostrar la pantalla final
    }
  }
  // ⭐⭐⭐ FIN DEL BLOQUE MOVIDO ⭐⭐⭐

  // 3) Update active custom levels (animations)
  const now = performance.now();
  const dt = (now - this.lastUpdateTime) / 1000;
  this.lastUpdateTime = now;
  Object.values(this.customLevels).forEach(lvl => {
    if (lvl && lvl.active && typeof lvl.update === 'function') lvl.update(dt);
  });
}


  /**
   * ============================================
   * ENTRAR A UN NIVEL PERSONALIZADO
   * ============================================
   */
  enterCustomLevel(level) {
    const customLevel = this.customLevels[level];
    if (customLevel && customLevel.onEnter) {
      console.log(`✨ Entering custom level: ${level}`);
      customLevel.onEnter();
    }
  }

  /**
   * ============================================
   * SALIR DE UN NIVEL PERSONALIZADO
   * ============================================
   */
  exitCustomLevel(level) {
    const customLevel = this.customLevels[level];
    if (customLevel && customLevel.onExit) {
      console.log(`👋 Exiting custom level: ${level}`);
      customLevel.onExit();
    }
  }

  /**
   * ============================================
   * HELPER: Obtener un tamaño representativo para un nivel
   * ============================================
   */
  getSizeForLevel(level) {
    const levelSizes = {
      0: 30,  // Medio del rango 20-39
      1: 50,  // Medio del rango 40-59
      2: 70,  // Medio del rango 60-79
      3: 90,  // Medio del rango 80-99
      4: 110, // Medio del rango 100-119
      5: 120  // 120+
    };
    return levelSizes[level] || 30;
  }

/**
 * ============================================
 * ANIMACIÓN DE TRANSICIÓN DE ZOOM
 * ============================================
 */
// ---- replace the whole function ----
  runZoomTransition(colorHex = 0x000000, onDone) {
    this.isTransition = true;
    const dur = 420;
    const start = performance.now();
    const baseScale = this.camera.viewScale;
    const pulse = baseScale * 0.88;

    // lock visual radius to 20 during the pulse
    window._transitionVisOverride = 20;

    const step = () => {
      const t = (performance.now() - start) / dur;
      const k = Math.min(1, Math.max(0, t));
      const s = k < 0.5
        ? baseScale + (pulse - baseScale) * (k / 0.5)
        : pulse + (baseScale - pulse) * ((k - 0.5) / 0.5);

      // camera supports transition scale
      this.camera.setTransitionScale(s);

      // nice color overlay
      const alpha = (k < 0.5 ? k / 0.5 : (1 - k) / 0.5) * 0.6;
      this.renderer.transitionOverlay.clear();
      this.renderer.transitionOverlay.beginFill(colorHex, alpha);
      this.renderer.transitionOverlay.drawRect(0, 0, this.renderer.app.screen.width, this.renderer.app.screen.height);
      this.renderer.transitionOverlay.endFill();

      if (k < 1) {
        requestAnimationFrame(step);
      } else {
        // end of pulse
        this.renderer.transitionOverlay.clear();
        this.camera.setTransitionScale(null);
        this.isTransition = false;

        // keep the circle visually at 20 AFTER the pulse:
        const me = this.clientGameState.players[this.myPlayerId];
        if (me) {
          window._visBaseline = { atSize: me.size, base: 20 };
        }
        window._transitionVisOverride = null; // stop forcing exactly 20

        if (typeof onDone === 'function') onDone();
      }
    };

    requestAnimationFrame(step);
  }

  // ====== Quantum Tunnel helpers & runner (methods) ======
  _clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  _sampleRadius1OverR(rMin, rMax) {
    const u = Math.random();
    const ratio = rMax / rMin;
    return rMin * Math.pow(ratio, u);
  }

  _sampleOffset1OverR(rMin, rMax) {
    const r = this._sampleRadius1OverR(rMin, rMax);
    const theta = Math.random() * Math.PI * 2;
    return { dx: r * Math.cos(theta), dy: r * Math.sin(theta) };
  }

  _startQuantumTunnel() {
    if (this._qtTimer) return;
    this._qtTimer = setInterval(() => {
      try {
        if (!this.isGameActive || !this.myPlayerId) return;
        if (Math.random() <= this.QT_TRIGGER_THRESHOLD) return; // ~5% chance

        const me = this.clientGameState.players[this.myPlayerId];
        if (!me || me.isAlive === false) return;

        const W = this.worldWidth  || 2000;
        const H = this.worldHeight || 2000;

        // Wide reach: ~half diagonal (clamped to world)
        const diag = Math.hypot(W, H);
        const R_MIN = this.QT_MIN_R;
        const R_MAX = Math.max(R_MIN + 1, 0.5 * diag);

        const { dx, dy } = this._sampleOffset1OverR(R_MIN, R_MAX);
        const tx = this._clamp(me.x + dx, 0, W);
        const ty = this._clamp(me.y + dy, 0, H);

        // Emit to server (authoritative snap)
        if (this.socket?.socket && typeof this.socket.socket.emit === 'function') {
          this.socket.socket.emit('quantumTunnel', {
            playerId: this.myPlayerId,
            from: { x: me.x, y: me.y },
            to:   { x: tx, y: ty },
            reason: 'tomas_quantum_tunnel_self'
          });
        }

        // Small overlay flash (optional)
        try {
          if (this.renderer?.transitionOverlay && this.renderer?.app) {
            const o = this.renderer.transitionOverlay;
            const w = this.renderer.app.screen.width;
            const h = this.renderer.app.screen.height;
            o.clear(); o.beginFill(0x000000, 0.35); o.drawRect(0,0,w,h); o.endFill();
            setTimeout(() => o.clear(), 90);
          }
        } catch (_) {}
      } catch (e) {
        console.warn('[QT] client tick error:', e);
      }
    }, this.QT_INTERVAL_MS);

    console.log('🌀 Quantum Tunnel: client emitter enabled.');
  }

  _stopQuantumTunnel() {
    if (this._qtTimer) clearInterval(this._qtTimer);
    this._qtTimer = null;
    console.log('🌀 Quantum Tunnel: client emitter disabled.');
  }
}

// ============================================
// INICIALIZAR CUANDO CARGUE EL DOM
// ============================================
window.addEventListener('DOMContentLoaded', () => {
  console.log('🌟 ========================================');
  console.log('🌟 AstroIo - Unified Level System');
  console.log('🌟 Multi-developer custom levels support');
  console.log('🌟 ========================================');
  const game = new AstroIoGame();
  game.init();
});