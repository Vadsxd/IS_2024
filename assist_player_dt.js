const rotationSpeed = 45;
const goalAngle = 3;
const flagCloseness = 3;
const ballCloseness = 0.5;
const runSpeed = 100;
const waitTime = 10;
const passAngleChange = 40;
const slowDownDistance = 3;
const slowDownCoefficient = 0.8;
const distance_treshold = 20;

const DT = {
	state: {
		next: 0,
		wait: 0,
		stay: false,
		previous_play_on: false,
		cur_play_on: false,
		start_coords: [-20, 0],
		player_angle: null,
		player_distance: null,
		message: false,
		sequence: [{act: "flag", fl: "fplc"}, {act: "flag", fl: "b"}],
	},
	root: {
		exec(mgr, state, p, cmd){
			state.action = state.sequence[state.next];
			state.command = null;
		},
		next: "messageSay",
	},
	messageSay: {
		condition: (mgr, state, p, cmd) => state.message,
		trueCond: "summonPlayer",
		falseCond: "start",
	},
	summonPlayer: {
		exec(mgr, state, p, cmd){
			state.command = {n: "say", v: "go"};
			state.stay = true;
			state.message = false;
		},
		next: "sendCommand",
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
			;
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
		trueCond: "sendCommand",
		falseCond: "isMoved",
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
			state.wait = 0;
			state.stay = false;
		},
		next: "sendCommand",
	},
	seeProcessing: {
		condition: (mgr, state, p, cmd) => state.cur_play_on && !state.stay,
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
		trueCond: "assist",
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
	flagSeek: {
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
	assist: {
		condition: (mgr, state, p, cmd) => mgr.getVisible('p', p),
		trueCond: "pass",
		falseCond: "wait",
	},
	wait: {
		condition: (mgr, state, p, cmd) => state.wait >= waitTime,
		trueCond: "findPlayer",
		falseCond: "waitIncrement",
	},
	waitIncrement: {
		exec(mgr, state, p, cmd){
			state.wait += 1;
		},
		next: "sendCommand",
	},
	findPlayer: {
		exec(mgr, state, p){
			state.command = {n: "kick", v: "10 45"}
		},
		next: "sendCommand",
	},
	pass: {
		exec(mgr, state, p, cmd){
			//let params = mgr.getAngleAndStrength(p);


			state.player_angle = mgr.getAngle("p", p);
			state.player_distance = mgr.getDistance("p", p);
			
			let kick_strength = mgr.getStrength(state.player_distance);
			let angle_change = 30;
			if (state.player_distance >= distance_treshold){
				angle_change = 15;
			}
			let kick_angle = state.player_angle - angle_change;

			state.command = {n: "kick", v: kick_strength + " " + kick_angle};
			state.message = true;
		},
		next: "sendCommand",
	},
	sendCommand: {
		command: (mgr, state, p, cmd) => state.command,
	},
}

module.exports = DT;
