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
   * Renderizar jugador
   */
  renderPlayer(player, isMe, myPlayerId) {
    try {
      if (!player || !player.id) return;

      // If server says this player is dead, purge visuals and skip drawing.
      if (player.isAlive === false) {
        if (typeof this.removePlayer === 'function') {
          this.removePlayer(player.id);
        }
        return;
      }

      // --- your existing drawing logic below ---
      let graphics = this.playerGraphics ? this.playerGraphics[player.id] : null;
      let nameText = this.playerNameTexts ? this.playerNameTexts[player.id] : null;

      if (!this.playerGraphics) this.playerGraphics = {};
      if (!this.playerNameTexts) this.playerNameTexts = {};

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

      const vis = this._effectiveVisualRadius(player, isMe);
      graphics.clear();

      const color = isMe ? 0x00ff88 : 0x0088ff;
      const glowColor = isMe ? 0x00ffaa : 0x00aaff;

      graphics.beginFill(glowColor, 0.2);
      graphics.drawCircle(player.x, player.y, vis + 8);
      graphics.endFill();

      graphics.beginFill(color, 0.9);
      graphics.lineStyle(3, 0xffffff, 0.6);
      graphics.drawCircle(player.x, player.y, vis);
      graphics.endFill();

      nameText.text = player.name || 'Player';
      nameText.x = player.x;
      nameText.y = player.y - vis - 20;

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
  removePlayer(id) {
    try {
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
