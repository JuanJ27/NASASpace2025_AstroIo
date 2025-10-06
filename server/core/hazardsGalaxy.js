/**
 * ============================================
 * HAZARDS PARA NIVEL 3: GALAXIAS
 * Agujero Negro Supermasivo con MOVIMIENTO ORBITAL
 * ============================================
 */

const { GAME_CONFIG, gameState } = require('./gameState');
const { LEVELS_CONFIG } = require('../../shared/levelsConfig');

function getBand(filter) {
  const row = LEVELS_CONFIG.find(e =>
    Object.entries(filter).every(([k, v]) => e[k] === v)
  );
  return row ? { min: row.min, max: row.max } : null;
}

const GALAXY_HAZARD_RANGE =
  getBand({ level: 2, sublevel: 1 }) ||
  getBand({ clientLevel: 4 }) ||
  { min: 120, max: 159 };

// Estado de hazards para nivel galaxias
let galaxyHazardsActive = false;

const galaxyHazards = {
  superMassiveBlackHole: null,
  quasar: null,
  darkMatter: []
};

// Configuración de movimiento orbital
const ORBITAL_CONFIG = {
  // Centro de la órbita (centro del mundo)
  centerX: GAME_CONFIG.WORLD_WIDTH * 0.5,
  centerY: GAME_CONFIG.WORLD_HEIGHT * 0.5,
  
  // Radio de órbita (distancia desde el centro)
  orbitRadius: 400,
  
  // Velocidad angular (radianes por segundo)
  angularSpeed: 0.0003, // Muy lento (1 vuelta completa ≈ 35 minutos)
  
  // Ángulo inicial
  initialAngle: 0,
  
  // Patrón de movimiento: 'circular', 'elliptical', 'spiral', 'figure8'
  pattern: 'elliptical'
};

/**
 * Inicializar hazards de galaxias
 */
function enableGalaxyHazards() {
  if (galaxyHazardsActive) return;
  
  console.log('🌌 ========================================');
  console.log('🌌 GALAXY HAZARDS ENABLED');
  console.log('🌌 Supermassive Black Hole: ORBITAL MOVEMENT');
  console.log('🌌 ========================================');
  
  galaxyHazardsActive = true;
  
  const W = GAME_CONFIG.WORLD_WIDTH;
  const H = GAME_CONFIG.WORLD_HEIGHT;
  
  // Agujero Negro Supermasivo (EN MOVIMIENTO)
  galaxyHazards.superMassiveBlackHole = {
    // Posición inicial (será actualizada en cada frame)
    x: ORBITAL_CONFIG.centerX + ORBITAL_CONFIG.orbitRadius,
    y: ORBITAL_CONFIG.centerY,
    
    // Radio de influencia
    r: 80,
    pullStrength: 0.15,
    killRadius: 70,
    
    // Variables de movimiento orbital
    orbitAngle: ORBITAL_CONFIG.initialAngle,
    orbitSpeed: ORBITAL_CONFIG.angularSpeed,
    orbitCenterX: ORBITAL_CONFIG.centerX,
    orbitCenterY: ORBITAL_CONFIG.centerY,
    orbitRadiusX: ORBITAL_CONFIG.orbitRadius,
    orbitRadiusY: ORBITAL_CONFIG.orbitRadius * 0.6,
    pattern: ORBITAL_CONFIG.pattern,
    
    // Velocidad actual (para efectos visuales)
    vx: 0,
    vy: 0
  };
  
  // Quasar (TAMBIÉN EN MOVIMIENTO, órbita opuesta)
  galaxyHazards.quasar = {
    x: W * 0.75,
    y: H * 0.25,
    r: 50,
    pushStrength: 0.25,
    rotationAngle: 0,
    
    // Movimiento orbital opuesto
    orbitAngle: Math.PI, // 180° desfasado del agujero negro
    orbitSpeed: ORBITAL_CONFIG.angularSpeed * 1.5, // Más rápido
    orbitCenterX: ORBITAL_CONFIG.centerX,
    orbitCenterY: ORBITAL_CONFIG.centerY,
    orbitRadiusX: 300,
    orbitRadiusY: 200,
    pattern: 'circular',
    vx: 0,
    vy: 0
  };
  
  // Nubes de Materia Oscura (DERIVAN lentamente)
  galaxyHazards.darkMatter = [];
  for (let i = 0; i < 5; i++) {
    galaxyHazards.darkMatter.push({
      id: `dark_${i}`,
      x: Math.random() * W,
      y: Math.random() * H,
      r: 60,
      slowFactor: 0.5,
      
      // Deriva aleatoria (muy lenta)
      driftVx: (Math.random() - 0.5) * 0.05,
      driftVy: (Math.random() - 0.5) * 0.05
    });
  }
  
  console.log('✅ Galaxy hazards initialized with ORBITAL MOVEMENT');
  console.log(`   - Black Hole orbit: ${ORBITAL_CONFIG.pattern}, radius: ${ORBITAL_CONFIG.orbitRadius}`);
  console.log(`   - Quasar orbit: circular, radius: 300`);
  console.log(`   - ${galaxyHazards.darkMatter.length} Dark Matter clouds (drifting)`);
}

