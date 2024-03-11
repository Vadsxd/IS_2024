const gatesFl = "gr";
const left_flag = 'gl';

const DT = {
	state: {
		inGates: false,
		command: null,
		kick: {act: "kick", fl: "b", goal: "gl"},
		catch: 0,
	},
	root: {
		exec(mgr, state, p){
			state.command = null; 
		},
		next: "checkGates",
	},	
	checkGates: {
		condition: (mgr, state, p) => state.inGates,
		trueCond: "isCatched",
		falseCond: "goalVisible",
	},
	isCatched: {
		condition: (mgr, state, p) => state.catch > 0,
		trueCond: "kickOut",
		falseCond: "controlBall",
	},
	kickOut: {
		condition: (mgr, state, p) => mgr.getVisible(left_flag, p),
		trueCond: "leftGatesAngle",
		falseCond: "rotate",
	},
	leftGatesAngle: {
		exec(mgr, state, p){
			state.left_gates_angle = mgr.getAngle(left_flag, p);
		},
		next: "kickBall",
	},
	kickBall: {
		exec(mgr, state, p){
			state.command = {n: "kick", v: "100" + " " + state.left_gates_angle};
		},
		next: "reset",
	},
	reset: {
		exec(mgr, state, p){
			state.inGates = false;
			state.catch = 0;
		},
		next: 'sendCommand',
	},

/*
		exec(mgr, state, p){
			state.command = {n: 'kick', v: "100 0"}
		},
		next: "sendCommand",

*/
	controlBall: {
		condition: (mgr, state, p) => mgr.getVisible('b', p),
		trueCond: "ballMeasures",
		falseCond: "rotate",
	},
	ballMeasures: {
		exec(mgr, state, p){
			state.ballAngle = mgr.getAngle('b', p);
			state.ballDistance = mgr.getDistance('b', p);
		},
		next: "canCatch",
	},
	canCatch: {
		condition: (mgr, state, p) => state.ballDistance < 0.5,
		trueCond: "catchBall",
		falseCond: "closeAngle",
	},
	catchBall: {
		exec(mgr, state, p){
			state.command = {n: 'catch', v: -state.ballAngle};
			state.catched = true;
		},
		next: "sendCommand",
	},
	closeAngle: {
		condition: (mgr, state, p) => Math.abs(state.ballAngle) < 5,
		trueCond: "ballClose",
		falseCond: "turnBody",
	},
	ballClose: {
		condition: (mgr, state, p) => state.ballDistance < 10,
		trueCond: "playerVisible",
		falseCond: "sendCommand", 
	},
	playerVisible: {
		condition: (mgr, state, p) => mgr.getVisible("p", p),
		trueCond: "playerDistance",
		falseCond: "runToGoal",
	},
	playerDistance: {
		exec(mgr, state, p){
			state.playerDistance = mgr.getDistance("p", p);
		},
		next: "playerClose",
	},
	playerClose: {
		condition: (mgr, state, p) => ((state.playerDistance - state.ballDistance) > 0 && (state.playerDistance - state.ballDistance) > state.ballDistance),
		trueCond: "runToGoal",
		falseCond: "sendCommand",
	},
	turnBody: {
		exec(mgr, state, p){
			state.command = {n: 'turn', v: state.ballAngle};
		},
		next: "sendCommand",
	},
	goalVisible: {
		condition(mgr, state, p){
			return mgr.getVisible(gatesFl, p);
		},
		trueCond: "flagSeek",
		falseCond: "rotate",
	},
	rotate: {
		exec(mgr, state, p){
			state.command = {n: "turn", v: 90}
		},
		next: "sendCommand",
	},
	flagSeek: {
		condition: (mgr, state, p) => 3 > mgr.getDistance(gatesFl, p),
		trueCond: "closeFlag",
		falseCond: "farGoal",
	},
	closeFlag: {
		exec(mgr, state, p){
			state.inGates = true;
			let angle = mgr.getAngle(gatesFl, p);
			let turnAngle = angle + 180;
			if (turnAngle > 180){
				turnAngle = -(360 - turnAngle);
			}
			state.command 
		},
		next: "sendCommand",
	},
	farGoal: {
		condition: (mgr, state, p) => mgr.getAngle(gatesFl, p) > 4,
		trueCond: "rotateToGoal",
		falseCond: "runToGoal",
	},
	rotateToGoal: {
		exec(mgr, state, p){
			state.command = {n: "turn", v: mgr.getAngle(gatesFl, p)}
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
}

module.exports = DT;