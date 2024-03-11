const FL = "flag", KI = "kick"
const DT = {
	state: {
		next: 0,
		sequence: [{act: FL, fl: "gl"},
			{act: KI, fl: "b", goal: "gr"}],
		command: null
	},
	root: {
		exec(mgr, state, p){
			state.action = state.sequence[state.next];
			state.command = null
		},
		next: "goalVisible",
	},
	goalVisible: {
		condition(mgr, state, p){
			return mgr.getVisible(state.action.fl, p);
		},
		trueCond: "rootNext",
		falseCond: "rotate",
	},
	rotate: {
		exec(mgr, state, p){
			state.command = {n: "turn", v: 90}
		},
		next: "sendCommand",
	},
	rootNext: {
		condition: (mgr, state, p) => state.action.act == FL,
		trueCond: "flagSeek",
		falseCond: "ballSeek",
	},
	flagSeek: {
		condition: (mgr, state, p) => 3 > mgr.getDistance(state.action.fl, p),
		trueCond: "closeFlag",
		falseCond: "farGoal",
	},
	closeFlag: {
		exec(mgr, state, p){
			state.next++;
			state.action = state.sequence[state.next];
		},
		next: "goalVisible",
	},
	farGoal: {
		condition: (mgr, state, p) => mgr.getAngle(state.action.fl, p) > 4,
		trueCond: "rotateToGoal",
		falseCond: "runToGoal",
	},
	rotateToGoal: {
		exec(mgr, state, p){
			state.command = {n: "turn", v: mgr.getAngle(state.action.fl, p)}
		},
		next: "sendCommand",
	},
	runToGoal: {
		exec(mgr, state, p){
			state.command = {n: "dash", v: 100};
		},
		next: "sendCommand",
	},
	sendCommand: {
		command: (mgr, state) => state.command,
	},
	ballSeek: {
		condition: (mgr, state, p) => 0.5 > mgr.getDistance(state.action.fl, p),
		trueCond: "closeBall",
		falseCond: "farGoal",
	},
	closeBall: {
		condition: (mgr, state, p) => mgr.getVisible(state.action.goal, p),
		trueCond: "ballGoalVisible",
		falseCond: "ballGoalInvisible",
	},
	ballGoalVisible: {
		exec(mgr, state, p){
			state.command = {n: "kick", v: `100 ${mgr.getAngle(state.action.goal, p)}`}
		},
		next: "sendCommand",
	},
	ballGoalInvisible: {
		exec(mgr, state, p){
			state.command = {n: "kick", v: "10 45"}
		},
		next: "sendCommand",
	},
}

module.exports = DT;

