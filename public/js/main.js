/**
 * AstroIo - Main Game Client
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
  }

  /**
   * Inicializar juego
   */
  async init() {
    console.log('🎮 Initializing AstroIo...');
    
    this.ui = new GameUI();
    window.game = this; // Exponer globalmente
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

    // ← FIX: Verificar que elementos estén cargados
    if (!window.getElementTextureSources) {
      console.error('❌ Elements module not loaded!');
      this.ui.showError('Failed to load game configuration');
      return;
    }

    const loader = PIXI.Loader.shared;

    // Limpiar loader si tiene recursos previos
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

    // ← FIX: Usar onComplete en lugar de load()
    loader.onComplete.once(() => {
      console.log('✅ All textures loaded successfully');
      console.log('📋 Loaded resources:', Object.keys(loader.resources));
      this.onAssetsLoaded();
    });

    loader.onError.once((error, loaderInstance, resource) => {
      console.error('❌ Error loading resource:', resource.name, error);
      this.ui.showError(`Failed to load: ${resource.name}`);
    });

    // Iniciar carga
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
    
    // ← FIX: Marcar texturas como cargadas ANTES de conectar al servidor
    this.renderer.elementTexturesLoaded = true;
    console.log('✅ Element textures marked as loaded');

    // Verificar que todas las texturas de elementos estén disponibles
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

  

  /**
   * Conectar a Socket.IO
   */
  connectToServer() {
    this.socket = new GameSocket();
    this.socket.connect();

    // Init
    this.socket.on('init', (data) => {
      this.myPlayerId = data.playerId;
      this.worldWidth = data.worldWidth;
      this.worldHeight = data.worldHeight;
      this.isGameActive = true;
      
      this.camera = new GameCamera(this.worldWidth, this.worldHeight);
      
      console.log(`✅ Initialized as player ${this.myPlayerId}`);
    });

    // Game Full
    this.socket.on('gameFull', (data) => {
      console.warn('⚠️ Game is full');
      this.ui.showError(data.message);
      setTimeout(() => location.reload(), 3000);
    });

    // Game Over (IMPLEMENTADO AQUÍ)
    this.socket.on('gameOver', (data) => {
      console.log(`💀 Game over: ${data.message}`);
      this.isGameActive = false;
      this.ui.showGameOver(data, this.finalSize, this.myPlayerName);
    });

    // Game State
    this.socket.on('gameState', (delta) => {
      if (this.isGameActive) {
        this.updateGameState(delta);
      }
    });

    // Disconnect
    this.socket.on('disconnect', () => {
      console.warn('⚠️ Disconnected from server');
    });

    // Enviar nombre
    this.socket.setName(this.myPlayerName);
  }

  /**
   * Configurar input del mouse
   */
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
    // Atajos de teclado (opcional)
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
    
    event.preventDefault(); // Prevenir scroll en móvil
  }, { passive: false });
}


  setupInputHandlers() {
  this.setupMouseInput();
  this.setupKeyboardInput();
  this.setupTouchInput();
  console.log('✅ Input handlers configured');
}

  /**
   * Actualizar estado del juego desde servidor
   */
  updateGameState(delta) {
    try {
      // Actualizar jugadores
      if (delta.players) {
        Object.entries(delta.players).forEach(([id, player]) => {
          this.clientGameState.players[id] = player;
        });
      }

      // Remover jugadores
      if (delta.removedPlayers) {
        delta.removedPlayers.forEach(id => {
          delete this.clientGameState.players[id];
          this.renderer.removePlayer(id);
        });
      }

      // Añadir orbes
      if (delta.orbs) {
        delta.orbs.forEach(orb => {
          this.clientGameState.orbs.set(orb.id, orb);
        });
      }

      // Remover orbes
      if (delta.removedOrbs) {
        delta.removedOrbs.forEach(orbId => {
          this.clientGameState.orbs.delete(orbId);
          this.renderer.removeOrb(orbId);
        });
      }

      // Renderizar
      this.render();
    } catch (error) {
      console.error('❌ Error updating game state:', error);
    }
  }

  /**
   * Renderizar frame
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

    // Actualizar cámara
    if (this.myPlayerId && this.clientGameState.players[this.myPlayerId]) {
      const myPlayer = this.clientGameState.players[this.myPlayerId];
      
      this.camera.update(
        myPlayer,
        this.renderer.app.screen.width,
        this.renderer.app.screen.height,
        this.renderer.worldContainer
      );

      // Actualizar parallax de estrellas
      this.renderer.updateStarParallax(this.camera.x, this.camera.y);

      // Actualizar HUD
      this.ui.updateHUD(myPlayer, Object.keys(this.clientGameState.players).length);
      
      // ← NEW: Actualizar Scale Panel
      this.ui.updateScalePanel(myPlayer.size);
      
      this.finalSize = Math.floor(myPlayer.size);

      // Transición de nivel
      this.maybeRunLevelTransition(myPlayer.size);
    }

    // Actualizar leaderboard
    this.ui.updateLeaderboard(this.clientGameState.players, this.myPlayerId);
  }

  /**
   * Ejecutar transición de nivel
   */
  maybeRunLevelTransition(size) {
    const tier = Math.floor(size / 200);
    if (tier !== this.lastLevelTier && !this.isTransition) {
      this.lastLevelTier = tier;
      this.runZoomTransition();
    }
  }

  /**
   * Animación de transición de zoom
   */
  runZoomTransition() {
    this.isTransition = true;
    const dur = 420;
    const start = performance.now();
    const baseScale = this.camera.viewScale;
    const pulse = baseScale * 0.88;

    const step = () => {
      const t = (performance.now() - start) / dur;
      const k = Math.min(1, Math.max(0, t));
      
      const s = k < 0.5
        ? baseScale + (pulse - baseScale) * (k / 0.5)
        : pulse + (baseScale - pulse) * ((k - 0.5) / 0.5);
      
      this.renderer.worldContainer.scale.set(s, s);

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

// Inicializar cuando cargue el DOM
window.addEventListener('DOMContentLoaded', () => {
  const game = new AstroIoGame();
  game.init();
});