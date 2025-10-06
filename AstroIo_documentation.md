**AstroIo - Master Documentation**

**A Multiplayer Educational Game About Cosmic Scale**\
Version: 3.0 - Modular Architecture with Scale Progression\
Last Updated: October 5, 2025

-----
**Game Overview**

**Concept**

AstroIo is a real-time multiplayer browser game inspired by Agar.io, designed to educate players about the scales of the universe. Players start as microscopic dust particles and grow through five cosmic levels, eventually becoming massive galaxy clusters before being pulled into the Great Attractor - visualizing the true scale of cosmic structure.

**Core Gameplay Loop**

1. **Start Small**: Begin as a dust particle (Ångström scale)
1. **Eat & Grow**: Consume orbs and smaller players to increase size
1. **Avoid Threats**: Dodge larger players and level-specific hazards
1. **Progress Through Scales**: Unlock 5 cosmic levels as you grow
1. **Learn**: Discover educational facts about cosmic scales through milestone cards
1. **Reach the End**: Experience the inevitable pull of the Great Attractor

**Educational Mission**

Each level transition teaches players about relative scales in the universe - from atoms to galaxy superclusters - providing context through informative cards that appear at specific point thresholds. Players learn how cosmic structures relate to everyday objects and distances.

-----
**Architecture**

**Design Pattern: Modular MVC**

┌─────────────────────────────────────────────────────────┐

│                    CLIENT (Browser)                      │

├─────────────────────────────────────────────────────────┤

│  main.js (Controller)                                    │

│    ├─── core/socket-client.js (Network Layer)          │

│    ├─── core/renderer.js (View - PixiJS)               │

│    ├─── core/camera.js (View Logic)                    │

│    ├─── core/ui.js (View - DOM)                        │

│    ├─── core/elements.js (Orb Definitions)             │

│    └─── levels\_pack.js (Level Configuration)           │

└─────────────────────────────────────────────────────────┘

`                           `↕ Socket.IO

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

**Directory Structure**

AstroIo/

├── server/

│   ├── core/

│   │   ├── gameState.js       # Game configuration & state

│   │   ├── player.js          # Player/bot creation

│   │   ├── physics.js         # Movement & collision math

│   │   ├── collisions.js      # Collision detection

│   │   └── bots.js            # Bot AI logic

│   └── sockets/

│       ├── connection.js      # Player join/leave events

│       └── movement.js        # Mouse input handling

├── public/

│   ├── js/

│   │   ├── core/

│   │   │   ├── socket-client.js  # Socket.IO wrapper

│   │   │   ├── renderer.js       # PixiJS rendering

│   │   │   ├── camera.js         # Camera system

│   │   │   ├── ui.js             # HUD & modals

│   │   │   └── elements.js       # Orb definitions per level

│   │   ├── levels\_pack.js        # Level configuration manager

│   │   └── main.js               # Client entry point

│   ├── assets/                   # Textures (planets, stars, etc.)

│   └── worlds/

│       └── [dev].html            # Developer entry points

└── server.js                     # Main server + game loop

-----
**Level System**

**Level Progression Overview**

|**Level**|**Name**|**Size Range**|**Scale**|**Theme**|
| :- | :- | :- | :- | :- |
|**Level 1 - Sublevel 1**|Atomic|2-13|Å → µm|Hydrogen, Helium, atoms|
|**Level 1 - Sublevel 2**|Dust Grains|14-26|µm → m|Silicates, ice, carbonaceous|
|**Level 1 - Sublevel 3**|Asteroids|27-39|m → Mm|C-type, S-type, M-type asteroids|
|**Level 1 - Sublevel 4**|Solar System|40-119|Mm → Gm|Planets, Sun (no new orbs)|
|**Level 2**|Galaxy|120-159|Kpc|Galaxies, star clusters|
|**Level 3**|Supercluster|160-200+|Mpc|Galaxy clusters, cosmic web|

**Level-Specific Features**

**Level 1 - Sublevel 1: Atomic (Å → µm)**

**Size Range:** 2-13\
**Visual:** Starfield background, purple-blue gradient\
**Special Mechanic:** Quantum Tunnel (teleportation)

**Orbs (Elements):**

