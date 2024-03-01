const Msg = require('./msg');
const readline = require('readline');
const utils = require("./utils");

class Agent {
    constructor(teamName, controller) {
        this.position = 'l'; // По умолчанию - левая половина поля
        this.run = false; // Игра начата
        this.act = null; // Действия
        this.rotationSpeed = null; // скорость вращения
        this.x_boundary = 57.5;
        this.y_boundary = 39;
        this.teamName = teamName;
        this.DirectionOfSpeed = null;
        this.controller = controller;
        this.turnSpeed = 10; // скорость вращения
        this.flag_distance_epsilon = 1; // значение близости к флагу
        this.flag_direction_epsilon = 10; // значение близости по углу
        this.max_speed = 100; // максимальная скорость
        this.ball_direction_epsilon = 0.5;
    }

    get_unit_vector(Direction){
        if (!this.DirectionOfSpeed){
            return;
        }
        if (this.teamName === 'A'){
            var angle = this.DirectionOfSpeed -  Direction;
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
        if (data.cmd === 'init') this.initAgent(data.p); // Инициализация
        this.analyzeEnv(data.msg, data.cmd, data.p); // Обработка
    }

    initAgent(p) {
        if (p[0] === 'r') this.position = 'r'; // Правая половина поля
        if (p[1]) this.id = p[1]; // id игрока
    }

    see_object(obj_name, see_data){
        /*
        Если объект не виден, возвращает null.
        Если объект виден, возвращает пространственные характеристики
        в формате [Distance, Direction, ...]
        */
        for (const obj of see_data){
            if (typeof obj === 'number'){
                continue;
            }
            let cur_obj_name = obj['cmd']['p'].join('');
            if (cur_obj_name === obj_name){
                return obj['p'];
            }
        }
        return null;
    }

    search_obj(obj_name){
        // Выдает действие для поиска объекта
        return {n: 'turn', v: this.turnSpeed};
    }

    get_flag_actions(see_data, flag_name){
        let obj = this.see_object(flag_name, see_data);
        if (!obj){
            return this.search_obj(flag_name);
        }

        let direction = obj[1];
        let distance = obj[0];

        if (distance < this.flag_distance_epsilon){
            return "complete";
        }

        if (Math.abs(direction) >= this.flag_direction_epsilon){
            return {n: "turn", v: direction};
        }

        let dash = 0;
        if (distance > 5){
            dash = this.max_speed;
        } else {
            dash = 20;
        }
        
        
        return {n: 'dash', v: dash};

    }

    get_kick_actions(see_data, flag_name){
        let ball_name = 'b';
        let ball = this.see_object(ball_name, see_data);
        if (!ball){
            return this.search_obj(ball_name);
        }

        let direction = ball[1];
        let distance = ball[0];

        if (distance < this.ball_direction_epsilon){
            let flag = this.see_object(flag_name, see_data);
            if (!flag){
                return {n: 'kick', v: 10, d: 45}
            }
            return {n: "kick", v: 100, d: flag[1]}
        }

        if (Math.abs(direction) >= this.flag_direction_epsilon){
            return {n: "turn", v: direction};
        }

        let dash = 0;
        if (distance > 5){
            dash = this.max_speed;
        } else {
            dash = 20;
        }
        
        return {n: 'dash', v: dash};

    }

    analyzeEnv(msg, cmd, p) {

        if (cmd === "hear"){
            if (p[2] === "play_on"){
                this.run = true;
            }
            if (p[2].includes("goal")){
                this.run = false;
                this.controller.cur = 0;
            }
        }

        if (!this.run){
            return;
        }

        if (cmd === "sense_body"){
            this.DirectionOfSpeed = p[3]['p'][1];
        }

        if (cmd === "see"){
            let cur_task = this.controller.get_current_task();
            if (cur_task['act'] === "flag"){
                this.act = this.get_flag_actions(p, cur_task["fl"]);
            } else if (cur_task['act'] === 'kick'){
                this.act = this.get_kick_actions(p, cur_task["goal"]);
            }
            if (this.act === "complete"){
                this.controller.cur += 1;
                this.act = null;
            }
        }
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
            //console.log(flags);
            flag1 = flags[0];
            flag2 = flags[1];
            let e1 = this.get_unit_vector(flag1[3]);
            let e2 = this.get_unit_vector(flag2[3]);

            let object;
            let obj_coords;
            coordinates = utils.solveby2(flag1[2], flag2[2], flag1[0], flag1[1], flag2[0], flag2[1],
                e1, e2, this.x_boundary, this.y_boundary);
            if (coordinates){
                //console.log('coordinates:', coordinates);   
            }
                
        }

        if (flags.length === 3){
            flag1 = flags[0];
            flag2 = flags[1];
            flag3 = flags[2];
            coordinates = utils.solveby3(flag1[2], flag2[2], flag3[2], flag1[0], flag1[1],
                flag2[0], flag2[1], flag3[0], flag3[1]);
                //if (!isNaN(coordinates[0]) && !isNaN(coordinates[0]) && coordinates[1] !== -Infinity) {
                //    console.log('coordinates:', coordinates);
                //}
                //console.log("coordinates: ", coordinates);
        }

        if (objects.length > 0){
            let object = objects[0];
                //console.log(object);
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
    

    sendCmd() {
        //console.log(this.act);
        if (this.run) {
            // Игра начата
            if (this.act) {
                // Есть команда от игрока
                if (this.act.n === 'kick')
                    // Пнуть мяч
                    this.socketSend(this.act.n, this.act.v + " " + this.act.d);
                // Движение и поворот
                else this.socketSend(this.act.n, this.act.v);
            }
            this.act = null; // Сброс команды
        }
    }
}

module.exports = Agent;

