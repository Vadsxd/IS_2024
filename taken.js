const utils = require("./utils");
const Flags = require('./flags');

class Taken{
	constructor(side){
		this.state = {}; // хранит информацию по данным зрения
		this.p = {};
        this.fw_p = 1;
        this.back_p = 0.3;
		this.x_boundary = 57.5;
		this.y_boundary = 39;
        this.see_forward = false;
		this.resetState();
	}	

    resetState(){
        this.state['pos'] = null;
        this.state['hear'] = null;
        this.state['goal'] = null;
        this.state['directionOfSpeed'] = null;
        this.state['lr'] = null;
        this.state['gl'] = null;
        this.state['all_flags'] = null;
        this.newAction = null;
        this.state['myTeam'] = null;
        this.state['enemyTeam'] = null;
        this.state['players'] = null;
    }

    getDistsAndAngles(data){
        let sortedFlags = {};
        let res = [];
        let flags = [];
        let dists_and_angles = {
            'ball': null,
            'player': null,
            'flags': [],
            'goal': null,
            'gl': null,
            'all_flags': {},
            'myTeam': [],
            'enemyTeam': [],
            'players': []}

        for (const obj of data){
            if (typeof obj === "number"){
                continue;
            }
            let obj_name = obj['cmd']['p'].join("");

            if (obj['p'].length === 1){
                continue;
            }

            if (obj_name === "b"){
                if (obj['p'].length > 2){
                    dists_and_angles['ball'] = [obj['p'][0], obj['p'][1], obj['p'][2]];
                } else {
                    dists_and_angles['ball'] = [obj['p'][0], obj['p'][1]];    
                }
                
            }

            if (obj_name.includes("p") && !obj_name.includes("f")){
                let enemy = null;
                if (this.team == "A"){
                    enemy = "B";
                } else {
                    enemy = "A";
                }
                let elem = {"dist": obj['p'][0], "angle": obj['p'][1]};

                if (obj_name.includes(this.team)){
                    dists_and_angles['myTeam'].push(elem);
                } else if (obj_name.includes(enemy)){
                    dists_and_angles['enemyTeam'].push(elem);
                } else {
                    dists_and_angles['players'].push(elem);
                }

            } 

            if (!Flags[obj_name]){
                continue;
            }

            dists_and_angles["all_flags"][obj_name] = {"dist": obj['p'][0], "angle": obj['p'][1], 'x': Flags[obj_name]['x'], 'y': Flags[obj_name]['y']};


            if (obj_name === "gl"){
                dists_and_angles['gl'] = {"f": "gl", "dist": obj['p'][0], "angle": obj['p'][1]};
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

    getPlayersXY(arr_key, e0, flag1, coords){
        for (let i = 0; i < this.state[arr_key].length; i++) {
            let object = [this.state[arr_key][i].dist, this.state[arr_key][i].angle];           
            let player_coords = utils.get_object_coords(flag1[2], object[0], coords[0], coords[1], flag1[0], flag1[1], flag1[3], object[1], e0);
            if (player_coords){
                this.state[arr_key][i].x = player_coords[0];
                this.state[arr_key][i].y = player_coords[1];                
            }
            //this.state[arr_key][i].dist = object[0];
            //this.state[arr_key][i].angle = object[1];
        }
    }

    writeSeeData(data){
        this.state['ballPrev'] = this.state['ball'];
        this.state['playerPrev'] = this.state['player'];

        let ball_coords = null;
        let player_coords = null;
        let coords = null;

        let dists_and_angles = this.getDistsAndAngles(data);
        this.state['goal'] = dists_and_angles['goal'];
        this.state['gl'] = dists_and_angles['gl'];
        this.state['all_flags'] = dists_and_angles['all_flags'];
        this.state['myTeam'] = dists_and_angles['myTeam'];
        this.state['enemyTeam'] = dists_and_angles['enemyTeam'];
        this.state['players'] = dists_and_angles['players'];


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
            e0 = null;//utils.get_unit_vector(object[1], this.state['directionOfSpeed']);
            this.getPlayersXY("myTeam", e0, flag1, coords);
            this.getPlayersXY("enemyTeam", e0, flag1, coords);
            this.getPlayersXY("players", e0, flag1, coords);
            
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
                if (object[2]){
                    this.state['ball']['distchange'] = object[2];
                }
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
        if (this.side == "l"){
            this.state.goal = this.state.all_flags['gl'];
            this.state.rival_goal = this.state.all_flags['gr'];
        } else {
            this.state.goal = this.state.all_flags['gr'];
            this.state.rival_goal = this.state.all_flags['gl'];
        }
    }

    writeSenseData(data){
        this.state['directionOfSpeed'] = data[3]['p'][1];
    }

	set(p){
		this.p = p;
		this.writeSeeData(p);
	}
}




module.exports = Taken;