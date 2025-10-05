// ✨✨✨ NUEVA LÍNEA - AGREGAR AL INICIO ✨✨✨ // la agrego darwin 
const { LEVELS_CONFIG } = require('../../shared/levelsConfig');

const GAME_CONFIG = {
  WORLD_WIDTH: parseInt(process.env.WORLD_WIDTH) || 2000,
  WORLD_HEIGHT: parseInt(process.env.WORLD_HEIGHT) || 2000,
  NUM_ORBS: parseInt(process.env.NUM_ORBS) || 200,
  MAX_PLAYERS: parseInt(process.env.MAX_PLAYERS) || 5,
  ORB_SIZE: 5,
  PLAYER_INITIAL_SIZE: 20,
  TARGET_FPS: 60,
  UPDATE_INTERVAL: 1000 / 60,
  BASE_SPEED: 5,
  EAT_SIZE_MULTIPLIER: 1.1,
  PLAYER_GROWTH_FROM_ORB: 1,
  PLAYER_GROWTH_FROM_PLAYER: 0.5,
  MAX_NAME_LENGTH: 20,  // ← Agregar esta línea
  MAX_HUMAN_PLAYERS: 5,
  NUM_BOTS: 2,
  BOT_INITIAL_SIZE: 5,
  BOT_SPEED: 2.8,
  BOT_RESPAWN_DELAY_MS: 1000 * 15
};

// ✨✨✨ USAR CONFIGURACIÓN CENTRALIZADA ✨✨✨ // darwin modifico esto
const LEVELS = LEVELS_CONFIG;

const gameState = {
  players: {},
  orbs: [],
  lastUpdate: Date.now(),
  humanCount: 0
};

// Inicializar orbes
function initializeOrbs() {
  gameState.orbs = [];
  const colors = ['#00FF00', '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500'];
  
  for (let i = 0; i < GAME_CONFIG.NUM_ORBS; i++) {
    gameState.orbs.push({
      id: `orb_${i}`,
      x: Math.random() * GAME_CONFIG.WORLD_WIDTH,
      y: Math.random() * GAME_CONFIG.WORLD_HEIGHT,
      size: GAME_CONFIG.ORB_SIZE,
      color: colors[Math.floor(Math.random() * colors.length)]
    });
  }
  
  console.log(`🟢 Initialized ${GAME_CONFIG.NUM_ORBS} orbs`);
}

// Inicializar al cargar el módulo
initializeOrbs();

let orbIdCounter = GAME_CONFIG.NUM_ORBS;
let botIdCounter = 0;

module.exports = {
  GAME_CONFIG,
  LEVELS,
  gameState,
  orbIdCounter: () => orbIdCounter++,
  botIdCounter: () => botIdCounter++,
  initializeOrbs
};