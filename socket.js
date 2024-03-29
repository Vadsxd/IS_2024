const dgram = require('dgram');

module.exports = async (agent, teamName, version, goalie) => {
    const socket = dgram.createSocket({type: 'udp4', reuseAddr: true});

    agent.setSocket(socket);

    socket.on('message', (msg, info) => {
        agent.msgGot(msg);
    });

    socket.sendMsg = (msg) => {
        return new Promise((resolve, reject) => {
            socket.send(Buffer.from(msg), 6000, 'localhost', (err, bytes) => {
                //console.log(msg);
                if (err) reject(err);
                resolve(bytes);
            });
        });
    };

    if (!goalie){
        await socket.sendMsg(`(init ${teamName} (version ${version}))`);    
    } else {
        await socket.sendMsg(`(init ${teamName} (version ${version}) (goalie))`);
    }
    
};