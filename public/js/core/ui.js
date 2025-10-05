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

    // Scale Panel
    this.scalePanel   = document.getElementById('scalePanel');
    this.scaleFill    = document.getElementById('scaleFill');
    this.scaleCurrent = document.getElementById('scaleCurrent');

    // Fallback scale constants (used only if no level overrides exist)
    this.SCALE_MIN_NM = 1;
    this.SCALE_MAX_NM = 1000;
    this.SIZE_START   = 10;
    this.SIZE_WRAP    = 200;

    this.setupEventListeners();
  }

  /* -------------------- basic UI -------------------- */

  setupEventListeners() {
    this.startButton.addEventListener('click', () => {
      const name = this.nameInput.value.trim();
      const validation = this.validateName(name);
      if (!validation.valid) return this.showError(validation.error);
      window.game && window.game.startGame(name);
    });

    this.nameInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.startButton.click();
    });

    this.respawnButton.addEventListener('click', () => location.reload());
    this.nameInput.focus();
  }

  validateName(name) {
    if (!name || !name.trim()) return { valid: false, error: 'Name cannot be empty' };
    if (name.length > 20)      return { valid: false, error: 'Name too long (max 20 characters)' };
    if (!/^[a-zA-Z0-9_\s]+$/.test(name)) {
      return { valid: false, error: 'Name can only contain letters, numbers, and spaces' };
    }
    return { valid: true };
  }

  showError(message) {
    this.errorMessage.textContent = message;
    this.errorMessage.style.display = 'block';
    setTimeout(() => (this.errorMessage.style.display = 'none'), 3000);
  }

  hideNameModal() { this.nameModal.classList.add('hidden'); }

  showHUD(playerName) {
    this.hud.classList.remove('hidden');
    this.scalePanel.classList.remove('hidden');
    this.leaderboard.classList.remove('hidden');
    document.getElementById('playerName').textContent = playerName;
  }

  updateHUD(player, playerCount) {
    try {
      document.getElementById('size').textContent = Math.floor(player.size);
      document.getElementById('players').textContent = playerCount;
      document.getElementById('position').textContent = `${Math.floor(player.x)}, ${Math.floor(player.y)}`;
    } catch (e) { console.error('❌ Error updating HUD:', e); }
  }

  /* -------------------- SCALE PANEL -------------------- */

  /**
   * Called every frame from main.render()
   * - Bar progress uses current level SIZE bounds
   * - Value uses per-level size→nm mapping & formatter
   */
  updateScalePanel(playerSize) {
    try {
      // 1) Progress: strictly normalized to SIZE band (from main.getLevelInfo thresholds)
      let sMin = 1, sMax = 200; // default if nothing provided
      if (window.currentLevelSizeBounds && Number.isFinite(window.currentLevelSizeBounds.min) && Number.isFinite(window.currentLevelSizeBounds.max)) {
        sMin = window.currentLevelSizeBounds.min;
        sMax = window.currentLevelSizeBounds.max;
      }
      const sClamped = Math.max(sMin, Math.min(sMax, playerSize));
      const sProgress = (sClamped - sMin) / Math.max(1e-9, (sMax - sMin)); // 0..1
      this.scaleFill.style.width = (sProgress * 100).toFixed(1) + '%';

      // 2) Label: still unit-aware (Å / nm / µm / mm / cm / m / km / Mm)
      const sizeToNm = window.overrideSizeToNanometers || ((size) => this.sizeToNanometers(size));
      const nm = sizeToNm(playerSize);
      this.scaleCurrent.textContent = 'Current: ' + this._formatByBestUnit(nm);
    } catch (err) {
      console.error('❌ Error updating scale panel:', err);
    }
  }


  /**
   * Called by the level system (levels_pack.js) on enter/change.
   * rule: { name?: string, nmMin: number, nmMax: number, accent?: CSS }
   */
  setScaleRule(rule = {}) {
    this._activeScaleRule = rule && typeof rule === 'object' ? rule : null;

    const title = document.getElementById('scaleTitle');
    if (title) title.textContent = 'SCALE · ' + (rule?.name || '—');

    const labels = document.getElementById('scaleLabels');
    if (labels && Number.isFinite(rule.nmMin) && Number.isFinite(rule.nmMax)) {
      labels.innerHTML = '';
      const left  = document.createElement('span'); left.textContent  = this._formatEdge(rule.nmMin);
      const mid   = document.createElement('span'); mid.textContent   = this._unitOnly(Math.sqrt(rule.nmMin * rule.nmMax));
      const right = document.createElement('span'); right.textContent = this._formatEdge(rule.nmMax);
      labels.appendChild(left); labels.appendChild(mid); labels.appendChild(right);
    }

    const fill = document.getElementById('scaleFill');
    if (fill) fill.style.background = rule?.accent || '';
  }

  /* -------------------- Unit helpers (in nm) -------------------- */

  // Force “edge” values like 0.1/1/1e3/1e9/1e15 to appear as "1 Å / 1 nm / 1 µm / 1 m / 1 Mm"
  _formatEdge(nm) {
    const edges = [
      { v: 0.1,  label: '1 Å'  },
      { v: 1,    label: '1 nm' },
      { v: 1e3,  label: '1 µm' },
      { v: 1e6,  label: '1 mm' },
      { v: 1e7,  label: '1 cm' },
      { v: 1e9,  label: '1 m'  },
      { v: 1e12, label: '1 km' },
      { v: 1e15, label: '1 Mm' }
    ];
    for (const e of edges) {
      if (Math.abs(nm - e.v) / e.v < 1e-9) return e.label;
    }
    // fallback: intelligent formatter
    return this._formatByBestUnit(nm);
  }

  _unitOnly(nm) {
    if (nm < 1) return 'Å';
    if (nm < 1e3) return 'nm';
    if (nm < 1e6) return 'µm';
    if (nm < 1e7) return 'mm';
    if (nm < 1e9) return 'cm';
    if (nm < 1e12) return 'm';
    if (nm < 1e15) return 'km';
    return 'Mm';
  }

  _formatByBestUnit(nm) {
    const round = (v, p = 2) => Math.round(v * Math.pow(10, p)) / Math.pow(10, p);

    if (nm < 0.1) { const A = nm * 10; return `${round(A, 1)} Å`; }        // < 1 Å
    if (nm < 1)   { const A = nm * 10; return `${round(A, 1)} Å`; }        // 0.1–1 nm shown as Å
    if (nm < 1e3) return `${round(nm, nm < 10 ? 2 : 1)} nm`;               // nm
    const um = nm / 1e3;
    if (um < 1e3) return `${round(um, um < 10 ? 2 : 1)} µm`;               // µm
    const m = nm / 1e9;
    if (m < 1) {                                                            // < 1 m → mm/cm
      const mm = m * 1000; if (mm < 10) return `${round(mm, 1)} mm`;
      const cm = m * 100;  if (cm < 10) return `${round(cm, 1)} cm`;
    }
    if (m < 1e3) return `${round(m, m < 10 ? 2 : 1)} m`;                    // m
    const km = m / 1e3;
    if (km < 1e3) return `${round(km, km < 10 ? 2 : 1)} km`;                // km
    const Mm = km / 1e3; return `${round(Mm, Mm < 10 ? 2 : 1)} Mm`;         // Mm
  }

  // Fallback mapping when no level override exists
  sizeToNanometers(size) {
    const t = this.clamp((size - this.SIZE_START) / (this.SIZE_WRAP - this.SIZE_START), 0, 1);
    return this.SCALE_MIN_NM + t * (this.SCALE_MAX_NM - this.SCALE_MIN_NM);
  }

  // Legacy (kept for compatibility)
  formatScale(nm) {
    if (nm < 1) return Math.round(nm * 10) + ' Å';
    if (nm < 1000) return Math.round(nm) + ' nm';
    return (nm / 1000).toFixed(2).replace(/\.00$/, '') + ' µm';
  }

  /* -------------------- Leaderboard / Game Over -------------------- */

  updateLeaderboard(players, myPlayerId) {
    try {
      const aliveOnly = Object.values(players || {}).filter(p => p && p.isAlive !== false);
      const sorted = aliveOnly.sort((a, b) => b.size - a.size).slice(0, 5);
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
    } catch (e) { console.error('❌ Error updating leaderboard:', e); }
  }

  showGameOver(data, finalSize, playerName) {
    try {
      document.getElementById('gameOverMessage').textContent = data.message || 'You were eaten!';
      document.getElementById('finalStats').textContent = `Final Size: ${finalSize} | Name: ${playerName}`;
      this.gameOverScreen.classList.remove('hidden');
    } catch (e) { console.error('❌ Error showing game over:', e); }
  }

  /* -------------------- utils -------------------- */
  clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
}

window.GameUI = GameUI;
