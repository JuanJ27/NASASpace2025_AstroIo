/**
 * GameRenderer - Gestión de PixiJS
 */
class GameRenderer {
  constructor() {
    this.app = null;
    this.worldContainer = null;
    this.starContainer = null;
    this.transitionOverlay = null;
    this.stars = [];
    this.playerGraphics = {};
    this.playerNameTexts = {};
    this.orbSprites = {}; // ← CHANGED from orbGraphics
    this.elementTexturesLoaded = false; // ← NEW
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
        antialias: true,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true
      });

      document.body.appendChild(this.app.view);
      this.app.view.id = 'gameCanvas';

      // Crear contenedor de estrellas (fondo)
      this.starContainer = new PIXI.ParticleContainer(1000, {
        scale: true,
        position: true,
        alpha: true,
        rotation: false,
        uvs: false,
        tint: false
      });
      this.app.stage.addChild(this.starContainer);

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

      console.log('✅ PixiJS initialized');
      return true;
    } catch (error) {
      console.error('❌ Error initializing PixiJS:', error);
      return false;
    }
  }

  /**
   * Crear fondo estrellado con parallax
   */
  createStarryBackground() {
    try {
      const star1Texture = PIXI.Loader.shared.resources['star1'].texture;
      const star2Texture = PIXI.Loader.shared.resources['star2'].texture;
      const numStars = 300;
      const starFieldWidth = 4000;
      const starFieldHeight = 4000;

      this.stars = [];

      for (let i = 0; i < numStars; i++) {
        const texture = i % 2 === 0 ? star1Texture : star2Texture;
        const star = new PIXI.Sprite(texture);
        
        star.anchor.set(0.5);
        star.x = Math.random() * starFieldWidth - starFieldWidth / 2;
        star.y = Math.random() * starFieldHeight - starFieldHeight / 2;
        
        const scale = Math.random() * 0.5 + 0.5;
        star.scale.set(scale);
        star.alpha = Math.random() * 0.5 + 0.5;
        
        star.baseAlpha = star.alpha;
        star.twinkleSpeed = Math.random() * 0.001 + 0.001;
        star.twinkleOffset = Math.random() * Math.PI * 2;
        star.baseX = star.x;
        star.baseY = star.y;
        
        this.starContainer.addChild(star);
        this.stars.push(star);
      }

      // Animación de parpadeo
      this.app.ticker.add(() => {
        const time = Date.now();
        this.stars.forEach(star => {
          star.alpha = star.baseAlpha * (0.7 + 0.3 * Math.sin(time * star.twinkleSpeed + star.twinkleOffset));
        });
      });

      console.log(`✨ Created ${numStars} stars`);
    } catch (error) {
      console.error('❌ Error creating stars:', error);
    }
  }

  /**
   * Actualizar parallax de estrellas
   */
  updateStarParallax(cameraX, cameraY) {
    const parallaxFactor = 0.2;
    this.stars.forEach(star => {
      star.x = star.baseX - cameraX * parallaxFactor;
      star.y = star.baseY - cameraY * parallaxFactor;
    });
  }

  /**
   * Renderizar jugador
   */
  renderPlayer(player, isMe, myPlayerId) {
    try {
      let graphics = this.playerGraphics[player.id];
      let nameText = this.playerNameTexts[player.id];

      if (!graphics) {
        graphics = new PIXI.Graphics();
        this.worldContainer.addChild(graphics);
        this.playerGraphics[player.id] = graphics;
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

      graphics.clear();

      const isBot = !!player.isBot || (typeof player.name === 'string' && player.name.startsWith('★ Bot'));
      
      if (isBot) {
        this.drawStar(graphics, player.x, player.y, 5, Math.max(player.size, 8), Math.max(player.size * 0.5, 4), 0xFFD84A, 0xFFF0A3);
      } else {
        const color = isMe ? 0x00ff88 : 0x0088ff;
        const glowColor = isMe ? 0x00ffaa : 0x00aaff;

        graphics.beginFill(glowColor, 0.2);
        graphics.drawCircle(player.x, player.y, player.size + 8);
        graphics.endFill();

        graphics.beginFill(color, 0.9);
        graphics.lineStyle(3, 0xffffff, 0.6);
        graphics.drawCircle(player.x, player.y, player.size);
        graphics.endFill();
      }

      nameText.text = player.name || 'Player';
      nameText.x = player.x;
      nameText.y = player.y - player.size - 20;
    } catch (error) {
      console.error(`❌ Error rendering player ${player.id}:`, error);
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
   * Renderizar orbe
   */
  renderOrb(orb) {
    try {
      if (!this.elementTexturesLoaded) {
        console.warn('⚠️ Element textures not loaded yet');
        return;
      }

      let sprite = this.orbSprites[orb.id];
      const element = window.elementForOrb(orb.id);

      // Crear sprite si no existe
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

      // Actualizar posición y tamaño
      sprite.x = orb.x;
      sprite.y = orb.y;
      
      // Tamaño visual: diámetro = 2 * radio
      const diameter = Math.max(10, orb.size * 2);
      sprite.width = diameter;
      sprite.height = diameter;

    } catch (error) {
      console.error(`❌ Error rendering orb ${orb.id}:`, error);
    }
  }

  /**
   * Limpiar gráfico de jugador
   */
  removePlayer(playerId) {
    if (this.playerGraphics[playerId]) {
      this.playerGraphics[playerId].destroy();
      delete this.playerGraphics[playerId];
    }
    if (this.playerNameTexts[playerId]) {
      this.playerNameTexts[playerId].destroy();
      delete this.playerNameTexts[playerId];
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
  }
}

window.GameRenderer = GameRenderer;