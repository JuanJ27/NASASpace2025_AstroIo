/**
 * GameUI - Gestión de interfaz de usuario
 */
class GameUI {
  constructor() {
    this.nameModal = document.getElementById('nameModal');
    this.nameInput = document.getElementById('nameInput');
    this.startButton = document.getElementById('startButton');
    this.errorMessage = document.getElementById('errorMessage');
    this.hud = document.getElementById('hud');
    this.leaderboard = document.getElementById('leaderboard');
    this.gameOverScreen = document.getElementById('gameOverScreen');
    this.respawnButton = document.getElementById('respawnButton');
    
    // Scale Panel (NEW)
    this.scalePanel = document.getElementById('scalePanel');
    this.scaleFill = document.getElementById('scaleFill');
    this.scaleCurrent = document.getElementById('scaleCurrent');
    
    // Scale constants
    this.SCALE_MIN_NM = 1;      // 10 Å
    this.SCALE_MAX_NM = 1000;   // 1 µm
    this.SIZE_START = 20;
    this.SIZE_WRAP = 200;
    
    this.setupEventListeners();
  }

  /**
   * Configurar event listeners
   */
  setupEventListeners() {
    this.startButton.addEventListener('click', () => {
      const name = this.nameInput.value.trim();
      const validation = this.validateName(name);
      
      if (!validation.valid) {
        this.showError(validation.error);
        return;
      }
      
      if (window.game) {
        window.game.startGame(name);
      }
    });

    this.nameInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.startButton.click();
      }
    });

    this.respawnButton.addEventListener('click', () => {
      location.reload();
    });

    this.nameInput.focus();
  }

  /**
   * Validar nombre del jugador
   */
  validateName(name) {
    if (!name || name.trim().length === 0) {
      return { valid: false, error: 'Name cannot be empty' };
    }
    if (name.length > 20) {
      return { valid: false, error: 'Name too long (max 20 characters)' };
    }
    if (!/^[a-zA-Z0-9_\s]+$/.test(name)) {
      return { valid: false, error: 'Name can only contain letters, numbers, and spaces' };
    }
    return { valid: true };
  }

  /**
   * Mostrar mensaje de error
   */
  showError(message) {
    this.errorMessage.textContent = message;
    this.errorMessage.style.display = 'block';
    setTimeout(() => {
      this.errorMessage.style.display = 'none';
    }, 3000);
  }

  /**
   * Ocultar modal de nombre
   */
  hideNameModal() {
    this.nameModal.classList.add('hidden');
  }

  /**
   * Mostrar HUD
   */
  showHUD(playerName) {
    this.hud.classList.remove('hidden');
    this.scalePanel.classList.remove('hidden'); // ← NEW: Show scale panel
    this.leaderboard.classList.remove('hidden');
    document.getElementById('playerName').textContent = playerName;
  }

  /**
   * Actualizar HUD
   */
  updateHUD(player, playerCount) {
    try {
      document.getElementById('size').textContent = Math.floor(player.size);
      document.getElementById('players').textContent = playerCount;
      document.getElementById('position').textContent = 
        `${Math.floor(player.x)}, ${Math.floor(player.y)}`;
    } catch (error) {
      console.error('❌ Error updating HUD:', error);
    }
  }

  /**
   * Actualizar Scale Panel (NEW)
   * Mapea el tamaño del jugador a escala real (10 Å → 1 µm)
   */
  updateScalePanel(playerSize) {
    try {
      const nm = this.sizeToNanometers(playerSize);
      const progress = this.clamp(
        (playerSize - this.SIZE_START) / (this.SIZE_WRAP - this.SIZE_START),
        0,
        1
      );
      
      // Actualizar barra de progreso
      this.scaleFill.style.width = (progress * 100).toFixed(1) + '%';
      
      // Actualizar texto de escala actual
      this.scaleCurrent.textContent = 'Current: ' + this.formatScale(nm);
    } catch (error) {
      console.error('❌ Error updating scale panel:', error);
    }
  }

  /**
   * Convertir tamaño del jugador a nanómetros
   */
  sizeToNanometers(size) {
    const t = this.clamp(
      (size - this.SIZE_START) / (this.SIZE_WRAP - this.SIZE_START),
      0,
      1
    );
    return this.SCALE_MIN_NM + t * (this.SCALE_MAX_NM - this.SCALE_MIN_NM);
  }

  /**
   * Formatear escala para mostrar
   */
  formatScale(nm) {
    if (nm < 1) {
      return Math.round(nm * 10) + ' Å';  // 1 nm = 10 Å
    }
    if (nm < 1000) {
      return Math.round(nm) + ' nm';
    }
    return (nm / 1000).toFixed(2).replace(/\.00$/, '') + ' µm';
  }

  /**
   * Actualizar leaderboard
   */
  updateLeaderboard(players, myPlayerId) {
    try {
      const aliveOnly = Object.values(players || {}).filter(p => p && p.isAlive !== false);

      const sorted = aliveOnly
        .sort((a, b) => b.size - a.size)
        .slice(0, 5);

      const leaderboardList = document.getElementById('leaderboardList');
      leaderboardList.innerHTML = '';

      sorted.forEach((player, index) => {
        const entry = document.createElement('div');
        entry.className = 'leaderboard-entry' + (player.id === myPlayerId ? ' self' : '');
        entry.innerHTML = `
          <span class="leaderboard-rank">#${index + 1}</span>
          <span class="leaderboard-name">${player.name || 'Player'}</span>
          <span class="leaderboard-size">${Math.floor(player.size)}</span>
        `;
        leaderboardList.appendChild(entry);
      });
    } catch (error) {
      console.error('❌ Error updating leaderboard:', error);
    }
  }

  /**
   * Mostrar pantalla de Game Over
   */
  showGameOver(data, finalSize, playerName) {
    try {
      document.getElementById('gameOverMessage').textContent = data.message || 'You were eaten!';
      document.getElementById('finalStats').textContent = 
        `Final Size: ${finalSize} | Name: ${playerName}`;
      this.gameOverScreen.classList.remove('hidden');
    } catch (error) {
      console.error('❌ Error showing game over:', error);
    }
  }

  /**
   * Utility: Clamp value
   */
  clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }
}

window.GameUI = GameUI;