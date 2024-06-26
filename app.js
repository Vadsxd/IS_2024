const readline = require('readline');
const Agent = require('./agent');
const Socket = require('./socket');
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
    console.log('Enter second player coords (x y):');
    playerCords2 = (await it.next()).value.split(' ').map((a) => +a);
    console.log('Enter first player rotation speed:');
    rotationSpeed = +(await it.next()).value;
    rl.close();

    let player1 = new Agent('A');
    player1.rotationSpeed = rotationSpeed;
    let player2 = new Agent('B');

    await Socket(player1, 'A', VERSION);
    await Socket(player2, 'B', VERSION);

    await player1.socketSend('move', `${playerCords1[0]} ${playerCords1[1]}`)
    await player2.socketSend('move', `${playerCords2[0]} ${playerCords2[1]}`)
})();