- **Hidrógeno (H)** - 0.5 points (60% spawn rate) - Blue sphere
- **Helio (He)** - 2.0 points (15% spawn rate) - Purple sphere
- **Oxígeno (O)** - 3.0 points (10% spawn rate) - Green sphere
- **Carbono (C)** - 4.0 points (8.5% spawn rate) - Grey carbonaceous
- **Neón (Ne)** - 7.0 points (6.5% spawn rate) - Red sphere

**Education:** Introduces atomic scale and basic elements that form matter

-----
**Level 1 - Sublevel 2: Dust Grains (µm → m)**

**Size Range:** 14-26\
**Visual:** Space dust particles, warm gold color scheme\
**Special Mechanic:** Burst Zones (high orb density areas)

**Orbs (Dust Types):**

- **Silicatos (Si)** - 2.0 points (60% spawn rate) - 2x visual scale
- **Carbonáceos (Carb)** - 3.0 points (20% spawn rate) - 2x visual scale
- **Mantos de Hielo (Ice)** - 4.0 points (12% spawn rate) - 2x visual scale
- **Óxidos Metálicos (Fe)** - 5.0 points (8% spawn rate) - 2x visual scale

**Education:** Interstellar dust formation and composition

-----
**Level 1 - Sublevel 3: Asteroids (m → Mm)**

**Size Range:** 27-39\
**Visual:** Asteroid belt, grey tones\
**Special Mechanic:** Fast-moving supersonic asteroids, black holes, white holes

**Orbs (Asteroid Types):**

- **Asteroide Tipo C** - 5.0 points (50% spawn rate) - 5x visual scale
- **Asteroide Tipo S** - 7.0 points (30% spawn rate) - 5x visual scale
- **Asteroide Tipo M** - 10.0 points (20% spawn rate) - 5x visual scale

**Hazards:**

- Black holes (deadly trap zones)
- White holes (teleportation points)
- Supersonic asteroids (moving obstacles)

**Special Feature:** Hazards only visible while player is within size range 27-119; permanently hidden after passing max threshold

**Education:** Solar system formation and asteroid classification

-----
**Level 1 - Sublevel 4: Solar System (Mm → Gm)**

**Size Range:** 40-119\
**Visual:** Planetary textures (Earth at 40-59, Sun at 60-119)\
**Special Mechanic:** Accretion disk, orbital mechanics (planned)

**Orbs:** No new orb types (transition level)

**Player Texture Changes:**

- Size 40-59: Earth texture (LaTierra.webp)
- Size 60-119: Sun texture (sol.webp)

**Education:** Planetary scale and stellar evolution

-----
**Level 2: Galaxy (Kpc)**

**Size Range:** 120-159\
**Visual:** Spiral galaxies, Milky Way texture\
**Special Mechanic:** AGN jets (rotating galaxy jets - planned)

**Orbs (Galactic Objects):**

- **Enana Irregular (DwarfIrr)** - 15.0 points (40% spawn rate) - 3x visual scale
- **Nube de Gas Frío (GasCloud)** - 20.0 points (20% spawn rate) - 3x visual scale
- **Enana Esferoidal (DwarfSph)** - 25.0 points (20% spawn rate) - 3x visual scale
- **Pequeña Espiral (SmallSpiral)** - 30.0 points (10% spawn rate) - 4x visual scale
- **Cúmulo Globular (GlobCluster)** - 35.0 points (10% spawn rate) - 4x visual scale

**Player Texture:** Milky Way galaxy (via\_lactea.webp)

**Education:** Galactic structure and types of galaxies

-----
**Level 3: Supercluster (Mpc)**

**Size Range:** 160-200+\
**Visual:** Exotic galaxy clusters, cosmic web visualization\
**Special Mechanic:** Great Attractor endgame (see below)

**Orbs (Galaxy Clusters):**

- **Elíptica Intermedia (EllipInt)** - 40.0 points (60% spawn rate) - 4x visual scale
- **Elíptica Gigante (EllipGiant)** - 50.0 points (30% spawn rate) - 5x visual scale
- **BCG/cD Galaxy (BCG)** - 70.0 points (10% spawn rate) - 6x visual scale

**Player Texture:** Exotic galaxy cluster (exotic\_galaxy.webp)

**Education:** Large-scale structure of universe, cosmic web, gravitational anomalies

