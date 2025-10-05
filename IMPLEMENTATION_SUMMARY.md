# AstroIo - Implementation Summary
**Architecture Version:** 2.0 - Modular MVC Pattern  
**Date:** October 4, 2025  

---

## 🏗️ Architecture Overview

### Design Pattern: Modular MVC

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENT (Browser)                      │
├─────────────────────────────────────────────────────────┤
│  main.js (Controller)                                    │
│    ├─── socket-client.js (Network Layer)               │
│    ├─── renderer.js (View)                             │
│    ├─── camera.js (View Logic)                         │
│    ├─── ui.js (View - DOM)                             │
│    └─── levels/*.js (Level Modules)                    │
└─────────────────────────────────────────────────────────┘
                           ↕ Socket.IO
┌─────────────────────────────────────────────────────────┐
│                    SERVER (Node.js)                      │
├─────────────────────────────────────────────────────────┤
│  server.js (Entry Point + Game Loop)                    │
│    ├─── sockets/connection.js (Event Handlers)         │
│    ├─── sockets/movement.js (Event Handlers)           │
│    └─── core/                                           │
│          ├─── gameState.js (Model - State)             │
│          ├─── player.js (Model - Entities)             │
│          ├─── physics.js (Business Logic)              │
│          ├─── collisions.js (Business Logic)           │
│          └─── bots.js (AI Logic)                       │
└─────────────────────────────────────────────────────────┘
```

---

## 📦 Module Descriptions

### Server Modules

#### **server.js** (Main Entry Point)
```javascript
Purpose: Initialize Express, Socket.IO, and Game Loop
Key Functions:
  - app.listen(PORT) - Start HTTP server
  - gameLoop() - 60 FPS game tick
  - io.on('connection') - Handle player connections
  
Game Loop Responsibilities:
  - Update player positions (human + bots)
  - Check collisions (orb + player)
  - Calculate delta state
  - Emit state updates to clients
  - Clean up dead players
```

#### **core/gameState.js** (Central State)
```javascript
Exports:
  - GAME_CONFIG: Object with all game constants
  - LEVELS: Array of level definitions
  - gameState: Live game state { players, orbs }
  - initializeOrbs(): Create initial orbs
  - orbIdCounter(): Generate unique orb IDs
  - botIdCounter(): Generate unique bot IDs

State Structure:
  gameState = {
    players: { [socketId]: PlayerObject },
    orbs: [ OrbObject, ... ],
    humanCount: number,
    lastUpdate: timestamp
  }
```

#### **core/player.js** (Player Management)
```javascript
Functions:
  - createPlayer(id, name) → PlayerObject
  - createBot(id, name) → BotObject
  - getRandomColor() → hex color
  - getPlayerLevel(size) → { key, name, index }
  - canEat(eater, target) → boolean
  - growPlayer(player, amount) → mutates player
  - respawnPlayer(player) → reset to initial state

PlayerObject Schema:
  {
    id: string,
    name: string,
    x: number,
    y: number,
    size: number,
    color: string,
    target: { x, y },
    speed: number,
    isBot: boolean,
    isAlive: boolean,
    score: number,
    joinTime: timestamp,
    levelKey: string,
    levelName: string
  }
```

#### **core/physics.js** (Movement & Math)
```javascript
Functions:
  - updatePlayerPosition(player, dt) → mutates player.x, player.y
  - calculateSpeed(player) → number (size-based)
  - circlesOverlap(x1,y1,r1, x2,y2,r2) → boolean
  - isNearby(x1,y1, x2,y2, maxDist) → boolean
  - distance(x1,y1, x2,y2) → number
  - clamp(value, min, max) → number

Algorithm: Linear interpolation movement
  velocity = (target - position) * (speed * dt)
  position += velocity
  position = clamp(position, 0, WORLD_SIZE)
```

#### **core/collisions.js** (Collision Detection)
```javascript
Functions:
  - checkOrbCollisions(player) → orbIdsRemoved[]
  - checkPlayerCollisions(io) → playerIdsRemoved[]
  - spawnOrb() → OrbObject

Collision Logic:
  1. Check if circles overlap (using circlesOverlap())
  2. If player eats orb:
     - Grow player by PLAYER_GROWTH_FROM_ORB
     - Remove orb from gameState.orbs
     - Spawn new orb
  3. If player eats player:
     - Check canEat(eater, target)
     - Grow eater by target.size * PLAYER_GROWTH_FROM_PLAYER
     - Mark target as dead
     - Emit 'gameOver' if target is human
     - Respawn if target is bot
```

#### **core/bots.js** (Bot AI)
```javascript
Functions:
  - initializeBots() → create NUM_BOTS bots
  - updateBots(dt) → update all bot behavior
  - findNearestOrb(bot) → OrbObject | null
  - findNearestThreat(bot) → PlayerObject | null

AI State Machine:
  1. Move towards current target
  2. 30% chance: Target nearest orb (if < 300px away)
  3. If threat detected (< 400px):
     - Calculate flee direction (opposite of threat)
     - Set target away from threat
  4. 1% chance per frame: Random target
```

#### **sockets/connection.js** (Connection Events)
```javascript
Events Handled:
  - 'connection': New player connects
  - 'setName': Player sends name
  - 'disconnect': Player leaves

Flow:
  1. Check if game is full (MAX_HUMAN_PLAYERS)
  2. Validate player name
  3. Create player object
  4. Add to gameState.players
  5. Emit 'init' with world size
  6. On disconnect: Remove player, decrement humanCount
```

#### **sockets/movement.js** (Movement Events)
```javascript
Events Handled:
  - 'move': Player sends mouse position

Flow:
  1. Validate player exists
  2. Update player.target = { x, y }
  3. Physics engine moves player towards target in gameLoop
```

---

### Client Modules

#### **main.js** (Game Controller)
```javascript
Class: AstroIoGame
  Properties:
    - socket: GameSocket instance
    - renderer: GameRenderer instance
    - camera: GameCamera instance
    - ui: GameUI instance
    - clientGameState: { players, orbs }
    - myPlayerId, myPlayerName, isGameActive
    
  Methods:
    - init(): Initialize UI
    - startGame(name): Load assets, connect socket
    - connectToServer(): Setup socket listeners
    - updateGameState(delta): Merge server delta
    - render(): Draw frame
    - maybeRunLevelTransition(size): Check level change
    - runZoomTransition(): Animate zoom effect

Game Loop (client-side):
  Server emits 'gameState' → updateGameState(delta) → render()
```

#### **core/socket-client.js** (Network Layer)
```javascript
Class: GameSocket
  Methods:
    - connect(): Initialize Socket.IO
    - setName(name): Emit 'setName'
    - sendMove(x, y): Emit 'move'
    - on(event, callback): Register listener
    
  Events Listened:
    - 'connect', 'disconnect'
    - 'init', 'gameFull', 'gameOver', 'gameState'
```

#### **core/renderer.js** (PixiJS Renderer)
```javascript
Class: GameRenderer
  Properties:
    - app: PIXI.Application
    - worldContainer: PIXI.Container (game objects)
    - starContainer: PIXI.ParticleContainer (background)
    - playerGraphics: { [id]: PIXI.Graphics }
    - orbGraphics: { [id]: PIXI.Graphics }
    
  Methods:
    - initialize(): Create PixiJS app
    - createStarryBackground(): Generate 300 stars
    - updateStarParallax(cameraX, cameraY): Move stars
    - renderPlayer(player, isMe, myPlayerId): Draw player
    - renderOrb(orb): Draw orb
    - drawStar(): Draw 5-point star (for bots)
    - removePlayer(id), removeOrb(id): Cleanup
    
Rendering Pipeline:
  1. Clear graphics (graphics.clear())
  2. Draw glow layer
  3. Draw main shape (circle or star)
  4. Update name text position
```

#### **core/camera.js** (Camera System)
```javascript
Class: GameCamera
  Properties:
    - x, y: Camera world position
    - viewScale: Current zoom level
    
  Methods:
    - update(player, screenW, screenH, container):
        * Calculate desired zoom: 1.4 - (size / 250)
        * Lerp current scale to desired
        * Center camera on player
        * Clamp to world bounds
        * Apply to worldContainer position
        
    - screenToWorld(screenX, screenY): Convert coordinates
    
Zoom Formula:
  viewScale = clamp(1.4 - (player.size / 250), 0.6, 1.4)
  Small players (size=20): scale = 1.32 (zoomed in)
  Large players (size=500): scale = 0.6 (zoomed out)
```

#### **core/ui.js** (UI Management)
```javascript
Class: GameUI
  DOM Elements:
    - nameModal, hud, leaderboard, gameOverScreen
    
  Methods:
    - validateName(name): Check length, characters
    - showError(message): 3-second toast
    - hideNameModal(), showHUD(name): Toggle views
    - updateHUD(player, count): Update size, position, players
    - updateLeaderboard(players, myId): Sort by size, top 5
    - showGameOver(data, finalSize, name): Display stats
    - formatTime(ms): Convert to mm:ss
```

---

## 🎮 Level System Implementation

### Level Definition (gameState.js)
```javascript
const LEVELS = [
  { min: 0,   max: 199.999, key: 'solar',        name: 'Solar System' },
  { min: 200, max: 399.999, key: 'galaxy',       name: 'Galaxy' },
  { min: 400, max: 599.999, key: 'cluster',      name: 'Cluster' },
  { min: 600, max: 799.999, key: 'supercluster', name: 'Supercluster' },
  { min: 800, max: 9999,    key: 'cosmicweb',    name: 'Cosmic Web' }
];
```

### Level Module Structure
```javascript
// public/js/levels/level1-star.js
class SolarSystemLevelClient {
  constructor() {
    this.key = 'solar';
    this.name = 'Solar System';
    this.minSize = 0;
    this.maxSize = 199;
    this.backgroundColor = 0x000033;
  }
  
  onEnter() {
    console.log('Entered Solar System');
    // Change background, load assets, etc.
  }
  
  onExit() {
    console.log('Exited Solar System');
    // Cleanup
  }
  
  render(renderer, camera) {
    // Custom rendering (planets, asteroids, etc.)
  }
  
  update(deltaTime) {
    // Level-specific updates
  }
}

window.SolarSystemLevel = new SolarSystemLevelClient();
```

### Level Transition Flow
```javascript
// In main.js
maybeRunLevelTransition(playerSize) {
  const tier = Math.floor(playerSize / 200); // 0, 1, 2, 3, 4
  
  if (tier !== this.lastLevelTier) {
    this.lastLevelTier = tier;
    
    // Exit old level
    if (window[`Level${this.lastLevelTier}`]) {
      window[`Level${this.lastLevelTier}`].onExit();
    }
    
    // Enter new level
    if (window[`Level${tier}`]) {
      window[`Level${tier}`].onEnter();
    }
    
    // Run zoom animation
    this.runZoomTransition();
  }
}
```

---

## 🔄 Network Protocol (Delta Updates)

### State Update Message
```javascript
// Server → Client (every 16ms)
{
  players: {
    [playerId]: { x, y, size, name, levelKey, isAlive, ... }
  },
  orbs: [
    { id, x, y, size, color }
  ],
  removedOrbs: [ orbId1, orbId2 ],
  removedPlayers: [ playerId1 ]
}
```

### Delta Optimization
```javascript
// Only send changed properties
const delta = { players: {}, orbs: [], removedOrbs: [], removedPlayers: [] };

for (const [id, player] of Object.entries(gameState.players)) {
  const prev = lastState.players[id];
  
  // Only include if changed
  if (!prev || prev.x !== player.x || prev.y !== player.y || ...) {
    delta.players[id] = { ...player };
  }
}
```

---

## 🎯 Game Loop Timing

### Server Loop (60 FPS)
```javascript
function gameLoop() {
  const start = Date.now();
  const dt = start - lastLoopTime;
  
  // Update physics (60 FPS = 16.67ms per frame)
  updatePlayers(dt);
  updateBots(dt);
  checkCollisions();
  
  // Send state
  io.emit('gameState', delta);
  
  // Schedule next tick
  const elapsed = Date.now() - start;
  setTimeout(gameLoop, Math.max(0, 16.67 - elapsed));
}
```

### Client Render Loop (requestAnimationFrame)
```javascript
// Triggered by 'gameState' event
socket.on('gameState', (delta) => {
  updateGameState(delta);  // Merge state
  render();                // Draw frame (browser handles timing)
});
```

---

## 🐛 Error Handling

### Server
```javascript
try {
  // Game loop logic
} catch (err) {
  console.error('❌ Error in game loop:', err.message);
  console.error(err);
  // Continue loop (don't crash server)
}
```

### Client
```javascript
try {
  // Render logic
} catch (error) {
  console.error('❌ Error rendering:', error);
  // UI will show last good frame
}
```

---

## 📊 Performance Optimizations

1. **Delta State Updates**: Only send changed data
2. **PIXI ParticleContainer**: For 300 stars (GPU-optimized)
3. **Object Pooling**: Reuse Graphics objects
4. **Spatial Hashing**: (TODO) For collision detection
5. **Throttled Mouse Input**: Max 60 updates/sec
6. **Debounced Window Resize**: 100ms delay

---

## 🔐 Security Considerations

1. **Input Validation**: Name length, character whitelist
2. **Rate Limiting**: Max 5 players, max 60 moves/sec
3. **Server Authority**: All physics calculated server-side
4. **Sanitized Output**: Escape player names in HTML

---

## 📝 Future Enhancements

### Planned Features
- [ ] Minimap with viewport indicator
- [ ] Particle effects (trails, explosions)
- [ ] Power-ups (speed boost, shield, split)
- [ ] Team mode (color-coded teams)
- [ ] Sound effects (eat, death, level up)
- [ ] Background music per level
- [ ] Leaderboard persistence (database)
- [ ] Spectator mode

### Technical Debt
- [ ] Add TypeScript types
- [ ] Unit tests (Jest)
- [ ] Integration tests (Socket.IO)
- [ ] Performance profiling
- [ ] Code coverage (>80%)
- [ ] API documentation (JSDoc)

---

**Last Updated:** October 4, 2025  
**Documented By:** ginkgo  