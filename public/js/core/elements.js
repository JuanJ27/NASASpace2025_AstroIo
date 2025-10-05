/**
 * ============================================
 * SISTEMA DE ELEMENTOS POR NIVELES Y SUBNIVELES
 * Organizado según la progresión del juego
 * ============================================
 */

const ELEMENTS = [
  // ========================================
  // NIVEL 1 - SUBNIVEL 1: ÁTOMOS (Å → µm)
  // Size range: 2-13
  // ========================================
  { 
    key: 'H',   
    name: 'Hidrógeno', 
    level: 1,
    sublevel: 1,
    sizeMin: 2,
    sizeMax: 13,
    weight: 0.60, 
    points: 0.5,  
    textureKey: 'texH',  
    src: '/assets/bola_azul.webp',   
    color: '#4da6ff',
    miniColor: '#4da6ff',
    visualScale: 1.0
  },
  { 
    key: 'He',  
    name: 'Helio',   
    level: 1,
    sublevel: 1,
    sizeMin: 2,
    sizeMax: 13,
    weight: 0.15, 
    points: 2.0,  
    textureKey: 'texHe', 
    src: '/assets/bola_morada.webp', 
    color: '#b37cff',
    miniColor: '#b37cff',
    visualScale: 1.0
  },
  { 
    key: 'O',   
    name: 'Oxígeno',   
    level: 1,
    sublevel: 1,
    sizeMin: 2,
    sizeMax: 13,
    weight: 0.10, 
    points: 3.0,  
    textureKey: 'texO',  
    src: '/assets/bola_verde.webp',  
    color: '#7ce37c',
    miniColor: '#7ce37c',
    visualScale: 1.0
  },
  { 
    key: 'C',  
    name: 'Carbono',     
    level: 1,
    sublevel: 1,
    sizeMin: 2,
    sizeMax: 13,
    weight: 0.085,
    points: 4.0,  
    textureKey: 'texC', 
    src: '/assets/carbonaceo.webp',   
    color: '#7a7a7a',
    miniColor: '#7a7a7a',
    visualScale: 1.0
  },
  { 
    key: 'Ne',  
    name: 'Neón',   
    level: 1,
    sublevel: 1,
    sizeMin: 2,
    sizeMax: 13,
    weight: 0.065, 
    points: 7.0,  
    textureKey: 'texNe', 
    src: '/assets/bola_roja.webp', 
    color: '#ff6b6b',
    miniColor: '#ff6b6b',
    visualScale: 1.0
  },
  
  // ========================================
  // NIVEL 1 - SUBNIVEL 2: GRANOS DE POLVO (µm → m)
  // Size range: 14-26
  // ========================================
  { 
    key: 'Si',   
    name: 'Silicatos',  
    level: 1,
    sublevel: 2,
    sizeMin: 14,
    sizeMax: 26,
    weight: 0.60,
    points: 2.0,  
    textureKey: 'texSi',  
    src: '/assets/silicatos.webp',   
    color: '#8E8C6A',
    miniColor: '#8E8C6A',
    visualScale: 2.0
  },
  { 
    key: 'Carb',   
    name: 'Carbonáceos',  
    level: 1,
    sublevel: 2,
    sizeMin: 14,
    sizeMax: 26,
    weight: 0.20,
    points: 3.0,  
    textureKey: 'texCarb',  
    src: '/assets/carbonaceo.webp',   
    color: '#b37cff',
    miniColor: '#b37cff',
    visualScale: 2.0
  },
  { 
    key: 'Ice',  
    name: 'Mantos de Hielo',   
    level: 1,
    sublevel: 2,
    sizeMin: 14,
    sizeMax: 26,
    weight: 0.12, 
    points: 4.0,  
    textureKey: 'texIce', 
    src: '/assets/bola_hielo.webp', 
    color: '#A6D8FF',
    miniColor: '#A6D8FF',
    visualScale: 2.0
  },
  { 
    key: 'Fe',   
    name: 'Óxidos Metálicos',  
    level: 1,
    sublevel: 2,
    sizeMin: 14,
    sizeMax: 26,
    weight: 0.08,
    points: 5.0,  
    textureKey: 'texFe',  
    src: '/assets/oxidos.webp',   
    color: '#A67C00',
    miniColor: '#A67C00',
    visualScale: 2.0
  },
  
  // ========================================
  // NIVEL 1 - SUBNIVEL 3: ASTEROIDES (m → Mm)
  // Size range: 27-39
  // ========================================
  { 
    key: 'AstC',   
    name: 'Asteroide Tipo C',  
    level: 1,
    sublevel: 3,
    sizeMin: 27,
    sizeMax: 39,
    weight: 0.50,
    points: 5.0,  
    textureKey: 'texAstC',  
    src: '/assets/asteroide_C.webp',   
    color: '#2B2B2B',
    miniColor: '#2B2B2B',
    visualScale: 5.0
  },
  { 
    key: 'AstS',   
    name: 'Asteroide Tipo S',  
    level: 1,
    sublevel: 3,
    sizeMin: 27,
    sizeMax: 39,
    weight: 0.30,
    points: 7.0,  
    textureKey: 'texAstS',  
    src: '/assets/asteroide_S.webp',   
    color: '#8E8C6A',
    miniColor: '#8E8C6A',
    visualScale: 5.0
  },
  { 
    key: 'AstM',   
    name: 'Asteroide Tipo M',  
    level: 1,
    sublevel: 3,
    sizeMin: 27,
    sizeMax: 39,
    weight: 0.20,
    points: 10.0,  
    textureKey: 'texAstM',  
    src: '/assets/asteroides_M.webp',   
    color: '#B5B5B5',
    miniColor: '#B5B5B5',
    visualScale: 5.0
  },
  
  // ========================================
  // NIVEL 2: GALAXIAS Y CÚMULOS (Kpc)
  // Size range: 120-159
  // ========================================
  { 
    key: 'DwarfIrr',   
    name: 'Enana Irregular',  
    level: 2,
    sublevel: 1,
    sizeMin: 120,
    sizeMax: 159,
    weight: 0.40,
    points: 15.0,  
    textureKey: 'texDwarfIrr',  
    src: '/assets/enana_irregular.webp',   
    color: '#62B0FF',
    miniColor: '#62B0FF',
    visualScale: 3.0
  },
  { 
    key: 'GasCloud',   
    name: 'Nube de Gas Frío',  
    level: 2,
    sublevel: 1,
    sizeMin: 120,
    sizeMax: 159,
    weight: 0.20,
    points: 20.0,  
    textureKey: 'texGasCloud',  
    src: '/assets/nube_gas_frio.webp',   
    color: '#7FEAE0',
    miniColor: '#7FEAE0',
    visualScale: 3.0
  },
  { 
    key: 'DwarfSph',   
    name: 'Enana Esferoidal',  
    level: 2,
    sublevel: 1,
    sizeMin: 120,
    sizeMax: 159,
    weight: 0.20,
    points: 25.0,  
    textureKey: 'texDwarfSph',  
    src: '/assets/enana_esferica.webp',   
    color: '#B5835A',
    miniColor: '#B5835A',
    visualScale: 3.0
  },
  { 
    key: 'SmallSpiral',   
    name: 'Pequeña Espiral',  
    level: 2,
    sublevel: 1,
    sizeMin: 120,
    sizeMax: 159,
    weight: 0.10,
    points: 30.0,  
    textureKey: 'texSmallSpiral',  
    src: '/assets/pequeña_espiral.webp',   
    color: '#9AA3A7',
    miniColor: '#9AA3A7',
    visualScale: 4.0
  },
  { 
    key: 'GlobCluster',   
    name: 'Cúmulo Globular',  
    level: 2,
    sublevel: 1,
    sizeMin: 120,
    sizeMax: 159,
    weight: 0.10,
    points: 35.0,  
    textureKey: 'texGlobCluster',  
    src: '/assets/cumulo_glubular.webp',   
    color: '#F2E6A7',
    miniColor: '#F2E6A7',
    visualScale: 4.0
  },
  
  // ========================================
  // NIVEL 3: SUPERCÚMULO (Mpc)
  // Size range: 160-200
  // ========================================
  { 
    key: 'EllipInt',   
    name: 'Elíptica Intermedia',  
    level: 3,
    sublevel: 1,
    sizeMin: 160,
    sizeMax: 200,
    weight: 0.60,
    points: 40.0,  
    textureKey: 'texEllipInt',  
    src: '/assets/galaxia_01.webp',   
    color: '#CFA27E',
    miniColor: '#CFA27E',
    visualScale: 4.0
  },
  { 
    key: 'EllipGiant',   
    name: 'Elíptica Gigante',  
    level: 3,
    sublevel: 1,
    sizeMin: 160,
    sizeMax: 200,
    weight: 0.30,
    points: 50.0,  
    textureKey: 'texEllipGiant',  
    src: '/assets/galaxia_02.webp',   
    color: '#D9B38C',
    miniColor: '#D9B38C',
    visualScale: 5.0
  },
  { 
    key: 'BCG',   
    name: 'BCG/cD Galaxy',  
    level: 3,
    sublevel: 1,
    sizeMin: 160,
    sizeMax: 200,
    weight: 0.10,
    points: 70.0,  
    textureKey: 'texBCG',  
    src: '/assets/galaxia_03.webp',   
    color: '#E8D6B3',
    miniColor: '#E8D6B3',
    visualScale: 6.0
  }
];

