const readline = require('readline');
const Agent = require('./agent');
const Socket = require('./socket');
const Controller = require('./controller');
const Manager = require("./manager");
const dt = require("./goal_scorer_dt");
const dt2 = require("./assist_player_dt");
const VERSION = 7;


(async () => {
    let assist_playerCords, score_playerCords, rotationSpeed, npc1Cords, npc2Cords;

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    const it = rl[Symbol.asyncIterator]();

    assist_playerCords = [-20, 0];
    score_playerCords = [-20, 20];

    npc1Cords = [-57.5, -38];
    npc2Cords = [-57.5, 38];


    let assist_player = new Agent('A');
    assist_player.playerName = "assist_player";
    assist_player.dt = dt2;
    assist_player.manager = new Manager();

    let score_player = new Agent('A');
    score_player.playerName = "score_player";
    score_player.dt = dt;
    score_player.manager = new Manager();

    let npc1 = new Agent("B");
    let npc2 = new Agent("B");

    await Socket(assist_player, 'A', VERSION);
    await Socket(score_player, 'A', VERSION);

    await Socket(npc1, 'B', VERSION);
    await Socket(npc2, 'B', VERSION);

    await assist_player.socketSend('move', `${assist_playerCords[0]} ${assist_playerCords[1]}`);
    await score_player.socketSend('move', `${score_playerCords[0]} ${score_playerCords[1]}`);

    await npc1.socketSend('move', `${npc1Cords[0]} ${npc1Cords[1]}`);
    await npc2.socketSend('move', `${npc2Cords[0]} ${npc2Cords[1]}`);  
})();
