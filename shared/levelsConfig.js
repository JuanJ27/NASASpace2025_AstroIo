/**
 * ============================================
 * CONFIGURACIÓN CENTRALIZADA DE NIVELES
 * Compartida entre servidor y cliente
 * 
 * ⚠️ IMPORTANTE: Este archivo se usa tanto en Node.js como en el navegador
 * ============================================
 */

const LEVELS_CONFIG = [
  { 
    min: 0,//20, 
    max: 200,//39, 
    key: 'amns-micr', 
    name: 'Solar System 0.1',
    clientLevel: 0,
    description: 'Escala atómica a microscópica'
  },
  { 
    min: 200, 
    max: 400, 
    key: 'micr-m', 
    name: 'Solar System 0.2',
    clientLevel: 1,
    description: 'Escala microscópica a milimétrica'
  },
  { 
    min: 400, 
    max: 600, 
    key: 'm-Mm', 
    name: 'Solar System 0.3',
    clientLevel: 2,
    description: 'Escala milimétrica a megamétrica'
  },
  { 
    min: 600, 
    max: 800, 
    key: 'galaxy-Kpc', 
    name: 'Galaxy 0.1',
    clientLevel: 3,
    description: 'Escala galáctica (Kiloparsecs)'
  },
  { 
    min: 800, 
    max: 1000, 
    key: 'cluster-galaxy-Mpc', 
    name: 'Cluster Galaxy',
    clientLevel: 4,
    description: 'Cúmulo de galaxias (Megaparsecs)',
    customLevel: 'DarwinClusterLevel', // ← Tu nivel personalizado
    backgroundColor: 0x1a0033 // Púrpura oscuro
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