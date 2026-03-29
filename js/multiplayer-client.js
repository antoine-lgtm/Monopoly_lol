// =============================================================
//  MONOPOLY - Client Multijoueur
//  Compatible script classique (pas d'import/export)
//  Placez ce fichier dans : monopoly-serveur/multiplayer-client.js
// =============================================================

var mp = (function () {

  var socket   = null;
  var roomId   = null;
  var myPlayer = null;

  var callbacks = {
    onRoomCreated      : function (room) {},
    onRoomJoined       : function (room) {},
    onPlayerJoined     : function (room) {},
    onPlayerLeft       : function (room, playerId) {},
    onPlayerDisconnected: function (room, playerId) {},
    onGameStarted      : function (room) {},
    onGameStateUpdated : function (gameState) {},
    onError            : function (msg) { console.error('[MP] Erreur :', msg); }
  };

  // ── Connexion ───────────────────────────────────────────────

  function connect(serverUrl) {
    socket = io(serverUrl);

    socket.on('connect', function () {
      console.log('[MP] Connecté au serveur :', serverUrl);
    });

    socket.on('disconnect', function (reason) {
      console.warn('[MP] Déconnecté :', reason);
    });

    socket.on('error', function (data) {
      callbacks.onError(data.message);
    });

    socket.on('room_created', function (data) {
      roomId   = data.room.id;
      myPlayer = data.room.players.find(function (p) { return p.id === socket.id; });
      console.log('[MP] Room créée :', roomId);
      callbacks.onRoomCreated(data.room);
    });

    socket.on('room_joined', function (data) {
      roomId   = data.room.id;
      myPlayer = data.room.players.find(function (p) { return p.id === socket.id; });
      console.log('[MP] Room rejointe :', roomId);
      callbacks.onRoomJoined(data.room);
    });

    socket.on('player_joined',       function (data) { callbacks.onPlayerJoined(data.room); });
    socket.on('player_reconnected',  function (data) { callbacks.onPlayerJoined(data.room); });
    socket.on('player_left',         function (data) { callbacks.onPlayerLeft(data.room, data.playerId); });
    socket.on('player_disconnected', function (data) { callbacks.onPlayerDisconnected(data.room, data.playerId); });

    socket.on('game_started', function (data) {
      console.log('[MP] Partie démarrée !');
      callbacks.onGameStarted(data.room);
    });

    socket.on('game_state_updated', function (data) {
      callbacks.onGameStateUpdated(data.gameState);
    });
  }

  // ── Actions ─────────────────────────────────────────────────

  function createRoom(playerName) {
    socket.emit('create_room', { playerName: playerName });
  }

  function joinRoom(rid, playerName) {
    socket.emit('join_room', { roomId: rid, playerName: playerName });
  }

  function startGame() {
    socket.emit('start_game', { roomId: roomId });
  }

  function leaveRoom() {
    if (roomId) {
      socket.emit('leave_room', { roomId: roomId });
      roomId   = null;
      myPlayer = null;
    }
  }

  function syncGameState(gameState) {
    if (roomId) socket.emit('sync_game_state', { roomId: roomId, gameState: gameState });
  }

  function isMyTurn(currentTurn) {
    return myPlayer && myPlayer.playerIndex === (currentTurn - 1);
  }

  function getRoomId()   { return roomId; }
  function getMyPlayer() { return myPlayer; }

  function on(event, fn) {
    if (callbacks.hasOwnProperty(event)) {
      callbacks[event] = fn;
    } else {
      console.warn('[MP] Événement inconnu :', event);
    }
  }

  return {
    connect      : connect,
    createRoom   : createRoom,
    joinRoom     : joinRoom,
    startGame    : startGame,
    leaveRoom    : leaveRoom,
    syncGameState: syncGameState,
    isMyTurn     : isMyTurn,
    getRoomId    : getRoomId,
    getMyPlayer  : getMyPlayer,
    on           : on
  };

})();