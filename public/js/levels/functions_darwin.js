console.log('🔵 CARGANDO functions_darwin.js...');

/**
 * ============================================
 * NIVEL 4: CLUSTER - CÚMULO DE GALAXIAS
 * Creado por: Darwin
 * CHECKPOINT: Todo funcionando + ajuste de distancia final
 * ============================================
 */

class ClusterLevelDarwin {
  constructor() {
    this.name = 'Cluster Galaxy Level';
    this.key = 'cluster';
    
    // Obtener rangos de la configuración centralizada
    const clusterConfig = window.getLevelByKey 
      ? window.getLevelByKey('cluster-galaxy-Mpc') 
      : null;
    
    if (clusterConfig) {
      this.minSize = clusterConfig.min;
      this.maxSize = clusterConfig.max;
      this.backgroundColor = clusterConfig.backgroundColor || 0x800080;
      console.log(`🌌 Cluster Level: ${this.minSize}-${this.maxSize}`);
    } else {
      console.warn('⚠️ No se encontró configuración de cluster, usando valores por defecto');
      this.minSize = 60;
      this.maxSize = 100;
      this.backgroundColor = 0x800080;
    }
    
    this.active = false;
    this.botsSpawned = false;
    this.spawnSizeThreshold = 70;
    
    // Sistema de pérdida de control
    this.lostControl = false;
    this.targetCenter = { x: 0, y: 0 };
    this.moveSpeed = 3;
    
    // 🆕 NUEVO: Distancia de seguridad y estado final
    this.safeDistance = 400; // Distancia mínima al centro (en píxeles)
    this.reachedCenter = false; // Si ya llegó al centro
    this.levelCompleted = false; // Si completó el nivel
    
    // Sistema de sprite personalizado del jugador
    this.customPlayerTexture = null;
    this.textureLoaded = false;
    
    // Texturas de los bots (ahora con más variedad)
    this.botTextures = [];
    this.botTexturesLoaded = false;
    this.botTexturePaths = [
      '/assets/andromeda.webp',
      '/assets/brazos_azules.webp',
      '/assets/enana_esferica.webp',
      '/assets/exotic_galaxy.webp',
      '/assets/pequeña_espiral.webp',
      '/assets/via_lactea.webp'
    ];
    
    console.log('✅ ClusterLevelDarwin creado');
    console.log(`📊 Rango del nivel: ${this.minSize} - ${this.maxSize}`);
    console.log(`🤖 Bots se spawnearán a tamaño: ${this.spawnSizeThreshold}`);
    console.log(`🛡️ Distancia de seguridad: ${this.safeDistance}px`);
    
    // Cargar texturas
    this.loadCustomTexture();
    this.loadBotTextures();
  }

  /**
   * Cargar textura del cúmulo globular para el jugador
   */
  loadCustomTexture() {
    const textureKey = 'cumulo_globular_darwin';
    const texturePath = '/assets/cumulo_glubular.webp';
    
    console.log('🔄 Intentando cargar textura del jugador:', texturePath);
    
    // Verificar si ya está cargada
    if (PIXI.utils.TextureCache[texturePath]) {
      this.customPlayerTexture = PIXI.utils.TextureCache[texturePath];
      this.textureLoaded = true;
      console.log('✅ Textura del jugador ya estaba cargada');
      return;
    }
    
    // Cargar textura
    const texture = PIXI.Texture.from(texturePath);
    
    // Verificar cuando esté lista
    if (texture.baseTexture.valid) {
      this.customPlayerTexture = texture;
      this.textureLoaded = true;
      console.log('✅ Textura del jugador cargada inmediatamente');
    } else {
      texture.baseTexture.on('loaded', () => {
        this.customPlayerTexture = texture;
        this.textureLoaded = true;
        console.log('✅ Textura del jugador cargada exitosamente');
        
        // Si ya entramos al nivel, activar sprite ahora
        if (this.active) {
          console.log('🔄 Activando sprite después de carga...');
          this.activateCustomPlayerSprite();
        }
      });
      
      texture.baseTexture.on('error', () => {
        console.error('❌ Error cargando textura del jugador:', texturePath);
      });
    }
  }

