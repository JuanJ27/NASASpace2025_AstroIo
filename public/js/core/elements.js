/**
 * Element Configuration System
 * Maps orb IDs to chemical elements with textures, colors, and point values
 */

const ELEMENTS = [
  { 
    key: 'H',   
    name: 'Hydrogen', 
    weight: 0.60, 
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
    points: 2.0,  
    textureKey: 'texHe', 
    src: '/assets/bola_morada.webp', 
    color: '#b37cff',
    miniColor: '#b37cff'
  },
  { 
    key: 'O',   
    name: 'Oxygen',   
    weight: 0.10, 
    points: 3.0,  
    textureKey: 'texO',  
    src: '/assets/bola_verde.webp',  
    color: '#7ce37c',
    miniColor: '#7ce37c'
  },
  { 
    key: 'C',   
    name: 'Carbon',  
    weight: 0.085,
    points: 4.0,  
    textureKey: 'texC',  
    src: '/assets/roca.webp',   
    color: '#9ea6ad',
    miniColor: '#9ea6ad'
  },
  { 
    key: 'Ne',  
    name: 'Neon',     
    weight: 0.065,
    points: 6.0,  
    textureKey: 'texNe', 
    src: '/assets/bola_roja.webp',   
    color: '#ff6b6b',
    miniColor: '#ff6b6b'
  }
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
window.CUM_WEIGHTS = CUM_WEIGHTS;
window.hash01 = hash01;
window.elementForOrb = elementForOrb;
window.getElementByKey = getElementByKey;
window.getElementTextureSources = getElementTextureSources;

console.log('✅ Elements module loaded');