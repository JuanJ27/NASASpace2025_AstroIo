/**
 * Element Configuration System
 * Maps orb IDs to chemical elements with textures, colors, and point values
 */

const ELEMENTS = [
  // Bolas de colores (comunes)
  { 
    key: 'H',   
    name: 'Hydrogen', 
    weight: 0.15, 
    points: 0.5,  
    textureKey: 'texH',  
    src: '/assets/bola_azul.webp',   
    color: '#4da6ff',
    miniColor: '#4da6ff'
  },
  { 
    key: 'He',  
    name: 'Helium',   
    weight: 0.15, 
    points: 1.0,  
    textureKey: 'texHe', 
    src: '/assets/bola_morada.webp', 
    color: '#b37cff',
    miniColor: '#b37cff'
  },
  { 
    key: 'O',   
    name: 'Oxygen',   
    weight: 0.15, 
    points: 1.0,  
    textureKey: 'texO',  
    src: '/assets/bola_verde.webp',  
    color: '#7ce37c',
    miniColor: '#7ce37c'
  },
  { 
    key: 'Ne',  
    name: 'Neon',     
    weight: 0.15,
    points: 1.0,  
    textureKey: 'texNe', 
    src: '/assets/bola_roja.webp',   
    color: '#ff6b6b',
    miniColor: '#ff6b6b'
  },
  { 
    key: 'Na',  
    name: 'Sodium',   
    weight: 0.10, 
    points: 1.5,  
    textureKey: 'texNa', 
    src: '/assets/bola_amarilla.webp', 
    color: '#ffd84a',
    miniColor: '#ffd84a'
  },
  
  // Minerales (menos comunes)
  { 
    key: 'Si',   
    name: 'Silicatos',  
    weight: 0.08,
    points: 2.0,  
    textureKey: 'texSi',  
    src: '/assets/silicatos.webp',   
    color: '#9ea6ad',
    miniColor: '#9ea6ad'
  },
  { 
    key: 'C',   
    name: 'Carbonaceo',  
    weight: 0.08,
    points: 2.5,  
    textureKey: 'texC',  
    src: '/assets/carbonaceo.webp',   
    color: '#7a7a7a',
    miniColor: '#7a7a7a'
  },
  { 
    key: 'Ice',  
    name: 'Ice Crystal',   
    weight: 0.06, 
    points: 3.0,  
    textureKey: 'texIce', 
    src: '/assets/bola_hielo.webp', 
    color: '#a3d9ff',
    miniColor: '#a3d9ff'
  },
  { 
    key: 'Fe',   
    name: 'Oxides',  
    weight: 0.05,
    points: 3.5,  
    textureKey: 'texFe',  
    src: '/assets/oxidos.webp',   
    color: '#c85a3d',
    miniColor: '#c85a3d'
  },
  
  // Asteroides (raros)
  { 
    key: 'AstC',   
    name: 'C-Type Asteroid',  
    weight: 0.02,
    points: 5.0,  
    textureKey: 'texAstC',  
    src: '/assets/asteroide_C.webp',   
    color: '#666666',
    miniColor: '#666666'
  },
  { 
    key: 'AstS',   
    name: 'S-Type Asteroid',  
    weight: 0.01,
    points: 7.0,  
    textureKey: 'texAstS',  
    src: '/assets/asteroide_S.webp',   
    color: '#a67c52',
    miniColor: '#a67c52'
  },
  { 
    key: 'AstM',   
    name: 'M-Type Asteroid',  
    weight: 0.005,
    points: 10.0,  
    textureKey: 'texAstM',  
    src: '/assets/asteroides_M.webp',   
    color: '#8c8c8c',
    miniColor: '#8c8c8c'
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

// Pre-calculate cumulative weights for weighted random selection
const CUM_WEIGHTS = (() => {
  let acc = 0;
  return ELEMENTS.map(e => (acc += e.weight));
})();

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
 * Determine element type for a given orb ID
 * Uses deterministic hash to ensure same orb always gets same element
 */
function elementForOrb(orbId) {
  const r = hash01(orbId || '');
  for (let i = 0; i < CUM_WEIGHTS.length; i++) {
    if (r <= CUM_WEIGHTS[i]) return ELEMENTS[i];
  }
  return ELEMENTS[ELEMENTS.length - 1];
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

// Export to window for global access
window.ELEMENTS = ELEMENTS;
window.ELEMENTS_L1 = ELEMENTS_L1;
window.ELEMENTS_L2 = ELEMENTS_L2;
window.CUM_WEIGHTS = CUM_WEIGHTS;
window.hash01 = hash01;
window.elementForOrb = elementForOrb;
window.getElementByKey = getElementByKey;
window.getElementTextureSources = getElementTextureSources;

console.log('✅ Elements module loaded');