  /**
   * Cargar texturas de los bots
   */
  loadBotTextures() {
    console.log('🔄 Cargando texturas de bots...');
    
    let loadedCount = 0;
    const totalTextures = this.botTexturePaths.length;
    
    this.botTexturePaths.forEach((path, index) => {
      console.log(`🔄 Cargando bot texture ${index}:`, path);
      
      // Verificar si ya está cargada
      if (PIXI.utils.TextureCache[path]) {
        this.botTextures[index] = PIXI.utils.TextureCache[path];
        loadedCount++;
        console.log(`✅ Bot texture ${index} ya estaba cargada:`, path);
        
        if (loadedCount === totalTextures) {
          this.botTexturesLoaded = true;
          console.log('✅✅✅ TODAS las texturas de bots cargadas!');
        }
        return;
      }
      
      // Cargar textura
      const texture = PIXI.Texture.from(path);
      
      // Verificar cuando esté lista
      if (texture.baseTexture.valid) {
        this.botTextures[index] = texture;
        loadedCount++;
        console.log(`✅ Bot texture ${index} cargada inmediatamente:`, path);
        
        if (loadedCount === totalTextures) {
          this.botTexturesLoaded = true;
          console.log('✅✅✅ TODAS las texturas de bots cargadas!');
        }
      } else {
        texture.baseTexture.on('loaded', () => {
          this.botTextures[index] = texture;
          loadedCount++;
          console.log(`✅ Bot texture ${index} cargada exitosamente:`, path);
          
          if (loadedCount === totalTextures) {
            this.botTexturesLoaded = true;
            console.log('✅✅✅ TODAS las texturas de bots cargadas!');
          }
        });
        
        texture.baseTexture.on('error', () => {
          console.error(`❌ Error cargando bot texture ${index}:`, path);
        });
      }
    });
  }

  /**
   * Asignar texturas a todos los bots existentes en el mapa
   */
  assignTexturesToExistingBots() {
    const game = window.game;
    if (!game || !game.clientGameState || !game.clientGameState.players) {
      console.warn('⚠️ No hay estado del juego disponible');
      return;
    }

    if (!this.botTexturesLoaded) {
      console.warn('⚠️ Texturas de bots no están cargadas todavía');
      return;
    }

    const players = game.clientGameState.players;
    let botsFound = 0;

    console.log('🔍 Buscando bots existentes en el mapa...');

    // Recorrer todos los jugadores
    Object.values(players).forEach(player => {
      // Solo aplicar a bots, no a jugadores reales
      if (player.isBot && player.isAlive) {
        // Asignar textura aleatoria
        const randomIndex = Math.floor(Math.random() * this.botTextures.length);
        const texture = this.botTextures[randomIndex];
        
        if (texture && texture.baseTexture.valid) {
          // Inicializar objetos si no existen
          if (!game.renderer.customBotSprites) {
            game.renderer.customBotSprites = {};
          }
          if (!game.renderer.customBotTextures) {
            game.renderer.customBotTextures = {};
          }
          
          // Asignar textura
          game.renderer.customBotTextures[player.id] = texture;
          botsFound++;
          
          console.log(`✅ Bot ${player.id} asignado con textura ${randomIndex} (${this.botTexturePaths[randomIndex]})`);
        }
      }
    });

    console.log(`🎨 Total de bots con textura asignada: ${botsFound}`);
  }

  /**
   * Registrar texturas de los 4 bots de las esquinas
   */
  registerBotTextures(botIds) {
    const game = window.game;
    if (!game || !game.renderer) {
      console.error('❌ No hay game o renderer');
      return;
    }
    
    console.log('🎨 Registrando texturas de bots de las esquinas:', botIds);
    console.log('🎨 Texturas disponibles:', this.botTextures.length);
    console.log('🎨 Texturas cargadas:', this.botTexturesLoaded);
    
    // Inicializar objetos si no existen
    if (!game.renderer.customBotSprites) {
      game.renderer.customBotSprites = {};
    }
    if (!game.renderer.customBotTextures) {
      game.renderer.customBotTextures = {};
    }
    
    // Usar las primeras 4 texturas para los bots de las esquinas
    botIds.forEach((botId, index) => {
      if (this.botTextures[index] && this.botTextures[index].baseTexture.valid) {
        game.renderer.customBotTextures[botId] = this.botTextures[index];
        console.log(`✅ Bot de esquina ${index} (${botId}) registrado con textura`);
      } else {
        console.error(`❌ No hay textura válida para bot ${index}`);
      }
    });
    
    console.log('🎨 Texturas de bots de esquinas registradas en renderer');
  }

