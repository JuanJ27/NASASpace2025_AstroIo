/**
 * AstroIo - Enhanced Combat Test Client
 * Tests: Player vs player combat, elimination, aggressive AI
 * Duration: 45 seconds with 5 AI players
 */

const io = require('socket.io-client');
const fs = require('fs');
const path = require('path');

// Logging utility
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [TEST-COMBAT] [${type.toUpperCase()}] ${message}`;
  console.log(logMessage);
  
  // Append to test.log
  try {
    fs.appendFileSync(path.join(__dirname, 'test.log'), logMessage + '\n');
  } catch (error) {
    console.error('Error writing to log:', error);
  }
}

class CombatTestClient {
  constructor(name, delay = 0) {
    this.name = name;
    this.playerId = null;
    this.playerData = null;
    this.allPlayers = {};
    this.connected = false;
    this.gameOver = false;
    this.orbsEaten = 0;
    this.playersEaten = 0;
    this.initialSize = 20;
    this.startTime = null;
    this.strategy = 'aggressive'; // aggressive, defensive, or opportunistic
    
    setTimeout(() => {
      this.connect();
    }, delay);
  }

  connect() {
    log(`${this.name} connecting to server (${this.strategy} mode)...`);
    this.socket = io('http://localhost:3000');

    this.socket.on('connect', () => {
      log(`${this.name} connected with socket ID: ${this.socket.id}`);
      this.connected = true;
      this.socket.emit('setName', this.name);
    });

    this.socket.on('init', (data) => {
      this.playerId = data.playerId;
      this.playerData = { x: data.x || 0, y: data.y || 0, size: this.initialSize }; // Initial placeholder
      this.startTime = Date.now();
      log(`${this.name} initialized at (${Math.floor(data.x || 0)}, ${Math.floor(data.y || 0)})`);
      this.startAI();
    });

    this.socket.on('gameState', (delta) => {
      // Handle delta updates - merge with existing player data
      if (delta.players) {
        // Update all players map
        Object.entries(delta.players).forEach(([id, player]) => {
          this.allPlayers[id] = player;
        });
      }

      // Remove deleted players
      if (delta.removedPlayers) {
        delta.removedPlayers.forEach(id => {
          delete this.allPlayers[id];
        });
      }
      
      if (this.playerId && delta.players && delta.players[this.playerId]) {
        const oldSize = this.playerData ? this.playerData.size : this.initialSize;
        this.playerData = delta.players[this.playerId];
        
        // Detect orb eating
        const sizeDiff = this.playerData.size - oldSize;
        if (sizeDiff > 0 && sizeDiff < 5) {
          this.orbsEaten++;
        } else if (sizeDiff > 5) {
          // Likely ate a player
          this.playersEaten++;
          log(`${this.name} eliminated another player! Size: ${Math.floor(this.playerData.size)}`);
        }
      }
    });

    this.socket.on('gameOver', (data) => {
      const duration = this.startTime ? ((Date.now() - this.startTime) / 1000).toFixed(1) : 'N/A';
      log(`${this.name} ELIMINATED: ${data.message} - Duration: ${duration}s, Final size: ${data.finalSize || 'N/A'}`);
      this.gameOver = true;
      this.socket.disconnect();
    });

    this.socket.on('gameFull', (data) => {
      log(`${this.name} rejected: ${data.message}`, 'warn');
      this.socket.disconnect();
    });

    this.socket.on('disconnect', () => {
      log(`${this.name} disconnected`);
      this.connected = false;
    });

    this.socket.on('error', (error) => {
      log(`${this.name} socket error: ${error}`, 'error');
    });
  }

  startAI() {
    this.aiInterval = setInterval(() => {
      if (this.connected && !this.gameOver && this.playerData) {
        this.executeStrategy();
      }
    }, 150);
  }

  executeStrategy() {
    if (this.strategy === 'aggressive') {
      this.aggressiveStrategy();
    } else if (this.strategy === 'defensive') {
      this.defensiveStrategy();
    } else {
      this.opportunisticStrategy();
    }
  }

  aggressiveStrategy() {
    // Hunt smaller players
    let target = null;
    let minDistance = Infinity;
    
    Object.values(this.allPlayers).forEach(player => {
      if (player.id === this.playerId) return;
      
      // Only target smaller players
      if (player.size < this.playerData.size * 0.95) {
        const dist = Math.hypot(player.x - this.playerData.x, player.y - this.playerData.y);
        if (dist < minDistance) {
          minDistance = dist;
          target = player;
        }
      }
    });
    
    if (target) {
      // Chase target
      this.socket.emit('move', { x: target.x, y: target.y });
    } else {
      // Random movement to find orbs
      this.randomMovement();
    }
  }

  defensiveStrategy() {
    // Flee from larger players
    let threat = null;
    let minDistance = Infinity;
    
    Object.values(this.allPlayers).forEach(player => {
      if (player.id === this.playerId) return;
      
      // Find closest larger player
      if (player.size > this.playerData.size * 1.05) {
        const dist = Math.hypot(player.x - this.playerData.x, player.y - this.playerData.y);
        if (dist < minDistance && dist < 300) {
          minDistance = dist;
          threat = player;
        }
      }
    });
    
    if (threat) {
      // Flee away from threat
      const fleeX = this.playerData.x + (this.playerData.x - threat.x) * 2;
      const fleeY = this.playerData.y + (this.playerData.y - threat.y) * 2;
      
      this.socket.emit('move', {
        x: Math.max(0, Math.min(2000, fleeX)),
        y: Math.max(0, Math.min(2000, fleeY))
      });
    } else {
      // Safe to collect orbs
      this.randomMovement();
    }
  }

  opportunisticStrategy() {
    // Balance between hunting and fleeing
    let target = null;
    let threat = null;
    let minTargetDist = Infinity;
    let minThreatDist = Infinity;
    
    Object.values(this.allPlayers).forEach(player => {
      if (player.id === this.playerId) return;
      
      const dist = Math.hypot(player.x - this.playerData.x, player.y - this.playerData.y);
      
      // Find hunt opportunities
      if (player.size < this.playerData.size * 0.90 && dist < minTargetDist) {
        minTargetDist = dist;
        target = player;
      }
      
      // Find threats
      if (player.size > this.playerData.size * 1.1 && dist < minThreatDist && dist < 250) {
        minThreatDist = dist;
        threat = player;
      }
    });
    
    // Priority: flee > hunt > explore
    if (threat) {
      const fleeX = this.playerData.x + (this.playerData.x - threat.x) * 2;
      const fleeY = this.playerData.y + (this.playerData.y - threat.y) * 2;
      this.socket.emit('move', {
        x: Math.max(0, Math.min(2000, fleeX)),
        y: Math.max(0, Math.min(2000, fleeY))
      });
    } else if (target && minTargetDist < 400) {
      this.socket.emit('move', { x: target.x, y: target.y });
    } else {
      this.randomMovement();
    }
  }

  randomMovement() {
    const targetX = this.playerData.x + (Math.random() - 0.5) * 400;
    const targetY = this.playerData.y + (Math.random() - 0.5) * 400;
    
    this.socket.emit('move', {
      x: Math.max(0, Math.min(2000, targetX)),
      y: Math.max(0, Math.min(2000, targetY))
    });
  }

  getStatus() {
    if (!this.playerData) return `${this.name}: Not initialized`;
    
    const growth = ((this.playerData.size - this.initialSize) / this.initialSize * 100).toFixed(1);
    return `${this.name} [${this.strategy}]: Size ${Math.floor(this.playerData.size)} (+${growth}%) | Orbs: ${this.orbsEaten} | Players: ${this.playersEaten} | Active enemies: ${Object.keys(this.allPlayers).length - 1}`;
  }

  getStats() {
    if (!this.playerData) return null;
    
    return {
      name: this.name,
      strategy: this.strategy,
      finalSize: Math.floor(this.playerData.size),
      growth: ((this.playerData.size - this.initialSize) / this.initialSize * 100).toFixed(1),
      orbsEaten: this.orbsEaten,
      playersEaten: this.playersEaten,
      duration: this.startTime ? ((Date.now() - this.startTime) / 1000).toFixed(1) : 0,
      survived: !this.gameOver
    };
  }

  disconnect() {
    if (this.aiInterval) clearInterval(this.aiInterval);
    if (this.socket) this.socket.disconnect();
  }
}

// Test Configuration
const TEST_DURATION = 45000; // 45 seconds
const STATUS_INTERVAL = 5000; // Report every 5 seconds
const NUM_CLIENTS = 5;

log('='.repeat(80));
log('AstroIo - Combat Test Client');
log(`Testing with ${NUM_CLIENTS} AI players (mixed strategies) for ${TEST_DURATION/1000} seconds`);
log('Features: Player vs player combat, elimination tracking, strategy AI');
log('='.repeat(80));

// Create test clients with different strategies
const clients = [];
const configurations = [
  { name: 'Hunter', strategy: 'aggressive' },
  { name: 'Survivor', strategy: 'defensive' },
  { name: 'Tactician', strategy: 'opportunistic' },
  { name: 'Predator', strategy: 'aggressive' },
  { name: 'Scavenger', strategy: 'opportunistic' }
];

for (let i = 0; i < NUM_CLIENTS; i++) {
  const config = configurations[i];
  const client = new CombatTestClient(config.name, i * 600);
  client.strategy = config.strategy;
  clients.push(client);
}

// Status reporting
const statusInterval = setInterval(() => {
  log('-'.repeat(80));
  log('COMBAT STATUS UPDATE');
  log('-'.repeat(80));
  
  const alive = clients.filter(c => !c.gameOver && c.playerData);
  const eliminated = clients.filter(c => c.gameOver);
  
  log(`Active Players: ${alive.length} | Eliminated: ${eliminated.length}`);
  log('-'.repeat(80));
  
  alive.forEach(client => {
    log(client.getStatus());
  });
  
  if (eliminated.length > 0) {
    log('-'.repeat(80));
    log('ELIMINATED PLAYERS:');
    eliminated.forEach(client => {
      log(`  ${client.name} [${client.strategy}]`);
    });
  }
  
  log('-'.repeat(80));
}, STATUS_INTERVAL);

// Test cleanup and results
setTimeout(() => {
  log('='.repeat(80));
  log('COMBAT TEST COMPLETE');
  log('='.repeat(80));
  
  // Collect statistics
  log('FINAL COMBAT STATISTICS:');
  log('-'.repeat(80));
  
  const allStats = [];
  clients.forEach(client => {
    const stats = client.getStats();
    if (stats) {
      allStats.push(stats);
      const status = stats.survived ? '✅ SURVIVED' : '❌ ELIMINATED';
      log(`${stats.name} [${stats.strategy}]: ${status} | Size ${stats.finalSize} (+${stats.growth}%) | Orbs: ${stats.orbsEaten} | Players eaten: ${stats.playersEaten} | Duration: ${stats.duration}s`);
    } else {
      log(`${client.name}: Failed to initialize`);
    }
  });
  
  log('-'.repeat(80));
  
  // Calculate combat metrics
  const initialized = clients.filter(c => c.playerData !== null).length;
  const survived = allStats.filter(s => s.survived).length;
  const eliminated = allStats.filter(s => !s.survived).length;
  const totalPlayersEaten = allStats.reduce((sum, s) => sum + s.playersEaten, 0);
  const totalOrbsEaten = allStats.reduce((sum, s) => sum + s.orbsEaten, 0);
  
  // Find winner (largest survivor)
  const survivors = allStats.filter(s => s.survived);
  let winner = null;
  if (survivors.length > 0) {
    winner = survivors.reduce((max, s) => s.finalSize > max.finalSize ? s : max, survivors[0]);
  }
  
  log('COMBAT METRICS:');
  log(`  Total players: ${NUM_CLIENTS}`);
  log(`  Initialized: ${initialized}`);
  log(`  Survived: ${survived}`);
  log(`  Eliminated: ${eliminated}`);
  log(`  Total players eaten: ${totalPlayersEaten}`);
  log(`  Total orbs eaten: ${totalOrbsEaten}`);
  log(`  Combat events detected: ${eliminated > 0 ? 'YES' : 'NO'}`);
  
  if (winner) {
    log('');
    log(`🏆 WINNER: ${winner.name} [${winner.strategy}] - Size ${winner.finalSize}`);
  }
  
  // Determine test result
  const combatOccurred = totalPlayersEaten > 0 || eliminated > 0;
  const testPassed = initialized === NUM_CLIENTS && combatOccurred;
  
  log('');
  log(`TEST RESULT: ${testPassed ? '✅ PASS' : '❌ FAIL'}`);
  if (!testPassed) {
    if (initialized < NUM_CLIENTS) {
      log('  Reason: Not all clients initialized', 'warn');
    }
    if (!combatOccurred) {
      log('  Reason: No combat detected (no eliminations or player eating)', 'warn');
    }
  }
  log('='.repeat(80));
  
  // Cleanup
  clearInterval(statusInterval);
  clients.forEach(client => client.disconnect());
  
  setTimeout(() => {
    log('All clients disconnected. Combat test finished.');
    process.exit(testPassed ? 0 : 1);
  }, 1000);
}, TEST_DURATION);

// Handle Ctrl+C
process.on('SIGINT', () => {
  log('Combat test interrupted by user', 'warn');
  clearInterval(statusInterval);
  clients.forEach(client => client.disconnect());
  process.exit(1);
});

// Handle errors
process.on('uncaughtException', (error) => {
  log(`Uncaught exception: ${error.message}`, 'error');
  console.error(error);
  process.exit(1);
});
