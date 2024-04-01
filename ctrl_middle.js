const CTRL_MIDDLE = {
	action: "return",
	turnData: "ft0",
	execute(input, controllers){
		const next = controllers[0];
		switch (input.action){ 
			case "return":
				input.cmd = this.actionReturn(input);
				break;
			case "rotateCenter":
				input.cmd = this.rotateCenter(input);
				break;
			case "seekBall":
				input.cmd = this.seekBall(input);
				break;
		}
		//input.action = this.action;
		if (next){
			const command = next.execute(input, controllers.slice(1));
			if (command) return command;
			if (input.newAction) input.action = input.newAction;
			return input.cmd;
		}
	},
	actionReturn(input){
		if (!input.state.goal) return {n: "turn", v: 60};
		if (Math.abs(input.state.goal.angle) > 10)
			return {n: "turn", v: input.state.goal.angle};
		if (input.state.goal.dist > 3)
			return {n: "dash", v: input.state.goal.dist * 2 + 30}
		input.action = "rotateCenter";
		return {n: "turn", v: 180};
	},
	rotateCenter(input){
		if (!input.state.all_flags["fc"]) return {n: "turn", v: 60};
		input.action = "seekBall";
		return {n: "turn", v: input.state.all_flags["fc"].angle};
	},
	seekBall(input){
		if (input.side != 'l' && input.team == "A"){
			throw "Error";
			console.log(input.turnData);				
		}

		if (input.state.all_flags[input.turnData]){

			if (Math.abs(input.state.all_flags[input.turnData].angle) > 10)
				return {n: "turn", v: input.state.all_flags[input.turnData].angle};
			if (input.turnData == "ft0") input.turnData = "fb0";
			else
				if (input.turnData == "fb0"){
					input.turnData = "ft0";
					input.action = "rotateCenter";
					return this.rotateCenter(input);
				}
		}
		if (input.turnData == "ft0")
			return {n: "turn", v: (input.side == "l") ? -20 : 20};
		if (input.turnData == "fb0"){
			return {n: "turn", v: (input.side == "l") ? 20 : -20};
		}
		//throw "Error"
	}
}


module.exports = CTRL_MIDDLE;
