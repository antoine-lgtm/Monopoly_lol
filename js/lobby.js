// ============================================================
//  MONOPOLY — Lobby Multijoueur — js/lobby.js
// ============================================================

var lobbyIsHost = false;
var lobbyRoomId = null;

// ── Navigation ───────────────────────────────────────────────
function showScreen(id) {
    ['lobby-home', 'lobby-create', 'lobby-join'].forEach(function (s) {
        document.getElementById(s).style.display = s === id ? 'block' : 'none';
    });
}

function lobbyShowCreate() { showScreen('lobby-create'); }
function lobbyShowJoin()   { showScreen('lobby-join'); setupCodeInputs(); }
function lobbyBack()       { showScreen('lobby-home'); }

// ── Actions ──────────────────────────────────────────────────
function lobbyCreate() {
    var name = document.getElementById('lobby-name-create').value.trim();
    if (!name) { setStatus('create', 'Entrez votre nom.', 'error'); return; }
    mp.createRoom(name);
}

function lobbyJoin() {
    var name  = document.getElementById('lobby-name-join').value.trim();
    var boxes = document.querySelectorAll('.lobby-code-box');
    var code  = '';
    boxes.forEach(function(b) { code += b.value; });
    if (!name)           { setStatus('join', 'Entrez votre nom.', 'error'); return; }
    if (code.length < 6) { setStatus('join', 'Code incomplet.', 'error'); return; }
    mp.joinRoom(code, name);
}

function lobbyCopyCode() {
    var code = document.getElementById('lobby-code-value').textContent;
    navigator.clipboard.writeText(code);
    setStatus('create', 'Code copié !', 'success');
}

var gameStarted = false;
function finalizeStartGame() {
    if (gameStarted) return;
    gameStarted = true;
    document.getElementById('lobby-start-btn').disabled = true;
    mp.startGame();
}

// ── Helpers ──────────────────────────────────────────────────
function setStatus(screen, msg, type) {
    var el = document.getElementById('lobby-status-' + screen);
    if (!el) return;
    el.textContent = msg;
    el.style.color = type === 'error' ? '#E84057' : '#0BC4E2';
}

function setupCodeInputs() {
    var boxes     = document.querySelectorAll('.lobby-code-box');
    var container = document.getElementById('lobby-code-inputs');
    boxes.forEach(function (box, i) {
        box.value   = '';
        box.oninput = function () {
            this.value = this.value.toUpperCase();
            if (this.value && i < boxes.length - 1) boxes[i + 1].focus();
            var code = '';
            boxes.forEach(function(b) { code += b.value; });
            if (code.length === 6) {
                var name = document.getElementById('lobby-name-join').value.trim();
                if (name) mp.joinRoom(code, name);
                else setStatus('join', 'Entrez votre nom.', 'error');
            }
        };
        box.onkeydown = function (e) {
            if (e.key === 'Backspace' && !this.value && i > 0) boxes[i - 1].focus();
        };
    });
    if (container) {
        container.onpaste = function (e) {
            e.preventDefault();
            var data  = e.clipboardData.getData('text').toUpperCase().trim();
            var chars = data.split('');
            boxes.forEach(function (box, index) {
                if (chars[index]) box.value = chars[index];
            });
            var lastIdx = Math.min(chars.length, boxes.length) - 1;
            if (lastIdx >= 0) boxes[lastIdx].focus();
        };
    }
}

function lobbyUpdatePlayers(players) {
    var html = '';
    for (var i = 0; i < players.length; i++) {
        var p       = players[i];
        var hostTag = p.playerIndex === 0 ? '<span style="font-size:10px;color:#FFD700"> [HOTE]</span>' : '';
        var color   = p.connected ? '#4caf50' : '#e05050';
        html += '<div style="margin:5px 0;">'
              + '<span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:' + color + '"></span> '
              + p.name + hostTag + '</div>';
    }
    document.getElementById('lobby-player-list').innerHTML = html;
}

// ── Connexion + Callbacks ─────────────────────────────────────
window.addEventListener('load', function () {

    mp.connect('https://monopoly-serveur-production.up.railway.app');

    mp.on('onRoomCreated', function (room) {
        lobbyIsHost = true;
        lobbyRoomId = room.id;
        document.getElementById('lobby-code-value').textContent  = room.id;
        document.getElementById('lobby-room-code').style.display = 'block';
        document.getElementById('lobby-players').style.display   = 'block';
        document.getElementById('lobby-start-btn').style.display = 'block';
        lobbyUpdatePlayers(room.players);
        setStatus('create', 'Partie creee !', 'success');
    });

    mp.on('onRoomJoined', function (room) {
        lobbyRoomId = room.id;
        showScreen('lobby-create');
        document.getElementById('lobby-room-code').style.display = 'block';
        document.getElementById('lobby-code-value').textContent  = room.id;
        document.getElementById('lobby-players').style.display   = 'block';
        var nameInput = document.getElementById('lobby-name-create');
        if (nameInput) nameInput.style.display = 'none';
        var label = document.querySelector('label[for="lobby-name-create"]');
        if (label) label.style.display = 'none';
        var createBtn = document.querySelector('[onclick="lobbyCreate()"]');
        if (createBtn) createBtn.style.display = 'none';
        lobbyUpdatePlayers(room.players);
        setStatus('create', 'Connecte ! En attente...', 'success');
    });

    mp.on('onPlayerJoined', function (room) {
        lobbyUpdatePlayers(room.players);
    });

    mp.on('onPlayerLeft', function (room, playerId) {
        lobbyUpdatePlayers(room.players);
        if (mp.getRoomId()) {
            var myPlayer = mp.getMyPlayer();
            if (myPlayer && myPlayer.playerIndex === 0) {
                addAlert("Un joueur s'est deconnecte.");
                addAlert("Tour passe automatiquement.");
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
        gameStarted = false;
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