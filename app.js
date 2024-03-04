const readline = require('readline');
const Agent = require('./agent');
const Socket = require('./socket');
const Controller = require('./controller');
const Manager = require("./manager");
const dt = require("./goal_dt");
const dt2 = require("./echelon2_dt");
const dt2_2 = require("./echelon2_dt2");
const goal_keep_dt = require("./goal_keeper_dt");
const VERSION = 7;


(async () => {
    let playerCords1, playerCords2, rotationSpeed;

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    const it = rl[Symbol.asyncIterator]();

    console.log('Enter first player coords (x,y):');
    playerCords1 = (await it.next()).value.split(' ').map((a) => +a);
    console.log('Enter second player coords (x,y):');
    playerCords2 = (await it.next()).value.split(' ').map((a) => +a);    
    rl.close();


    let player1 = new Agent('A');
    player1.dt = dt2;
    player1.manager = new Manager();

    let player2 = new Agent('A');
    player2.dt = dt2_2;
    player2.manager = new Manager();

    let goalKeeper = new Agent("B");
    goalKeeper.dt = goal_keep_dt;
    goalKeeper.manager = new Manager();
    goalKeeper.goalie = true;

    await Socket(player1, 'A', VERSION);
    await Socket(player2, 'A', VERSION);
    await Socket(goalKeeper, 'B', VERSION, true);

    await player1.socketSend('move', `${playerCords1[0]} ${playerCords1[1]}`);
    await player2.socketSend('move', `${playerCords2[0]} ${playerCords2[1]}`);
    await goalKeeper.socketSend('move', "-20 0");    
})();
