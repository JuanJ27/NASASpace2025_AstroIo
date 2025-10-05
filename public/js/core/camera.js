/**
 * GameCamera - Sistema de cámara con zoom
 */
class GameCamera {
  constructor(worldWidth, worldHeight) {
    this.x = 0;
    this.y = 0;
    this.viewScale = 1.0;
    this.worldWidth = worldWidth;
    this.worldHeight = worldHeight;
  }

  /**
   * Actualizar cámara para seguir al jugador
   */
  update(player, screenWidth, screenHeight, worldContainer) {
    try {
      // Zoom dinámico: pequeños = zoom in, grandes = zoom out
      const desiredScale = this.clamp(1.4 - (player.size / 250), 0.6, 1.4);
      this.viewScale = this.lerp(this.viewScale, desiredScale, 0.15);
      const finalScale = (this._transitionScale != null) ? this._transitionScale : this.viewScale;
      worldContainer.scale.set(finalScale, finalScale);

      // Calcular viewport con escala
      const viewW = screenWidth / this.viewScale;
      const viewH = screenHeight / this.viewScale;

      this.x = player.x - viewW / 2;
      this.y = player.y - viewH / 2;

      this.x = Math.max(0, Math.min(this.worldWidth - viewW, this.x));
      this.y = Math.max(0, Math.min(this.worldHeight - viewH, this.y));

      worldContainer.x = -this.x * this.viewScale;
      worldContainer.y = -this.y * this.viewScale;
    } catch (error) {
      console.error('❌ Error updating camera:', error);
    }
  }

  // Optional external override for transient zoom animations.
  setTransitionScale(scaleOrNull) {
    this._transitionScale = (typeof scaleOrNull === 'number') ? scaleOrNull : null;
  }

  /**
   * Convertir coordenadas de pantalla a mundo
   */
  screenToWorld(screenX, screenY) {
    return {
      x: this.clamp(this.x + (screenX / this.viewScale), 0, this.worldWidth),
      y: this.clamp(this.y + (screenY / this.viewScale), 0, this.worldHeight)
    };
  }

  clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  lerp(a, b, t) {
    return a + (b - a) * t;
  }
}

window.GameCamera = GameCamera;