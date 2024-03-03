const Msg = require('./msg');
const readline = require('readline');
const utils = require("./utils");

class Agent {
    constructor(teamName) {
        this.position = 'l'; // По умолчанию - левая половина поля
        this.run = false; // Игра начата
        this.act = null; // Действия
        this.rotationSpeed = null; // скорость вращения
        this.x_boundary = 57.5;
        this.y_boundary = 39;
        this.teamName = teamName;
        this.DirectionOfSpeed = null;
    }

    get_unit_vector(Direction) {
        if (!this.DirectionOfSpeed) {
            return;
        }

        if (this.teamName === 'A') {
            let angle = this.DirectionOfSpeed - Direction;
            angle = angle * Math.PI / 180;

            return [Math.cos(angle), -Math.sin(angle)];
        }
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
        if (this.rotationSpeed) {
            if (!this.act) {
                this.act = {n: 'turn', v: this.rotationSpeed};
            }
        } else {
            return;
        }

        if (cmd === "sense_body") {
            this.DirectionOfSpeed = p[3]['p'][1];
        }

        if (cmd === "see") {
            let flag1 = null;
            let flag2 = null;
            let flag3 = null;
            let coordinates;
            let flags_and_objects = utils.get_flags_and_objects(p);
            let flags = flags_and_objects[0];
            let objects = flags_and_objects[1];

            if (flags.length === 2) {
                flag1 = flags[0];
                flag2 = flags[1];
                let e1 = this.get_unit_vector(flag1[3]);
                let e2 = this.get_unit_vector(flag2[3]);

                coordinates = utils.solveBy2(flag1[2], flag2[2], flag1[0], flag1[1], flag2[0], flag2[1],
                    e1, e2, this.x_boundary, this.y_boundary);
                if (coordinates) {
                    console.log("coordinates:", coordinates);
                }

            }

            if (flags.length === 3) {
                flag1 = flags[0];
                flag2 = flags[1];
                flag3 = flags[2];
                coordinates = utils.solveBy3(flag1[2], flag2[2], flag3[2], flag1[0], flag1[1],
                    flag2[0], flag2[1], flag3[0], flag3[1]);
                console.log("coordinates:", coordinates);
            }

            if (objects.length > 0) {
                let object = objects[0];
                let eo = this.get_unit_vector(object[1]);
                if (!eo) {
                    return;
                }
                let obj_coords = utils.get_object_coords(flag1[2], object[0], coordinates[0], coordinates[1], flag1[0], flag1[1], flag1[3], object[1], eo);
                if (obj_coords) {
                    console.log("obj_coords:", obj_coords);
                }
            }
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