  /**
   * Activar sprite personalizado para el jugador
   */
  activateCustomPlayerSprite() {
    const game = window.game;
    
    console.log('🔍 Verificando activación de sprite:', {
      game: !!game,
      renderer: !!game?.renderer,
      myPlayerId: game?.myPlayerId,
      texture: !!this.customPlayerTexture,
      textureValid: this.customPlayerTexture?.baseTexture?.valid
    });
    
    if (!game || !game.renderer || !game.myPlayerId) {
      console.error('❌ No se puede activar sprite: falta game, renderer o playerId');
      return;
    }
    
    if (!this.customPlayerTexture || !this.customPlayerTexture.baseTexture.valid) {
      console.warn('⚠️ Textura personalizada no está lista aún');
      return;
    }
    
    // Activar flags en el renderer
    game.renderer.useCustomPlayerSprite = true;
    game.renderer.customPlayerTexture = this.customPlayerTexture;
    game.renderer.customPlayerId = game.myPlayerId;
    
    console.log('✅ Sprite personalizado activado para jugador:', game.myPlayerId);
    console.log('✅ Flags del renderer:', {
      useCustomPlayerSprite: game.renderer.useCustomPlayerSprite,
      customPlayerId: game.renderer.customPlayerId,
      hasTexture: !!game.renderer.customPlayerTexture
    });
  }

  /**
   * Desactivar sprite personalizado
   */
  deactivateCustomPlayerSprite() {
    const game = window.game;
    if (!game || !game.renderer) return;
    
    game.renderer.useCustomPlayerSprite = false;
    game.renderer.customPlayerTexture = null;
    game.renderer.customPlayerId = null;
    
    // Limpiar sprite si existe
    if (game.renderer.customPlayerSprite) {
      game.renderer.customPlayerSprite.destroy();
      game.renderer.customPlayerSprite = null;
    }
    
    // Limpiar sprites de bots
    if (game.renderer.customBotSprites) {
      Object.values(game.renderer.customBotSprites).forEach(sprite => {
        if (sprite && sprite.destroy) sprite.destroy();
      });
      game.renderer.customBotSprites = {};
    }
    
    // Limpiar texturas de bots
    if (game.renderer.customBotTextures) {
      game.renderer.customBotTextures = {};
    }
    
    console.log('✅ Sprite personalizado y bots desactivados');
  }

  /**
   * Se ejecuta cuando el jugador entra al nivel 4
   */
  onEnter() {
    console.log('🌌🌌🌌 ¡¡¡ENTRASTE AL CLUSTER GALAXY!!! 🌌🌌🌌');
    console.log('📍 onEnter() ejecutado');
    
    this.active = true;
    this.changeBackgroundColor();
    this.showLevelMessage('CLUSTER GALAXY - Nivel 4');
    
    // Activar sprite personalizado si la textura ya está cargada
    console.log('🔍 Estado de textura:', {
      loaded: this.textureLoaded,
      texture: !!this.customPlayerTexture
    });
    
    if (this.textureLoaded && this.customPlayerTexture) {
      this.activateCustomPlayerSprite();
    } else {
      console.warn('⚠️ Textura aún no está lista, se activará cuando cargue');
    }

    // Asignar texturas a todos los bots existentes
    if (this.botTexturesLoaded) {
      console.log('🎨 Asignando texturas a bots existentes...');
      this.assignTexturesToExistingBots();
    } else {
      console.warn('⚠️ Texturas de bots no están listas todavía');
    }
    
    // Escuchar respuesta del servidor cuando spawnen los bots de las esquinas
    const game = window.game;
    if (game && game.socket && game.socket.socket) {
      console.log('✅ Registrando listener para darwinBotsSpawned');
      
      game.socket.socket.on('darwinBotsSpawned', (data) => {
        console.log('🎯🎯🎯 Bots spawneados! Centro:', data.centerX, data.centerY);
        console.log('📦 Datos recibidos:', data);
        
        this.targetCenter.x = data.centerX;
        this.targetCenter.y = data.centerY;
        this.lostControl = true;
        
        // Registrar texturas de bots de las esquinas
        if (data.botIds && this.botTexturesLoaded) {
          console.log('🎨 Registrando texturas de bots de esquinas...');
          this.registerBotTextures(data.botIds);
        } else {
          console.warn('⚠️ No se pudieron registrar texturas de bots:', {
            hasBotIds: !!data.botIds,
            texturesLoaded: this.botTexturesLoaded
          });
        }
        
        this.showLevelMessage('⚠️ ATRACCIÓN GRAVITACIONAL ⚠️');
      });
    } else {
      console.error('❌ No se pudo registrar listener: game o socket no disponible');
    }
  }