const ELEMENTS_L1 = [
  { key:'Si', name:'Silicatos', weight:0.50, points:0.5, textureKey:'texSilicatos', src:'/assets/silicatos.webp', color:'#a08f6c', miniColor:'#a08f6c' },
  { key:'Cb', name:'Carbonáceos', weight:0.20, points:2.0, textureKey:'texCarbonaceo', src:'/assets/carbonaceo.webp', color:'#3b3b3b', miniColor:'#3b3b3b' },
  { key:'Hi', name:'Mantos de Hielo', weight:0.12, points:5.0, textureKey:'texHielo', src:'/assets/bola_hielo.webp', color:'#9adfff', miniColor:'#9adfff' },
  { key:'Ox', name:'Óxidos y sulfuros', weight:0.18, points:3.0, textureKey:'texOxidos', src:'/assets/oxidos.webp', color:'#8a9aa5', miniColor:'#8a9aa5' }
];

// L2: Asteroides C / S / M
const ELEMENTS_L2 = [
  { key:'AC', name:'Asteroide C', weight:0.50, points:1.0, textureKey:'texAstC', src:'/assets/asteroide_C.webp', color:'#7f8c8d', miniColor:'#7f8c8d' },
  { key:'AS', name:'Asteroide S', weight:0.30, points:2.0, textureKey:'texAstS', src:'/assets/asteroide_S.webp', color:'#c0a16b', miniColor:'#c0a16b' },
  { key:'AM', name:'Asteroide M', weight:0.20, points:4.0, textureKey:'texAstM', src:'/assets/asteroides_M.webp', color:'#a7a7a7', miniColor:'#a7a7a7' }
];

