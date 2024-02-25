const Flags = require('./flags');

module.exports = {
    squares_diff(x1, x2){
        return x1 * x1 - x2 * x2
    },

    solveby3(d1, d2, d3, x1, y1, x2, y2, x3, y3){
    	// функция для нахождения координат игрока по трем флагам
    	// x1, x2, x3 - разные
    	// возвращает координаты игрока в виде [x, y]
    }

    solveby2(d1, d2, x1, y1, x2, y2, x_bound, y_bound){
        var x, y;
        if (x1 == x2){
            y = (this.squares_diff(y2, y1) + this.squares_diff(d1, d2)) / (2 * (y2 - y1));
            diff = Math.pow(this.squares_diff(d1, y-y1), 0.5);
            x = x1 + diff;
            if (Math.abs(x) > x_bound){
                x -= 2 * diff;
            }
            return [x, y];
        }
  
        if (y1 == y2){
            x = (this.squares_diff(x2, x1) + this.squares_diff(d1, d2)) / (2 * (x2 - x1));
            diff = Math.pow(this.squares_diff(d1, x-x1), 0.5);
            y = y1 + diff;
            if (Math.abs(y) > y_bound){
                y -= 2 * diff;
            }
            return [x, y];
        }

        var alpha = (y1 - y2) / (x2 - x1);
        var beta = (this.squares_diff(y2, y1) + this.squares_diff(x2, x1) + this.squares_diff(d1, d2)) / (2 * (x2 - x1));

        var a = alpha * alpha + 1;
        var b = -2 * (alpha * (x1 - beta) + y1);
        var c = Math.pow(x1 - beta, 2) + this.squares_diff(y1, d1);
  
        var discriminant = Math.pow(b*b - 4 * a * c, 0.5);
        y = (-b + discriminant) / (2 * a);

        if (Math.abs(y) > y_bound){
            y = y - discriminant / a;
        }

        x = y * alpha + beta;
        if (Math.abs(x) > x_bound){
            y = y - discriminant / a;
            x = y * alpha + beta;
        }
        return [x, y];
    },

    get_object_coords(d1, da, x, y, x1, y1, a1, aa){
        a1 = a1 / Math.PI * 180;
        aa = aa / Math.PI * 180;
        d_a1 = d1 * d1 + da * da - 2 * d1 * da * Math.cos(Math.abs(a1 - aa));
        return solve(da, x, y, d_a1, x1, y1)
    },

    find_different_x_y(flags, flag){
        for (const f of flags){
            if ((f[0] !== flag[0]) && (f[1] !== flag[1])){
                return f;
            }
        }
        return null;
    },

    get_flags(data){
        var flags = [];
        for (const obj of data){
            if (typeof obj === 'number'){
                continue;
            }
            obj_name = obj['cmd']['p'].join('');
            if (!Flags[obj_name] || obj['p'].length === 1){
                continue;
            }
            cur = [Flags[obj_name]['x'], Flags[obj_name]['y'], obj['p'][0], obj['p'][1]];
            flags.push(cur);
            if (flags.length >= 2){ // Заменить на условие выхода по трем флагам; все 3 возвращаемых флага должны иметь разные координаты по x; 
            	                    // если таких трех флагов не найдется, то возвратить любые 2 или 1 флага
     			break;
            }
        }
        return flags;
    },
}