-----
**Progression Mechanics**

**Growth System**

**Orb Consumption:** Each orb has specific point values based on level and rarity. Point values range from 0.5 (common hydrogen atoms) to 70.0 (rare BCG galaxies). Growth is calculated as:

- newSize = currentSize + orbPoints

**Visual Scaling:** Orbs have different visual scales to indicate their importance:

- 1x scale: Basic atoms (Level 1.1)
- 2x scale: Dust grains (Level 1.2)
- 5x scale: Asteroids (Level 1.3)
- 3x-4x scale: Galactic objects (Level 2)
- 4x-6x scale: Galaxy clusters (Level 3)

**Player vs Player:**

- Can eat players 10% smaller than you
- Growth = currentSize + (targetSize \* 0.5)
- Death triggers Game Over screen with survival time and final stats

**Educational Milestones**

At specific point thresholds, educational cards appear with fascinating cosmic facts:

**Microscopic Scale (28-110 points):**

- **28 pts** - Transistor Gate (5 nm): Microscopic switches in electronics
- **46 pts** - Ultraviolet Wavelength (60 nm): Invisible energetic light
- **90 pts** - Human Hair Width (100 µm): You have 50,000-200,000 strands
- **110 pts** - Rice Grain & Ant (5 mm): Similar sizes, vastly different lives

**Human Scale (145-185 points):**

- **145 pts** - Giraffe Height (6 m): Necks are nearly half their height
- **168 pts** - Burj Khalifa (~1 km): World's tallest building with swimming pool on 76th floor
- **185 pts** - Neutron Star (24-35 km): More mass than Sun in 20 km sphere

**Planetary Scale (209-325 points):**

- **209 pts** - Io Moon (3.6 Mm): 400+ active volcanoes, most volcanic place in solar system
- **248 pts** - The Sun (696 Mm): 1.3 million Earths fit inside, converts 600M tons H→He per second
- **269 pts** - All Humans Stacked (13.2 Gm): 88x Earth-Moon distance
- **294 pts** - R Doradus (2.74 AU): Red giant would swallow inner planets
- **325 pts** - Light's Daily Travel (173.8 AU): 26 billion km in one day

**Stellar Scale (364-412 points):**

- **364 pts** - Hourglass Nebula (36,765 AU): Dying star's beautiful ejected layers
- **391 pts** - Orion Nebula (7.45 pc): Stellar nursery where baby stars are born
- **412 pts** - Omega Centauri (46 pc): 10 million stars in cosmic ball

**Galactic Scale (490-595 points):**

- **490 pts** - Sagittarius Dwarf (3 kpc): Small galaxy being eaten by Milky Way
- **513 pts** - Large Magellanic Cloud (9.86 kpc): 20 billion stars, visible to naked eye
- **534 pts** - Milky Way (30 kpc): Our home, 200-400 billion stars
- **549 pts** - Andromeda Galaxy (67.45 kpc): 1 trillion stars, on collision course with us
- **595 pts** - Distance to Andromeda (778 kpc): Light takes 2.5 million years

**Cosmic Scale (620-720 points):**

- **620 pts** - Virgo Cluster (16.5 Mpc): 2,000+ galaxies, heart of Local Supercluster
- **658 pts** - Coma Cluster (100 Mpc): Where dark matter was first detected
- **705 pts** - Shapley Supercluster (250 Mpc): Biggest concentration of galaxies nearby
- **720 pts** - Large-Scale Structure (1 Gpc): Cosmic web of filaments and voids

**Card Display:** Each card shows for 10-12 seconds with beautiful accompanying images, providing context for the player's current scale.

**UI Scale Display**

The HUD dynamically shows:

- Current scale unit (Å, nm, µm, mm, m, km, Mm, Gm, AU, pc, kpc, Mpc, Gpc)
- Size within level (percentage bar with gradient)
- Real-world scale name (e.g., "Å → nm → µm" for Level 1.1)
- Gradient accent colors that change per level
- Player count and current position
-----
**Endgame: The Great Attractor**

**Trigger Conditions**

When player reaches approximately **190-195 points** (near max of Level 3):

