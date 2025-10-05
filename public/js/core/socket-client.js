/**
 * GameSocket - Cliente Socket.IO
 */
class GameSocket {
  constructor() {
    this.socket = null;
    this.playerId = null;
    this.isConnected = false;
  }

  /**
   * Conectar al servidor
   */
  connect() {
    this.socket = io({
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    this.setupListeners();
  }

  /**
   * Configurar listeners de Socket.IO
   */
  setupListeners() {
    // Conexión exitosa
    this.socket.on('connect', () => {
      console.log('✅ Connected to server:', this.socket.id);
      this.isConnected = true;
    });

    // Desconexión
    this.socket.on('disconnect', (reason) => {
      console.warn('❌ Disconnected:', reason);
      this.isConnected = false;
    });

    // Error de conexión
    this.socket.on('connect_error', (error) => {
      console.error('❌ Connection error:', error);
    });

    // Intento de reconexión
    this.socket.on('reconnect_attempt', (attempt) => {
      console.log(`🔄 Reconnection attempt ${attempt}`);
    });

    // Reconectado
    this.socket.on('reconnect', (attemptNumber) => {
      console.log(`✅ Reconnected after ${attemptNumber} attempts`);
    });
  }

  /**
   * Enviar nombre del jugador
   */
  setName(playerName) {
    console.log('🎮 Sending name to server:', playerName);
    this.socket.emit('setName', playerName);
  }

  /**
   * Enviar movimiento
   */
  sendMove(x, y) {
    if (this.isConnected) {
      this.socket.emit('move', { x, y });
    }
  }

  /**
   * Escuchar evento
   */
  on(event, callback) {
    this.socket.on(event, callback);
  }

  /**
   * Remover listener
   */
  off(event, callback) {
    this.socket.off(event, callback);
  }
}

// Exportar instancia global
window.GameSocket = GameSocket;