/**
 * Desactivar hazards de galaxias
 */
function disableGalaxyHazards() {
  if (!galaxyHazardsActive) return;
  
  galaxyHazardsActive = false;
  galaxyHazards.superMassiveBlackHole = null;
  galaxyHazards.quasar = null;
  galaxyHazards.darkMatter = [];
  
  console.log('🌌 Galaxy hazards DISABLED');
}

/**
 * Calcular posición orbital según patrón
 */
function calculateOrbitalPosition(hazard, dt) {
  // Incrementar ángulo orbital
  hazard.orbitAngle += hazard.orbitSpeed * (dt / 16.67); // Normalizado a 60 FPS
  
  // Mantener ángulo en rango [0, 2π]
  if (hazard.orbitAngle > Math.PI * 2) {
    hazard.orbitAngle -= Math.PI * 2;
  }
  
  let newX, newY;
  const angle = hazard.orbitAngle;
  const cx = hazard.orbitCenterX;
  const cy = hazard.orbitCenterY;
  const rx = hazard.orbitRadiusX;
  const ry = hazard.orbitRadiusY;
  
  switch (hazard.pattern) {
    case 'circular':
      newX = cx + rx * Math.cos(angle);
      newY = cy + rx * Math.sin(angle);
      break;
      
    case 'elliptical':
      newX = cx + rx * Math.cos(angle);
      newY = cy + ry * Math.sin(angle);
      break;
      
    case 'spiral':
      const spiralRadius = rx * (0.8 + 0.2 * Math.sin(angle * 3));
      newX = cx + spiralRadius * Math.cos(angle);
      newY = cy + spiralRadius * Math.sin(angle);
      break;
      
    case 'figure8':
      newX = cx + rx * Math.sin(angle * 2);
      newY = cy + ry * Math.sin(angle);
      break;
      
    default:
      newX = cx + rx * Math.cos(angle);
      newY = cy + ry * Math.sin(angle);
  }
  
  // Calcular velocidad (para efectos visuales)
  const prevX = hazard.x;
  const prevY = hazard.y;
  hazard.vx = (newX - prevX) / (dt / 16.67);
  hazard.vy = (newY - prevY) / (dt / 16.67);
  
  // Actualizar posición
  hazard.x = newX;
  hazard.y = newY;
}

/**
 * Actualizar hazards de galaxias (física + interacciones + MOVIMIENTO)
 */
