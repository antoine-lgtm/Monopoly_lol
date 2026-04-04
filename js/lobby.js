var lobbyIsHost = false;
var lobbyRoomId = null;

window.showScreen = function(id) {
        ['lobby-home', 'lobby-create', 'lobby-join'].forEach(function (s) {
            document.getElementById(s).style.display = s === id ? 'block' : 'none';
        });
    }
window.addEventListener('load', function () {

    mp.connect('https://monopoly-serveur-production.up.railway.app');

    // ── NAVIGATION ─────────────────────────────────────────

    window.lobbyShowCreate = function () { showScreen('lobby-create'); };
    window.lobbyShowJoin = function () { 
        showScreen('lobby-join'); 
        setupCodeInputs(); 
    };
    window.lobbyBack = function () { showScreen('lobby-home'); };

    // ── ACTIONS DU LOBBY ───────────────────────────────────

    window.lobbyCreate = function () {
        var name = document.getElementById('lobby-name-create').value.trim();
        if (!name) { setStatus('create', 'Entrez votre nom.', 'error'); return; }
        mp.createRoom(name);
    };

    window.lobbyStartMulti = function () { mp.startGame(); };

    window.lobbyCopyCode = function () {
        const code = document.getElementById('lobby-code-value').innerText;
        navigator.clipboard.writeText(code);
        setStatus('create', 'Code copié !', 'success');
    };

    // LA FONCTION MANQUANTE POUR LE BOUTON
    window.lobbyJoin = function() {
        const name = document.getElementById('lobby-name-join').value.trim();
        const boxes = document.querySelectorAll('.lobby-code-box');
        let code = '';
        boxes.forEach(b => code += b.value);

        if (!name) { 
            setStatus('join', 'Entrez votre nom d\'abord.', 'error'); 
            return; 
        }
        if (code.length < 6) {
            setStatus('join', 'Le code doit faire 6 caractères.', 'error');
            return;
        }
        mp.joinRoom(code, name);
    };

    function setStatus(screen, msg, type) {
        var el = document.getElementById('lobby-status-' + screen);
        if (!el) return;
        el.textContent = msg;
        el.style.color = type === 'error' ? '#E84057' : '#0BC4E2';
    }

    // ── GESTION DU CODE (AUTO-TAB + PASTE) ─────────────────

    function setupCodeInputs() {
        var boxes = document.querySelectorAll('.lobby-code-box');
        var container = document.getElementById('lobby-code-inputs');

        boxes.forEach(function (box, i) {
            box.value = ''; // Reset
            
            box.oninput = function () {
                this.value = this.value.toUpperCase();
                if (this.value && i < boxes.length - 1) boxes[i + 1].focus();
                
                // Optionnel : Tentative de join auto si 6 caractères
                var code = '';
                boxes.forEach(b => code += b.value);
                if (code.length === 6) {
                    const name = document.getElementById('lobby-name-join').value.trim();
                    if(name) mp.joinRoom(code, name);
                }
            };

            box.onkeydown = function (e) {
                if (e.key === 'Backspace' && !this.value && i > 0) boxes[i - 1].focus();
            };
        });

        // Gestion du COLLER
        container.onpaste = function(e) {
            e.preventDefault();
            const data = e.clipboardData.getData('text').toUpperCase().trim();
            const characters = data.split('');
            boxes.forEach((box, index) => {
                if (characters[index]) box.value = characters[index];
            });
            const lastIdx = Math.min(characters.length, boxes.length) - 1;
            if (lastIdx >= 0) boxes[lastIdx].focus();
        };
    }

    // ── CALLBACKS RÉSEAU (Gardés intacts) ──────────────────

    mp.on('onRoomCreated', function (room) {
        lobbyIsHost = true;
        lobbyRoomId = room.id;
        document.getElementById('lobby-code-value').textContent = room.id;
        document.getElementById('lobby-room-code').style.display = 'block';
        document.getElementById('lobby-players').style.display = 'block';
        document.getElementById('lobby-start-btn').style.display = 'block';
        lobbyUpdatePlayers(room.players);
        setStatus('create', 'Partie créée !', 'success');
    });

mp.on('onRoomJoined', function (room) {
    lobbyRoomId = room.id;
    showScreen('lobby-create');
    document.getElementById('lobby-room-code').style.display  = 'block';
    document.getElementById('lobby-code-value').textContent   = room.id;
    document.getElementById('lobby-players').style.display    = 'block';
    // Cacher les éléments réservés à l'hôte
    document.getElementById('lobby-name-create').style.display = 'none';
    document.querySelector('label[for="lobby-name-create"]')   = null;
    document.querySelector('.lobby-label').style.display       = 'none';
    document.querySelector('[onclick="lobbyCreate()"]').style.display = 'none';
    lobbyUpdatePlayers(room.players);
    setStatus('create', 'Connecté ! En attente du démarrage...', 'success');
});

    mp.on('onPlayerJoined', function (room) {
        lobbyUpdatePlayers(room.players);
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
    document.getElementById('lobby').style.display  = 'none';
    document.getElementById('setup').style.display  = 'none';
    document.getElementById('board').style.display  = 'table';
    document.getElementById('moneybar').style.display = 'block';
    document.getElementById('control').style.display  = 'block';
}
    });
});

function lobbyUpdatePlayers(players) {
    var html = '';
    for (var i = 0; i < players.length; i++) {
        var p = players[i];
        var hostTag = p.playerIndex === 0 ? '<span style="font-size:10px; color:#FFD700"> [HÔTE]</span>' : '';
        var color = p.connected ? '#4caf50' : '#e05050';
        html += '<div style="margin: 5px 0;">'
              + '<span style="display:inline-block; width:10px; height:10px; border-radius:50%; background:' + color + '"></span> '
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


document.addEventListener('DOMContentLoaded', () => {
    const inputs = document.querySelectorAll('.lobby-code-box');
    const container = document.getElementById('lobby-code-inputs');

    // --- 1. Gérer le COLLER (Paste) ---
    container.addEventListener('paste', (e) => {
        // On empêche le comportement par défaut (coller tout dans une seule case)
        e.preventDefault();
        
        // On récupère le texte du presse-papier
        const data = e.clipboardData.getData('text').toUpperCase().trim();
        const characters = data.split('');

        // On distribue les caractères dans les cases
        inputs.forEach((input, index) => {
            if (characters[index]) {
                input.value = characters[index];
            }
        });

        // On met le focus sur la dernière case remplie (ou la 6ème)
        const lastIndex = Math.min(characters.length, inputs.length) - 1;
        if (lastIndex >= 0) inputs[lastIndex].focus();
    });

    // --- 2. Gérer la saisie CLAVIER (Auto-focus) ---
    inputs.forEach((input, index) => {
        input.addEventListener('input', (e) => {
            // Si on a tapé un caractère, on passe à la case suivante
            if (e.target.value.length === 1 && index < inputs.length - 1) {
                inputs[index + 1].focus();
            }
        });

        input.addEventListener('keydown', (e) => {
            // Si on appuie sur Retour (Backspace), on revient à la case précédente
            if (e.key === 'Backspace' && e.target.value === '' && index > 0) {
                inputs[index - 1].focus();
            }
        });
    });
});