// =============================================================
//  MONOPOLY - Lobby Multijoueur
//  lobby.js — version clean
// =============================================================

var lobbyIsHost = false;
var lobbyRoomId = null;

// Couleurs par défaut attribuées automatiquement en multijoueur
var LOBBY_DEFAULT_COLORS = ['yellow', 'blue', 'red', 'lime', 'orange', 'purple', 'aqua', 'fuchsia'];

window.addEventListener('load', function () {

    mp.connect('https://monopoly-serveur.onrender.com');

    // ── NAVIGATION ─────────────────────────────────────────────

    function showScreen(id) {
        ['lobby-home', 'lobby-create', 'lobby-join'].forEach(function (s) {
            var el = document.getElementById(s);
            if (el) el.style.display = (s === id) ? 'block' : 'none';
        });
    }

    window.lobbyShowCreate = function () { showScreen('lobby-create'); };
    window.lobbyShowJoin   = function () { showScreen('lobby-join'); setupCodeInputs(); };
    window.lobbyBack       = function () {
        if (lobbyRoomId) mp.leaveRoom();
        lobbyRoomId  = null;
        lobbyIsHost  = false;
        showScreen('lobby-home');
    };

    // ── ACTIONS DU LOBBY ───────────────────────────────────────

    window.lobbyCreate = function () {
        var name = document.getElementById('lobby-name-create').value.trim();
        if (!name) return;
        mp.createRoom(name);
    };

    window.lobbyJoin = function () {
        var name  = document.getElementById('lobby-name-join').value.trim();
        var boxes = document.querySelectorAll('.lobby-code-box');
        var code  = '';
        boxes.forEach(function (b) { code += b.value; });
        if (!name || code.length < 6) return;
        mp.joinRoom(code, name);
    };

    window.lobbyStartMulti = function () {
        if (!lobbyIsHost) {
            console.warn('[Lobby] Seul l\'hôte peut démarrer la partie.');
            return;
        }
        if (typeof mp !== 'undefined' && mp.startGame) {
            mp.startGame();
        } else {
            console.error('[Lobby] mp.startGame n\'est pas défini.');
        }
    };

    window.lobbyCopyCode = function () {
        var code = document.getElementById('lobby-code-value').innerText;
        if (!code) return;
        navigator.clipboard.writeText(code).then(function () {
            alert('Code de partie copié !');
        }).catch(function () {
            var ta = document.createElement('textarea');
            ta.value = code;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
            alert('Code copié !');
        });
    };

    // ── GESTION DU CODE (AUTO-TAB + PASTE) ─────────────────────

    function setupCodeInputs() {
        var boxes     = document.querySelectorAll('.lobby-code-box');
        var container = document.getElementById('lobby-code-inputs');

        boxes.forEach(function (box, i) {
            box.value   = '';
            box.oninput = function () {
                this.value = this.value.toUpperCase().substring(0, 1);
                if (this.value && i < boxes.length - 1) boxes[i + 1].focus();
            };
            box.onkeydown = function (e) {
                if (e.key === 'Backspace' && !this.value && i > 0) boxes[i - 1].focus();
            };
        });

        if (container) {
            container.onpaste = function (e) {
                e.preventDefault();
                var data = (e.clipboardData || window.clipboardData)
                    .getData('text').toUpperCase().trim().substring(0, 6).split('');
                boxes.forEach(function (box, i) {
                    if (data[i]) box.value = data[i];
                });
            };
        }
    }

    // ── CALLBACKS RÉSEAU ───────────────────────────────────────

    function refreshLobbyUI(room) {
        lobbyRoomId = room.id;

        // Toujours montrer l'écran "créer" comme salle d'attente
        document.getElementById('lobby-home').style.display   = 'none';
        document.getElementById('lobby-join').style.display   = 'none';
        document.getElementById('lobby-create').style.display = 'block';

        document.getElementById('lobby-room-code').style.display = 'block';
        document.getElementById('lobby-code-value').textContent  = room.id;
        document.getElementById('lobby-players').style.display   = 'block';

        var startBtn = document.getElementById('lobby-start-btn');
        if (startBtn) startBtn.style.display = lobbyIsHost ? 'block' : 'none';

        lobbyUpdatePlayers(room.players);
    }

    mp.on('onRoomCreated', function (room) {
        lobbyIsHost = true;
        refreshLobbyUI(room);
    });

    mp.on('onRoomJoined', function (room) {
        lobbyIsHost = false;
        refreshLobbyUI(room);
    });

    mp.on('onPlayerJoined', function (room) {
        lobbyUpdatePlayers(room.players);
    });

    mp.on('onPlayerLeft', function (room) {
        lobbyUpdatePlayers(room.players);
    });

    // ── DÉMARRAGE DE LA PARTIE ─────────────────────────────────
    //
    //  Appelé pour TOUS les clients (hôte ET joueurs) quand le
    //  serveur émet 'game_started'.
    //
    //  Stratégie :
    //    1. Cacher le lobby
    //    2. Pré-remplir les inputs du formulaire setup (noms, couleurs)
    //    3. Appeler setup() → il initialise les joueurs et appelle play()

    mp.on('onGameStarted', function (room) {
        console.log('[Lobby] Partie démarrée !', room);

        // 1. Masquer le lobby
        var lobby = document.getElementById('lobby');
        if (lobby) lobby.style.display = 'none';

        var players = room.players;

        // 2. Nombre de joueurs
        var playerNumInput = document.getElementById('playernumber');
        if (playerNumInput) {
            playerNumInput.value = players.length;
            if (typeof playernumber_onchange === 'function') playernumber_onchange();
        }

        // 3. Noms, couleurs et mode humain pour chaque joueur
        for (var i = 0; i < players.length; i++) {
            var slot = i + 1; // les inputs sont indexés à partir de 1

            var nameInput  = document.getElementById('player' + slot + 'name');
            var colorInput = document.getElementById('player' + slot + 'color');
            var aiSelect   = document.getElementById('player' + slot + 'ai');

            if (nameInput)  nameInput.value  = players[i].name;
            if (colorInput) colorInput.value = LOBBY_DEFAULT_COLORS[i] || 'yellow';
            if (aiSelect)   aiSelect.value   = '0'; // toujours "Human" en multi
        }

        // 4. Lancer le moteur (setup appelle play() en interne)
        if (typeof setup === 'function') {
            setup();
        } else {
            console.error('[Lobby] setup() introuvable — vérifiez l\'ordre de chargement des scripts.');
        }

        document.body.style.backgroundColor = '#1a1a1a';
    });

});

// ── FONCTIONS GLOBALES ─────────────────────────────────────────

function lobbyUpdatePlayers(players) {
    var list = document.getElementById('lobby-player-list');
    if (!list) return;

    list.innerHTML = '';

    players.forEach(function (p) {
        var div      = document.createElement('div');
        var dotColor = p.connected ? '#4caf50' : '#e05050';
        var hostTag  = p.playerIndex === 0
            ? '<span style="color:#FFD700; margin-left:10px; font-weight:bold;">[HÔTE]</span>'
            : '';

        div.style.cssText = 'padding:12px; border-bottom:1px solid #333; color:white; display:flex; align-items:center;';
        div.innerHTML =
            '<span style="height:10px;width:10px;background:' + dotColor + ';border-radius:50%;margin-right:15px;"></span>' +
            '<span style="font-family:sans-serif;font-size:16px;">' + p.name + '</span>' +
            hostTag;

        list.appendChild(div);
    });
}