const Agent = require('./agent');
const Socket = require('./socket');
const VERSION = 7;


(async () => {
    let score_playerCords = [-20, 0];
    let goalkeeper_coords = [-40, 0];

    let score_player = new Agent("A", false);
    let goalkeeper = new Agent("B", true);

    await Socket(score_player, 'A', VERSION);
    await Socket(goalkeeper, 'B', VERSION);

    await score_player.socketSend('move', `${score_playerCords[0]} ${score_playerCords[1]}`);
    await goalkeeper.socketSend('move', `${goalkeeper_coords[0]} ${goalkeeper_coords[1]}`);
})();
