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
        this.x_boundary = 57.5;
        this.y_boundary = 39;
        this.DirectionOfSpeed = null;
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

        // if (cmd === "hear"){
        //     this.writeHearData(p);
        // }

        // if (cmd === "sense_body"){
        //     this.writeSenseData(p);
        // }
        
        if (!this.prevTact || this.prevTact < tact || !this.act){
            // console.log(this.playerName, cmd);
            // console.log(this.act, this.prevTact, tact);
            this.prevTact = tact;
            this.act = null;
            this.act = this.manager.getAction(this.dt, p, cmd);
            // console.log("-------------------");
        }
    }

    writeSeeData(p) {
        this.state["time"] = p[0];
        let coordinates = this.get_x_y(p);
        let posJson = {};
        posJson["x"] = coordinates[0];
        posJson["y"] = coordinates[1];
        this.state["pos"] = posJson;
        for (const obj of p) {
            if (typeof obj === 'number'){
                continue;
            }

            if (obj['cmd']['p'].join('') === 'gr') {
                let goalJson = {};
                goalJson["x"] = 72.2;
                goalJson["y"] = 0;
                goalJson["f"] = "gr";
                goalJson["angle"] = obj['p'][1];
                goalJson["dist"] = obj['p'][0];
                this.state["goal"] = goalJson;
            }

            if (obj['cmd']['p'].join('') === 'b') {
                this.state["ballPrev"] = this.state["ball"];
                let ballJson = {};
                let coordinates = utils.get_object_coords();
                ballJson["f"] = "b";
                ballJson["angle"] = obj['p'][1];
                ballJson["dist"] = obj['p'][0];
                this.state["ball"] = ballJson;
            }

            if (obj['cmd']['p'].join('') === 'p') {
                this.state["playerPrev"] = this.state["player"];
                let playerJson = {};
                playerJson["angle"] = obj['p'][1];
                playerJson["dist"] = obj['p'][0];
                this.state["player"] = playerJson;
            }
        }
        console.log(this.state);
    }

    get_x_y(p){
        let flag1 = null;
        let flag2 = null;
        let flag3 = null;
        let coordinates;
        let flags_and_objects = utils.get_flags_and_objects_2(p);
        let flags = flags_and_objects[0];
        let objects = flags_and_objects[1];

        if (flags.length === 2){
            flag1 = flags[0];
            flag2 = flags[1];
            let e1 = this.get_unit_vector(flag1[3]);
            let e2 = this.get_unit_vector(flag2[3]);

            coordinates = utils.solveby2(flag1[2], flag2[2], flag1[0], flag1[1], flag2[0], flag2[1],
                e1, e2, this.x_boundary, this.y_boundary);

            if (coordinates){
                return coordinates;
            }

        }

        if (flags.length === 3){
            flag1 = flags[0];
            flag2 = flags[1];
            flag3 = flags[2];
            coordinates = utils.solveby3(flag1[2], flag2[2], flag3[2], flag1[0], flag1[1],
                flag2[0], flag2[1], flag3[0], flag3[1]);

            return coordinates;
        }

        if (objects.length > 0){
            let object = objects[0];
            console.log("objects: ", object);
            let eo = this.get_unit_vector(object[1]);
            if (!eo){
                return;
            }
            let obj_coords = utils.get_object_coords(flag1[2], object[0], coordinates[0], coordinates[1], flag1[0], flag1[1], flag1[3], object[1], eo);
            if (obj_coords){
                //console.log("obj_coords:", obj_coords);
            }
        }
    }

    get_unit_vector(Direction){
        if (!this.DirectionOfSpeed){
            return;
        }
        if (this.teamName === 'A'){
            let angle = this.DirectionOfSpeed - Direction;
            angle = angle * Math.PI / 180;

            return [Math.cos(angle), -Math.sin(angle)];
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

