/**
 * ============================================
 * NIVEL 3: GALAXIAS - ESCALA GALÁCTICA
 * Creado por: Profe
 * Versión simplificada: Cambia el fondo a azul oscuro
 * ============================================
 */

class GalaxyLevelProfe {
  constructor() {
    this.name = 'Galactic Scale Level';
    this.key = 'galaxy';

    // Obtener rangos de la configuración centralizada
    const galaxyConfig = window.getLevelByKey 
      ? window.getLevelByKey('galaxy-Kpc') 
      : null;

    if (galaxyConfig) {
      this.minSize = galaxyConfig.min;  // 200
      this.maxSize = galaxyConfig.max;  // 399
      this.backgroundColor = galaxyConfig.backgroundColor || 0x000033; // Azul oscuro
      console.log(`🌌 Galaxy Level: ${this.minSize}-${this.maxSize}`);
    } else {
      this.minSize = 60;
      this.maxSize = 100;
      this.backgroundColor = 0x000033; // Azul oscuro por defecto
    }

    this.active = false;
    console.log('🌌 Galaxy Level initialized (simple mode)');
  }

  /**
   * Se ejecuta cuando el jugador entra al nivel
   */
  onEnter() {
    console.log('🌌 ¡Entraste al nivel de Galaxias! Fondo azul oscuro activado');
    this.active = true;
    this.changeBackgroundColor();
    this.showLevelMessage('GALAXIAS - Nivel 3');
  }

  /**
   * Se ejecuta cuando el jugador sale del nivel
   */
  onExit() {
    console.log('👋 Saliendo del nivel de Galaxias...');
    this.active = false;
    this.restoreBackgroundColor();
  }

  /**
   * Render vacío (no dibujamos nada extra)
   */
  render(renderer, camera) {
    // No hace nada - solo el fondo azul oscuro
  }

  /**
   * Update vacío (sin animaciones)
   */
  update(deltaTime) {
    // No hace nada
  }

  /**
   * Cambiar fondo a azul oscuro
   */
  changeBackgroundColor() {
    if (window.game && window.game.renderer && window.game.renderer.app) {
      window.game.renderer.app.renderer.backgroundColor = this.backgroundColor;
      console.log('🎨 Fondo cambiado a azul oscuro');
    }
  }

  /**
   * Restaurar fondo original (negro/azul oscuro)
   */
  restoreBackgroundColor() {
    if (window.game && window.game.renderer && window.game.renderer.app) {
      window.game.renderer.app.renderer.backgroundColor = 0x0a0a0f;
      console.log('🎨 Fondo restaurado');
    }
  }

  /**
   * Mostrar mensaje cuando cambias de nivel
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
    messageDiv.style.color = '#00FFFF';
    messageDiv.style.textShadow = '0 0 20px #00FFFF';
    messageDiv.style.zIndex = '9999';
    messageDiv.style.pointerEvents = 'none';
    messageDiv.style.fontFamily = 'Arial, sans-serif';

    document.body.appendChild(messageDiv);

    // Remover después de 2 segundos
    setTimeout(() => {
      messageDiv.remove();
    }, 2000);
  }

  /**
   * Limpiar recursos
   */
  cleanup() {
    this.restoreBackgroundColor();
  }
}

// Exponer la clase globalmente
window.GalaxyLevelProfe = new GalaxyLevelProfe();

console.log('✅ functions_profe.js loaded (simple version)');