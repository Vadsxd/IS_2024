const FL = "flag", KI = "kick", PL = "p";
const leaderSpeed = 40, goalAngle = 4, rotationSpeed = 75;
const fullSpeed = 100, avgSpeed = 40, lowSpeed = 20;
const farPlayerDist = 13, avgPlayerDist = 7, closePlayerDist = 2;
const holdedAngle = 35, aroundAngleLow = 20, aroundAngleHigh = 30;
const leaderStop = 7;

const DT2 = {
	state: {
		next: 0,
		sequence: [/*{act: FL, fl: "fcb"},*/
			{act: KI, fl: "b", goal: "gr"}],
		command: null,
		leader: null
	},
	root: {
		exec(mgr, state, p){
			state.action = state.sequence[state.next];
			state.command = null;
		},
		next: "position",
	},
	position: {
		condition: (mgr, state, p) => state.leader === null,
		trueCond: "definePosition", 
		falseCond: "isLeader",
	},
	definePosition: {
		condition: (mgr, state, p) => mgr.getVisible(PL, p),
		trueCond: "slaveInit",
		falseCond: "leaderInit",
	},
	leaderInit: {
		exec(mgr, state, p){
			state.leader = true;
		},
		next: "leaderProgram",
	},
	slaveInit: {
		exec(mgr, state, p){
			state.leader = false;
		},
		next: "slaveProgram",
	},
	isLeader: {
		condition: (mgr, state, p) => state.leader,
		trueCond: "leaderProgram",
		falseCond: "slaveProgram",
	},
	slaveProgram: {
		condition: (mgr, state, p) => mgr.getVisible(PL, p),
		trueCond: "countMeasures",
		falseCond: "rotate",
	},
	countMeasures: {
		exec(mgr, state, p){
			//state.command = null;
			state.dist = mgr.getDistance(PL, p);
			state.angle = mgr.getAngle(PL, p);
		},
		next: "seeFacingDir",		
	},
	seeFacingDir: {
		condition: (mgr, state, p) => state.dist <= 14,
		trueCond: "getFaceDir",
		falseCond: "collisionAvoidance",
	},
	getFaceDir: {
		exec(mgr, state, p){
			state.faceDir = mgr.getFaceDir(PL, p);
		},
		next: "checkFaceDir",
	},
	checkFaceDir:{
		condition: (mgr, state, p) => Math.abs(state.faceDir) <= 90,
		trueCond: "collisionAvoidance",
		falseCond: "around",
	},
	around: {
		condition: (mgr, state, p) => (state.angle >= -aroundAngleHigh) && (state.angle <= -aroundAngleLow),
		trueCond: "dash80",
		falseCond: "turnByFaceDir",	
	},
	turnByFaceDir: {
		exec(mgr, state, p){
			state.command = {n: "turn", v: state.angle + aroundAngleHigh};
		},
		next: "sendCommand",
	},
	collisionAvoidance: {
		condition: (mgr, state, p) => (state.dist < closePlayerDist && Math.abs(state.angle) < 40),
		trueCond: "rotate30",
		falseCond: "distCheck",
	},
	rotate30: {
		exec(mgr, state, p){
			state.command = {n: "turn", v: 30};
		},
		next: "sendCommand",
	},
	distCheck: {
		condition: (mgr, state, p) => state.dist > farPlayerDist,
		trueCond: "farPlayer",
		falseCond: "closePlayer",
	},
	farPlayer: {
		condition: (mgr, state, p) => Math.abs(state.angle) > 5,
		trueCond: "angleRotate",
		falseCond: "dash80",
	},
	angleRotate: {
		exec(mgr, state, p){
			state.command = {n: "turn", v: state.angle};
		},
		next: "sendCommand",
	},
	dash80: {
		exec(mgr, state, p){
			state.command = {n: "dash", v: fullSpeed};
		},
		next: "sendCommand",		
	},
	closePlayer: {
		condition: (mgr, state, p) => (state.angle > 40 || state.angle < 30),
		trueCond: "holdAngle",
		falseCond: "holdDistance",
	},
	holdAngle: {
		exec(mgr, state, p){
			state.command = {n: "turn", v: state.angle - holdedAngle};
		},
		next: "sendCommand",				
	},
	holdDistance: {
		condition: (mgr, state, p) => (state.dist < avgPlayerDist),
		trueCond: "dash20",
		falseCond: "dash40",
	},
	dash20: {
		exec(mgr, state, p){
			state.command = {n: "dash", v: lowSpeed};
		},
		next: "sendCommand",		
	},
	dash40: {
		exec(mgr, state, p){
			state.command = {n: "dash", v: avgSpeed};
		},
		next: "sendCommand",		
	},
	leaderProgram: {
		condition: (mgr, state, p) => mgr.getVisible("p", p),
		trueCond: "isSlaveClose",
		falseCond: "goalPath",
	},
	isSlaveClose: {
		condition(mgr, state, p){
			return mgr.getDistance("p", p) < leaderStop;//closePlayerDist;
		},
		trueCond: "slowMove",
		falseCond: "goalPath",
	},
	slowMove: {
		exec(mgr, state, p){
			state.command = {n: "dash", v: 5};
		},
		next: "sendCommand",
	},
	goalPath: {
		condition(mgr, state, p){
			return mgr.getVisible(state.action.fl, p);
		},
		trueCond: "rootNext",
		falseCond: "rotate",
	},
	rotate: {
		exec(mgr, state, p){
			state.command = {n: "turn", v: rotationSpeed}
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
		next: "leaderProgram",
	},
	farGoal: {
		condition: (mgr, state, p) => Math.abs(mgr.getAngle(state.action.fl, p)) > goalAngle,
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
			state.command = {n: "dash", v: leaderSpeed};
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

module.exports = DT2;
