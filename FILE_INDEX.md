# AstroIo - Final Project Index
**Version:** 2.0 - Modular Architecture  
**Last Updated:** October 4, 2025  
**Developer:** ginkgo  

---

## 📂 Project Structure

```
Nasa2025/
├── server/                          # Backend (Node.js + Socket.IO)
│   ├── core/                        # Core game logic
│   │   ├── gameState.js            # Game state & configuration
│   │   ├── player.js               # Player creation & management
│   │   ├── physics.js              # Physics calculations
│   │   ├── collisions.js           # Collision detection & handling
│   │   └── bots.js                 # Bot AI & behavior
│   │
│   └── sockets/                     # Socket.IO event handlers
│       ├── connection.js           # Player connection/disconnect
│       └── movement.js             # Player movement events
│
├── public/                          # Frontend (Client-side)
│   ├── js/                         # JavaScript modules
│   │   ├── core/                   # Core client modules
│   │   │   ├── socket-client.js   # Socket.IO client wrapper
│   │   │   ├── renderer.js        # PixiJS rendering engine
│   │   │   ├── camera.js          # Camera system with zoom
│   │   │   └── ui.js              # UI management (HUD, GameOver, etc.)
│   │   │
│   │   ├── levels/                 # Level-specific modules
│   │   │   ├── level1-star.js     # Solar System (0-199 size)
│   │   │   ├── level2-galaxy.js   # Galaxy (200-399 size)
│   │   │   └── level3-cluster.js  # Cluster (400-599 size)
│   │   │
│   │   └── main.js                 # Entry point & game orchestration
│   │
│   ├── css/                        # Stylesheets
│   │   └── styles.css             # Global styles
│   │
│   ├── assets/                     # Game assets
│   │   ├── star1.webp             # Background star texture 1
│   │   └── star2.webp             # Background star texture 2
│   │
│   └── worlds/                     # HTML entry points per developer
│       ├── ginkgo_dev.html        # Ginkgo's development world
│       ├── juanjo_dev.html        # Juanjo's development world
│       ├── tomas_dev.html         # Tomas's development world
│       └── darwin_dev.html        # Darwin's development world
│
├── .env                            # Environment variables
├── server.js                       # Main server entry point
├── package.json                    # Node.js dependencies
│
└── docs/                           # Project documentation
    ├── FINAL_INDEX.md             # This file
    ├── IMPLEMENTATION_SUMMARY.md  # Technical implementation details
    ├── EXECUTIVE_SUMMARY.txt      # High-level project overview
    ├── FINAL_STATUS.txt           # Current project status
    ├── COMPLETION_REPORT.txt      # Feature completion checklist
    └── INVENTORY.txt              # File inventory & descriptions
```

---

## 🎮 Game Architecture

### Server-Side (Node.js)

#### Core Modules
- **gameState.js**: Central game state, configuration constants, orb initialization
- **player.js**: Player/bot creation, growth, respawn, level calculation
- **physics.js**: Movement, collision detection helpers, speed calculations
- **collisions.js**: Player-orb and player-player collision logic, gameOver events
- **bots.js**: Bot AI (target finding, threat avoidance, orb seeking)

#### Socket Handlers
- **connection.js**: Handle player join/disconnect, name validation, max players
- **movement.js**: Process player movement input from mouse

---

### Client-Side (Browser)

#### Core Modules
- **socket-client.js**: Socket.IO client wrapper (connect, emit, on)
- **renderer.js**: PixiJS rendering (players, orbs, stars, particles)
- **camera.js**: Camera follow player with dynamic zoom (smaller = zoom in)
- **ui.js**: HUD updates, leaderboard, game over screen, modals

#### Level Modules (Progressive Unlocking)
- **level1-star.js**: Solar System (0-199 size) - Basic gameplay
- **level2-galaxy.js**: Galaxy (200-399 size) - Expanded world
- **level3-cluster.js**: Cluster (400-599 size) - Advanced mechanics

#### Main Controller
- **main.js**: Game initialization, state management, render loop, event coordination

---

## 🚀 Quick Start

### Installation
```bash
npm install
```

### Development Mode
```bash
# Set developer name
$env:USER="ginkgo"
$env:NODE_ENV="development"

# Start server
node server.js
```

### Production Mode
```bash
$env:NODE_ENV="production"
node server.js
```

---

## 🔧 Configuration

