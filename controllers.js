const Taken = require("./taken");
const CTRL_LOW = {
	execute(taken, controllers){
		const next = controllers[0];
		taken.canKick = taken.state.ball && taken.state.ball.dist < 0.5;
		if (next){
			return next.execute(this.taken, controllers.slice(1));
		} 
	}
}

const CTRL_MIDDLE = {
	action: "return",
	turnData: "ft0",
	execute(input, controllers){
		const next = controllers[0];
		switch (this.action){ 
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
		input.action = this.action;
		if (next){
			const command = next.execute(input, controllers.slice(1));
			if (command) return command;
			if (input.newAction) this.action = input.newAction;
			return input.cmd;
		}
	},
	actionReturn(input){
		if (!input.state.goal) return {n: "turn", v: 60};
		if (Math.abs(input.state.goal.angle) > 10)
			return {n: "turn", v: input.state.goal.angle};
		if (input.state.goal.dist > 3)
			return {n: "dash", v: input.state.goal.dist * 2 + 30}
		this.action = "rotateCenter";
		return {n: "turn", v: 180};
	},
	rotateCenter(input){
		if (!input.state.all_flags["fc"]) return {n: "turn", v: 60};
		this.action = "seekBall";
		return {n: "turn", v: input.state.all_flags["fc"].angle};
	},
	seekBall(input){
		if (input.state.all_flags[this.turnData]){
			if (Math.abs(input.state.all_flags[this.turnData].angle) > 10)
				return {n: "turn", v: input.state.all_flags[this.turnData].angle};
			if (this.turnData == "ft0") this.turnData = "fb0";
			else
				if (this.turnData == "fb0"){
					this.turnData = "ft0";
					this.action = "rotateCenter";
					return this.rotateCenter(input);
				}
		}
		if (this.turnData == "ft0")
			return {n: "turn", v: this.side == "l" ? -30 : 30};
		if (this.turnData == "fb0")
			return {n: "turn", v: this.side == "l" ? 30 : -30};
		throw "Error"
	}
}


const CTRL_HIGH = {
	execute(input){
		const immediate = this.imidiateReaction(input);
		if (immediate) return immediate;
		const defend = this.defendGoal(input);
		if (defend) return defend;
		if (this.last == "defend")
			input.newAction = "return";
		this.last = "previous";
	},
	immidiateReaction(input){
		if (input.canKick){
			this.last = "kick";
			if (input.state.lr)
				return {n: "kick", v: "100 " + input.state.lr.angle};
			return {n: "kick", v: "100 45"}
		}
	},
	defendGoal(input){
		if (input.state.ball){
			if (input.state.ball.dist < 15){
				this.last = "defend";
				if (Math.abs(input.state.ball.angle) > 5)
					return {n: "turn", v: input.state.ball.angle};
				return {n: "dash", v: 100}
			}
		}
	}
}