  /**
   * Se ejecuta cuando el jugador sale del nivel 4
   */
  onExit() {
    console.log('👋👋👋 SALIENDO DEL CLUSTER GALAXY 👋👋👋');
    this.active = false;
    this.restoreBackgroundColor();
    this.botsSpawned = false;
    this.lostControl = false;
    this.reachedCenter = false;
    this.levelCompleted = false;
    
    // Desactivar sprite personalizado
    this.deactivateCustomPlayerSprite();
    
    const game = window.game;
    if (game && game.socket && game.socket.socket) {
      game.socket.socket.off('darwinBotsSpawned');
    }
  }

  /**
   * Render: No dibuja nada (los bots son del servidor)
   */
  render(renderer, camera) {
    // Los bots son del servidor
  }

  /**
   * 🆕 MODIFICADO: Update con distancia de seguridad
   */
  update(deltaTime) {
    const game = window.game;
    if (!game || !game.myPlayerId) return;
    
    const myPlayer = game.clientGameState.players[game.myPlayerId];
    if (!myPlayer || !myPlayer.isAlive) return;
    
    // DEBUG: Log periódico de tamaño del jugador
    if (Math.random() < 0.01) {
      console.log(`📏 Tamaño actual: ${myPlayer.size.toFixed(1)}, Nivel activo: ${this.active}`);
    }
    
    // Solicitar spawn de bots cuando alcance el tamaño
    if (!this.botsSpawned && myPlayer.size >= this.spawnSizeThreshold) {
      console.log(`🤖🤖🤖 ¡Size ${this.spawnSizeThreshold} alcanzado! Solicitando spawn... 🤖🤖🤖`);
      this.requestBotsSpawn();
    }
    
    // 🆕 MODIFICADO: Mover hacia el centro pero detenerse a distancia segura
    if (this.lostControl && game.socket && game.socket.socket) {
      const dx = this.targetCenter.x - myPlayer.x;
      const dy = this.targetCenter.y - myPlayer.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // 🆕 NUEVO: Si llegó a la distancia segura
      if (distance <= this.safeDistance) {
        if (!this.reachedCenter) {
          this.reachedCenter = true;
          console.log('🎉🎉🎉 ¡LLEGASTE AL CENTRO! 🎉🎉🎉');
          console.log(`🛡️ Distancia final: ${Math.round(distance)}px`);
          
          // Marcar nivel como completado
          this.levelCompleted = true;
          
          // Mostrar mensaje de victoria
          this.showVictoryMessage();
          
          // Desactivar control (ya no te moverás más)
          this.lostControl = false;
        }
        
        return; // No mover más
      }
      
      // Si aún está lejos, seguir moviéndose
      if (distance > this.safeDistance + 5) { // +5 para evitar oscilaciones
        const moveX = (dx / distance) * this.moveSpeed;
        const moveY = (dy / distance) * this.moveSpeed;
        
        const newX = myPlayer.x + moveX;
        const newY = myPlayer.y + moveY;
        
        game.socket.sendMove(newX, newY);
        
        if (Math.random() < 0.016) {
          console.log(`🎯 Moviendo hacia centro: distancia=${Math.round(distance)}px`);
        }
      }
    }
  }

