const readline = require('readline');
const Agent = require('./agent');
const Socket = require('./socket');
const Controller = require('./controller');
const Manager = require("./manager");
const dt2 = require("./echelon2_dt2");
const VERSION = 7;


(async () => {
    let assist_playerCords, score_playerCords, rotationSpeed, npc1Cords, npc2Cords;

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    const it = rl[Symbol.asyncIterator]();

    score_playerCords = [-20, 0];
    goalkeeper_coords = [-40, 0];
    /*
    let score_player = new Agent('A');
    score_player.playerName = "score_player";
    score_player.dt = dt2;
    score_player.manager = new Manager();
    */
    let score_player = new Agent("A", false);
    let goalkeeper = new Agent("B", true);

    await Socket(score_player, 'A', VERSION);
    await Socket(goalkeeper, 'B', VERSION);

    await score_player.socketSend('move', `${score_playerCords[0]} ${score_playerCords[1]}`);
    await goalkeeper.socketSend('move', `${goalkeeper_coords[0]} ${goalkeeper_coords[1]}`);


})();
