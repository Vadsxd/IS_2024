const Flags = require('./flags');

module.exports = {
    squares_diff(x1, x2){
        return x1 * x1 - x2 * x2
    },
    find_parameter(param, data){
        for (const obj of data){
            if (typeof obj === 'number'){
                continue;
            }
            if (obj['cmd'] === param){
                return obj['p'];
            }
        }        
    },
    // fix: выбирать флаги так, чтобы alpha получались разными
    solveby3(d1, d2, d3, x1, y1, x2, y2, x3, y3) {
        //console.log(d1, d2, d3, x1, y1, x2, y2, x3, y3);
        if ((y1 - y2) === (y1 - y3)){
            [d1, d2] = [d2, d1];
            [x1, x2] = [x2, x1];
            [y1, y2] = [y2, y1];
        }

        let alpha1 = (y1 - y2) / (x2 - x1);
        let beta1 = (y2 * y2 - y1 * y1 + x2 * x2 - x1 * x1 + d1 * d1 - d2 * d2) / (2 * (x2 - x1));
        let alpha2 = (y1 - y3) / (x3 - x1);
        let beta2 = (y3 * y3 - y1 * y1 + x3 * x3 - x1 * x1 + d1 * d1 - d3 * d3) / (2 * (x3 - x1));
        let delta_beta = beta1 - beta2;
        let delta_alpha = alpha2 - alpha1;
        //console.log("DElta_alpha: ", delta_alpha);
        let X = alpha1 * (delta_beta / delta_alpha) + beta1;
        let Y = delta_beta / delta_alpha;

        return [X, Y];
    },

    get_similarity(coord, x1, y1, x2, y2, e1, e2){
    	let vector1 = [x1 - coord[0], y1 - coord[1]];
    	let vector2 = [x2 - coord[0], y2 - coord[1]];
    	let result = (e1[0] * vector1[0] + e1[1] * vector1[1]);
        if (e2){
            result += e2[0] * vector2[0] + e2[1] * vector2[1];
        } 
        return result;
    },

    get_best(coord1, coord2, x1, y1, x2, y2, e1, e2){
    	let sim1 = this.get_similarity(coord1, x1, y1, x2, y2, e1, e2);
    	let sim2 = this.get_similarity(coord2, x1, y1, x2, y2, e1, e2);

    	if (sim1 > sim2){
    		return coord1;
    	} 
    	return coord2;
    },

    solveby2(d1, d2, x1, y1, x2, y2, e1, e2, x_bound, y_bound){
        let x, y, x_, y_;
        let possible_poses = [];
        let in_field = [];
        let result = [];
        if (x1 == x2){
            y = (this.squares_diff(y2, y1) + this.squares_diff(d1, d2)) / (2 * (y2 - y1));
            diff = Math.pow(this.squares_diff(d1, y-y1), 0.5);
            x = x1 + diff;
            x_ = x - 2 * diff;
            
            possible_poses.push([x, y]);
            possible_poses.push([x_, y]);
        } else if (y1 == y2){
            x = (this.squares_diff(x2, x1) + this.squares_diff(d1, d2)) / (2 * (x2 - x1));
            diff = Math.pow(this.squares_diff(d1, x-x1), 0.5);
            y = y1 + diff;
            y_ = y - 2 * diff;
            
            possible_poses.push([x, y]);
            possible_poses.push([x, y_]);
        } else {
	        let alpha = (y1 - y2) / (x2 - x1);
	        let beta = (this.squares_diff(y2, y1) + this.squares_diff(x2, x1) + this.squares_diff(d1, d2)) / (2 * (x2 - x1));

	        let a = alpha * alpha + 1;
	        let b = -2 * (alpha * (x1 - beta) + y1);
	        let c = Math.pow(x1 - beta, 2) + this.squares_diff(y1, d1);
	  
	        let discriminant = Math.pow(b*b - 4 * a * c, 0.5);
	        
	        y = (-b + discriminant) / (2 * a);
			x = y * alpha + beta;
			possible_poses.push([x, y]);

	        y_ = y - discriminant / a;
	        x_ = y_ * alpha + beta;
	        possible_poses.push([x_, y_]) 
        }
        for (const coord of possible_poses){
        	if ((Math.abs(coord[0]) <= x_bound) && (Math.abs(coord[1]) <= y_bound)){
        		in_field.push(coord);
        	}
        }
        if (in_field.length === 2 && e1){
        	result = this.get_best(in_field[0], in_field[1], x1, y1, x2, y2, e1, e2);
        } else {
        	result = in_field[0];
        }
        //console.log("possible: ", possible_poses);
        return result;
    },

    get_object_coords(d1, da, x, y, x1, y1, a1, aa, eo){
        let d_a1 = d1 * d1 + da * da - 2 * d1 * da * Math.cos(Math.abs(a1 - aa) * Math.PI / 180);
        d_a1 = Math.pow(d_a1, 0.5);
        eo = [eo[0] * -1, eo[1] * -1];
        return this.solveby2(da, d_a1, x, y, x1, y1, eo, null, 57.5, 39);
    },

    find_different_x_y(flags, flag){
        for (const f of flags){
            if ((f[0] !== flag[0]) && (f[1] !== flag[1])){
                return f;
            }
        }
        return null;
    },

    get_flags_and_objects(data){
        let flags = [];
        let objects = [];
        let cur;
        for (const obj of data){
            if (typeof obj === 'number'){
                continue;
            }
            obj_name = obj['cmd']['p'].join('');
            //console.log(obj_name);
            if (obj['p'].length === 1){
                continue;
            }

            if (!Flags[obj_name]){
                if (obj_name.includes("p")){
                    //console.log(obj['cmd']['p']);
                    objects.push([obj['p'][0], obj['p'][1]]);
                }
                continue;
            }

            cur = [Flags[obj_name]['x'], Flags[obj_name]['y'], obj['p'][0], obj['p'][1]];
            flags.push(cur);
        }
        //console.log("------------");
        return [flags, objects];
    },

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
            if (cur_obj_name === obj_name || (obj_name === 'p' && cur_obj_name.includes(obj_name)) && !cur_obj_name.includes("f") && !cur_obj_name.includes("B")){
                return obj['p'];
            }
        }
        return null;
    },

    get_flags_and_objects_2(data){
        let flags = [];
        let objects = [];
        let sortedFlags = {};
        let cur;
        let res = [];
        for (const obj of data){
            if (typeof obj === 'number'){
                continue;
            }
            obj_name = obj['cmd']['p'].join('');

            if (obj['p'].length === 1){
                continue;
            }

            if (!Flags[obj_name] && obj_name == "b"){
                objects.push([obj['p'][0], obj['p'][1]]);
                continue;
            }

            cur = [Flags[obj_name]['x'], Flags[obj_name]['y'], obj['p'][0], obj['p'][1]];
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
        if (res.length === 3){
            return [res, objects];
        } else {
            return [flags, objects]; 
        }
    },

}



