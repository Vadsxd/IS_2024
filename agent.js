const Msg = require('./msg');
const readline = require('readline');
const utils = require("./utils");

// имя первого игрока: p"A"1

class Agent {
    constructor(teamName) {
        this.run = true; // Игра начата
        this.act = null; // Действия
        this.teamName = teamName;
        this.prevTact = null;
        this.playerName = "";
        this.state = {}; // начальное состояние игрока
    }

    msgGot(msg) {
        // Получение сообщения
        let data = msg.toString(); // Приведение
        this.processMsg(data); // Разбор сообщения
        this.sendCmd(); // Отправка команды
    }

    setSocket(socket) {
        // Настройка сокета
        this.socket = socket;
    }

    async socketSend(cmd, value, goalie) {
        // Отправка команды
        await this.socket.sendMsg(`(${cmd} ${value})`);
    }

    processMsg(msg) {
        // Обработка сообщения
        let data = Msg.parseMsg(msg); // Разбор сообщения
        if (!data) throw new Error('Parse error\n' + msg);
        if (data.cmd === 'init') this.initAgent(data.p); // Инициализация
        this.analyzeEnv(data.msg, data.cmd, data.p); // Обработка
    }

    initAgent(p) {
        if (p[0] === 'r') this.position = 'r'; // Правая половина поля
        if (p[1]) this.id = p[1]; // id игрока
    }

    analyzeEnv(msg, cmd, p) {
        if (this.teamName === "B"){
            return;
        }
        
        let tact = p[0];

        if (cmd === "see"){
            this.writeSeeData(p);
        }

        if (cmd === "hear"){
            this.writeHearData(p);
        }

        if (cmd === "sense_body"){
            this.writeSenseData(p);
        }
        
        if (!this.prevTact || this.prevTact < tact || !this.act){
            console.log(this.playerName, cmd);
            console.log(this.act, this.prevTact, tact);
            this.prevTact = tact;
            this.act = null;
            this.act = this.manager.getAction(this.dt, p, cmd);
            console.log("-------------------");
        }
    }

    sendCmd() {
        //console.log(this.act);
        if (this.run) {
            // Игра начата
            if (this.act) {
                // Есть команда от игрока
                if (this.act.n === 'kick')
                    // Пнуть мяч
                    this.socketSend(this.act.n, this.act.v);
                // Движение и поворот
                else this.socketSend(this.act.n, this.act.v);
            }
            //this.act = null; // Сброс команды
        }
    }
}

module.exports = Agent;

