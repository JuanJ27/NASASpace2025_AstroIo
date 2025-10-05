/**
 * ============================================
 * NIVEL 4: CLUSTER - CÚMULO DE GALAXIAS
 * Creado por: Darwin
 * Versión simplificada: Solo cambia el fondo a morado
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
      this.minSize = clusterConfig.min;  // 100
      this.maxSize = clusterConfig.max;  // 119
      this.backgroundColor = clusterConfig.backgroundColor || 0x800080; // Morado
      console.log(`🌌 Cluster Level: ${this.minSize}-${this.maxSize}`);
    } else {
      this.minSize = 100;
      this.maxSize = 119;
      this.backgroundColor = 0x800080; // Morado por defecto
    }
    
    this.active = false;
    console.log('🌌 Cluster Level initialized (simple mode)');
  }

  /**
   * Se ejecuta cuando el jugador entra al nivel
   */
  onEnter() {
    console.log('🌌 ¡Entraste al Cluster Galaxy! Fondo morado activado');
    this.active = true;
    this.changeBackgroundColor();
    this.showLevelMessage('CLUSTER GALAXY - Nivel 4');
  }

  /**
   * Se ejecuta cuando el jugador sale del nivel
   */
  onExit() {
    console.log('👋 Saliendo del Cluster Galaxy...');
    this.active = false;
    this.restoreBackgroundColor();
  }

  /**
   * Render vacío (no dibujamos nada extra)
   */
  render(renderer, camera) {
    // No hace nada - solo el fondo morado
  }

  /**
   * Update vacío (sin animaciones)
   */
  update(deltaTime) {
    // No hace nada
  }

  /**
   * Cambiar fondo a morado
   */
  changeBackgroundColor() {
    if (window.game && window.game.renderer && window.game.renderer.app) {
      window.game.renderer.app.renderer.backgroundColor = this.backgroundColor;
      console.log('🎨 Fondo cambiado a morado');
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
    messageDiv.style.color = '#FF00FF';
    messageDiv.style.textShadow = '0 0 20px #FF00FF';
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
window.DarwinClusterLevel = new ClusterLevelDarwin();

console.log('✅ functions_darwin.js loaded (simple version)');