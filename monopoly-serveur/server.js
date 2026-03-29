/**
 * ============================================================
 *  MONOPOLY - Serveur Multijoueur (Socket.IO + Node.js)
 * ============================================================
 */

const express = require('express');
const http    = require('http');
const { Server } = require('socket.io');
const { v4: uuidv4 } = require('uuid');

const PORT        = process.env.PORT || 3000;
const MAX_PLAYERS = 4;

const app    = express();
const server = http.createServer(app);
const io     = new Server(server, { cors: { origin: '*' } });
const rooms  = new Map();

// ─── Helpers ─────────────────────────────────────────────────

function getRoomPublicData(room) {
  return {
    id      : room.id,
    hostId  : room.hostId,
    started : room.started,
    players : [...room.players.values()].map(p => ({
      id         : p.id,
      name       : p.name,
      playerIndex: p.playerIndex,
      connected  : p.connected,
    })),
  };
}

function getNextPlayerIndex(room) {
  const used = new Set([...room.players.values()].map(p => p.playerIndex));
  for (let i = 0; i < MAX_PLAYERS; i++) {
    if (!used.has(i)) return i;
  }
  return -1;
}

function findRoomBySocket(socketId) {
  for (const room of rooms.values()) {
    if (room.players.has(socketId)) return room;
  }
  return null;
}

// ─── Connexions ───────────────────────────────────────────────

io.on('connection', (socket) => {
  console.log(`[+] Connexion : ${socket.id}`);

  socket.on('create_room', ({ playerName } = {}) => {
    if (!playerName?.trim()) return socket.emit('error', { message: 'Nom de joueur requis.' });

    const roomId = uuidv4().slice(0, 6).toUpperCase();
    const room   = { id: roomId, hostId: socket.id, players: new Map(), gameState: null, started: false };
    const player = { id: socket.id, name: playerName.trim(), playerIndex: 0, connected: true };

    room.players.set(socket.id, player);
    rooms.set(roomId, room);
    socket.join(roomId);

    console.log(`[ROOM] Créée : ${roomId} par "${playerName}"`);
    socket.emit('room_created', { room: getRoomPublicData(room) });
  });

  socket.on('join_room', ({ roomId, playerName } = {}) => {
    if (!playerName?.trim()) return socket.emit('error', { message: 'Nom de joueur requis.' });

    const room = rooms.get(roomId?.toUpperCase());
    if (!room) return socket.emit('error', { message: `Room "${roomId}" introuvable.` });

    if (room.started) {
      if (room.players.has(socket.id)) {
        socket.join(roomId);
        socket.emit('room_joined', { room: getRoomPublicData(room) });
        return;
      }
      return socket.emit('error', { message: 'La partie a déjà commencé.' });
    }

    if (room.players.has(socket.id)) {
      room.players.get(socket.id).connected = true;
      socket.join(roomId);
      socket.emit('room_joined', { room: getRoomPublicData(room) });
      socket.to(roomId).emit('player_reconnected', { room: getRoomPublicData(room) });
      return;
    }

    const playerIndex = getNextPlayerIndex(room);
    if (playerIndex === -1) return socket.emit('error', { message: 'La room est pleine (max 4 joueurs).' });

    const player = { id: socket.id, name: playerName.trim(), playerIndex, connected: true };
    room.players.set(socket.id, player);
    socket.join(roomId);

    console.log(`[ROOM] "${playerName}" a rejoint ${roomId} (joueur ${playerIndex + 1})`);
    socket.emit('room_joined', { room: getRoomPublicData(room) });
    socket.to(roomId).emit('player_joined', { room: getRoomPublicData(room) });
  });

  socket.on('start_game', ({ roomId } = {}) => {
    const room = rooms.get(roomId);
    if (!room)                     return socket.emit('error', { message: 'Room introuvable.' });
    if (room.hostId !== socket.id) return socket.emit('error', { message: "Seul l'hôte peut démarrer." });
    if (room.started)              return socket.emit('error', { message: 'Partie déjà démarrée.' });
    if (room.players.size < 2)     return socket.emit('error', { message: 'Minimum 2 joueurs requis.' });

    room.started = true;
    console.log(`[ROOM] Partie démarrée : ${roomId}`);
    io.to(roomId).emit('game_started', { room: getRoomPublicData(room) });
  });

  socket.on('sync_game_state', ({ roomId, gameState } = {}) => {
    const room = rooms.get(roomId);
    if (!room) return;
    room.gameState = gameState;
    socket.to(roomId).emit('game_state_updated', { gameState });
  });

  socket.on('player_action', ({ roomId, action } = {}) => {
    if (!rooms.has(roomId)) return;
    socket.to(roomId).emit('player_action', { playerId: socket.id, action });
  });

  socket.on('leave_room', ({ roomId } = {}) => {
    handleLeave(socket, roomId, false);
  });

  socket.on('disconnect', () => {
    console.log(`[-] Déconnexion : ${socket.id}`);
    const room = findRoomBySocket(socket.id);
    if (room) handleLeave(socket, room.id, true);
  });
});

// ─── Départ / déconnexion ─────────────────────────────────────

function handleLeave(socket, roomId, silent) {
  const room = rooms.get(roomId);
  if (!room || !room.players.has(socket.id)) return;

  const player = room.players.get(socket.id);

  if (silent) {
    player.connected = false;
    socket.to(roomId).emit('player_disconnected', { room: getRoomPublicData(room), playerId: socket.id });
    socket.to(roomId).emit('player_left',         { room: getRoomPublicData(room), playerId: socket.id });
  } else {
    removePlayer(socket, roomId);
  }
}

function removePlayer(socket, roomId) {
  const room = rooms.get(roomId);
  if (!room) return;

  room.players.delete(socket.id);
  socket.leave(roomId);
  console.log(`[ROOM] Joueur ${socket.id} a quitté ${roomId}`);

  if (room.players.size === 0) {
    rooms.delete(roomId);
    console.log(`[ROOM] Supprimée (vide) : ${roomId}`);
    return;
  }

  if (room.hostId === socket.id) {
    const newHost = [...room.players.values()].find(p => p.connected);
    if (newHost) {
      room.hostId = newHost.id;
      console.log(`[ROOM] Nouvel hôte : ${newHost.name}`);
    }
  }

  io.to(roomId).emit('player_left', { room: getRoomPublicData(room), playerId: socket.id });
}

// ─── Route de santé ──────────────────────────────────────────

app.get('/health', (_, res) => {
  res.json({ status: 'ok', rooms: rooms.size });
});

// ─── Démarrage ───────────────────────────────────────────────

server.listen(PORT, () => {
  console.log(`✅  Serveur Monopoly démarré sur http://localhost:${PORT}`);
});