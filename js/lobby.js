var lobbyIsHost = false;
var lobbyRoomId = null;

window.addEventListener('load', function () {

    mp.connect('https://monopoly-serveur.onrender.com');

    // ── NAVIGATION ─────────────────────────────────────────

    function showScreen(id) {
        const screens = ['lobby-home', 'lobby-create', 'lobby-join'];
        screens.forEach(function (s) {
            const el = document.getElementById(s);
            if (el) el.style.display = (s === id) ? 'block' : 'none';
        });
    }

    window.lobbyShowCreate = function () { showScreen('lobby-create'); };
    window.lobbyShowJoin = function () { 
        showScreen('lobby-join'); 
        setupCodeInputs(); 
    };
    window.lobbyBack = function () { 
        if(lobbyRoomId) mp.leaveRoom(); 
        showScreen('lobby-home'); 
    };

    // ── ACTIONS DU LOBBY ───────────────────────────────────

    window.lobbyCreate = function () {
        const name = document.getElementById('lobby-name-create').value.trim();
        if (!name) return;
        mp.createRoom(name);
    };

    window.lobbyJoin = function() {
        const name = document.getElementById('lobby-name-join').value.trim();
        const boxes = document.querySelectorAll('.lobby-code-box');
        let code = '';
        boxes.forEach(b => code += b.value);

        if (!name || code.length < 6) return;
        mp.joinRoom(code, name);
    };

    // Dans la section ACTIONS DU LOBBY
window.lobbyStartMulti = function () { 
    console.log("Tentative de lancement de la partie...");
    if (!lobbyIsHost) {
        console.error("Seul l'hôte peut lancer la partie.");
        return;
    }
    // Appel au moteur réseau
    if (typeof mp !== 'undefined' && mp.startGame) {
        mp.startGame(); 
    } else {
        console.error("Erreur : mp.startGame n'est pas défini.");
    }
};

// Dans la section CALLBACKS RÉSEAU
mp.on('onGameStarted', function (room) {
    console.log("Le serveur confirme le début de la partie !");
    
    // 1. Cacher le lobby
    const lobby = document.getElementById('lobby');
    if (lobby) lobby.style.display = 'none';

    // 2. Préparer l'affichage du plateau
    if (lobbyIsHost) {
        const players = room.players;
        const playerNumInput = document.getElementById('playernumber');
        
        if (playerNumInput) {
            playerNumInput.value = players.length;
            // On déclenche manuellement le changement de nombre de joueurs
            if (typeof playernumber_onchange === "function") playernumber_onchange();
            
            // On remplit les noms pour le script de setup original
            for (let i = 0; i < players.length; i++) {
                const input = document.getElementById('player' + (i + 1) + 'name');
                if (input) input.value = players[i].name;
            }
            
            // On lance le setup du Monopoly original
            if (typeof setup === "function") setup();
        }
    } else {
        // Pour les clients (non-hôtes)
        const setupScreen = document.getElementById('setup');
        if (setupScreen) setupScreen.style.display = 'none';
        
        const board = document.getElementById('board');
        if (board) board.style.display = 'table';
        
        const controls = document.getElementById('control');
        if (controls) controls.style.display = 'block';
        
        const money = document.getElementById('moneybarwrap') || document.getElementById('moneybar');
        if (money) money.style.display = 'block';
    }
    
    document.body.style.backgroundColor = "#1a1a1a";
});

    // FIX COPIER : Méthode robuste
    window.lobbyCopyCode = function () {
        const code = document.getElementById('lobby-code-value').innerText;
        if (!code) return;

        navigator.clipboard.writeText(code).then(() => {
            alert("Code de partie copié !");
        }).catch(err => {
            // Méthode de secours si navigator.clipboard échoue
            const textArea = document.createElement("textarea");
            textArea.value = code;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            alert("Code copié (méthode de secours) !");
        });
    };

    // ── GESTION DU CODE (AUTO-TAB + PASTE) ─────────────────

    function setupCodeInputs() {
        const boxes = document.querySelectorAll('.lobby-code-box');
        const container = document.getElementById('lobby-code-inputs');

        boxes.forEach(function (box, i) {
            box.value = ''; 
            box.oninput = function () {
                this.value = this.value.toUpperCase().substring(0, 1);
                if (this.value && i < boxes.length - 1) boxes[i + 1].focus();
            };
            box.onkeydown = function (e) {
                if (e.key === 'Backspace' && !this.value && i > 0) boxes[i - 1].focus();
            };
        });

        if (container) {
            container.onpaste = function(e) {
                e.preventDefault();
                const data = (e.clipboardData || window.clipboardData).getData('text').toUpperCase().trim().substring(0, 6);
                const characters = data.split('');
                boxes.forEach((box, index) => {
                    if (characters[index]) box.value = characters[index];
                });
            };
        }
    }

    // ── CALLBACKS RÉSEAU ───────────────────────────────────

    function refreshLobbyUI(room) {
        lobbyRoomId = room.id;
        
        // Navigation auto vers l'écran d'attente
        document.getElementById('lobby-home').style.display = 'none';
        document.getElementById('lobby-join').style.display = 'none';
        document.getElementById('lobby-create').style.display = 'block';

        // Affichage du code et de la liste
        document.getElementById('lobby-room-code').style.display = 'block';
        document.getElementById('lobby-code-value').textContent = room.id;
        document.getElementById('lobby-players').style.display = 'block';

        // Bouton Lancer (uniquement pour l'hôte)
        const startBtn = document.getElementById('lobby-start-btn');
        if (startBtn) startBtn.style.display = lobbyIsHost ? 'block' : 'none';

        // Rendu des joueurs
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

    mp.on('onGameStarted', function (room) {
        finalizeStartGame();
    });
});

// ── FONCTIONS GLOBALES ──────────────────────────────────────

function lobbyUpdatePlayers(players) {
    const list = document.getElementById('lobby-player-list');
    if (!list) return;

    list.innerHTML = ''; // On vide proprement
    
    players.forEach(p => {
        const div = document.createElement('div');
        div.style.cssText = "padding:12px; border-bottom:1px solid #333; color:white; display:flex; align-items:center;";
        
        const hostTag = p.playerIndex === 0 ? '<span style="color:#FFD700; margin-left:10px; font-weight:bold;">[HÔTE]</span>' : '';
        const dotColor = p.connected ? '#4caf50' : '#e05050';
        
        div.innerHTML = `
            <span style="height:10px; width:10px; background:${dotColor}; border-radius:50%; margin-right:15px;"></span>
            <span style="font-family:sans-serif; font-size:16px;">${p.name}</span>
            ${hostTag}
        `;
        list.appendChild(div);
    });
}

function finalizeStartGame() {
    const lobby = document.getElementById('lobby');
    if (lobby) {
        lobby.style.display = 'none';
        document.getElementById('board').style.display = 'table';
        document.getElementById('control').style.display = 'block';
        document.getElementById('moneybarwrap').style.display = 'block';
    }
}