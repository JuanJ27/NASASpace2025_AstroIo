# AstroIo 🚀

**An educational multiplayer browser game about cosmic scale**

> Version: 3.0 — Modular architecture with scale progression
> Last updated: October 5, 2025

![Status: Alpha](https://img.shields.io/badge/Status-Alpha-orange)
![Node.js](https://img.shields.io/badge/Node.js-v14+-green)
![License](https://img.shields.io/badge/License-MIT-blue)

---

## Overview

AstroIo is a real-time multiplayer browser game inspired by *Agar.io*, designed to teach players about the scales of the universe — from ångström up to large-scale cosmic structures. Players start as tiny particles and progress through levels that represent different physical scales while learning via informational cards and a narrative centered on the "Great Attractor".

This README synthesizes the project's documentation and provides the information needed to run, develop and contribute to the project.

---

## Key Features

- Full-screen rendering using PixiJS.
- Real-time multiplayer with Socket.IO (designed for up to 5 simultaneous human players).
- Growth mechanics (consume orbs and smaller players), bots, and level-specific hazards.
- Dynamic HUD showing unit of scale, progress bar, level name and player count.
- Educational card system that appears at milestones to explain real-world objects at each scale.
- Final narrative sequence: **The Great Attractor** — a visual and narrative climax that contextualizes cosmic scales.

---

## Project Structure

```
AstroIo/
├── server/
│   ├── core/
│   │   ├── gameState.js
│   │   ├── player.js
│   │   ├── physics.js
│   │   ├── collisions.js
│   │   └── bots.js
│   └── sockets/
│       ├── connection.js
│       └── movement.js
├── public/
│   ├── js/
│   │   ├── core/
│   │   │   ├── socket-client.js
│   │   │   ├── renderer.js
│   │   │   ├── camera.js
│   │   │   ├── ui.js
│   │   │   └── elements.js
│   │   ├── levels_pack.js
│   │   └── main.js
│   ├── assets/
│   └── worlds/
│       └── [dev].html
└── server.js
```

---

## Level System and Progression

Levels represent increasing physical scales. Example progression:

- **Level 1** — Subatomic and small scales (Å → µm → m → Mm → Gm)
- **Level 2** — Galactic-scale (kpc)
- **Level 3** — Superclusters and cosmological scale (Mpc)

Each level defines size ranges and special mechanics (e.g. quantum tunnel, burst zones, black/white holes, orbital mechanics). Educational cards are triggered at specific milestones to describe representative real objects (e.g. transistor, Orion Nebula, galaxy clusters).

---

## Installation

### Requirements

- Node.js v14 or newer
- npm (bundled with Node.js)

### Quick start

```bash
# clone the repository
git clone <REPO_URL> AstroIo
cd AstroIo

# install dependencies
npm install

# start the server
node server.js
```

Open the game in your browser at `http://localhost:3000`.

---

## Controls and Gameplay

- **Name**: enter a player name (alphanumeric, max 20 characters) when prompted.
- **Movement**: the player follows the mouse cursor.
- **Respawn**: click the "Respawn" button after elimination.
- **Combat rules**: you can consume players at least 10% smaller than you.

---

## Technical Architecture

- **Backend**: Node.js + Socket.IO. Authoritative server loop runs at 60 FPS.
- **Frontend**: PixiJS for 2D rendering; Vanilla JavaScript for UI and game logic.
- **Optimization**: delta updates (only changed properties transmitted), particle containers for star fields, object pooling and spatial culling.

---

## Important Configuration

Example `GAME_CONFIG` in `server.js`:

```javascript
const GAME_CONFIG = {
  WORLD_WIDTH: 2000,
  WORLD_HEIGHT: 2000,
  NUM_ORBS: 200,
  ORB_SIZE: 5,
  PLAYER_INITIAL_SIZE: 20,
  MAX_PLAYERS: 5,
  TARGET_FPS: 60,
  BASE_SPEED: 5,
  EAT_SIZE_MULTIPLIER: 1.1,
  PLAYER_GROWTH_FROM_ORB: 1,
  PLAYER_GROWTH_FROM_PLAYER: 0.5,
  MAX_NAME_LENGTH: 20
};
```

`levels_pack.js` contains the scale mappings (linear/log), UI rules per level, and object sets for each level.

---

## Tests

- `test-client.js`: simple test with 3 bots (~30s)
- `test-combat.js`: combat test with 5 bots (~45s)

Run tests with:

```bash
node test-client.js
node test-combat.js
```

Test results and logs are written to `test.log`.

---

## Development and Customization

- **Colors and theme**: CSS variables in `public/index.html`.
- **Starfield**: particle count and textures in `public/js/core/renderer.js`.
- **World size**: modify `WORLD_WIDTH`/`WORLD_HEIGHT` in `server.js`.

---

## Roadmap

- **Current status**: Alpha — core mechanics and Levels 1.1–3 implemented.
- **Next steps**: expand visual content for Level 1.4 and Level 2, polish the Great Attractor sequence, and improve AI and visuals.

---

## Contributing

1. Fork the repository.
2. Create a branch: `git checkout -b feat/your-feature`.
3. Implement changes and tests.
4. Submit a Pull Request describing your changes.

---

## License

MIT License — free to use and modify under the terms of the MIT license.

---

## Credits

- Inspired by **Agar.io**
- Thanks to **PixiJS** (rendering) and **Socket.IO** (real-time communication).

---

**Source materials:** This README compiles and summarizes the project's English and Spanish documentation files.

<!-- End of README_en.md -->