function updateGalaxyHazards(dt, io) {
  if (!galaxyHazardsActive) return;
  
  const players = Object.values(gameState.players);
  const bh = galaxyHazards.superMassiveBlackHole;
  const quasar = galaxyHazards.quasar;
  
  // ========== ACTUALIZAR MOVIMIENTO DE HAZARDS ==========
  
  // 1. Mover Agujero Negro Supermasivo (órbita elíptica)
  if (bh) {
    calculateOrbitalPosition(bh, dt);
  }
  
  // 2. Mover Quasar (órbita circular opuesta)
  if (quasar) {
    calculateOrbitalPosition(quasar, dt);
    
    // Actualizar rotación de chorros
    quasar.rotationAngle += 0.01;
    if (quasar.rotationAngle > Math.PI * 2) {
      quasar.rotationAngle -= Math.PI * 2;
    }
  }
  
  // 3. Mover Nubes de Materia Oscura (deriva lenta)
  galaxyHazards.darkMatter.forEach(cloud => {
    cloud.x += cloud.driftVx * (dt / 16.67);
    cloud.y += cloud.driftVy * (dt / 16.67);
    
    // Wrap around edges (toroidal world)
    const W = GAME_CONFIG.WORLD_WIDTH;
    const H = GAME_CONFIG.WORLD_HEIGHT;
    
    if (cloud.x < 0) cloud.x += W;
    if (cloud.x > W) cloud.x -= W;
    if (cloud.y < 0) cloud.y += H;
    if (cloud.y > H) cloud.y -= H;
  });
  
  // ========== APLICAR EFECTOS A JUGADORES ==========
  
  players.forEach(player => {
    if (!player.isAlive) return;

    const inGalBand =
      player.size >= GALAXY_HAZARD_RANGE.min &&
      player.size <= GALAXY_HAZARD_RANGE.max;

    if (!inGalBand) return; // ← prevents “hidden” galaxy BH from touching others
    
    // 1. Agujero Negro Supermasivo (atracción gravitacional + movimiento)
    if (bh) {
      const dx = bh.x - player.x;
      const dy = bh.y - player.y;
      const dist = Math.hypot(dx, dy);
      
      // Muerte instantánea si entra en el horizonte de eventos
      if (dist < bh.killRadius) {
        player.isAlive = false;
        console.log(`💀 ${player.name} was consumed by the Supermassive Black Hole (moving)`);
        
        io.to(player.id).emit('gameOver', {
          message: 'Consumed by Supermassive Black Hole',
          finalSize: Math.floor(player.size),
          killedBy: 'galaxy_black_hole_moving'
        });
        return;
      }
      
      // Atracción gravitacional (1/r² law)
      if (dist < bh.r * 4) {
        const force = bh.pullStrength * (1 / Math.max(1, dist * dist / 1000));
        player.vx = (player.vx || 0) + (dx / dist) * force * dt;
        player.vy = (player.vy || 0) + (dy / dist) * force * dt;
      }
      
      // Frame dragging (arrastre rotacional cerca del horizonte)
      if (dist < bh.r * 2) {
        const dragFactor = 0.05 * (1 - dist / (bh.r * 2));
        player.vx = (player.vx || 0) + bh.vx * dragFactor;
        player.vy = (player.vy || 0) + bh.vy * dragFactor;
      }
    }
    
    // 2. Quasar (repulsión + empuje por movimiento)
    if (quasar) {
      const dx = player.x - quasar.x;
      const dy = player.y - quasar.y;
      const dist = Math.hypot(dx, dy);
      
      if (dist < quasar.r * 2.5) {
        const force = quasar.pushStrength * (1 / Math.max(1, dist / 50));
        player.vx = (player.vx || 0) + (dx / dist) * force * dt;
        player.vy = (player.vy || 0) + (dy / dist) * force * dt;
        
        if (dist < quasar.r * 1.5) {
          player.vx = (player.vx || 0) + quasar.vx * 0.1;
          player.vy = (player.vy || 0) + quasar.vy * 0.1;
        }
      }
    }
    
    // 3. Materia Oscura (slowdown + deriva)
    galaxyHazards.darkMatter.forEach(cloud => {
      const dx = player.x - cloud.x;
      const dy = player.y - cloud.y;
      const dist = Math.hypot(dx, dy);
      
      if (dist < cloud.r) {
        player.vx = (player.vx || 0) * cloud.slowFactor;
        player.vy = (player.vy || 0) * cloud.slowFactor;
        
        player.vx += cloud.driftVx * 0.3;
        player.vy += cloud.driftVy * 0.3;
      }
    });
  });
}

/**
 * Obtener snapshot de hazards para enviar al cliente
 */
function getGalaxyHazardsSnapshot() {
  if (!galaxyHazardsActive) {
    return { active: false };
  }
  
  return {
    active: true,
    superMassiveBlackHole: galaxyHazards.superMassiveBlackHole ? {
      x: galaxyHazards.superMassiveBlackHole.x,
      y: galaxyHazards.superMassiveBlackHole.y,
      r: galaxyHazards.superMassiveBlackHole.r,
      pullStrength: galaxyHazards.superMassiveBlackHole.pullStrength,
      killRadius: galaxyHazards.superMassiveBlackHole.killRadius,
      vx: galaxyHazards.superMassiveBlackHole.vx,
      vy: galaxyHazards.superMassiveBlackHole.vy
    } : null,
    quasar: galaxyHazards.quasar ? {
      x: galaxyHazards.quasar.x,
      y: galaxyHazards.quasar.y,
      r: galaxyHazards.quasar.r,
      pushStrength: galaxyHazards.quasar.pushStrength,
      rotationAngle: galaxyHazards.quasar.rotationAngle,
      vx: galaxyHazards.quasar.vx,
      vy: galaxyHazards.quasar.vy
    } : null,
    darkMatter: galaxyHazards.darkMatter.map(cloud => ({
      id: cloud.id,
      x: cloud.x,
      y: cloud.y,
      r: cloud.r,
      slowFactor: cloud.slowFactor
    }))
  };
}

/**
 * Verificar si hazards están activos
 */
function areGalaxyHazardsActive() {
  return galaxyHazardsActive;
}

/**
 * Cambiar patrón de movimiento del agujero negro (opcional, para debug/testing)
 */
function setBlackHolePattern(pattern) {
  if (galaxyHazards.superMassiveBlackHole) {
    galaxyHazards.superMassiveBlackHole.pattern = pattern;
    console.log(`🌌 Black Hole pattern changed to: ${pattern}`);
  }
}

module.exports = {
  enableGalaxyHazards,
  disableGalaxyHazards,
  updateGalaxyHazards,
  getGalaxyHazardsSnapshot,
  areGalaxyHazardsActive,
  setBlackHolePattern
};