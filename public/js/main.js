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
    
    this.myPlayerId = null;
    this.myPlayerName = '';
    this.worldWidth = 2000;
    this.worldHeight = 2000;
    this.isGameActive = false;
    this.finalSize = 0;
    
    this.clientGameState = {
      players: {},
      orbs: new Map()
    };
    
    this.lastLevelTier = -1;
    this.isTransition = false;
    
    // ========== NUEVO: Variables para sistema de niveles ==========
    this.currentLevel = null;
    this.lastUpdateTime = performance.now();
    this.customLevels = {}; // Registro de niveles personalizados
    // ==============================================================

    // ===== Quantum Tunnel (client emitter) =====
    this.QT_INTERVAL_MS = 1000;       // check once per second
    this.QT_TRIGGER_THRESHOLD = 0.95; // ~5% chance
    this.QT_MIN_R = 30;               // min radius around current pos
    this._qtTimer = null;
  }

  /**
   * Inicializar juego
   */
  async init() {
    console.log('🎮 Initializing AstroIo (Unified System)...');
    
    this.ui = new GameUI();
    window.game = this; // Exponer globalmente
    
    // ========== NUEVO: Registrar niveles personalizados ==========
    this.registerCustomLevels();
    // =============================================================
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
      { level: 2, instance: window.ThirdSolarLevel,  name: 'Solar 3' },
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

    // Cargar texturas de jugadores (Nivel 1: Nebula para jugador, Sol2 para bots)
    if (!loader.resources['nebula']) {
      loader.add('nebula', '/assets/nebula.webp');
    }
    if (!loader.resources['sol2']) {
      loader.add('sol2', '/assets/sol2.webp');
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

    this.socket.on('disconnect', () => {
      console.warn('⚠️ Disconnected from server');
    });

    this.socket.setName(this.myPlayerName);
  }

  // setupMouseInput() {
  //   document.addEventListener('mousemove', (event) => {
  //     if (this.socket && this.isGameActive && this.myPlayerId && this.camera) {
  //       const worldPos = this.camera.screenToWorld(event.clientX, event.clientY);
  //       this.socket.sendMove(worldPos.x, worldPos.y);
  //     }
  //   });
  // }
  setupMouseInput() {
    // Send at most ~60 fps (like a game loop), not per DOM event.
    let pending = null;
    let sending = false;

    const sendLoop = () => {
      if (!sending) return;
      if (pending && this.socket && this.isGameActive && this.myPlayerId && this.camera) {
        const { x, y } = pending;
        this.socket.sendMove(x, y);
        pending = null; // sent the latest
      }
      requestAnimationFrame(sendLoop);
    };

    document.addEventListener('mousemove', (event) => {
      if (!this.camera) return;
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
      if (pending && this.socket && this.isGameActive && this.myPlayerId && this.camera) {
        const { x, y } = pending;
        this.socket.sendMove(x, y);
        pending = null;
      }
      requestAnimationFrame(sendLoop);
    };

    document.addEventListener('touchmove', (event) => {
      if (!this.camera) return;
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

    // Renderizar orbes
    this.clientGameState.orbs.forEach(orb => {
      this.renderer.renderOrb(orb);
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
      
      this.camera.update(
        myPlayer,
        this.renderer.app.screen.width,
        this.renderer.app.screen.height,
        this.renderer.worldContainer
      );

      this.renderer.updateStarParallax(this.camera.x, this.camera.y);

      this.ui.updateHUD(myPlayer, Object.keys(this.clientGameState.players).length);
      this.ui.updateScalePanel(myPlayer.size);
      
      this.finalSize = Math.floor(myPlayer.size);

      // ========== NUEVO: Sistema de transición mejorado ==========
      this.maybeRunLevelTransition(myPlayer.size);
      // ===========================================================

      this.renderer.drawMinimap(
        this.clientGameState.players,
        this.clientGameState.orbs,
        this.camera,
        this.worldWidth,
        this.worldHeight
      );
    } else {
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
      case 0: return { min: 2,   max: 39  };
      case 1: return { min: 40,  max: 79  };
      case 2: return { min: 80,  max: 119 };
      case 3: return { min: 120, max: 159 };
      case 4: return { min: 160, max: 200 };
      default: return { min: 1,  max: 200 };
    }
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
    if (size >= 2 && size < 40) {
      return { level: 0, name: 'Solar System 0.1', key: 'amns-micr', range: '20-39' };
    } else if (size >= 40 && size < 80) {
      return { level: 1, name: 'Solar System 0.2', key: 'micr-m', range: '40-59' };
    } else if (size >= 80 && size < 120) {
      return { level: 2, name: 'Solar System 0.3', key: 'm-Mm', range: '60-79' };
    } else if (size >= 120 && size < 160) {
      return { level: 3, name: 'Galaxy', key: 'galaxy-Kpc', range: '80-99' };
    } else if (size >= 160 && size <= 200) {
      return { level: 4, name: 'Cluster Galaxy', key: 'cluster-galaxy-Mpc', range: '100-119' };
    } else {
      return { level: 5, name: 'Beyond Cluster', key: 'beyond', range: '120+' };
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

    // 2) If we crossed a band and we're not already animating, switch level
    if (currentLevel !== this.lastLevelTier && !this.isTransition) {
      const oldLevel = this.lastLevelTier;
      const oldLevelInfo = oldLevel >= 0
        ? this.getLevelInfo(this.getSizeForLevel(oldLevel))
        : { name: 'None', range: '-' };

      this.lastLevelTier = currentLevel;

      // --- Fallback: if the level didn't set the scale rule, set it here ---
      if (!this.ui._activeScaleRule) {
        // nm spans per level
        const nmBands = {
          0: { nmMin: 0.1,  nmMax: 1e3,  name: 'Solar System 0.1 (Å → µm)' },
          1: { nmMin: 1e3,  nmMax: 1e9,  name: 'Solar System 0.2 (µm → m)' },
          2: { nmMin: 1e9,  nmMax: 1e15, name: 'Solar System 0.3 (m → Mm)' },
          3: { nmMin: 1e15, nmMax: 1e18, name: 'Galaxy' },             // placeholder
          4: { nmMin: 1e18, nmMax: 1e21, name: 'Cluster Galaxy' },     // placeholder
        };
        const band = nmBands[currentLevel] || nmBands[0];
        if (this.ui?.setScaleRule) {
          this.ui.setScaleRule({
            name: band.name,
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

      // Keep your existing zoom transition & quantum toggle lines as-is
      this.runZoomTransition(transitionColor);
      this._toggleQuantumByLevel(currentLevel);
    }

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
