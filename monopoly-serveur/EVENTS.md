# Structure des événements WebSocket — Monopoly Multijoueur

## Vue d'ensemble

```
CLIENT                          SERVEUR                         AUTRES CLIENTS
  │                               │                                   │
  │──── create_room ─────────────►│                                   │
  │◄─── room_created ─────────────│                                   │
  │                               │                                   │
  │──── join_room ───────────────►│                                   │
  │◄─── room_joined ──────────────│                                   │
  │                               │──── player_joined ───────────────►│
  │                               │                                   │
  │──── start_game ─────────────►│                                   │
  │◄─── game_started ─────────────│──── game_started ────────────────►│
  │                               │                                   │
  │──── sync_game_state ─────────►│                                   │
  │                               │──── game_state_updated ──────────►│
  │                               │                                   │
  │──── player_action ──────────►│                                   │
  │                               │──── player_action ───────────────►│
  │                               │                                   │
  │──── leave_room ─────────────►│                                   │
  │                               │──── player_left ─────────────────►│
  │                               │                                   │
  │ (perte réseau)                │                                   │
  │ ✕ disconnect                  │──── player_disconnected ─────────►│
```

---

## Événements Client → Serveur

### `create_room`
Créer une nouvelle partie.
```json
{ "playerName": "Alice" }
```

### `join_room`
Rejoindre une partie existante.
```json
{ "roomId": "A3F9B2", "playerName": "Bob" }
```

### `start_game`
Démarrer la partie (hôte uniquement).
```json
{ "roomId": "A3F9B2" }
```

### `sync_game_state`
Synchroniser l'état complet du jeu après une action.
```json
{
  "roomId": "A3F9B2",
  "gameState": {
    "currentPlayerIndex": 1,
    "players": [...],
    "board": {...}
  }
}
```

### `player_action`
Action ponctuelle (son, animation) sans envoi d'état complet.
```json
{
  "roomId": "A3F9B2",
  "action": {
    "type": "DICE_ROLL",
    "payload": { "result": [3, 5] }
  }
}
```

### `leave_room`
Quitter volontairement une partie.
```json
{ "roomId": "A3F9B2" }
```

---

## Événements Serveur → Client

### `room_created` → émetteur
```json
{
  "room": {
    "id": "A3F9B2",
    "hostId": "socket-id-alice",
    "started": false,
    "players": [
      { "id": "socket-id-alice", "name": "Alice", "playerIndex": 0, "connected": true }
    ]
  }
}
```

### `room_joined` → émetteur
Même structure que `room_created` avec la liste de tous les joueurs présents.

### `player_joined` → tous les autres joueurs de la room
```json
{ "room": { ...même structure... } }
```

### `game_started` → tous les joueurs de la room
```json
{ "room": { ...même structure... } }
```

### `game_state_updated` → tous sauf l'émetteur
```json
{
  "gameState": { ...état complet du jeu... }
}
```

### `player_action` → tous sauf l'émetteur
```json
{
  "playerId": "socket-id-bob",
  "action": { "type": "DICE_ROLL", "payload": { "result": [3, 5] } }
}
```

### `player_left` → tous les joueurs restants
```json
{
  "room": { ...room mise à jour... },
  "playerId": "socket-id-bob"
}
```

### `player_disconnected` → tous les joueurs restants
```json
{
  "room": { ...room avec connected: false... },
  "playerId": "socket-id-bob"
}
```

### `error` → émetteur uniquement
```json
{ "message": "La room est pleine (max 4 joueurs)." }
```

---

## Codes d'erreur possibles

| Situation                        | Message                                      |
|----------------------------------|----------------------------------------------|
| Nom de joueur manquant           | `"Nom de joueur requis."`                    |
| Room inexistante                 | `"Room \"XXX\" introuvable."`                |
| Partie déjà commencée            | `"La partie a déjà commencé."`               |
| Room pleine (4 joueurs max)      | `"La room est pleine (max 4 joueurs)."`       |
| Start par un non-hôte            | `"Seul l'hôte peut démarrer."`               |
| Pas assez de joueurs pour start  | `"Minimum 2 joueurs requis."`                |

---

## Structure d'un objet Player

```json
{
  "id"          : "socket-id",   // identifiant unique du socket
  "name"        : "Alice",       // nom affiché
  "playerIndex" : 0,             // 0=joueur1, 1=joueur2, 2=joueur3, 3=joueur4
  "connected"   : true           // false si déconnexion réseau
}
```