  /**
   * Solicitar al servidor que spawnee los bots
   */
  requestBotsSpawn() {
    this.botsSpawned = true;
    
    const game = window.game;
    if (game && game.socket && game.socket.socket) {
      console.log('📡 Enviando solicitud de spawn al servidor...');
      
      game.socket.socket.emit('spawnDarwinBots', { 
        playerId: game.myPlayerId,
        count: 4,
        size: 100
      });
      
      console.log('📡 Solicitud de spawn enviada al servidor');
    } else {
      console.error('❌ No se pudo enviar solicitud al servidor');
    }
  }

  /**
   * Cambiar fondo a morado
   */
  changeBackgroundColor() {
    if (window.game && window.game.renderer && window.game.renderer.app) {
      window.game.renderer.app.renderer.backgroundColor = this.backgroundColor;
      console.log('🎨 Fondo cambiado a morado');
    } else {
      console.error('❌ No se pudo cambiar el fondo');
    }
  }

  /**
   * Restaurar fondo original
   */
  restoreBackgroundColor() {
    if (window.game && window.game.renderer && window.game.renderer.app) {
      window.game.renderer.app.renderer.backgroundColor = 0x0a0a0f;
      console.log('🎨 Fondo restaurado');
    }
  }

  /**
   * Mostrar mensaje
   */
  showLevelMessage(message) {
    const messageDiv = document.createElement('div');
    messageDiv.textContent = message;
    messageDiv.style.position = 'fixed';
    messageDiv.style.top = '20%';
    messageDiv.style.left = '50%';
    messageDiv.style.transform = 'translate(-50%, -50%)';
    messageDiv.style.fontSize = '36px';
    messageDiv.style.fontWeight = 'bold';
    messageDiv.style.color = '#FF0000';
    messageDiv.style.textShadow = '0 0 30px #FF0000, 0 0 60px #FF0000';
    messageDiv.style.zIndex = '9999';
    messageDiv.style.pointerEvents = 'none';
    messageDiv.style.fontFamily = 'Arial, sans-serif';
    
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
      messageDiv.remove();
    }, 3000);
  }

  /**
   * 🆕 NUEVO: Mostrar mensaje de victoria
   */
  showVictoryMessage() {
    const victoryDiv = document.createElement('div');
    victoryDiv.innerHTML = `
      <div style="font-size: 48px; margin-bottom: 20px;">🎉 ¡NIVEL COMPLETADO! 🎉</div>
      <div style="font-size: 24px;">Has alcanzado el Gran Atractor</div>
      <div style="font-size: 18px; margin-top: 10px; opacity: 0.8;">Permaneces en órbita estable</div>
    `;
    victoryDiv.style.position = 'fixed';
    victoryDiv.style.top = '30%';
    victoryDiv.style.left = '50%';
    victoryDiv.style.transform = 'translate(-50%, -50%)';
    victoryDiv.style.fontWeight = 'bold';
    victoryDiv.style.color = '#00FF00';
    victoryDiv.style.textShadow = '0 0 30px #00FF00, 0 0 60px #00FF00';
    victoryDiv.style.zIndex = '10000';
    victoryDiv.style.pointerEvents = 'none';
    victoryDiv.style.fontFamily = 'Arial, sans-serif';
    victoryDiv.style.textAlign = 'center';
    victoryDiv.style.padding = '30px';
    victoryDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    victoryDiv.style.borderRadius = '20px';
    victoryDiv.style.border = '3px solid #00FF00';
    
    document.body.appendChild(victoryDiv);
    
    // No remover automáticamente - queda permanente
    console.log('🎊 Mensaje de victoria mostrado');
  }

  /**
   * Limpiar recursos
   */
  cleanup() {
    this.restoreBackgroundColor();
    this.botsSpawned = false;
    this.lostControl = false;
    this.reachedCenter = false;
    this.levelCompleted = false;
    this.deactivateCustomPlayerSprite();
  }
}

// Exponer globalmente
window.DarwinClusterLevel = new ClusterLevelDarwin();

console.log('✅ functions_darwin.js cargado completamente');
console.log('✅ window.DarwinClusterLevel:', window.DarwinClusterLevel);