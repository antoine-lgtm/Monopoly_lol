function Square(name, pricetext, color, price, groupNumber, baserent, rent1, rent2, rent3, rent4, rent5) {
	this.name = name;
	this.pricetext = pricetext;
	this.color = color;
	this.owner = 0;
	this.mortgage = false;
	this.house = 0;
	this.hotel = 0;
	this.groupNumber = groupNumber || 0;
	this.price = (price || 0);
	this.baserent = (baserent || 0);
	this.rent1 = (rent1 || 0);
	this.rent2 = (rent2 || 0);
	this.rent3 = (rent3 || 0);
	this.rent4 = (rent4 || 0);
	this.rent5 = (rent5 || 0);
	this.landcount = 0;

	if (groupNumber === 3 || groupNumber === 4) {
		this.houseprice = 50;
	} else if (groupNumber === 5 || groupNumber === 6) {
		this.houseprice = 100;
	} else if (groupNumber === 7 || groupNumber === 8) {
		this.houseprice = 150;
	} else if (groupNumber === 9 || groupNumber === 10) {
		this.houseprice = 200;
	} else {
		this.houseprice = 0;
	}
}

function Card(text, action) {
	this.text = text;
	this.action = action;
}

function corrections() {
	document.getElementById("cell24name").textContent = "blooming...";
}

function utiltext() {
	return '&nbsp;&nbsp;&nbsp;&nbsp;If one "Utility" is owned rent is 4 times amount shown on dice.<br /><br />&nbsp;&nbsp;&nbsp;&nbsp;If both "Utilitys" are owned rent is 10 times amount shown on dice.';
}

function transtext() {
	return '<div style="font-size: 14px; line-height: 1.5;">Rent<span style="float: right;">$25.</span><br />If 2 Transportations are owned<span style="float: right;">50.</span><br />If 3 &nbsp; &nbsp; " &nbsp; &nbsp; " &nbsp; &nbsp; "<span style="float: right;">100.</span><br />If 4 &nbsp; &nbsp; " &nbsp; &nbsp; " &nbsp; &nbsp; "<span style="float: right;">200.</span></div>';
}

function citytax() {
	var p = player[turn];

	if (p.human) {

		buttonAonclick = 'hide("popupbackground"); hide("popupwrap"); var p=player[turn]; addalert(p.name+" paid $200 for landing on City Tax."); p.pay(200, 0);';
		buttonBonclick = ' hide("popupbackground"); hide("popupwrap"); var p=player[turn]; var cost=p.money; for(var i=0; i<40; i++){sq=square[i]; if(sq.owner==turn) { if(sq.mortgage) { cost+=sq.price*0.5; } else { cost+=sq.price; } cost+=(sq.house*sq.houseprice); } } cost*=0.1; cost=Math.round(cost); addalert(p.name+" paid $"+cost+" for landing on City Tax."); p.pay(cost,0);';

		popup("You landed on City Tax. You must pay $200 or ten percent of your total worth.<div><input type='button' value='Pay $200' onclick='" + buttonAonclick + "' /><input type='button' value='Pay 10%' onclick='" + buttonBonclick + "' /></div>", false);
	} else {
		addalert(p.name + " paid $200 for landing on City Tax.");
		p.pay(200, 0);
	}
}

function luxurytax() {
	addalert(player[turn].name + " paid $75 for landing on Luxury Tax.");
	player[turn].pay(75, 0);

	$("landed").show().text("You landed on Luxury Tax. Pay $75.");
}

var square = [];

square[0] = new Square("Fontaine", "RECEVEZ 200 GOLD EN PASSANT ICI.", "white");

// GROUPE MARRON (Sivir & Skarner)
square[1] = new Square("Sivir", "60 Gold", "#955438", 60, 3, 2, 10, 30, 90, 160, 250);
square[2] = new Square("Coffre Hextech", "BUTIN EN COURS D'OUVERTURE...", "white");
square[3] = new Square("Skarner", "60 Gold", "#955438", 60, 3, 4, 20, 60, 180, 320, 450);

square[4] = new Square("Taxe de Sbires", "PAYEZ 10% OU 200 GOLD", "white");

// GARE 1
square[5] = new Square("Dragon des Océans", "200 Gold", "white", 200, 1);

// GROUPE GRIS - FRELJORD (Lissandra, Volibear, Ornn)
square[6] = new Square("Lissandra", "100 Gold", "#AACCFF", 100, 4, 6, 30, 90, 270, 400, 550);
square[7] = new Square("Ping SS", "ENNEMI DISPARU ! SURPRISE...", "white");
square[8] = new Square("Volibear", "100 Gold", "#AACCFF", 100, 4, 6, 30, 90, 270, 400, 550);
square[9] = new Square("Ornn", "120 Gold", "#AACCFF", 120, 4, 8, 40, 100, 300, 450, 600);

