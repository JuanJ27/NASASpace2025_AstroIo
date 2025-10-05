require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');

// Importar módulos
const { GAME_CONFIG, gameState } = require('./server/core/gameState');
const { handleConnection } = require('./server/sockets/connection');
const { handleMovement } = require('./server/sockets/movement');
const { updatePlayerPosition } = require('./server/core/physics');
const { checkOrbCollisions, checkPlayerCollisions } = require('./server/core/collisions');
const { initializeBots, updateBots } = require('./server/core/bots');
const { getPlayerLevel } = require('./server/core/player');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  },
  transports: ['websocket', 'polling'],
  allowEIO3: true
});

io.engine.on('initial_headers', (headers, req) => {
  console.log('📡 SocketIO headers:', headers);
});

io.engine.on('connection_error', (err) => {
  console.error('❌ SocketIO connection error:', err);
});

const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const USER = process.env.USER || '';

// Rutas condicionales
app.get('/', (req, res) => {
  if (NODE_ENV == 'development') {
    console.log("••••• Entrando en modo desarrollo ••••");
    const devFiles = {
      'ginkgo': 'ginkgo_dev.html',
      'juan': 'juanjo_dev.html',
      'tomas': 'tomas_dev.html',
      'darwin': 'darwin_dev.html'
    };
    
    const devFile = devFiles[USER.toLowerCase()] || 'index.html';
    console.log("------>"+USER);
    const filePath = path.join(__dirname, 'public', 'worlds', devFile);
    console.log(`🔧 DEV MODE: ${devFile} for ${USER}`);
    res.sendFile(filePath);
  } else {
    const filePath = path.join(__dirname, 'public', 'index.html');
    console.log(`🚀 PROD MODE: index.html`);
    res.sendFile(filePath);
  }
});
// Servir estáticos
app.use(express.static(path.join(__dirname, 'public')));



// Socket.IO
io.on('connection', (socket) => {
  handleConnection(io, socket);
  handleMovement(socket);
});

// Game Loop Variables
let lastLoopTime = Date.now();
let lastState = {
  players: {},
  orbs: []
};
let frameCount = 0;
let fpsUpdateTime = Date.now();

/**
 * Game Loop Principal
 */
function gameLoop() {
  const start = Date.now();
  
  try {
    const dt = start - lastLoopTime;
    lastLoopTime = start;

    // FPS counter
    frameCount++;
    if (start - fpsUpdateTime >= 1000) {
      frameCount = 0;
      fpsUpdateTime = start;
    }

    // Actualizar jugadores humanos
    Object.values(gameState.players).forEach(player => {
      if (player.isBot) return;
      
      updatePlayerPosition(player, dt);
      checkOrbCollisions(player);
      
      // Actualizar nivel
      const level = getPlayerLevel(player.size);
      player.levelKey = level.key;
      player.levelName = level.name;
    });

    // Actualizar bots
    updateBots(dt);

    // Colisiones jugador vs jugador (PASAR io AQUÍ)
    const removedPlayers = checkPlayerCollisions(io);

    // Construir delta (solo cambios)
    const delta = {
      players: {},
      orbs: [],
      removedOrbs: [],
      removedPlayers: []
    };

    // Jugadores cambiados/nuevos
    for (const [id, player] of Object.entries(gameState.players)) {
      const prev = lastState.players[id];
      
      if (!prev ||
          prev.x !== player.x || 
          prev.y !== player.y ||
          prev.size !== player.size || 
          prev.name !== player.name ||
          prev.levelKey !== player.levelKey ||
          prev.isAlive !== player.isAlive) {
        delta.players[id] = { ...player };
      }
    }

    // Jugadores removidos
    for (const id of Object.keys(lastState.players)) {
      if (!gameState.players[id]) {
        delta.removedPlayers.push(id);
      }
    }

    // Orbes añadidos
    const lastOrbMap = new Map(lastState.orbs.map(o => [o.id, o]));
    const currOrbMap = new Map(gameState.orbs.map(o => [o.id, o]));
    
    for (const orb of gameState.orbs) {
      if (!lastOrbMap.get(orb.id)) {
        delta.orbs.push({ ...orb });
      }
    }

    // Orbes removidos
    for (const orb of lastState.orbs) {
      if (!currOrbMap.has(orb.id)) {
        delta.removedOrbs.push(orb.id);
      }
    }

    // Añadir jugadores removidos por colisión
    delta.removedPlayers.push(...removedPlayers);

    // Enviar delta si hay cambios
    if (Object.keys(delta.players).length || 
        delta.orbs.length || 
        delta.removedOrbs.length || 
        delta.removedPlayers.length) {
      io.emit('gameState', delta);
    }

    // Actualizar último estado (deep copy)
    lastState.players = JSON.parse(JSON.stringify(gameState.players));
    lastState.orbs = JSON.parse(JSON.stringify(gameState.orbs));

    // Remover jugadores muertos
    removedPlayers.forEach(id => {
      if (gameState.players[id] && !gameState.players[id].isBot) {
        delete gameState.players[id];
        gameState.humanCount = Math.max(0, gameState.humanCount - 1);
      }
    });

  } catch (err) {
    console.error('❌ Error in game loop:', err.message);
    console.error(err);
  }

  // Programar siguiente iteración
  const elapsed = Date.now() - start;
  setTimeout(gameLoop, Math.max(0, GAME_CONFIG.UPDATE_INTERVAL - elapsed));
}

// Inicializar bots
initializeBots();

// Iniciar game loop
gameLoop();

// Iniciar servidor
server.listen(PORT, () => {
  console.log('═══════════════════════════════════════════════════');
  console.log(`🚀 AstroIo Server Started`);
  console.log(`📍 URL: http://localhost:${PORT}`);
  console.log(`🌍 Environment: ${NODE_ENV}`);
  
  if (NODE_ENV === 'development') {
    console.log(`👤 Developer: ${USER}`);
  }
  
  console.log(`🎮 Max Players: ${GAME_CONFIG.MAX_PLAYERS}`);
  console.log(`🌎 World Size: ${GAME_CONFIG.WORLD_WIDTH}x${GAME_CONFIG.WORLD_HEIGHT}`);
  console.log(`⚫ Orbs: ${GAME_CONFIG.NUM_ORBS}`);
  console.log(`🤖 Bots: ${GAME_CONFIG.NUM_BOTS}`);
  console.log('═══════════════════════════════════════════════════');
});