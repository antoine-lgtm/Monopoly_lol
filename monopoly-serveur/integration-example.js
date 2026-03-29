/**
 * ============================================================
 *  EXEMPLE D'INTÉGRATION — Comment brancher votre jeu existant
 * ============================================================
 *  Ce fichier montre un exemple concret d'intégration.
 *  Adaptez-le à votre propre structure de jeu.
 * ============================================================
 */

import { MultiplayerClient } from './multiplayer-client.js';

// ─── 1. Votre jeu existant (exemple générique) ───────────────
// Remplacez `game` par votre objet/instance de jeu existant.
// La seule chose importante : il doit exposer :
//   - game.getFullState()  → retourne l'état complet (objet sérialisable)
//   - game.applyState(state) → remplace l'état interne par state
//   - game.onActionDone → callback à appeler après chaque action locale

// Exemple fictif :
const game = {
  state: {
    currentPlayerIndex: 0,
    players: [],
    board: {},
    // ... votre état
  },
  getFullState() { return structuredClone(this.state); },
  applyState(newState) { this.state = newState; renderBoard(); },
};

// ─── 2. Initialiser le client multijoueur ────────────────────
const mp = new MultiplayerClient('http://localhost:3000');
mp.connect();

// ─── 3. Brancher les callbacks ────────────────────────────────

// ✅ La room est créée → afficher le code à partager
mp.onRoomCreated = (room) => {
  showLobby(room);
  console.log(`Partagez ce code : ${room.id}`);
};

// ✅ Vous avez rejoint une room existante
mp.onRoomJoined = (room) => {
  showLobby(room);
};

// ✅ Un nouveau joueur arrive dans le lobby
mp.onPlayerJoined = (room) => {
  updatePlayerList(room.players);
};

// ✅ Un joueur quitte
mp.onPlayerLeft = (room, playerId) => {
  updatePlayerList(room.players);
  showNotification(`Le joueur a quitté la partie`);
};

// ✅ La partie démarre
mp.onGameStarted = (room) => {
  hideLobby();
  startLocalGame(room.players);
};

// ⭐ ESSENTIEL — Recevoir et appliquer l'état des autres joueurs
mp.onGameStateUpdated = (gameState) => {
  // Votre jeu applique l'état reçu du réseau
  game.applyState(gameState);
};

// Optionnel — Effets visuels/sonores
mp.onPlayerAction = (playerId, action) => {
  if (action.type === 'DICE_ROLL') playDiceSound(action.payload.result);
  if (action.type === 'BUY_PROPERTY') showBuyAnimation(action.payload);
};

// ─── 4. Après chaque action de jeu → synchroniser ────────────
//
// Dans votre code existant, trouvez les endroits où une action
// se termine (lancer de dé, achat, fin de tour, etc.)
// et ajoutez UN appel à mp.syncGameState().
//
// AVANT (votre code) :
//   function rollDice() {
//     // ... logique de lancer
//     endTurn();
//   }
//
// APRÈS (avec multijoueur) :
//   function rollDice() {
//     // ... logique de lancer (inchangée)
//     endTurn();
//     mp.syncGameState(game.getFullState()); // ← ajouter cette ligne
//   }
//
// Ou, si vous avez un système d'événements :
//   game.on('action', () => mp.syncGameState(game.getFullState()));

// ─── 5. Bloquer les actions si ce n'est pas votre tour ───────
//
// Dans vos handlers d'UI existants, ajoutez une garde :
//
//   rollDiceButton.addEventListener('click', () => {
//     if (!mp.isMyTurn(game.state.currentPlayerIndex)) return; // ← ajouter
//     rollDice();
//   });

// ─── 6. Boutons UI du lobby (exemple HTML) ────────────────────
function setupLobbyUI() {
  document.getElementById('btn-create').addEventListener('click', () => {
    const name = document.getElementById('input-name').value;
    mp.createRoom(name);
  });

  document.getElementById('btn-join').addEventListener('click', () => {
    const name   = document.getElementById('input-name').value;
    const roomId = document.getElementById('input-room-code').value;
    mp.joinRoom(roomId, name);
  });

  document.getElementById('btn-start').addEventListener('click', () => {
    mp.startGame();
  });
}

// ─── Fonctions UI fictives (à remplacer par les vôtres) ───────
function showLobby(room)          { /* Afficher le lobby avec room.players */ }
function hideLobby()              { /* Passer à l'écran de jeu */ }
function updatePlayerList(players){ /* Mettre à jour la liste de joueurs */ }
function startLocalGame(players)  { /* Initialiser game.state avec les joueurs */ }
function renderBoard()            { /* Re-render votre plateau */ }
function showNotification(msg)    { /* Toast / alert */ }
function playDiceSound(result)    { /* Son de dé */ }
function showBuyAnimation(data)   { /* Animation achat */ }
