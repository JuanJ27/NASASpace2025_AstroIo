/**
 * ============================================
 * CONFIGURACIÓN DE NIVELES CON SUBNIVELES
 * Nivel 1: 3 subniveles (Átomos, Granos, Asteroides)
 * Nivel 2: Galaxias (sin subniveles)
 * Nivel 3: Supercúmulo (sin subniveles)
 * ============================================
 */
const LEVELS_CONFIG = [
  // NIVEL 1 - SUBNIVEL 1: Átomos
  { 
    min: 2,   
    max: 13,  
    key: 'atomos',          
    name: 'Átomos', 
    clientLevel: 0, 
    level: 1,
    sublevel: 1,
    description: 'Å → µm (Átomos: H, He, O, C, Ne)'
  },
  // NIVEL 1 - SUBNIVEL 2: Granos de Polvo
  { 
    min: 14,  
    max: 26,  
    key: 'granos',             
    name: 'Granos de Polvo', 
    clientLevel: 1, 
    level: 1,
    sublevel: 2,
    description: 'µm → m (Silicatos, Carbonáceos, Hielo, Óxidos)'
  },
  // NIVEL 1 - SUBNIVEL 3: Asteroides
  { 
    min: 27,  
    max: 39, 
    key: 'asteroides',               
    name: 'Asteroides',       
    clientLevel: 2, 
    level: 1,
    sublevel: 3,
    description: 'm → Mm (Asteroides C, S, M)'
  },
  // Transición entre nivel 1 y 2 (sin contenido específico)
  { 
    min: 40,  
    max: 119, 
    key: 'transicion-sistema',               
    name: 'Sistema Solar',       
    clientLevel: 3, 
    level: 1,
    sublevel: 4,
    description: 'Formación del Sistema Solar'
  },
  // NIVEL 2: Galaxias
  { 
    min: 120, 
    max: 159, 
    key: 'galaxias',         
    name: 'Galaxias',       
    clientLevel: 4,
    level: 2,
    sublevel: 1,
    description: 'Kpc (Enanas, Cúmulos Globulares, Espirales)'
  },
  // NIVEL 3: Supercúmulo
  { 
    min: 160, 
    max: 200, 
    key: 'supercumulo', 
    name: 'Supercúmulo',   
    clientLevel: 5,
    level: 3,
    sublevel: 1,
    description: 'Mpc (Elípticas, BCG)'
  }
];

/**
 * Obtener información del nivel según el tamaño
 * @param {number} size - Tamaño del jugador
 * @returns {Object} Información del nivel
 */
function getLevelForSize(size) {
  for (let i = 0; i < LEVELS_CONFIG.length; i++) {
    const level = LEVELS_CONFIG[i];
    if (size >= level.min && size <= level.max) {
      return {
        ...level,
        range: `${level.min}-${level.max}`
      };
    }
  }
  
  // Más allá del último nivel
  return {
    min: 120,
    max: Infinity,
    key: 'beyond',
    name: 'Beyond Cluster',
    clientLevel: 5,
    range: '120+',
    description: 'Más allá del cúmulo de galaxias'
  };
}

/**
 * Obtener nivel por su clientLevel
 * @param {number} clientLevel - Número del nivel (0-5)
 * @returns {Object|null} Configuración del nivel
 */
function getLevelByClientLevel(clientLevel) {
  return LEVELS_CONFIG.find(l => l.clientLevel === clientLevel) || null;
}

/**
 * Obtener nivel por su key
 * @param {string} key - Key del nivel
 * @returns {Object|null} Configuración del nivel
 */
function getLevelByKey(key) {
  return LEVELS_CONFIG.find(l => l.key === key) || null;
}

// ============================================
// EXPORTACIÓN PARA NODE.JS (SERVIDOR)
// ============================================
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { 
    LEVELS_CONFIG, 
    getLevelForSize,
    getLevelByClientLevel,
    getLevelByKey
  };
}

// ============================================
// EXPORTACIÓN PARA NAVEGADOR (CLIENTE)
// ============================================
if (typeof window !== 'undefined') {
  window.LEVELS_CONFIG = LEVELS_CONFIG;
  window.getLevelForSize = getLevelForSize;
  window.getLevelByClientLevel = getLevelByClientLevel;
  window.getLevelByKey = getLevelByKey;
  
  console.log('✅ levels-config.js loaded');
  console.log('📊 Niveles disponibles:', LEVELS_CONFIG.length);
}