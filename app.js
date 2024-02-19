const readline = require('readline');
const Agent = require('./agent');
const Socket = require('./socket');
const VERSION = 7;

(async () => {
    let agent = new Agent();
    await Socket(agent, 'A', VERSION);
    await agent.socketSend('move', '-30 0')
})();
