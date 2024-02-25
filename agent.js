const Msg = require('./msg');
const readline = require('readline');
const utils = require("./utils");

class Agent {
    constructor() {
        this.position = 'l'; // По умолчанию - левая половина поля
        this.run = false; // Игра начата
        this.act = null; // Действия
        this.rotationSpeed = null; // скорость вращения
        this.x_boundary = 57.5;
        this.y_boundary = 39;
        /*
        this.rl = readline.createInterface({
            // Чтение консоли
            input: process.stdin,
            output: process.stdout,
        });
        this.posMethod = '3P';

        this.rl.on('line', (input) => {
            // Обработка строки из кон—
            if (this.run) {
                // Если игра начата
                // ДВижения вперед, вправо, влево, удар по мячу

                if ('w' === input) this.act = {n: 'dash', v: 100};
                if ('d' === input) this.act = {n: 'turn', v: 20};
                if ('a' === input) this.act = {n: 'turn', v: -20};
                if ('s' === input) this.act = {n: 'kick', v: 100};
            }
        });
        */
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

    async socketSend(cmd, value) {
        // Отправка команды
        await this.socket.sendMsg(`(${cmd} ${value})`);
    }

    processMsg(msg) {
        // Обработка сообщения
        let data = Msg.parseMsg(msg); // Разбор сообщения
        if (!data) throw new Error('Parse error\n' + msg);
        // Первое (hear) — начало игры
        if (data.cmd === 'hear') this.run = true;
        if (data.cmd === 'init') this.initAgent(data.p); // Инициализация
        this.analyzeEnv(data.msg, data.cmd, data.p); // Обработка
    }

    initAgent(p) {
        if (p[0] === 'r') this.position = 'r'; // Правая половина поля
        if (p[1]) this.id = p[1]; // id игрока
    }

    analyzeEnv(msg, cmd, p) {
        // анализ сообщения
        //this.act = {n: 'turn', v: 20};
        /*
        console.log("message: ", msg);
        console.log("cmd: ", cmd)
        console.log("p: ", p)
        if (cmd === "see"){
            console.log("Array: ", p[1]["cmd"]["p"])
        }
        */

        
        if (this.rotationSpeed){
            this.act = {n: 'turn', v: this.rotationSpeed};
        }

        let flag1 = null;
        let flag2 = null;
        let flag3 = null;
        //flags_params = null;
        if (cmd === "see"){
            let flags = utils.get_flags(p);
            console.log(flags);
            //console.log(flags);
            
            if (flags.length === 2){
                flag1 = flags[0];
                flag2 = flags[1];
                let coordinates = utils.solveby2(flag1[2], flag2[2], flag1[0], flag1[1], flag2[0], flag2[1],
                    flag1[3], flag2[3], this.x_boundary, this.y_boundary);
                console.log(coordinates);
            }

            if (flags.length === 3){
                flag1 = flags[0];
                flag2 = flags[1];
                flag3 = flags[2];
                let coordinates = utils.solveby3(flag1[2], flag2[2], flag3[2], flag1[0], flag1[1], flag2[0], flag2[1],
                    flag1[3], flag2[3], flag3[0], flag3[1]);
                console.log(coordinates);
            }

            
            //flags_params.push(this.x_boundary, this.y_boundary);
        }
        
    }

    sendCmd() {
        if (this.run) {
            // Игра начата
            if (this.act) {
                // Есть команда от игрока
                if (this.act.n === 'kick')
                    // Пнуть мяч
                    this.socketSend(this.act.n, this.act.v + ' 0');
                // Движение и поворот
                else this.socketSend(this.act.n, this.act.v);
            }
            this.act = null; // Сброс команды
        }
    }
}

module.exports = Agent;

