const Msg = require('./msg');
const readline = require('readline');
const utils = require("./utils");
const Flags = require('./flags');
const TManager = require('./timeMacineManager');
const goal_keeper_TA = require("./goal_keeper_time_machine");
const fw_TA = require("./fw_time_machine");
const Taken = require("./taken");

// имя первого игрока: p"A"1

class Agent {
    constructor(teamName, goalkeeper) {
        this.position = 'l'; // По умолчанию - левая половина поля
        this.run = true; // Игра начата
        this.act = null; // Действия
        this.rotationSpeed = null; // скорость вращения
        this.x_boundary = 57.5;
        this.y_boundary = 39;
        this.teamName = teamName;
        this.DirectionOfSpeed = null;
        this.turnSpeed = 10; // скорость вращения
        this.flag_distance_epsilon = 1; // значение близости к флагу
        this.flag_direction_epsilon = 10; // значение близости по углу
        this.max_speed = 100; // максимальная скорость
        this.ball_direction_epsilon = 0.5;
        this.leading = false;
        this.goalie = false; // является ли игрок вратарем
        this.prevCatch = 0;
        this.prevTact = null;
        this.playerName = "";
        this.state = {'time': 0}; // текущее состояние игрока
        this.TManager = TManager;
        this.taken = new Taken();
        this.ta = null;
        if (goalkeeper){
            this.ta = goal_keeper_TA;
        } else {
            this.ta = fw_TA;
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


    search_obj(obj_name){
        // Выдает действие для поиска объекта
        return {n: 'turn', v: this.turnSpeed};
    }

    get_flag_actions(see_data, flag_name){
        let obj = utils.see_object(flag_name, see_data);
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
        let ball = utils.see_object(ball_name, see_data);
        if (!ball){
            return this.search_obj(ball_name);
        }

        let direction = ball[1];
        let distance = ball[0];

        if (distance < this.ball_direction_epsilon){
            let flag = utils.see_object(flag_name, see_data);
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


    getDistsAndAngles(data){
        let sortedFlags = {};
        let res = [];
        let flags = [];
        let dists_and_angles = {
            'ball': null,
            'player': null,
            'flags': [],
            'goal': null}

        for (const obj of data){
            if (typeof obj === "number"){
                continue;
            }
            let obj_name = obj['cmd']['p'].join("");
            //console.log(obj_name);

            if (obj['p'].length === 1){
                continue;
            }

            if (obj_name === "b"){
                dists_and_angles['ball'] = [obj['p'][0], obj['p'][1]];
            }

            if (obj_name.includes("p") && !obj_name.includes("f")){
                dists_and_angles['player'] = [obj['p'][0], obj['p'][1]];
            } 

            if (!Flags[obj_name]){
                continue;
            }

            if (obj_name === "gr"){
                dists_and_angles['goal'] = {"x":52.5, "y":0, "f":"gr", "dist": obj['p'][0], "angle": obj['p'][1]}
            }
            let cur = [Flags[obj_name]['x'], Flags[obj_name]['y'], obj['p'][0], obj['p'][1]];
            if (res.length < 3){
                if (!sortedFlags[cur[0]]) {
                    sortedFlags[cur[0]] = [];
                    sortedFlags[cur[0]].push(cur);
                } else {
                    sortedFlags[cur[0]].push(cur);
                }

                if (Object.keys(sortedFlags).length === 3) {
                    for (let [key, value] of Object.entries(sortedFlags)) {
                        res.push(value[0]);
                        if (res.length === 3) {
                            break;
                        }
                    }
                }
            }
            if (flags.length < 2){
                flags.push(cur);
            }           

        }
        if (res.length === 3 && !utils.checkSame3Y(res)){
            dists_and_angles['flags'] = res;
        } else {
            dists_and_angles['flags'] = flags; 
        }
        return dists_and_angles;        
    }

    writeSeeData(data){
        this.state['ballPrev'] = this.state['ball'];
        this.state['playerPrev'] = this.state['player'];

        let ball_coords = null;
        let player_coords = null;
        let coords = null;

        let dists_and_angles = this.getDistsAndAngles(data);
        this.state['goal'] = dists_and_angles['goal'];
        let flag1 = dists_and_angles['flags'][0];
        let flag2 = dists_and_angles['flags'][1];
        let flag3 = dists_and_angles['flags'][2];

        if (dists_and_angles['flags'].length === 3){
            coords = utils.solveby3(flag1[2], flag2[2], flag3[2], 
                flag1[0], flag1[1], flag2[0], flag2[1], flag3[0], flag3[1])
        }

        if (dists_and_angles['flags'].length === 2){
            let e1 = utils.get_unit_vector(flag1[3], this.state['directionOfSpeed']);
            let e2 = utils.get_unit_vector(flag2[3], this.state['directionOfSpeed']);
            coords = utils.solveby2(flag1[2], flag2[2], flag1[0], flag1[1], flag2[0], flag2[1], 
                e1, e2, this.x_boundary, this.y_boundary);
        }

        if (coords){
            let e0, object;
            if (dists_and_angles['ball']){
                object = dists_and_angles['ball'];
                e0 = utils.get_unit_vector(object[1], this.state['directionOfSpeed']);
                ball_coords = utils.get_object_coords(flag1[2], object[0], coords[0], coords[1], flag1[0], flag1[1], flag1[3], object[1], e0);
                this.state['ball'] = {};
                if (ball_coords){
                    this.state['ball']['x'] = ball_coords[0];
                    this.state['ball']['y'] = ball_coords[1];
                }

                this.state['ball']['angle'] = object[1];
                this.state['ball']['dist'] = object[0];
            } else {
                this.state['ball'] = null;
            }

            if (dists_and_angles['player']){
                object = dists_and_angles['player'];
                e0 = utils.get_unit_vector(object[1], this.state['directionOfSpeed']);
                player_coords = utils.get_object_coords(flag1[2], object[0], coords[0], coords[1], flag1[0], flag1[1], flag1[3], object[1], e0);                
                this.state['player'] = {};

                if (player_coords){
                    this.state['player']['x'] = player_coords[0];
                    this.state['player']['y'] = player_coords[1];

                    this.state['player']['angle'] = object[1];
                    this.state['player']['dist'] = object[0];
                }
            } else {
                this.state['player'] = null;
            }

            this.state['pos'] = {};
            this.state['pos']['x'] = coords[0];
            this.state['pos']['y'] = coords[1];
        }
    }

    writeHearData(data){
        this.state['hear'] = {"who": data[0], "msg": data[1]};
    }

    writeSenseData(data){
        this.state['directionOfSpeed'] = data[3]['p'][1];
    }

    oldVers(msg, cmd, p){
        if (cmd === "hear"){
            if (p[2] === "play_on"){
                this.run = true;
            }
        }

        if (!this.run){
            return;
        }
        if (cmd === "see"){
            this.act = this.manager.getAction(this.dt, p, cmd);    
        }
        
    }

    analyzeEnv(msg, cmd, p) {
        if (this.manager){
            this.oldVers(msg, cmd, p);    
            return;
        }
        

        if (cmd === "see"){
            //console.log(this.taken.state['ball']);
            this.taken.state['time'] = p[0];
            this.taken.set(p);
            this.act = this.TManager.getAction(this.taken, this.ta);

            // Вызов автомата
            this.taken.resetState();
        }

        if (cmd === "hear"){
            this.writeHearData(p);
        }

        if (cmd === "sense_body"){
            this.taken.writeSenseData(p);
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
                    this.socketSend(this.act.n, this.act.v);
                // Движение и поворот
                else this.socketSend(this.act.n, this.act.v);
            }
            this.act = null; // Сброс команды
        }
    }
}

module.exports = Agent;