- Great Attractor spawns at a distant location in the game world
- Gravitational pull gradually increases over time
- Player movement becomes increasingly restricted
- Visual effects intensify (screen shake, gravitational distortion lines)

**Endgame Sequence**

1. **Initial Pull**: Great Attractor appears on horizon, subtle pull begins
1. **Intensification**: Camera shake increases, gravitational lines visible
1. **Inevitable Attraction**: Player cannot escape regardless of input, pulled toward center
1. **Dramatic Zoom Out**: Camera zooms out exponentially, player becomes smaller and smaller
1. **Cosmic Scale Reveal**: Player becomes a single dot among countless others
1. **Final Transition**: Fade to real universe image showing cosmic web filaments
1. **Educational Message**: "You've experienced the full scale of the universe - from atoms to the largest structures. The Great Attractor is a real gravitational anomaly pulling our Local Group of galaxies at 600 km/s toward an unknown point in space."

**Educational Message**

The Great Attractor is a real gravitational anomaly in the universe, pulling the Milky Way and hundreds of thousands of other galaxies toward it at tremendous speeds. The ending teaches that even the most massive structures we can observe are still part of larger cosmic systems beyond our complete understanding.

-----
**Visual Design**

**Rendering System (PixiJS)**

**Layer Organization (z-index):**

- 0-10: Background elements (starfield, nebulae)
- 20: Player entities
- 25: Orb entities
- 30: Hazards (asteroids, black holes, white holes)
- 40: Name labels and text
- 50+: UI overlays and modal cards

**Visual Effects:**

- Glow effects on players and orbs (intensity varies by size)
- Star twinkling animation using sine wave calculations
- Parallax scrolling (stars move at 20% of camera speed for depth perception)
- Smooth zoom transitions between levels
- Hazard-specific effects (black hole event horizons, white hole cores)

**Texture Assets**

**Player Textures (change automatically by size):**

- nebula.webp - Size 2-26 (atomic/dust phase)
- roca.webp - Size 27-39 (asteroid phase)
- LaTierra.webp - Size 40-59 (planet phase)
- sol.webp - Size 60-119 (star phase)
- via\_lactea.webp - Size 120-159 (galaxy phase)
- exotic\_galaxy.webp - Size 160-200+ (supercluster phase)

**Bot Textures:**

- sol2.webp, sol3.webp - Star-shaped bots (various levels)
- planeta\_anillo.webp - Ringed planet bots
- andromeda.webp - Galaxy-shaped bots
- Rendered as 5-point stars with textures

**Orb Textures:** 23 unique textures across all levels (see elements.js)

**Educational Card Images:** 24 milestone images (1\_transistor\_gate.webp through 24\_cosmic\_web.webp)

-----
**Bot AI**

**Behavior System**

Bots use a state machine with multiple decision layers:

1. **Orb Seeking** (30% probability): Target nearest orb within 300px radius
1. **Threat Avoidance** (triggered automatically): Flee from larger players within 400px radius
1. **Random Wandering** (1% probability per frame): Choose random direction for exploration
1. **Growth Response**: Bots grow using same mechanics as human players

**Bot Properties**

- **Visual Distinction**: Rendered as 5-point stars (vs circles for human players)
- **Population**: 6 bots active simultaneously
- **Respawn Timer**: 15 seconds after being eaten
- **Texture Variation**: Unique textures per level (sol2, planeta\_anillo, andromeda, etc.)
- **Intelligence**: Simple but effective - bots can compete with human players

**Bot Challenges**

Bots provide dynamic gameplay challenges:

- Small bots serve as growth opportunities
- Large bots become threats to avoid
- Bot population maintains game activity during low player counts
-----
**Network Protocol**

**Communication Events**

**Client → Server:**

- setName(name) - Set player name at game start (max 20 characters, validated)
- move(target) - Update target coordinates {x, y} based on mouse position

**Server → Client:**

- init(data) - Initialize new player with unique ID and world size parameters
- gameState(delta) - Delta state update containing only changed data
- gameOver(data) - Notify player elimination with survival stats (time, final size, killer)
- gameFull(data) - Reject connection when max 5 human players reached

**Delta State Optimization**

The server implements delta updates to reduce bandwidth consumption:

- Only transmits changed player properties (position, size, level)
- Only includes new or moved orbs
- Explicitly lists removed orbs and players
- Includes hazards only when applicable (Level 1.3)

