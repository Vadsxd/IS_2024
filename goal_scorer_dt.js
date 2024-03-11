const rotationSpeed = -45;
const goalAngle = 3;
const flagCloseness = 3;
const ballCloseness = 0.5;
const runSpeed = 85;
const waitTime = 20;
const passAngleChange = 30;
const slowDownDistance = 3;
const slowDownCoefficient = 0.8;

const DT = {
	state: {
		next: 0,
		go: 0,
		previous_play_on: false,
		cur_play_on: false,
		start_coords: [-20, 20],
		turn_angle: 0,
		sequence: [{act: "flag", fl: "fplb"}, {act: "flag", fl: "fgrb"}, {act: "kick", fl: "b", goal: "gr"}],
	},
	root: {
		exec(mgr, state, p, cmd){
			state.action = state.sequence[state.next];
			state.command = null;
		},
		next: "start",
	},
	start: {
		condition: (mgr, state, p, cmd) => cmd === "hear",
		trueCond: "hearProcessing",
		falseCond: "seeOrSenseProcessing",
	},
	seeOrSenseProcessing: {
		condition: (mgr, state, p, cmd) => cmd === "see",
		trueCond: "seeProcessing",
		falseCond: "senseProcessing",
	},
	senseProcessing: {
		exec(mgr, state, p, cmd){
			if (cmd === "sense_body"){
				//console.log(p);
				state.turn_angle = p[3]['p'][1];	
			}
			
		},
		next: "sendCommand",
	},

	hearProcessing: {
		exec(mgr, state, p, cmd){
			state.previous_play_on = state.cur_play_on;
			state.cur_play_on = mgr.isPlayOn(p, state.cur_play_on);
		},
		next: "checkPlayMode",
	},
	checkPlayMode: {
		condition: (mgr, state, p, cmd) => state.cur_play_on,
		trueCond: "goCheck",
		falseCond: "isMoved",
	},
	goCheck: {
		exec(mgr, state, p, cmd){
			let curGo = mgr.hearGo(p);
			if (curGo){
				state.go = true;
			}
		},
		next: "sendCommand",
	},
	isMoved: {
		condition: (mgr, state, p, cmd) => state.previous_play_on,
		trueCond: "move2start", 
		falseCond: "sendCommand",
	},
	move2start: {
		exec(mgr, state, p, cmd){
			state.command = {n: "move", v: state.start_coords[0] + " " + state.start_coords[1]};
			state.next = 0;
			state.go = false;
		},
		next: "sendCommand",
	},
	seeProcessing: {
		condition: (mgr, state, p, cmd) => state.cur_play_on,
		trueCond: "goalPath",
		falseCond: "sendCommand",
	},
	goalPath: {
		condition(mgr, state, p, cmd){
			return mgr.getVisible(state.action.fl, p);
		},
		trueCond: "rootNext",
		falseCond: "rotate",
	},
	rotate: {
		exec(mgr, state, p, cmd){
			state.command = {n: "turn", v: rotationSpeed}
		},
		next: "sendCommand",
	},
	rootNext: {
		condition: (mgr, state, p, cmd) => state.action.fl === "b",
		trueCond: "ballSeek",
		falseCond: "flagSeek",
	},
	ballSeek: {
		condition: (mgr, state, p) => ballCloseness > mgr.getDistance(state.action.fl, p),
		trueCond: "closeBall",
		falseCond: "checkFar",				
	},
	checkFar: {
		condition: (mgr, state, p, cmd) => slowDownDistance > mgr.getDistance(state.action.fl, p),
		trueCond: "slowRun",
		falseCond: "farGoal",
	},
	slowRun: {
		condition: (mgr, state, p, cmd) => Math.abs(mgr.getAngle(state.action.fl, p)) > goalAngle,
		trueCond: "rotateToGoal",
		falseCond: "runSlow", 
	},
	runSlow: {
		exec(mgr, state, p, cmd){
			state.command = {n: "dash", v: Math.floor(runSpeed * slowDownCoefficient)};
		},
		next: "sendCommand",
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
			let angle = -45;
			if (state.turn_angle < 0){
				angle = 45;
			}
			angle = 45;
			state.command = {n: "kick", v: "10 " + angle};
		},
		next: "sendCommand",
	},
	flagSeek: {
		condition: (mgr, state, p, cmd) => state.go && mgr.getVisible("b", p),
		trueCond: "score",
		falseCond: "catchFlag",
	},
	score: {
		exec(mgr, state, p, cmd){
			state.next = 2;
		},
		next: "ballSeek",
	},
	catchFlag: {
		condition: (mgr, state, p, cmd) => flagCloseness > mgr.getDistance(state.action.fl, p),
		trueCond: "closeFlag",
		falseCond: "farGoal",
	},
	closeFlag: {
		exec(mgr, state, p, cmd){
			state.next++;
			state.action = state.sequence[state.next];
		},
		next: "seeProcessing",
	},
	farGoal: {
		condition: (mgr, state, p, cmd) => Math.abs(mgr.getAngle(state.action.fl, p)) > goalAngle,
		trueCond: "rotateToGoal",
		falseCond: "runToGoal",
	},
	rotateToGoal: {
		exec(mgr, state, p, cmd){
			state.command = {n: "turn", v: mgr.getAngle(state.action.fl, p)}
		},
		next: "sendCommand",
	},
	runToGoal: {
		exec(mgr, state, p, cmd){
			state.command = {n: "dash", v: runSpeed};
		},
		next: "sendCommand",
	},
	sendCommand: {
		command: (mgr, state, p, cmd) => state.command,
	},
}

module.exports = DT;
