const utils = require("./utils");

const CTRL_HIGH = {
	execute(taken, controllers, bottom, top, direction, center){
		let act;
		if (taken.state.ball.dist <= 0.5){
			//if (!utils.seeDir(taken)){
			//	return {n: "kick", v: "10 45"};
			//}
			if (taken.kick){
				act = utils.pass(taken);
				//console.log("ACT: ", act);
				if (act){
					return act;
				} else {
					return {n: "kick", v: "60 180"}
				}

			}
			// удар
			let side = taken.side;
			if (side == "l"){
				if (taken.state.ball){
					if (taken.state.ball.y >= 27){
						return {n: "kick", v: "10 -45"}
					} else if (taken.state.ball.y <= -27){
						return {n: "kick", v: "10 45"}
					}
				}
			} else {
				if (taken.state.ball){
					if (taken.state.ball.y >= 29){
						return {n: "kick", v: "10 45"}
					} else if (taken.state.ball.y <= -29){
						return {n: "kick", v: "10 -45"}
					}
				}
			}
			

			if (taken.state.pos){
				if (taken.state.pos.x >= 28 && taken.side == 'l' ||
					taken.state.pos.x <= -28 && taken.side == 'r'){
					return utils.kick(taken);

				}
			}
			//...........

			act = utils.pass(taken);
			//console.log("ACT: ", act);
			if (act){
				return act;
			} else {
				if (!utils.seeDir(taken)){
					return {n: "kick", v: "10 45"};
				}
				act = utils.forward(taken);
				//console.log("second act", act);
				if (!act){
					return {n: "kick", v: "10 45"}
				}
				return act;
			}

		}


		if (taken.state.ball.dist >= 5){
			//console.log("Ball far. returning in zone");
			//act = utils.avoidCollision(taken);
			//if (act){
				//console.log("AVOIDED!");
			//	return act;
			//}
			for (const player of taken.state.myTeam){
				if (player.dist < 10){
					return null;
				}
			}
			act = utils.returnInZone(taken.state.pos.y, bottom, top, direction, taken);
			if (act){
				return act;
			}
			//console.log("in zone. Go 2 ball");
			let x = taken.state.pos.x;
			let y = taken.state.pos.y;
			return utils.go2ball(x, y, bottom, top, center, taken.state.ball.angle, direction, taken);			
		}

		// TODO: проверить, что рядом с мячом нет своих
		//console.log("take ball");

		let teamTake = utils.teamTaken(taken);
		if (!teamTake){
			return utils.takeBall(taken.state.ball.dist, taken.state.ball.angle);	
		} else {
			act = utils.returnInZone(taken.state.pos.y, bottom, top, direction, taken);
			if (act){
				return act;
			}			
		}
		
	}
}

module.exports = CTRL_HIGH;