**Performance Impact:**

- Bandwidth reduction: 60-80% compared to full state updates
- Update frequency: 60 FPS (16.67ms intervals)
- Latency: <10ms on local network, <50ms typical internet
-----
**Core Systems**

**Server Game Loop (60 FPS)**

The server maintains authoritative game state with these responsibilities:

1. Update all player positions based on physics
1. Update bot AI behavior and movement
1. Check orb collision detection and consumption
1. Check player-vs-player collisions and eating mechanics
1. Check hazard collisions (Level 1.3 only)
1. Apply Great Attractor gravitational pull (endgame)
1. Calculate delta state (only changed data)
1. Emit state updates to all connected clients
1. Clean up disconnected players and dead bots
1. Schedule next tick at precise 16.67ms intervals

**Client Render Loop**

The client responds to server updates:

1. Receive delta state from server via Socket.IO
1. Merge delta into local game state
1. Update camera position and zoom level based on player size
1. Render all visible entities (players, orbs, hazards) using PixiJS
1. Update HUD information (size, position, player count, scale)
1. Update leaderboard with top 5 players
1. Check for educational milestone cards and display when triggered
1. Handle level transitions and zoom animations

**Configuration Management**

**levels\_pack.js** serves as the central configuration manager:

- Defines scale mapping functions (linear or logarithmic) for each level
- Manages level transitions (onEnter/onExit lifecycle)
- Swaps element sets between levels (ELEMENTS vs ELEMENTS\_L1 vs ELEMENTS\_L2)
- Configures UI display rules (scale units, ranges, gradient colors)
- Controls hazard visibility rules (Level 1.3 specific)
- Maintains global state overrides for scale calculations

**Global State Variables:**

- overrideSizeToNanometers - Custom function for current level's scale mapping
- currentLevelSizeBounds - Size range {min, max} for percentage calculations
- currentLevelNmBounds - Nanometer range {min, max} for UI labels
- ELEMENTS - Current active orb definitions array
-----
**Performance Optimizations**

**Implemented Optimizations**

1. **Delta State Updates**: Only transmit changed properties (60-80% bandwidth reduction)
1. **PIXI ParticleContainer**: GPU-optimized rendering for 300+ background stars
1. **Graphics Object Pooling**: Reuse PIXI.Graphics instances between frames
1. **Spatial Pre-checks**: Distance filtering before expensive collision calculations
1. **Debounced Events**: Window resize throttled to 100ms to prevent excessive redraws
1. **Level-Specific Rendering**: Only active level renders its unique content
1. **Hazard Visibility Culling**: Level 1.3 hazards hidden outside size range 27-119

**Performance Targets**

**Server Performance:**

- Target: 60 FPS (16.67ms per tick)
- CPU Usage: ~7% with 5 players + 6 bots
- Memory: ~69 MB steady state
- Network: ~10 KB/s per connected client

**Client Performance:**

- Target: 60 FPS rendering
- Hardware acceleration via PixiJS WebGL
- Smooth camera interpolation
- No memory leaks (tested for extended sessions)
-----
**Development Philosophy**

**Core Principles**

**Education First:** All gameplay mechanics serve the educational goal of understanding cosmic scale. Point thresholds are carefully calibrated to create meaningful learning moments.

**Server Authority:** All physics, collision detection, and game logic execute server-side to ensure fair play and prevent client-side manipulation.

**Progressive Enhancement:** Core gameplay works immediately, with visual effects and polish layered on top. The game remains functional even if advanced features fail.

**Modular Design:** Clear separation between server logic, client rendering, and game configuration allows independent development and testing of components.

**Performance Focus:** Optimizations (delta updates, object pooling, spatial culling) ensure smooth gameplay even on modest hardware.

-----
**Project Status**: Alpha - Core mechanics complete, Levels 1.1-3 fully implemented\
**Next Milestone**: Level 1.4 and Level 2 visual content, Great Attractor sequence polish\
**Target Audience**: Ages 12+ interested in space, science, and educational gaming\
**Technology Stack**: Node.js, Socket.IO, PixiJS, HTML5 Canvas

-----
*Documentation maintained by: ginkgo*\
*Last updated: October 5, 2025*

