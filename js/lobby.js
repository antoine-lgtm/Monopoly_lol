// ============================================================
//  MONOPOLY — Lobby Multijoueur
//  Fichier : js/lobby.js
// ============================================================

var lobbyIsHost = false;
var lobbyRoomId = null;

window.addEventListener('load', function () {

  mp.connect('https://monopoly-serveur-production.up.railway.app');

  // ── Navigation ─────────────────────────────────────────

  function showScreen(id) {
    ['lobby-home', 'lobby-create', 'lobby-join'].forEach(function (s) {
      document.getElementById(s).style.display = s === id ? 'block' : 'none';
    });
  }

  window.lobbyShowCreate = function () { showScreen('lobby-create'); };
  window.lobbyShowJoin   = function () { showScreen('lobby-join'); setupCodeInputs(); };
  window.lobbyBack       = function () { showScreen('lobby-home'); };

  window.lobbyCreate = function () {
    var name = document.getElementById('lobby-name-create').value.trim();
    if (!name) { setStatus('create', 'Entrez votre nom.', 'error'); return; }
    mp.createRoom(name);
  };

  window.lobbyStartMulti = function () { mp.startGame(); };

  window.lobbyCopyCode = function () {
    navigator.clipboard.writeText(lobbyRoomId);
    setStatus('create', 'Code copié !', 'success');
  };

  function setStatus(screen, msg, type) {
    var el = document.getElementById('lobby-status-' + screen);
    if (!el) return;
    el.textContent = msg;
    el.style.color = type === 'error' ? '#E84057' : '#0BC4E2';
  }

  // ── Cases de code (auto-avance + rejoint automatiquement) ─

  function setupCodeInputs() {
    var boxes = document.querySelectorAll('.lobby-code-box');
    boxes.forEach(function (box, i) {
      box.value = '';
      box.oninput = function () {
        this.value = this.value.toUpperCase();
        if (this.value && i < boxes.length - 1) boxes[i + 1].focus();
        var code = '';
        boxes.forEach(function (b) { code += b.value; });
        if (code.length === 6) {
          var name = document.getElementById('lobby-name-join').value.trim();
          if (!name) { setStatus('join', 'Entrez votre nom d\'abord.', 'error'); boxes[0].focus(); return; }
          mp.joinRoom(code, name);
        }
      };
      box.onkeydown = function (e) {
        if (e.key === 'Backspace' && !this.value && i > 0) boxes[i - 1].focus();
      };
    });
  }

  // ── Callbacks réseau ───────────────────────────────────

  mp.on('onRoomCreated', function (room) {
    lobbyIsHost = true;
    lobbyRoomId = room.id;
    document.getElementById('lobby-code-value').textContent  = room.id;
    document.getElementById('lobby-room-code').style.display = 'block';
    document.getElementById('lobby-players').style.display   = 'block';
    document.getElementById('lobby-start-btn').style.display = 'block';
    lobbyUpdatePlayers(room.players);
    setStatus('create', 'Partie créée ! Partagez le code.', 'success');
  });

  mp.on('onRoomJoined', function (room) {
    lobbyRoomId = room.id;
    lobbyUpdatePlayers(room.players);
    setStatus('join', 'Connecté ! En attente du démarrage...', 'success');
  });

  mp.on('onPlayerJoined', function (room) {
    lobbyUpdatePlayers(room.players);
  });

  mp.on('onPlayerLeft', function (room, playerId) {
    lobbyUpdatePlayers(room.players);
    if (mp.getRoomId()) {
      var myPlayer = mp.getMyPlayer();
      if (myPlayer && myPlayer.playerIndex === 0) {
        addAlert("Un joueur s'est déconnecté.");
        addAlert("Tour passé automatiquement.");
        setTimeout(function () {
          play();
          setTimeout(function () {
            mp.syncGameState({ player: player, pcount: pcount, turn: turn, square: square });
          }, 300);
        }, 2000);
      }
    }
  });

  mp.on('onGameStarted', function (room) {
    document.getElementById('lobby').style.display = 'none';
    if (lobbyIsHost) {
      var players = room.players;
      document.getElementById('playernumber').value = players.length;
      playernumber_onchange();
      for (var i = 0; i < players.length; i++) {
        var input = document.getElementById('player' + (i + 1) + 'name');
        if (input) input.value = players[i].name;
      }
      setup();
    } else {
      document.getElementById('setup').style.display    = 'none';
      document.getElementById('board').style.display    = 'table';
      document.getElementById('moneybar').style.display = 'block';
      document.getElementById('control').style.display  = 'block';
    }
  });

  mp.on('onGameStateUpdated', function (gameState) {
    if ($("#setup").is(":visible") || !$("#control").is(":visible")) {
      $("#setup").hide();
      $("#board, #moneybar, #control, #buy").show();
    }
    pcount = gameState.pcount;
    turn   = gameState.turn;
    for (var i = 0; i <= 8; i++) {
      if (gameState.player[i]) {
        player[i].name                   = gameState.player[i].name;
        player[i].color                  = gameState.player[i].color;
        player[i].position               = gameState.player[i].position;
        player[i].money                  = gameState.player[i].money;
        player[i].jail                   = gameState.player[i].jail;
        player[i].jailroll               = gameState.player[i].jailroll;
        player[i].human                  = gameState.player[i].human;
        player[i].bidding                = gameState.player[i].bidding;
        player[i].creditor               = gameState.player[i].creditor;
        player[i].communityChestJailCard = gameState.player[i].communityChestJailCard;
        player[i].chanceJailCard         = gameState.player[i].chanceJailCard;
        player[i].index                  = gameState.player[i].index;
      }
    }
    for (var i = 0; i < 40; i++) {
      if (gameState.square[i]) {
        square[i].owner    = gameState.square[i].owner;
        square[i].house    = gameState.square[i].house;
        square[i].hotel    = gameState.square[i].hotel;
        square[i].mortgage = gameState.square[i].mortgage;
      }
    }
    document.getElementById("pname").innerHTML              = player[turn].name;
    document.getElementById("quickstats").style.borderColor = player[turn].color;
    document.getElementById("pmoney").innerHTML             = "$" + player[turn].money;
    updateMoney();
    updatePosition();
    updateOwned();
  });

  mp.on('onError', function (msg) {
    setStatus('create', msg, 'error');
    setStatus('join',   msg, 'error');
  });

});

