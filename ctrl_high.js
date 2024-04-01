const CTRL_HIGH = {
	wait: 0,
	execute(input){
		input.wait--;
		const immediate = this.immidiateReaction(input);
		if (immediate) return immediate;
		const defend = this.defendGoal(input);
		if (defend) return defend;
		if (this.last == "defend")
			input.newAction = "return";
		this.last = "previous";
	},
	immidiateReaction(input){
		if (input.canCatch && this.last != "catch"){
			this.last = "catch";
			return {n: "catch", v: input.state.ball.angle};
		}
		if (input.canKick){
			this.last = "kick";
			input.wait = 10;
			if (input.state.rival_goal)
				return {n: "kick", v: "100 " + input.state.rival_goal.angle};

			if (input.state.all_flags.gr || input.state.all_flags.fgrb || input.state.all_flags.fgrt){
				return {n: "kick", v: "100 180"}
			}
			return {n: "kick", v: "100 0"}
		}
	},
	defendGoal(input){
		if (input.state.ball){
			if (input.state.ball.dist < 15 && input.wait <= 0){
				this.last = "defend";
				if (Math.abs(input.state.ball.angle) > 5)
					return {n: "turn", v: input.state.ball.angle};
				return {n: "dash", v: 100}
			} 
			if (input.state.ball.dist < 15){
				this.last = "defend";
			}
		}
	}
}

module.exports = CTRL_HIGH;