square[10] = new Square("Juste en visite", "", "white");

// GROUPE ROSE - IONIA (Shen, Karma, Irelia)
square[11] = new Square("Shen", "140 Gold", "purple", 140, 5, 10, 50, 150, 450, 625, 750);
square[12] = new Square("Potion de HP", "150 Gold", "white", 150, 2);
square[13] = new Square("Karma", "140 Gold", "purple", 140, 5, 10, 50, 150, 450, 625, 750);
square[14] = new Square("Irelia", "160 Gold", "purple", 160, 5, 12, 60, 180, 500, 700, 900);

// GARE 2
square[15] = new Square("Dragon de Montagne", "200 Gold", "white", 200, 1);

// GROUPE ORANGE - SHURIMA (Azir, Renekton, Nasus)
square[16] = new Square("Azir", "180 Gold", "orange", 180, 6, 14, 70, 200, 550, 750, 950);
square[17] = new Square("Coffre Hextech", "BUTIN EN COURS D'OUVERTURE...", "white");
square[18] = new Square("Renekton", "180 Gold", "orange", 180, 6, 14, 70, 200, 550, 750, 950);
square[19] = new Square("Nasus", "200 Gold", "orange", 200, 6, 16, 80, 220, 600, 800, 1000);

square[20] = new Square("Pause Café (Scuttle)", "", "white");

// GROUPE ROUGE - NOXUS (Sion, Kled, Swain)
square[21] = new Square("Sion", "220 Gold", "red", 220, 7, 18, 90, 250, 700, 875, 1050);
square[22] = new Square("Ping SS", "ENNEMI DISPARU ! SURPRISE...", "white");
square[23] = new Square("Kled", "220 Gold", "red", 220, 7, 18, 90, 250, 700, 875, 1050);
square[24] = new Square("Swain", "240 Gold", "red", 240, 7, 20, 100, 300, 750, 925, 1100);

// GARE 3
square[25] = new Square("Dragon Infernal", "200 Gold", "white", 200, 1);

// GROUPE JAUNE - TARGON (Taric, Leona, Diana)
square[26] = new Square("Taric", "260 Gold", "yellow", 260, 8, 22, 110, 330, 800, 975, 1150);
square[27] = new Square("Leona", "260 Gold", "yellow", 260, 8, 22, 110, 330, 800, 975, 1150);
square[28] = new Square("Potion de Mana", "150 Gold", "white", 150, 2);
square[29] = new Square("Diana", "280 Gold", "yellow", 280, 8, 24, 120, 360, 850, 1025, 1200);

square[30] = new Square("Allez en Prison", "Blitzcrank vous attrape !", "white");

// GROUPE VERT - ZAUN (Warwick, Singed, Urgot)
square[31] = new Square("Warwick", "300 Gold", "green", 300, 9, 26, 130, 390, 900, 1100, 1275);
square[32] = new Square("Singed", "300 Gold", "green", 300, 9, 26, 130, 390, 900, 1100, 1275);
square[33] = new Square("Coffre Hextech", "BUTIN EN COURS D'OUVERTURE...", "white");
square[34] = new Square("Urgot", "320 Gold", "green", 320, 9, 28, 150, 450, 1000, 1200, 1400);

// GARE 4
square[35] = new Square("Dragon de Vent", "200 Gold", "white", 200, 1);

square[36] = new Square("Ping SS", "ENNEMI DISPARU ! SURPRISE...", "white");

// GROUPE BLEU - FRÈRES IONIENS (Yone & Yasuo)
square[37] = new Square("Yone", "350 Gold", "blue", 350, 10, 35, 175, 500, 1100, 1300, 1500);
square[38] = new Square("BOUTIQUE", "Payez 75 Gold", "white");
square[39] = new Square("Yasuo", "400 Gold", "blue", 400, 10, 50, 200, 600, 1400, 1700, 2000);