### Environment Variables (.env)
```env
PORT=3000
NODE_ENV=development
USER=ginkgo

# Game Configuration
WORLD_WIDTH=2000
WORLD_HEIGHT=2000
NUM_ORBS=200
MAX_PLAYERS=5
NUM_BOTS=6
```

### Game Constants (gameState.js)
```javascript
GAME_CONFIG = {
  WORLD_WIDTH: 2000,
  WORLD_HEIGHT: 2000,
  NUM_ORBS: 200,
  MAX_PLAYERS: 5,
  PLAYER_INITIAL_SIZE: 20,
  BOT_INITIAL_SIZE: 18,
  ORB_SIZE: 5,
  BASE_SPEED: 5,
  EAT_SIZE_MULTIPLIER: 1.1,
  // ...
}
```

---

## 📊 Level System

| Level | Size Range | Key | Name | Features |
|-------|-----------|-----|------|----------|
| 1 | 0-199 | `solar` | Solar System | Basic gameplay, small world |
| 2 | 200-399 | `galaxy` | Galaxy | Expanded world, new visuals |
| 3 | 400-599 | `cluster` | Cluster | Advanced mechanics |
| 4 | 600-799 | `supercluster` | Supercluster | (Future) |
| 5 | 800+ | `cosmicweb` | Cosmic Web | (Future) |

---

## 🎯 Key Features

### Implemented ✅
- [x] Multiplayer Socket.IO connection
- [x] Player vs Player collision (eat mechanic)
- [x] Player vs Orb collision (growth)
- [x] Bot AI with threat avoidance
- [x] Dynamic camera zoom (based on size)
- [x] Level progression system
- [x] Leaderboard (top 5)
- [x] Game Over screen with stats
- [x] Parallax starfield background
- [x] Twinkling star animation
- [x] Delta state updates (network optimization)

### In Progress 🚧
- [ ] Level-specific backgrounds per tier
- [ ] Special abilities per level
- [ ] Sound effects & music
- [ ] Particle effects (explosions, trails)

### Planned 📋
- [ ] Minimap
- [ ] Power-ups
- [ ] Team mode
- [ ] Achievements
- [ ] Persistent high scores

---

## 📝 Development Guidelines

### Adding a New Level

1. **Create level module**: `public/js/levels/levelX-name.js`
```javascript
class LevelXClient {
  constructor() {
    this.key = 'levelname';
    this.name = 'Level Name';
    this.minSize = 400;
    this.maxSize = 599;
  }
  
  onEnter() { /* Level entry logic */ }
  onExit() { /* Level exit logic */ }
  render(renderer, camera) { /* Custom rendering */ }
}

window.LevelX = new LevelXClient();
```

2. **Update LEVELS array**: `server/core/gameState.js`
```javascript
const LEVELS = [
  { min: 400, max: 599.999, key: 'levelname', name: 'Level Name' }
];
```

3. **Import in HTML**: `public/worlds/ginkgo_dev.html`
```html
<script src="/js/levels/levelX-name.js"></script>
```

---

## 🐛 Debugging

### Server Logs
```bash
# View game loop info
🟢 Initialized 200 orbs
🤖 Initialized 6 bots
Player connected: [socket-id]
Player joined: PlayerName ([socket-id])
💀 PlayerName was eaten by Bot 1
```

### Client Console
```javascript
// Enable debug mode
localStorage.setItem('debug', 'true');

// View game state
console.log(window.game.clientGameState);
```

---

## 📚 Related Documentation

- [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) - Technical details
- [EXECUTIVE_SUMMARY.txt](./EXECUTIVE_SUMMARY.txt) - Project overview
- [FINAL_STATUS.txt](./FINAL_STATUS.txt) - Current status
- [COMPLETION_REPORT.txt](./COMPLETION_REPORT.txt) - Feature checklist
- [INVENTORY.txt](./INVENTORY.txt) - File descriptions

---

## 🤝 Contributing

### Branch Strategy
- `main` - Production-ready code
- `dev` - Development branch
- `feature/level-X` - Level-specific features
- `fix/bug-description` - Bug fixes

### Commit Messages
```
feat(levels): Add level 3 cluster mechanics
fix(collision): Resolve bot respawn timing issue
docs(readme): Update installation instructions
refactor(renderer): Optimize player rendering
```

---

## 📞 Contact

**Developer:** ginkgo  
**Project:** AstroIo (Agar.io-like space game)  
**Version:** 2.0 - Modular Architecture  
**Last Updated:** October 4, 2025  

---

## 🔐 License

MIT License - See LICENSE file for details