// ── Helpers ─────────────────────────────────────────────────

function lobbyUpdatePlayers(players) {
  var html = '';
  for (var i = 0; i < players.length; i++) {
    var p       = players[i];
    var hostTag = p.playerIndex === 0 ? '<span class="lobby-player-host">&nbsp;HÔTE</span>' : '';
    var color   = p.connected ? '#4caf50' : '#e05050';
    html += '<div class="lobby-player-row">'
          + '<span class="lobby-player-dot" style="background:' + color + '"></span>'
          + '<span>' + p.name + '</span>' + hostTag
          + '</div>';
  }
  document.getElementById('lobby-player-list').innerHTML = html;
}


// --- GESTION DE L'AFFICHAGE DU MENU ---

function lobbyShowCreate() {
    document.getElementById('lobby-home').style.display = 'none';
    document.getElementById('lobby-create').style.display = 'block';
}

function lobbyShowJoin() {
    document.getElementById('lobby-home').style.display = 'none';
    document.getElementById('lobby-join').style.display = 'block';
}

function lobbyBack() {
    // On cache tout et on remet l'écran d'accueil
    document.getElementById('lobby-create').style.display = 'none';
    document.getElementById('lobby-join').style.display = 'none';
    document.getElementById('lobby-home').style.display = 'block';
}

// --- LOGIQUE POUR LE CODE À 6 CHIFFRES ---

// Cette partie permet de passer automatiquement à la case suivante
// quand on tape une lettre dans le code de partie.
document.addEventListener('DOMContentLoaded', () => {
    const inputs = document.querySelectorAll('.lobby-code-box');
    
    inputs.forEach((input, index) => {
        input.addEventListener('input', (e) => {
            if (e.target.value.length === 1 && index < inputs.length - 1) {
                inputs[index + 1].focus();
            }
        });

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && e.target.value === '' && index > 0) {
                inputs[index - 1].focus();
            }
        });
    });
});

// --- TRANSITION VERS LE JEU ---

function finalizeStartGame() {
    // 1. On fait disparaître le lobby avec un petit effet (optionnel)
    const lobby = document.getElementById('lobby');
    lobby.style.transition = "opacity 0.5s";
    lobby.style.opacity = "0";

    setTimeout(() => {
        lobby.style.display = 'none';

        // 2. On affiche les éléments du Monopoly
        // Note : On utilise 'table' pour le board car c'est un <table> dans ton code
        document.getElementById('board').style.display = 'table';
        document.getElementById('moneybarwrap').style.display = 'block';
        document.getElementById('control').style.display = 'block';
        
        // On remet le fond du body en mode "tapis de jeu"
        document.body.style.backgroundColor = "#e8f5e9";
    }, 500);
}

// Exemple de fonction pour copier le code (appelée par ton bouton "Copier")
function lobbyCopyCode() {
    const code = document.getElementById('lobby-code-value').innerText;
    navigator.clipboard.writeText(code);
    alert("Code copié : " + code);
}


// Dans js/lobby.js
document.addEventListener('DOMContentLoaded', () => {
    const inputs = document.querySelectorAll('.lobby-code-box');
    inputs.forEach((input, index) => {
        input.addEventListener('input', (e) => {
            if (e.target.value.length === 1 && index < inputs.length - 1) {
                inputs[index + 1].focus(); // Saute à la case suivante
            }
        });
    });
});