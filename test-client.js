/**
 * AstroIo - Enhanced Basic Test Client
 * Tests: Connection, movement, orb eating, name display
 * Duration: 30 seconds with 3 AI players
 */

const io = require('socket.io-client');
const fs = require('fs');
const path = require('path');

// Logging utility
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [TEST-CLIENT] [${type.toUpperCase()}] ${message}`;
  console.log(logMessage);
  
  // Append to test.log
  try {
    fs.appendFileSync(path.join(__dirname, 'test.log'), logMessage + '\n');
  } catch (error) {
    console.error('Error writing to log:', error);
  }
}

class TestClient {
  constructor(name, delay = 0) {
    this.name = name;
    this.playerId = null;
    this.playerData = null;
    this.connected = false;
    this.gameOver = false;
    this.orbsEaten = 0;
    this.initialSize = 20;
    this.startTime = null;
    
    setTimeout(() => {
      this.connect();
    }, delay);
  }

  connect() {
    log(`${this.name} connecting to server...`);
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
      log(`${this.name} initialized - World: ${data.worldWidth}x${data.worldHeight}`);
      this.startRandomMovement();
    });

    this.socket.on('gameState', (delta) => {
      // Handle delta updates
      if (this.playerId) {
        // Update player data if changed
        if (delta.players && delta.players[this.playerId]) {
          const oldSize = this.playerData ? this.playerData.size : this.initialSize;
          this.playerData = delta.players[this.playerId];
          
          // Detect orb eating
          const sizeDiff = this.playerData.size - oldSize;
          if (sizeDiff > 0 && sizeDiff < 5) {
            this.orbsEaten++;
          }
        }
      }
    });

    this.socket.on('gameOver', (data) => {
      const duration = this.startTime ? ((Date.now() - this.startTime) / 1000).toFixed(1) : 'N/A';
      log(`${this.name} GAME OVER: ${data.message} - Duration: ${duration}s`);
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

  startRandomMovement() {
    this.moveInterval = setInterval(() => {
      if (this.connected && !this.gameOver && this.playerData) {
        const targetX = this.playerData.x + (Math.random() - 0.5) * 300;
        const targetY = this.playerData.y + (Math.random() - 0.5) * 300;
        
        // Clamp to world bounds
        const clampedX = Math.max(0, Math.min(2000, targetX));
        const clampedY = Math.max(0, Math.min(2000, targetY));
        
        this.socket.emit('move', { x: clampedX, y: clampedY });
      }
    }, 100);
  }

  getStatus() {
    if (!this.playerData) return `${this.name}: Not initialized`;
    
    const growth = ((this.playerData.size - this.initialSize) / this.initialSize * 100).toFixed(1);
    return `${this.name}: Size ${Math.floor(this.playerData.size)} (+${growth}%) | Orbs: ${this.orbsEaten} | Pos: (${Math.floor(this.playerData.x)}, ${Math.floor(this.playerData.y)})`;
  }

  getStats() {
    if (!this.playerData) return null;
    
    return {
      name: this.name,
      finalSize: Math.floor(this.playerData.size),
      growth: ((this.playerData.size - this.initialSize) / this.initialSize * 100).toFixed(1),
      orbsEaten: this.orbsEaten,
      duration: this.startTime ? ((Date.now() - this.startTime) / 1000).toFixed(1) : 0
    };
  }

  disconnect() {
    if (this.moveInterval) clearInterval(this.moveInterval);
    if (this.socket) this.socket.disconnect();
  }
}

// Test Configuration
const TEST_DURATION = 30000; // 30 seconds
const STATUS_INTERVAL = 5000; // Report every 5 seconds
const NUM_CLIENTS = 3;

log('='.repeat(80));
log('AstroIo - Basic Test Client');
log(`Testing with ${NUM_CLIENTS} AI players for ${TEST_DURATION/1000} seconds`);
log('Features: Connection, movement, orb eating, name display');
log('='.repeat(80));

// Create test clients
const clients = [];
const clientNames = ['Alpha', 'Beta', 'Gamma'];

for (let i = 0; i < NUM_CLIENTS; i++) {
  clients.push(new TestClient(clientNames[i], i * 500));
}

// Status reporting
const statusInterval = setInterval(() => {
  log('-'.repeat(80));
  log('STATUS UPDATE');
  log('-'.repeat(80));
  clients.forEach(client => {
    if (!client.gameOver) {
      log(client.getStatus());
    } else {
      log(`${client.name}: ELIMINATED`);
    }
  });
  log('-'.repeat(80));
}, STATUS_INTERVAL);

// Test cleanup and results
setTimeout(() => {
  log('='.repeat(80));
  log('TEST COMPLETE');
  log('='.repeat(80));
  
  // Collect statistics
  log('FINAL STATISTICS:');
  log('-'.repeat(80));
  
  clients.forEach(client => {
    const stats = client.getStats();
    if (stats) {
      log(`${stats.name}: Size ${stats.finalSize} (+${stats.growth}%) | Orbs eaten: ${stats.orbsEaten} | Duration: ${stats.duration}s`);
    } else if (client.gameOver) {
      log(`${client.name}: ELIMINATED`);
    } else {
      log(`${client.name}: Failed to initialize`);
    }
  });
  
  log('-'.repeat(80));
  
  // Calculate success metrics
  const initialized = clients.filter(c => c.playerData !== null).length;
  const survived = clients.filter(c => !c.gameOver && c.playerData !== null).length;
  const totalOrbs = clients.reduce((sum, c) => sum + c.orbsEaten, 0);
  
  log('TEST METRICS:');
  log(`  Clients initialized: ${initialized}/${NUM_CLIENTS}`);
  log(`  Clients survived: ${survived}/${NUM_CLIENTS}`);
  log(`  Total orbs eaten: ${totalOrbs}`);
  log(`  Test duration: ${TEST_DURATION/1000}s`);
  
  // Determine test result
  const testPassed = initialized === NUM_CLIENTS && totalOrbs > 0;
  log('');
  log(`TEST RESULT: ${testPassed ? '✅ PASS' : '❌ FAIL'}`);
  log('='.repeat(80));
  
  // Cleanup
  clearInterval(statusInterval);
  clients.forEach(client => client.disconnect());
  
  setTimeout(() => {
    log('All clients disconnected. Test finished.');
    process.exit(testPassed ? 0 : 1);
  }, 1000);
}, TEST_DURATION);

// Handle Ctrl+C
process.on('SIGINT', () => {
  log('Test interrupted by user', 'warn');
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
