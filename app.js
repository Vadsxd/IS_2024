const readline = require('readline');
const Agent = require('./agent');
const Socket = require('./socket');
const low_ctrl = require("./field_player_low");
const high_ctrl = require("./field_player_high");
const VERSION = 7;

const goalie_low = require("./ctrl_low");
const goalie_middle = require("./ctrl_middle");
const goalie_high = require("./ctrl_high");

function createAgent(team, goalkeeper, controllers, bottom, top, center, start_x, start_y){
    let agent = new Agent(team, goalkeeper);
    agent.bottom = bottom;
    agent.top = top;
    agent.center = center;
    agent.controllers = controllers;
    agent.start_x = start_x;
    agent.start_y = start_y;
    return agent;
}

(async () => {
    let A_team = [
        [-40, -20, -35, -40, -30],
        [-20, 0, -35, -40, -10],
        [0, 20, -35, -40, 10],
        [20, 40, 35, -40, 30],

        [-40, -20, -25, -25, -30],
        [-20, 0, -25, -25, -10],
        [0, 20, -25, -25, 10],
        [20, 40, -25, -25, 30],


        [-40, 0, -10, -10, -20],
        [0, 40, -10, -10, 20],
    ]

    let B_team = [
        [-40, -20, -35, -40, 30],
        [-20, 0, -35, -40, 10],
        [0, 20, -35, -40, -10],
        [20, 40, 35, -40, -30],

        [-40, -20, -25, -25, 30],
        [-20, 0, -25, -25, 10],
        [0, 20, -25, -25, -10],
        [20, 40, -25, -25, -30],


        [-40, 0, -10, -10, 20],
        [0, 40, -10, -10, -20],
    ]
    let players = [];
    
    
    for (const pl of A_team){
        players.push(createAgent("A", false, [low_ctrl, high_ctrl], 
            pl[1], pl[0], pl[2], pl[3], pl[4]))
    }
    
    
    for (const pl of B_team){
        players.push(createAgent("B", false, [low_ctrl, high_ctrl], 
            pl[1], pl[0], pl[2], pl[3], pl[4]))
    }
    

    
    let goalkeeper_A = new Agent("A", true);
    goalkeeper_A.start_x = -50;
    goalkeeper_A.start_y = 0;
    let goalkeeper_B = new Agent("B", true);
    goalkeeper_B.start_x = -50;
    goalkeeper_B.start_y = 0;

    goalkeeper_A.taken.action = "return";
    goalkeeper_A.taken.turnData = "ft0";
    goalkeeper_A.taken.wait = 0;

    goalkeeper_B.taken.action = "return";
    goalkeeper_B.taken.turnData = "ft0";
    goalkeeper_B.taken.wait = 0;


    goalkeeper_A.controllers = [goalie_low, goalie_middle, goalie_high];
    goalkeeper_B.controllers = [goalie_low, goalie_middle, goalie_high];

    await Socket(goalkeeper_A, "A", VERSION, true);
    await goalkeeper_A.socketSend('move', `${goalkeeper_A.start_x} ${goalkeeper_A.start_y}`);

    await Socket(goalkeeper_B, goalkeeper_B.teamName, VERSION, true);
    await goalkeeper_B.socketSend('move', `${goalkeeper_B.start_x} ${goalkeeper_B.start_y}`);


    for (const player of players){
        await Socket(player, player.teamName, VERSION);
        //console.log("move ", player.start_x, player.start_y);
        await player.socketSend('move', `${player.start_x} ${player.start_y}`);

    }
})();
