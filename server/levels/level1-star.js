/**
 * Solar System Level (0-199 size)
 * Características específicas del nivel 1
 */

const { GAME_CONFIG } = require('../core/gameState');

class SolarSystemLevel {
  constructor() {
    this.key = 'solar';
    this.name = 'Solar System';
    this.minSize = 0;
    this.maxSize = 199.999;
    this.speedMultiplier = 1.0;
    this.orbGrowth = 1;
  }

  // Lógica específica del nivel
  onEnterLevel(player) {
    console.log(`${player.name} entered Solar System`);
    // Eventos especiales del nivel
  }

  onExitLevel(player) {
    console.log(`${player.name} left Solar System`);
  }

  // Modificadores de gameplay
  getSpeedModifier() {
    return this.speedMultiplier;
  }

  getOrbGrowthRate() {
    return this.orbGrowth;
  }

  // Eventos especiales del nivel
  update(gameState, deltaTime) {
    // Lógica específica del nivel
    // Ejemplo: spawner de asteroides, eventos especiales, etc.
  }
}

module.exports = new SolarSystemLevel();