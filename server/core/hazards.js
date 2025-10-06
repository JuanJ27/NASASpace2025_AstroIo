// server/core/hazards.js
const { gameState, GAME_CONFIG } = require('./gameState');

const HZ = {
  active: false,               // << NEW: only run/spawn when active
  blackHole: null,             // {x,y,r}
  whiteHole: null,             // {x,y,r}
  asteroids: [],               // [{id,x,y,vx,vy,r}]
  _asteroidTimer: 0,
  _asteroidEveryMs: 5000,
  _nextAsteroidId: 1,
  whiteHoleUsedBy: new Set()   // one-use per player
};

function rand(min, max) { return Math.random() * (max - min) + min; }
function dist2(ax, ay, bx, by) { const dx=ax-bx, dy=ay-by; return dx*dx+dy*dy; }
function overlap(ax, ay, ar, bx, by, br) { return dist2(ax, ay, bx, by) < (ar+br)*(ar+br); }

function _resetHazardsState() {
  HZ.blackHole = null;
  HZ.whiteHole = null;
  HZ.asteroids.length = 0;
  HZ._asteroidTimer = 0;
  HZ._nextAsteroidId = 1;
  HZ.whiteHoleUsedBy.clear();
}

function _spawnStaticHoles() {
  const W = GAME_CONFIG.WORLD_WIDTH;
  const H = GAME_CONFIG.WORLD_HEIGHT;

  HZ.blackHole = {
    x: Math.round(rand(W*0.2, W*0.8)),
    y: Math.round(rand(H*0.2, H*0.8)),
    r: 24
  };
  HZ.whiteHole = {
    x: Math.round(rand(W*0.2, W*0.8)),
    y: Math.round(rand(H*0.2, H*0.8)),
    r: 20
  };
}

function enableHazardsForLevel3() {
  if (HZ.active) return;
  HZ.active = true;
  _resetHazardsState();
  _spawnStaticHoles();
}

function disableHazards() {
  if (!HZ.active) return;
  HZ.active = false;
  _resetHazardsState();
}

function areHazardsActive() { return HZ.active; }

function _spawnAsteroidFromCorner() {
  const W = GAME_CONFIG.WORLD_WIDTH;
  const H = GAME_CONFIG.WORLD_HEIGHT;

  const corners = [
    { x: 0, y: 0 },
    { x: W, y: 0 },
    { x: 0, y: H },
    { x: W, y: H }
  ];
  const c = corners[Math.floor(Math.random()*corners.length)];

  const tx = rand(0, W);
  const ty = rand(0, H);
  let dx = tx - c.x, dy = ty - c.y;
  const len = Math.hypot(dx, dy) || 1;
  dx /= len; dy /= len;

  const speed = rand(2.5, 7.5)//rand(7.5, 11.5); // fast
  const r = rand(10, 16);

  HZ.asteroids.push({
    id: HZ._nextAsteroidId++,
    x: c.x, y: c.y,
    vx: dx * speed, vy: dy * speed,
    r
  });
}

function _tickAsteroids(dtMs) {
  const W = GAME_CONFIG.WORLD_WIDTH;
  const H = GAME_CONFIG.WORLD_HEIGHT;

  for (const a of HZ.asteroids) {
    a.x += a.vx * (dtMs/16.67);
    a.y += a.vy * (dtMs/16.67);
  }
  const pad = 50;
  HZ.asteroids = HZ.asteroids.filter(a => a.x>-pad && a.x<W+pad && a.y>-pad && a.y<H+pad);
}

function updateHazards(dtMs, io) {
  if (!HZ.active) return;

  // spawn cadence
  HZ._asteroidTimer += dtMs;
  if (HZ._asteroidTimer >= HZ._asteroidEveryMs) {
    HZ._asteroidTimer = 0;
    _spawnAsteroidFromCorner();
  }

  _tickAsteroids(dtMs);

  // collisions
  const players = Object.values(gameState.players);
  for (const p of players) {
    if (!p.isAlive) continue;

    // black hole (kill)
    if (HZ.blackHole && overlap(p.x, p.y, p.size, HZ.blackHole.x, HZ.blackHole.y, HZ.blackHole.r)) {
      p.isAlive = false;
      if (!p.isBot && io) {
        io.to(p.id).emit('gameOver', {
          message: 'You were swallowed by a black hole!',
          killedBy: 'Black Hole',
          finalSize: Math.floor(p.size)
        });
      }
      continue;
    }

    // white hole (one-use teleport)
    if (HZ.whiteHole && !HZ.whiteHoleUsedBy.has(p.id) &&
        overlap(p.x, p.y, p.size, HZ.whiteHole.x, HZ.whiteHole.y, HZ.whiteHole.r)) {
      p.x = Math.round(rand(0, GAME_CONFIG.WORLD_WIDTH));
      p.y = Math.round(rand(0, GAME_CONFIG.WORLD_HEIGHT));
      HZ.whiteHoleUsedBy.add(p.id);
      if (io) io.to(p.id).emit('whiteHoleUsed', { to: { x: p.x, y: p.y } });
    }
  }

  // asteroid hits: halve size and remove asteroid
  const toRemove = new Set();
  for (const a of HZ.asteroids) {
    for (const p of players) {
      if (!p.isAlive) continue;
      if (overlap(a.x, a.y, a.r, p.x, p.y, p.size)) {
        p.size = Math.max(1, p.size * 0.5);
        toRemove.add(a.id);
      }
    }
  }
  if (toRemove.size) {
    HZ.asteroids = HZ.asteroids.filter(a => !toRemove.has(a.id));
  }
}

function getHazardsSnapshot() {
  if (!HZ.active) {
    return { blackHole: null, whiteHole: null, asteroids: [] };
  }
  return {
    blackHole: HZ.blackHole ? { x: HZ.blackHole.x, y: HZ.blackHole.y, r: HZ.blackHole.r } : null,
    whiteHole: HZ.whiteHole ? { x: HZ.whiteHole.x, y: HZ.whiteHole.y, r: HZ.whiteHole.r } : null,
    asteroids: HZ.asteroids.map(a => ({ id: a.id, x: a.x, y: a.y, r: a.r }))
  };
}

module.exports = {
  enableHazardsForLevel3,   
  disableHazards,
  areHazardsActive,
  updateHazards,
  getHazardsSnapshot
};