var communityChestCards = [];
var chanceCards = [];
communityChestCards[0] = new Card("Vous achetez un QSS, vous échappez à tout contrôle. Sortez de prison gratuitement. Carte à conserver.", function() { p.communityChestJailCard = true; updateOwned();});
communityChestCards[1] = new Card("Gangplank lance son ultime. Gagnez 10 gold.", function() { addamount(10, 'Community Chest');});
communityChestCards[2] = new Card("Vos runes First Strike s’activent parfaitement. Gagnez 45 gold.", function() { addamount(45, 'Community Chest');});
communityChestCards[3] = new Card("Vous participez à une élimination. Assist sur un kill : gagnez 100 gold.", function() { addamount(100, 'Community Chest');});
communityChestCards[4] = new Card("Votre rune Cashback vous récompense. Gagnez 20 gold.", function() { addamount(20, 'Community Chest');});
communityChestCards[5] = new Card("Pyke exécute un ennemi avec son ultime. Partage du butin : gagnez 100 gold.", function() { addamount(100, 'Community Chest');});
communityChestCards[6] = new Card("Vous dominez complètement votre lane. Mid gap : gagnez 100 gold.", function() { addamount(100, 'Community Chest');});
communityChestCards[7] = new Card("Une pluie d’or tombe sur la Faille. Gagnez 25 gold.", function() { addamount(25, 'Community Chest');});
communityChestCards[8] = new Card("Vous achetez une balise de contrôle (pink ward). Payez 100 gold.", function() { subtractamount(100, 'Community Chest');});
communityChestCards[9] = new Card("Vous récupérez un shutdown important. Gagnez 200 gold.", function() { addamount(200, 'Community Chest');});
communityChestCards[10] = new Card("Vous achetez un élixir de rage. Payez 150 gold.", function() { subtractamount(150, 'Community Chest');});
communityChestCards[11] = new Card("Vous achetez une potion pour survivre en lane. Payez 50 gold.", function() { subtractamount(50, 'Community Chest');});
communityChestCards[12] = new Card("Vous recevez 9 honneurs après la partie. Chaque joueur vous donne 50 gold.", function() { collectfromeachplayer(50, 'Community Chest');});
communityChestCards[13] = new Card("Vous lancez un recall. Retournez à la case départ (Collectez 200 gold).", function() { advance(0);});
communityChestCards[14] = new Card("Vos structures sont en ruine après un siège. Payez 40 gold par inhibiteur et 115 gold par nexus.", function() { streetrepairs(40, 115);});
communityChestCards[15] = new Card("Blitzcrank vous attrape avec son Q. Allez directement en prison. Ne passez pas par la case départ.", function() { gotojail();});


chanceCards[0] = new Card("Vous achetez un QSS, vous échappez à tout contrôle. Sortez de prison gratuitement. Carte à conserver.", function() { p.chanceJailCard=true; updateOwned();});
chanceCards[1] = new Card("Vos structures sont endommagées après un siège. Payez 25 gold par inhibiteur et 100 gold par nexus.", function() { streetrepairs(25, 100);});
chanceCards[2] = new Card("Vous achetez une épée longue pour renforcer votre équipement. Payez 15 gold.", function() { subtractamount(15, 'Chance');});
chanceCards[3] = new Card("Vous recevez 4 honneurs après la partie. Donnez 50 gold à chaque joueur.", function() { payeachplayer(50, 'Chance');});
chanceCards[4] = new Card("Ekko remonte le temps avec son ultime. Reculez de 3 cases.", function() { gobackthreespaces();});
chanceCards[5] = new Card("Vous utilisez une plante de soin. Avancez jusqu’au prochain point de heal. S’il est possédé, payez le double.", function() { advanceToNearestUtility();});
chanceCards[6] = new Card("Twisted Fate vous fait gagner au jeu. Recevez 20 gold.", function() { addamount(20, 'Chance');});
chanceCards[7] = new Card("Vous utilisez un téléport vers le dragon. Avancez jusqu’à la prochaine gare. Si elle est possédée, payez le double.", function() { advanceToNearestRailroad();});
chanceCards[8] = new Card("Vous découvrez un artefact ancien. Avancez jusqu’à la case Ornn.", function() { advance(9); });
chanceCards[9] = new Card("Vous allez voir le général. Avancez directement à la case Swain.", function() { advance(31);});
chanceCards[10] = new Card("Vous partez en duel contre Yasuo. Avancez directement à la case Yasuo.", function() { advance(39);});
chanceCards[11] = new Card("Shen vous protège avec son ultime. Avancez directement à la case Shen.", function() { advance(13);});
chanceCards[12] = new Card("Vous réalisez un solo kill. Gagnez 150 gold.", function() { addamount(150, 'Chance');});
chanceCards[13] = new Card("Vous utilisez un téléport vers le dragon. Avancez jusqu’à la prochaine gare. Si elle est possédée, payez le double.", function() { advanceToNearestRailroad();});
chanceCards[14] = new Card("Vous vous dirigez vers le dragon des océans. Avancez jusqu’à cette case.", function() { advance(5); });
chanceCards[15] = new Card("Nautilus vous attrape avec son Q. Allez directement en prison. Ne passez pas par la case départ.", function() { gotojail();});