/**
 * ============================================
 * FUNCIONES DE SELECCIÓN DE ELEMENTOS
 * ============================================
 */

/**
 * Simple hash function to convert string to 0-1 range
 */
function hash01(str) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return (h >>> 0) / 4294967296;
}

/**
 * Obtener elementos disponibles según el tamaño del jugador
 * @param {number} playerSize - Tamaño actual del jugador
 * @returns {Array} Array de elementos disponibles
 */
function getAvailableElements(playerSize) {
  // NIVEL 1 - Subnivel 1: Átomos (2-13)
  if (playerSize >= 2 && playerSize < 14) {
    return ELEMENTS.filter(e => e.level === 1 && e.sublevel === 1);
  }
  // NIVEL 1 - Subnivel 2: Granos de polvo (14-26)
  else if (playerSize >= 14 && playerSize < 27) {
    return ELEMENTS.filter(e => e.level === 1 && e.sublevel === 2);
  }
  // NIVEL 1 - Subnivel 3: Asteroides (27-39)
  else if (playerSize >= 27 && playerSize < 40) {
    return ELEMENTS.filter(e => e.level === 1 && e.sublevel === 3);
  }
  // NIVEL 2: Galaxias y cúmulos (120-159)
  else if (playerSize >= 120 && playerSize < 160) {
    return ELEMENTS.filter(e => e.level === 2);
  }
  // NIVEL 3: Supercúmulo (160-200)
  else if (playerSize >= 160 && playerSize <= 200) {
    return ELEMENTS.filter(e => e.level === 3);
  }
  
  // Por defecto: átomos del nivel 1
  return ELEMENTS.filter(e => e.level === 1 && e.sublevel === 1);
}

