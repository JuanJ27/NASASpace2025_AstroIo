/**
 * GameRenderer - Gestión de PixiJS
 */
class GameRenderer {
  constructor() {
    this.app = null;
    this.worldContainer = null;
    
    // Fondos por nivel
    this.backgroundLevel1 = null;
    this.backgroundLevel2 = null;
    this.backgroundLevel3 = null;
    this.currentLevel = 1;
    
    this.starLayer1 = null;
    this.starLayer2 = null;
    this.starLayer3 = null;
    this.starLayer4 = null;
    this.transitionOverlay = null;
    this.stars = [];
    this.backgroundObjects = [];
    this.playerGraphics = {};
    this.playerSprites = {};
    this.playerNameTexts = {};
    this.orbSprites = {}; // ← CHANGED from orbGraphics
    this.elementTexturesLoaded = false; // ← NEW

    // Minimap bits
    this.minimapCanvas = null;
    this.minimapCtx = null;
    this.minimapCssW = 200;
    this.minimapCssH = 140;
    this.minimapDpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 3));
  }

  /**
   * Inicializar PixiJS
   */
  initialize() {
    try {
      this.app = new PIXI.Application({
        width: window.innerWidth,
        height: window.innerHeight,
        backgroundColor: 0x0a0a0f,
        antialias: false, // ← CAMBIADO: Desactivar antialiasing para pixel art
        resolution: window.devicePixelRatio || 1,
        autoDensity: true
      });

      document.body.appendChild(this.app.view);
      this.app.view.id = 'gameCanvas';
      
      // Configurar CSS para renderizado pixelado
      this.app.view.style.imageRendering = 'pixelated';      // Chrome/Edge
      this.app.view.style.imageRendering = 'crisp-edges';    // Firefox
      this.app.view.style.imageRendering = '-moz-crisp-edges'; // Firefox antiguo
      console.log('🎮 Canvas configurado para pixel art (crisp-edges)');

      // Crear contenedores de fondo para cada nivel
      this.backgroundLevel1 = new PIXI.Container();
      this.backgroundLevel1.alpha = 1.0; // Nivel 1 visible por defecto
      this.app.stage.addChild(this.backgroundLevel1);
      
      this.backgroundLevel2 = new PIXI.Container();
      this.backgroundLevel2.alpha = 0.0; // Nivel 2 invisible inicialmente
      this.app.stage.addChild(this.backgroundLevel2);
      
      this.backgroundLevel3 = new PIXI.Container();
      this.backgroundLevel3.alpha = 0.0; // Nivel 3 invisible inicialmente
      this.app.stage.addChild(this.backgroundLevel3);

      // Crear 4 contenedores separados para cada capa de estrellas (transparentes)
      this.starLayer1 = new PIXI.Container();
      this.starLayer2 = new PIXI.Container();
      this.starLayer3 = new PIXI.Container();
      this.starLayer4 = new PIXI.Container();
      
      // Añadir capas al stage (todas transparentes)
      this.backgroundLevel1.addChild(this.starLayer1);
      this.backgroundLevel1.addChild(this.starLayer2);
      this.backgroundLevel1.addChild(this.starLayer3);
      this.backgroundLevel1.addChild(this.starLayer4);

      // Crear contenedor del mundo
      this.worldContainer = new PIXI.Container();
      this.app.stage.addChild(this.worldContainer);

      // Overlay de transición
      this.transitionOverlay = new PIXI.Graphics();
      this.transitionOverlay.beginFill(0x000000, 0);
      this.transitionOverlay.drawRect(0, 0, this.app.screen.width, this.app.screen.height);
      this.transitionOverlay.endFill();
      this.transitionOverlay.zIndex = 9999;
      this.app.stage.addChild(this.transitionOverlay);
      this.app.stage.sortableChildren = true;

      // Minimap
      this.minimapCanvas = document.getElementById('minimapCanvas') || null;
      this.minimapCtx = this.minimapCanvas ? this.minimapCanvas.getContext('2d') : null;
      this._setupMinimapBackingStore(); // ← FIX: actually define & call this

      console.log('✅ PixiJS initialized');
      return true;
    } catch (error) {
      console.error('❌ Error initializing PixiJS:', error);
      return false;
    }
  }

  /**
   * Configurar backing store HiDPI del minimapa
   */
  _setupMinimapBackingStore() {
    if (!this.minimapCanvas || !this.minimapCtx) return;
    const dpr = this.minimapDpr;
    this.minimapCanvas.width = Math.round(this.minimapCssW * dpr);
    this.minimapCanvas.height = Math.round(this.minimapCssH * dpr);
    this.minimapCanvas.style.width = this.minimapCssW + 'px';
    this.minimapCanvas.style.height = this.minimapCssH + 'px';
    this.minimapCtx.setTransform(dpr, 0, 0, dpr, 0, 0); // draw in CSS pixels
  }

  /**
   * Crear fondos para los 3 niveles
   */
  createStarryBackground() {
    try {
      console.log('🔍 Creando fondos para 3 niveles...');
      
      const starFieldWidth = 2500;
      const starFieldHeight = 2500;
      this.stars = [];
      this.backgroundObjects = [];
      
      // NIVEL 1: Estrellas + Meteoros
      this.createLevel1Background(starFieldWidth, starFieldHeight);
      
      // NIVEL 2: Galaxias + Agujeros Negros
      this.createLevel2Background(starFieldWidth, starFieldHeight);
      
      // NIVEL 3: Imagen final sutil
      this.createLevel3Background(starFieldWidth, starFieldHeight);
      
      console.log(`✨ Created ${this.stars.length} stars + ${this.backgroundObjects.length} background objects`);

      // Animación de parpadeo
      this.app.ticker.add(() => {
        const time = Date.now();
        this.stars.forEach(star => {
          star.alpha = star.baseAlpha * (0.7 + 0.3 * Math.sin(time * star.twinkleSpeed + star.twinkleOffset));
        });
      });
    } catch (error) {
      console.error('❌ Error creating backgrounds:', error);
    }
  }

  /**
   * NIVEL 1: Estrellas + Meteoros
   */
  createLevel1Background(starFieldWidth, starFieldHeight) {
    console.log('🌟 Creando fondo NIVEL 1...');
    
    const star1Texture = PIXI.Loader.shared.resources['star1']?.texture;
    const star2Texture = PIXI.Loader.shared.resources['star2']?.texture;
    const star3Texture = PIXI.Loader.shared.resources['star_3']?.texture;
    const star4Texture = PIXI.Loader.shared.resources['star_4']?.texture;
    
    if (!star1Texture || !star2Texture || !star3Texture || !star4Texture) {
      console.error('❌ Missing star textures!');
      return;
    }

    // CAPA 1: star1 (pequeñas) - 180 estrellas
    for (let i = 0; i < 180; i++) {
      const star = new PIXI.Sprite(star1Texture);
      star.anchor.set(0.5);
      star.x = Math.random() * starFieldWidth - starFieldWidth / 2;
      star.y = Math.random() * starFieldHeight - starFieldHeight / 2;
      star.scale.set(0.3 + Math.random() * 0.3);
      star.rotation = Math.random() * Math.PI * 2;
      star.alpha = Math.min(0.8, 0.5 + Math.random() * 0.3); // Máximo 0.8
      star.baseAlpha = star.alpha;
      star.twinkleSpeed = Math.random() * 0.001 + 0.001;
      star.twinkleOffset = Math.random() * Math.PI * 2;
      star.baseX = star.x;
      star.baseY = star.y;
      star.layerName = 'star1';
      star.level = 1;
      
      this.starLayer1.addChild(star);
      this.stars.push(star);
    }

    // CAPA 2: star2 (pequeñas) - 180 estrellas
    for (let i = 0; i < 180; i++) {
      const star = new PIXI.Sprite(star2Texture);
      star.anchor.set(0.5);
      star.x = Math.random() * starFieldWidth - starFieldWidth / 2;
      star.y = Math.random() * starFieldHeight - starFieldHeight / 2;
      star.scale.set(0.3 + Math.random() * 0.3);
      star.rotation = Math.random() * Math.PI * 2;
      star.alpha = Math.min(0.8, 0.5 + Math.random() * 0.3); // Máximo 0.8
      star.baseAlpha = star.alpha;
      star.twinkleSpeed = Math.random() * 0.001 + 0.001;
      star.twinkleOffset = Math.random() * Math.PI * 2;
      star.baseX = star.x;
      star.baseY = star.y;
      star.layerName = 'star2';
      star.level = 1;
      
      this.starLayer2.addChild(star);
      this.stars.push(star);
    }

    // CAPA 3: star_3 (grandes) - 10 estrellas
    for (let i = 0; i < 10; i++) {
      const star = new PIXI.Sprite(star3Texture);
      star.anchor.set(0.5);
      star.x = Math.random() * starFieldWidth - starFieldWidth / 2;
      star.y = Math.random() * starFieldHeight - starFieldHeight / 2;
      star.scale.set(0.8 + Math.random() * 0.7);
      star.rotation = Math.random() * Math.PI * 2;
      star.alpha = Math.min(0.8, 0.5 + Math.random() * 0.3); // Máximo 0.8
      star.baseAlpha = star.alpha;
      star.twinkleSpeed = Math.random() * 0.001 + 0.001;
      star.twinkleOffset = Math.random() * Math.PI * 2;
      star.baseX = star.x;
      star.baseY = star.y;
      star.layerName = 'star_3';
      star.level = 1;
      
      this.starLayer3.addChild(star);
      this.stars.push(star);
    }

    // CAPA 4: star_4 (grandes) - 10 estrellas
    for (let i = 0; i < 10; i++) {
      const star = new PIXI.Sprite(star4Texture);
      star.anchor.set(0.5);
      star.x = Math.random() * starFieldWidth - starFieldWidth / 2;
      star.y = Math.random() * starFieldHeight - starFieldHeight / 2;
      star.scale.set(0.8 + Math.random() * 0.7);
      star.rotation = Math.random() * Math.PI * 2;
      star.alpha = Math.min(0.8, 0.5 + Math.random() * 0.3); // Máximo 0.8
      star.baseAlpha = star.alpha;
      star.twinkleSpeed = Math.random() * 0.001 + 0.001;
      star.twinkleOffset = Math.random() * Math.PI * 2;
      star.baseX = star.x;
      star.baseY = star.y;
      star.layerName = 'star_4';
      star.level = 1;
      
      this.starLayer4.addChild(star);
      this.stars.push(star);
    }

    // Agregar Meteoros (un poco más para enriquecer el fondo)
    const meteorTextures = [
      PIXI.Loader.shared.resources['meteoro1']?.texture,
      PIXI.Loader.shared.resources['meteoro2']?.texture,
      PIXI.Loader.shared.resources['meteoro_azul']?.texture
    ].filter(t => t);

    for (let i = 0; i < 15; i++) { // Aumentado de 8 a 15 meteoros
      const texture = meteorTextures[Math.floor(Math.random() * meteorTextures.length)];
      if (!texture) continue;
      
      const meteor = new PIXI.Sprite(texture);
      meteor.anchor.set(0.5);
      meteor.x = Math.random() * starFieldWidth - starFieldWidth / 2;
      meteor.y = Math.random() * starFieldHeight - starFieldHeight / 2;
      meteor.scale.set(0.2 + Math.random() * 0.5); // Pequeños y medianos (aumentada variedad)
      meteor.rotation = Math.random() * Math.PI * 2;
      meteor.alpha = Math.min(0.8, 0.3 + Math.random() * 0.3); // Máximo 0.8, más tenues
      meteor.baseAlpha = meteor.alpha;
      meteor.baseX = meteor.x;
      meteor.baseY = meteor.y;
      meteor.level = 1;
      
      this.starLayer4.addChild(meteor);
      this.backgroundObjects.push(meteor);
    }
  }

  /**
   * NIVEL 2: Galaxias + Agujeros Negros
   */
  createLevel2Background(starFieldWidth, starFieldHeight) {
    console.log('🌌 Creando fondo NIVEL 2...');
    
    // Galaxias de fondo (más pequeñas y tenues para distinguir de la comida)
    const backgroundGalaxyTextures = [
      PIXI.Loader.shared.resources['galaxia_04']?.texture,
      PIXI.Loader.shared.resources['galaxia_05']?.texture,
      PIXI.Loader.shared.resources['galaxia_06']?.texture,
      PIXI.Loader.shared.resources['brazos_azules']?.texture,
      PIXI.Loader.shared.resources['enana_irregular']?.texture,
      PIXI.Loader.shared.resources['pequeña_espiral']?.texture,
      PIXI.Loader.shared.resources['ojo_cangrejo']?.texture,
      PIXI.Loader.shared.resources['cumulo_glubular']?.texture
    ].filter(t => t);

    for (let i = 0; i < 25; i++) { // Aumentado de 18 a 25 para llenar más el espacio
      const texture = backgroundGalaxyTextures[Math.floor(Math.random() * backgroundGalaxyTextures.length)];
      if (!texture) continue;
      
      const galaxy = new PIXI.Sprite(texture);
      galaxy.anchor.set(0.5);
      galaxy.x = Math.random() * starFieldWidth - starFieldWidth / 2;
      galaxy.y = Math.random() * starFieldHeight - starFieldHeight / 2;
      galaxy.scale.set(0.25 + Math.random() * 0.4); // Más pequeñas para distinguir
      galaxy.rotation = Math.random() * Math.PI * 2;
      galaxy.alpha = 0; // Invisible inicialmente
      galaxy.baseAlpha = Math.min(0.6, 0.3 + Math.random() * 0.25); // Máximo 0.6 (más tenues)
      galaxy.baseX = galaxy.x;
      galaxy.baseY = galaxy.y;
      galaxy.level = 2;
      galaxy.isBackground = true; // Marcar como fondo
      
      this.backgroundLevel2.addChild(galaxy);
      this.backgroundObjects.push(galaxy);
    }

    // Agujeros Negros (con galaxias alrededor)
    const blackHoleTextures = [
      PIXI.Loader.shared.resources['agujero_negro1']?.texture,
      PIXI.Loader.shared.resources['agujero_negro2']?.texture,
      PIXI.Loader.shared.resources['agujero_negro3']?.texture,
      PIXI.Loader.shared.resources['galaxia_agujero']?.texture
    ].filter(t => t);

    for (let i = 0; i < 12; i++) { // Aumentado de 8 a 12 para llenar más el fondo
      const texture = blackHoleTextures[Math.floor(Math.random() * blackHoleTextures.length)];
      if (!texture) continue;
      
      const blackHole = new PIXI.Sprite(texture);
      blackHole.anchor.set(0.5);
      blackHole.x = Math.random() * starFieldWidth - starFieldWidth / 2;
      blackHole.y = Math.random() * starFieldHeight - starFieldHeight / 2;
      blackHole.scale.set(0.4 + Math.random() * 0.5);
      blackHole.rotation = Math.random() * Math.PI * 2;
      blackHole.alpha = 0; // Invisible inicialmente
      blackHole.baseAlpha = Math.min(0.7, 0.4 + Math.random() * 0.25); // Máximo 0.7
      blackHole.baseX = blackHole.x;
      blackHole.baseY = blackHole.y;
      blackHole.level = 2;
      blackHole.isBackground = true;
      
      this.backgroundLevel2.addChild(blackHole);
      this.backgroundObjects.push(blackHole);
    }
  }

  /**
   * NIVEL 3: Imagen final sutil
   */
  createLevel3Background(starFieldWidth, starFieldHeight) {
    console.log('🌠 Creando fondo NIVEL 3...');
    
    const finalTexture = PIXI.Loader.shared.resources['final']?.texture;
    if (!finalTexture) {
      console.warn('⚠️ Textura final.webp no encontrada');
      return;
    }

    // Imagen final como fondo completo - inicia con zoom para hacer zoom out después
    const finalBg = new PIXI.Sprite(finalTexture);
    finalBg.anchor.set(0.5); // Centrado en su punto medio
    finalBg.x = 1000 // Centro del mundo (0,0)
    finalBg.y = 500;
    
    // Escala inicial: 4x para comenzar el zoom out
    const screenWidth = this.app.screen.width;
    const screenHeight = this.app.screen.height;
    const scaleX = (screenWidth * 5) / finalTexture.width; // 5x para zoom out
    const scaleY = (screenHeight * 5) / finalTexture.height;
    finalBg.scale.set(Math.max(scaleX, scaleY));
    
    finalBg.alpha = 0; // Invisible inicialmente
    finalBg.baseAlpha = 0.12; // Muy sutil al principio
    finalBg.level = 3;
    finalBg.isFullScreen = true; // Marca que es fullscreen
    
    this.backgroundLevel3.addChild(finalBg);
    this.backgroundObjects.push(finalBg);
    this.finalBackgroundSprite = finalBg; // Referencia para animación final
  }

  /**
   * Actualizar parallax de estrellas y objetos de fondo
   */
  updateStarParallax(cameraX, cameraY) {
    const parallaxFactor = 0.4;
    
    // Parallax para estrellas del Nivel 1
    this.stars.forEach(star => {
      star.x = star.baseX - cameraX * parallaxFactor;
      star.y = star.baseY - cameraY * parallaxFactor;
    });
    
    // Parallax para objetos de fondo (Nivel 2 y 3)
    this.backgroundObjects.forEach(obj => {
      if (obj.baseX !== undefined && obj.baseY !== undefined) {
        const factor = obj.level === 2 ? 0.3 : 0.2; // Más lento para niveles superiores
        obj.x = obj.baseX - cameraX * factor;
        obj.y = obj.baseY - cameraY * factor;
      }
    });
  }

  /**
   * Transicionar entre fondos de niveles
   * @param {number} newLevel - Nivel al que transicionar (1, 2 o 3)
   * @param {number} playerSize - Tamaño actual del jugador
   */
  transitionToLevel(newLevel, playerSize = 0) {
    if (newLevel === this.currentLevel) return;
    
    console.log(`🔄 Transicionando de nivel ${this.currentLevel} → ${newLevel}`);
    const oldLevel = this.currentLevel;
    this.currentLevel = newLevel;
    
    const transitionDuration = 1500; // 2 segundos
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(1, elapsed / transitionDuration);
      const eased = this._easeInOutCubic(progress);
      
      // MANTENER las estrellas (backgroundLevel1) SIEMPRE visibles en todos los niveles
      this.backgroundLevel1.alpha = 1.0; // Estrellas siempre visibles
      
      // Fade out nivel anterior (solo niveles 2 y 3)
      if (oldLevel === 2) {
        this.backgroundLevel2.alpha = 1 - eased;
      } else if (oldLevel === 3) {
        this.backgroundLevel3.alpha = 1 - eased;
      }
      
      // Fade in nuevo nivel
      if (newLevel === 2) {
        this.backgroundLevel2.alpha = eased;
        // Fade in galaxias y agujeros negros
        this.backgroundObjects.forEach(obj => {
          if (obj.level === 2 && obj.baseAlpha) {
            obj.alpha = obj.baseAlpha * eased;
          }
        });
      } else if (newLevel === 3) {
        this.backgroundLevel3.alpha = eased;
        // Fade in imagen final sutilmente
        if (this.finalBackgroundSprite) {
          this.finalBackgroundSprite.alpha = this.finalBackgroundSprite.baseAlpha * eased;
        }
      }
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        console.log(`✅ Transición completada a nivel ${newLevel}`);
      }
    };
    
    animate();
  }

  /**
   * Animación final: Zoom out centrado desde 4x hasta 2x (imagen final doble del tamaño de pantalla)
   */
  showFinalScreen() {
    if (!this.finalBackgroundSprite) return;
    
    console.log('🌌 Mostrando pantalla final con zoom out centrado...');
    
    const duration = 5000; // 5 segundos
    const startTime = Date.now();
    const startAlpha = this.finalBackgroundSprite.alpha;
    
    // Calcular escala inicial (4x) y final (2x para imagen doble del tamaño de pantalla)
    const screenWidth = this.app.screen.width;
    const screenHeight = this.app.screen.height;
    const finalTexture = this.finalBackgroundSprite.texture;
    
    // Escala inicial: 4x (zoom máximo)
    const startScaleX = (screenWidth * 5) / finalTexture.width;
    const startScaleY = (screenHeight * 5) / finalTexture.height;
    const startScale = Math.max(startScaleX, startScaleY);
    
    // Escala final: 2x (doble del tamaño de pantalla)
    const endScaleX = (screenWidth * 1.7) / finalTexture.width;
    const endScaleY = (screenHeight * 1.7) / finalTexture.height;
    const endScale = Math.max(endScaleX, endScaleY);
    
    // Centrar en la mitad de la pantalla (posición de la cámara)
    const centerX = this.app.screen.width / 2;
    const centerY = this.app.screen.height / 2;
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(1, elapsed / duration);
      const eased = this._easeInOutCubic(progress);
      
      // Fade in la imagen final a opacidad completa
      this.finalBackgroundSprite.alpha = startAlpha + (1.0 - startAlpha) * eased;
      
      // Zoom out gradual centrado: de 4x a 2x
      const currentScale = startScale + (endScale - startScale) * eased;
      this.finalBackgroundSprite.scale.set(currentScale);
      
      // Mantener centrado en la mitad de la pantalla
      this.finalBackgroundSprite.x = 1000;
      this.finalBackgroundSprite.y = 500;
      
      // Ocultar todo lo demás
      this.backgroundLevel1.alpha = 1 - eased;
      this.backgroundLevel2.alpha = 1 - eased;
      this.worldContainer.alpha = 1 - eased;
      
      // Ocultar HUD gradualmente
      this._hideHUD(eased);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        console.log('✅ Pantalla final mostrada - Zoom out completado (4x → 2x)');
      }
    };
    
    animate();
  }

  /**
   * Ocultar elementos del HUD
   */
  _hideHUD(fadeAmount) {
    // Ocultar todos los elementos del HUD incluyendo minimapa
    const hudElements = [
      document.getElementById('hud'),
      document.getElementById('leaderboard'),
      document.getElementById('scalePanel'),
      document.getElementById('minimap'), // Contenedor del minimapa
      document.getElementById('minimapContainer'),
      document.getElementById('minimapCanvas'), // Canvas del minimapa
      document.querySelector('.hud-top'),
      document.querySelector('.hud-bottom-left'),
      document.querySelector('.hud-bottom-right')
    ];
    
    hudElements.forEach(el => {
      if (el) {
        el.style.opacity = (1 - fadeAmount).toString();
        if (fadeAmount >= 1) {
          el.style.display = 'none';
        }
      }
    });
  }

  /**
   * Easing function para transiciones suaves
   */
  _easeInOutCubic(t) {
    return t < 0.5 ? 2 * t * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }

  // Compute the visual radius so every player "starts at 20" on level entry.
  _effectiveVisualRadius(player, isMe) {
    const BASE = 20;

    // While the zoom transition is running, keep MY circle pinned at 20 for the pulse.
    if (isMe && window._transitionVisOverride != null) {
      return window._transitionVisOverride;
    }

    // Prefer the authoritative baseline coming from the server
    if (Number.isFinite(player.levelEntrySize)) {
      const grown = player.size - player.levelEntrySize;
      return Math.max(6, Math.min(200, BASE + grown));
    }

    // Fallback to the old client baseline if present (legacy)
    if (isMe && window._visBaseline && Number.isFinite(window._visBaseline.atSize)) {
      const base = Number.isFinite(window._visBaseline.base) ? window._visBaseline.base : BASE;
      const vis  = base + (player.size - window._visBaseline.atSize);
      return Math.max(6, Math.min(200, vis));
    }

    // Last resort: cap raw size (prevents giant sprites)
    return Math.max(6, Math.min(200, player.size));
  }

  /**
   * Determinar textura del jugador según su tamaño (progresión de niveles)
   */
  _getPlayerTextureKey(player) {
    const size = player.size || 10;
    
    // Bots tienen texturas diferentes
    if (player.isBot) {
      if (size < 27) return 'sol2';       // Nivel 1 Subnivel 1-2
      if (size < 40) return 'planeta_anillo';  // Nivel 1 Subnivel 3
      if (size < 120) return 'sol3';      // Nivel 1 Subnivel 4
      if (size < 160) return 'andromeda'; // Nivel 2
      return 'exotic_galaxy';             // Nivel 3
    }
    
    // Jugadores humanos
    if (size >= 2 && size < 14) {
      return 'nebula';  // Nivel 1 Subnivel 1: Átomos
    } else if (size >= 14 && size < 27) {
      return 'nebula';  // Nivel 1 Subnivel 2: Granos de polvo
    } else if (size >= 27 && size < 40) {
      return 'roca';    // Nivel 1 Subnivel 3: Asteroides
    } else if (size >= 40 && size < 60) {
      return 'LaTierra'; // Nivel 1 Subnivel 4: Planeta pequeño
    } else if (size >= 60 && size < 120) {
      return 'sol';     // Nivel 1 Final: Estrella
    } else if (size >= 120 && size < 125) {
      return 'via_lactea'; // Nivel 2 Inicio
    } else if (size >= 125 && size < 135) {
      return 'galaxia_01'; // Nivel 2 Sub 1
    } else if (size >= 135 && size < 145) {
      return 'galaxia_02'; // Nivel 2 Sub 2
    } else if (size >= 145 && size < 155) {
      return 'galaxia_03'; // Nivel 2 Sub 3
    } else if (size >= 155 && size < 165) {
      return 'galaxia_04'; // Nivel 2/3 Sub 4
    } else if (size >= 165 && size < 175) {
      return 'galaxia_05'; // Nivel 3 Sub 5
    } else if (size >= 175 && size < 185) {
      return 'galaxia_06'; // Nivel 3 Sub 6
    } else if (size >= 185) {
      return 'galaxia_agujero'; // Skin FINAL del juego (185+)
    }
    
    return 'galaxia_agujero'; // Fallback - skin final del juego
  }

  /**
   * Renderizar jugador (Nivel 1: Nebula para jugador, Sol2 para bots)
   */
  renderPlayer(player, isMe, myPlayerId) {
    try {
      if (!player || !player.id) return;

      if (player.isAlive === false) {
        if (typeof this.removePlayer === 'function') {
          this.removePlayer(player.id);
        }
        return;
      }

      if (!this.playerSprites) this.playerSprites = {};
      if (!this.playerNameTexts) this.playerNameTexts = {};

      let sprite = this.playerSprites[player.id];
      let nameText = this.playerNameTexts[player.id];

      // Determinar textura según tamaño (progresión de niveles)
      const currentTextureKey = this._getPlayerTextureKey(player);
      
      if (!sprite) {
        const texture = PIXI.Loader.shared.resources[currentTextureKey]?.texture;
        
        if (!texture) {
          console.error(`❌ Texture not found: ${currentTextureKey}`);
          return;
        }

        sprite = new PIXI.Sprite(texture);
        sprite.anchor.set(0.5);
        this.worldContainer.addChild(sprite);
        this.playerSprites[player.id] = sprite;
        sprite._currentTextureKey = currentTextureKey;
        
        console.log(`✨ Created ${currentTextureKey} sprite for player ${player.id} (${player.name})`);
      } else {
        // Cambiar textura si el jugador ha progresado de nivel
        if (sprite._currentTextureKey !== currentTextureKey) {
          const newTexture = PIXI.Loader.shared.resources[currentTextureKey]?.texture;
          if (newTexture) {
            sprite.texture = newTexture;
            sprite._currentTextureKey = currentTextureKey;
            console.log(`🔄 Updated texture to ${currentTextureKey} for player ${player.id} (size: ${player.size})`);
          }
        }
      }

      if (!nameText) {
        nameText = new PIXI.Text('', {
          fontFamily: 'Orbitron, Arial',
          fontSize: 14,
          fill: 0xffffff,
          stroke: 0x000000,
          strokeThickness: 3,
          align: 'center'
        });
        nameText.anchor.set(0.5);
        this.worldContainer.addChild(nameText);
        this.playerNameTexts[player.id] = nameText;
      }

      // MERGE: Usar _effectiveVisualRadius (remoto) + posicionamiento pixel art (local)
      const vis = this._effectiveVisualRadius(player, isMe);
      
      // Posicionar en píxeles enteros para pixel art nítido
      sprite.x = Math.round(player.x);
      sprite.y = Math.round(player.y);

      const visualSize = vis * 2; // Usar vis calculado en lugar de player.size directamente
      sprite.width = visualSize;
      sprite.height = visualSize;

      // Rotación principal hacia el objetivo
      if (player.targetX !== undefined && player.targetY !== undefined) {
        const angle = Math.atan2(player.targetY - player.y, player.targetX - player.x);
        sprite.rotation = angle;
      }
      
      // Añadir rotación sutil modulada por función seno (lenta y suave)
      const time = Date.now() * 0.00015; // Velocidad muy lenta
      const subtleRotation = Math.abs(Math.sin(time)) * 0.015; // Oscilación de ±0.15 radianes (~8.6°)
      sprite.rotation += subtleRotation;

      nameText.text = player.name || 'Player';
      nameText.x = Math.round(player.x);
      nameText.y = Math.round(player.y - visualSize / 2 - 20);

    } catch (e) {
      console.warn('renderPlayer error:', e);
    }
  }

  /**
   * Dibujar estrella (para bots)
   */
  drawStar(g, x, y, spikes, outerR, innerR, fillColor = 0xFFD84A, glowColor = 0xFFF0A3) {
    g.beginFill(glowColor, 0.25);
    g.drawCircle(x, y, outerR + 8);
    g.endFill();

    const step = Math.PI / spikes;
    let rot = -Math.PI / 2;
    const pts = [];
    
    for (let i = 0; i < spikes; i++) {
      pts.push(x + Math.cos(rot) * outerR, y + Math.sin(rot) * outerR);
      rot += step;
      pts.push(x + Math.cos(rot) * innerR, y + Math.sin(rot) * innerR);
      rot += step;
    }
    
    g.beginFill(fillColor, 0.95);
    g.lineStyle(3, 0xffffff, 0.6);
    g.drawPolygon(pts);
    g.endFill();
  }

  /**
   * Renderizar orbe con tamaños diferenciados según tipo y nivel
   * Ahora usa el visualScale del elemento para determinar el tamaño
   */
  renderOrb(orb, maxPlayerSize = 10) {
    try {
      if (!this.elementTexturesLoaded) {
        return;
      }

      let sprite = this.orbSprites[orb.id];
      
      // Obtener elemento según el tamaño del jugador más grande (para progresión de niveles)
      const element = window.elementForOrb(orb.id, maxPlayerSize);

      if (!sprite) {
        const texture = PIXI.Loader.shared.resources[element.textureKey]?.texture;
        
        if (!texture) {
          console.error(`❌ Texture not found for element: ${element.key}`);
          return;
        }

        sprite = new PIXI.Sprite(texture);
        sprite.anchor.set(0.5);
        this.worldContainer.addChild(sprite);
        this.orbSprites[orb.id] = sprite;
      }

      // Posicionar en píxeles enteros para pixel art nítido
      sprite.x = Math.round(orb.x);
      sprite.y = Math.round(orb.y);
      
      // Usar el visualScale del elemento en lugar de lógica hardcoded
      const sizeMultiplier = element.visualScale || 1.0;
      
      const baseDiameter = Math.max(10, orb.size * 2);
      const finalDiameter = baseDiameter * sizeMultiplier;
      
      sprite.width = finalDiameter;
      sprite.height = finalDiameter;

    } catch (error) {
      console.error(`❌ Error rendering orb ${orb.id}:`, error);
    }
  }

  /**
   * Limpiar gráfico de jugador
   */
  removePlayer(id) {
    try {
      if (this.playerSprites && this.playerSprites[id]) {
        this.playerSprites[id].destroy();
        delete this.playerSprites[id];
      }
      if (this.playerGraphics && this.playerGraphics[id]) {
        this.playerGraphics[id].destroy();
        delete this.playerGraphics[id];
      }
      if (this.playerNameTexts && this.playerNameTexts[id]) {
        this.playerNameTexts[id].destroy();
        delete this.playerNameTexts[id];
      }
    } catch (e) {
      console.warn('Renderer.removePlayer error:', e);
    }
  }

  /**
   * Limpiar gráfico de orbe
   */
  removeOrb(orbId) {
    if (this.orbSprites[orbId]) {
      this.orbSprites[orbId].destroy();
      delete this.orbSprites[orbId];
    }
  }

  /**
   * Dibujar minimapa (jugadores, orbes y viewport)
   */
  /**
   * Dibujar minimapa (jugadores y orbes, SIN rectángulo de viewport)
   */
  drawMinimap(players, orbsMap, camera, worldWidth, worldHeight) {
    if (!this.minimapCtx) return;

    const ctx = this.minimapCtx;
    const W = this.minimapCssW;
    const H = this.minimapCssH;

    // Fondo + borde
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(138,43,226,0.5)';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, W, H);

    // Grid sutil
    ctx.strokeStyle = 'rgba(138,43,226,0.22)';
    ctx.lineWidth = 1;
    for (let gx = 0; gx <= W; gx += 40) {
      ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke();
    }
    for (let gy = 0; gy <= H; gy += 28) {
      ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke();
    }

    // Escala
    const sx = W / Math.max(1, worldWidth);
    const sy = H / Math.max(1, worldHeight);

    // Orbes
    if (orbsMap && typeof orbsMap.forEach === 'function') {
      orbsMap.forEach(o => {
        const el = (window.elementForOrb && window.elementForOrb(o.id)) || { mini: '#7aa7ff' };
        const color = el.mini || el.miniColor || '#7aa7ff';
        ctx.fillStyle = color;
        ctx.fillRect(o.x * sx, o.y * sy, 2, 2);
      });
    }

    // Jugadores (oculta muertos)
    Object.values(players || {}).forEach(p => {
      if (!p || p.isAlive === false) return;
      const isMe = window.game && p.id === window.game.myPlayerId;
      ctx.fillStyle = isMe ? '#00ffcc' : (p.isBot ? '#ffd84a' : '#66aaff');
      const r = Math.max(2, Math.min(5, Math.log2(4 + (p.size || 0))));
      ctx.beginPath();
      ctx.arc(p.x * sx, p.y * sy, r, 0, Math.PI * 2);
      ctx.fill();
    });

    // >>> No se dibuja el rectángulo de viewport <<<
  }

  /**
   * Manejar resize
   */
  handleResize() {
    if (this.app) {
      this.app.renderer.resize(window.innerWidth, window.innerHeight);
      
      if (this.transitionOverlay) {
        this.transitionOverlay.clear();
        this.transitionOverlay.beginFill(0x000000, 0);
        this.transitionOverlay.drawRect(0, 0, this.app.screen.width, this.app.screen.height);
        this.transitionOverlay.endFill();
      }
    }
    // mantener el minimapa nítido
    this.minimapDpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 3));
    this._setupMinimapBackingStore();
  }
}

window.GameRenderer = GameRenderer;
