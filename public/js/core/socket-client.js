/**
 * GameSocket - Cliente Socket.IO
 */
class GameSocket {
  constructor() {
    this.socket = null;
    this.playerId = null;
    this.isConnected = false;
    this._pendingName = null; // ← NEW: buffer name until connected
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

      // ← NEW: si ya teníamos nombre pendiente, enviarlo ahora
      if (this._pendingName) {
        this.socket.emit('setName', this._pendingName);
        console.log('🎮 Sent pending name:', this._pendingName);
      }
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

      // Si perdimos la sesión, reenviar el nombre por si acaso
      if (this._pendingName) {
        this.socket.emit('setName', this._pendingName);
      }
    });
  }

  /**
   * Enviar nombre del jugador
   * - Si aún no hay conexión, se envía cuando 'connect' dispare.
   */
  setName(playerName) {
    this._pendingName = playerName; // guardar siempre
    if (this.isConnected) {
      console.log('🎮 Sending name to server:', playerName);
      this.socket.emit('setName', playerName);
    } else {
      console.log('⏳ Queued name until connect:', playerName);
    }
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

// Exportar clase
window.GameSocket = GameSocket;
