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

  /**
   * ============================================
   * SISTEMA DE REGISTRO DE NIVELES PERSONALIZADOS
   * Cada developer puede registrar su nivel aquí
   * ============================================
   */
  registerCustomLevels() {
    console.log('📋 Registering custom levels...');
    
    // Registro de niveles disponibles (agregar según developer)
    const levelRegistry = [
      // Darwin - Cluster Galaxy (Nivel 4: 100-119)
      { level: 4, instance: window.DarwinClusterLevel, name: 'Darwin Cluster' },
      
      // Juan - Galaxy Expansion (Nivel 3: 80-99) - EJEMPLO
      { level: 3, instance: window.JuanGalaxyLevel, name: 'Juan Galaxy' },
      
      // Tomás - Nebula Zone (Nivel 2: 60-79) - EJEMPLO
      { level: 2, instance: window.TomasNebulaLevel, name: 'Tomas Nebula' },
      
      // Ginkgo - Solar Storm (Nivel 1: 40-59) - EJEMPLO
      { level: 1, instance: window.GinkgoSolarLevel, name: 'Ginkgo Solar' },
      
      // Profe - Quantum Field (Nivel 5: 120+) - EJEMPLO
      { level: 5, instance: window.ProfeQuantumLevel, name: 'Profe Quantum' }
    ];
    
    // Registrar solo los niveles que existen
    levelRegistry.forEach(({ level, instance, name }) => {
      if (instance) {
        this.customLevels[level] = instance;
        console.log(`  ✅ Registered: ${name} (Level ${level})`);
      }
    });
    
    console.log(`📦 Total custom levels registered: ${Object.keys(this.customLevels).length}`);
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

    // Cargar texturas de estrellas
    if (!loader.resources['star1']) {
      loader.add('star1', '/assets/star1.webp');
    }
    if (!loader.resources['star2']) {
      loader.add('star2', '/assets/star2.webp');
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

  setupMouseInput() {
    document.addEventListener('mousemove', (event) => {
      if (this.socket && this.isGameActive && this.myPlayerId && this.camera) {
        const worldPos = this.camera.screenToWorld(event.clientX, event.clientY);
        this.socket.sendMove(worldPos.x, worldPos.y);
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
    let lastTouchTime = 0;
    const TOUCH_THROTTLE = 16;

    document.addEventListener('touchmove', (event) => {
      if (!this.socket || !this.isGameActive || !this.myPlayerId || !this.camera) {
        return;
      }

      const now = performance.now();
      if (now - lastTouchTime < TOUCH_THROTTLE) {
        return;
      }
      lastTouchTime = now;

      const touch = event.touches[0];
      const worldPos = this.camera.screenToWorld(touch.clientX, touch.clientY);
      this.socket.sendMove(worldPos.x, worldPos.y);
      
      event.preventDefault();
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
  getLevelInfo(size) {
    if (size >= 20 && size < 40) {
      return { level: 0, name: 'Solar System 0.1', key: 'amns-micr', range: '20-39' };
    } else if (size >= 40 && size < 60) {
      return { level: 1, name: 'Solar System 0.2', key: 'micr-m', range: '40-59' };
    } else if (size >= 60 && size < 80) {
      return { level: 2, name: 'Solar System 0.3', key: 'm-Mm', range: '60-79' };
    } else if (size >= 80 && size < 100) {
      return { level: 3, name: 'Galaxy', key: 'galaxy-Kpc', range: '80-99' };
    } else if (size >= 100 && size <= 119) {
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
  maybeRunLevelTransition(size) {
    // Obtener información del nivel actual basado en size
    const levelInfo = this.getLevelInfo(size);
    const currentLevel = levelInfo.level;
    
    // Verificar si cambió de nivel
    if (currentLevel !== this.lastLevelTier && !this.isTransition) {
      const oldLevel = this.lastLevelTier;
      const oldLevelInfo = oldLevel >= 0 ? this.getLevelInfo(this.getSizeForLevel(oldLevel)) : { name: 'None', range: '-' };
      
      this.lastLevelTier = currentLevel;
      
      console.log(`🔄 ========== LEVEL TRANSITION ==========`);
      console.log(`   📊 Size: ${size}`);
      console.log(`   ⬅️  Previous: Level ${oldLevel} (${oldLevelInfo.name})`);
      console.log(`   ➡️  Current: Level ${currentLevel} (${levelInfo.name})`);
      console.log(`   🎯 Range: ${levelInfo.range}`);
      console.log(`========================================`);
      
      // ========== GESTIÓN AUTOMÁTICA DE NIVELES PERSONALIZADOS ==========
      
      // Salir del nivel anterior (si tenía uno personalizado)
      this.exitCustomLevel(oldLevel);
      
      // Entrar al nivel nuevo (si tiene uno personalizado)
      this.enterCustomLevel(currentLevel);
      
      // ==================================================================
      
      // Ejecutar animación de transición visual
      this.runZoomTransition();
    }
    
    // ========== ACTUALIZAR ANIMACIONES DE NIVELES ACTIVOS ==========
    const now = performance.now();
    const deltaTime = (now - this.lastUpdateTime) / 1000; // Convertir a segundos
    this.lastUpdateTime = now;
    
    // Actualizar todos los niveles personalizados que estén activos
    Object.entries(this.customLevels).forEach(([level, levelInstance]) => {
      if (levelInstance && levelInstance.active && levelInstance.update) {
        levelInstance.update(deltaTime);
      }
    });
    // ================================================================
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
  runZoomTransition() {
    this.isTransition = true;
    const dur = 420; // 420ms
    const start = performance.now();
    const baseScale = this.camera.viewScale;
    const pulse = baseScale * 0.88;

    const step = () => {
      const t = (performance.now() - start) / dur;
      const k = Math.min(1, Math.max(0, t));
      
      // Calcular escala (zoom in -> zoom out)
      const s = k < 0.5
        ? baseScale + (pulse - baseScale) * (k / 0.5)
        : pulse + (baseScale - pulse) * ((k - 0.5) / 0.5);
      
      this.renderer.worldContainer.scale.set(s, s);

      // Fade negro
      const alpha = (k < 0.5 ? k / 0.5 : (1 - k) / 0.5) * 0.6;
      this.renderer.transitionOverlay.clear();
      this.renderer.transitionOverlay.beginFill(0x000000, alpha);
      this.renderer.transitionOverlay.drawRect(
        0, 0,
        this.renderer.app.screen.width,
        this.renderer.app.screen.height
      );
      this.renderer.transitionOverlay.endFill();

      if (k < 1) {
        requestAnimationFrame(step);
      } else {
        this.renderer.transitionOverlay.clear();
        this.isTransition = false;
      }
    };
    
    requestAnimationFrame(step);
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