/**
 * Pre-calcular pesos acumulados para un conjunto de elementos
 */
function calculateCumulativeWeights(elements) {
  let acc = 0;
  return elements.map(e => (acc += e.weight));
}

/**
 * Determine element type for a given orb ID based on player size
 * Uses deterministic hash to ensure same orb always gets same element
 * @param {string} orbId - ID del orbe
 * @param {number} playerSize - Tamaño del jugador más grande (para determinar nivel)
 * @returns {Object} Elemento seleccionado
 */
function elementForOrb(orbId, playerSize = 10) {
  const availableElements = getAvailableElements(playerSize);
  
  if (availableElements.length === 0) {
    console.warn('No elements available for player size:', playerSize);
    return ELEMENTS[0]; // Fallback al primer elemento
  }
  
  const cumWeights = calculateCumulativeWeights(availableElements);
  const r = hash01(orbId || '');
  
  for (let i = 0; i < cumWeights.length; i++) {
    if (r <= cumWeights[i]) {
      return availableElements[i];
    }
  }
  
  return availableElements[availableElements.length - 1];
}

/**
 * Get element by key
 */
function getElementByKey(key) {
  return ELEMENTS.find(e => e.key === key);
}

/**
 * Get all element texture sources for preloading
 */
function getElementTextureSources() {
  return ELEMENTS.map(e => ({ key: e.textureKey, src: e.src }));
}

/**
 * Obtener información del nivel/subnivel según el tamaño
 */
function getLevelInfoBySize(size) {
  if (size >= 2 && size < 14) {
    return { level: 1, sublevel: 1, name: 'Átomos', range: 'Å → µm' };
  } else if (size >= 14 && size < 27) {
    return { level: 1, sublevel: 2, name: 'Granos de Polvo', range: 'µm → m' };
  } else if (size >= 27 && size < 40) {
    return { level: 1, sublevel: 3, name: 'Asteroides', range: 'm → Mm' };
  } else if (size >= 120 && size < 160) {
    return { level: 2, sublevel: 1, name: 'Galaxias', range: 'Kpc' };
  } else if (size >= 160 && size <= 200) {
    return { level: 3, sublevel: 1, name: 'Supercúmulo', range: 'Mpc' };
  }
  
  return { level: 1, sublevel: 1, name: 'Átomos', range: 'Å → µm' };
}

// Export to window for global access
window.ELEMENTS = ELEMENTS;
window.hash01 = hash01;
window.elementForOrb = elementForOrb;
window.getElementByKey = getElementByKey;
window.getElementTextureSources = getElementTextureSources;
window.getAvailableElements = getAvailableElements;
window.calculateCumulativeWeights = calculateCumulativeWeights;
window.getLevelInfoBySize = getLevelInfoBySize;

console.log('✅ Elements module loaded with level-based progression');
console.log(`📊 Total elements: ${ELEMENTS.length}`);
console.log('  - Nivel 1 Subnivel 1 (Átomos): 5 elementos');
console.log('  - Nivel 1 Subnivel 2 (Granos): 4 elementos');
console.log('  - Nivel 1 Subnivel 3 (Asteroides): 3 elementos');
console.log('  - Nivel 2 (Galaxias): 5 elementos');
console.log('  - Nivel 3 (Supercúmulo): 3 elementos');