const TA = {
	current: "start", 
	state: {
		variables: {dist: null},
		timers: {t: 0},
		next: true,
		synch: undefined,
		local: {},
	},
	nodes: {
		start: {n: "start", e: ['ballfound']},
		ballfound: {n: "ballfound", e: ["near", "far"]},
		far: {n: "far", e: ["start"]},
		near: {n: "near", e: ["start"]},
	},
	edges: {
		start_ballfound: [{synch: "lookAround!"}],
		ballfound_near: [{guard: [{s: "lte", l: {v: "dist"}, r: 0.5}]}],
		ballfound_far: [{guard: [{s: "gt", l: {v: "dist"}, r: 0.5}]}],
		far_start: [{synch: "runToBall!"}],
		near_start: [{synch: "kick!"}],
	},
	actions: {
		beforeAction(taken, state) {
			// Действие перед каждым вычислением
			if (taken.state['ball']){
				state.variables.dist = taken.state["ball"].dist;	
			} else {
				state.variables.dist = null;
			}

		},
		lookAround(taken, state) {
			state.next = false;
			if (!taken.state['ball']) return { n: 'turn', v: 90 };
			else state.next = true;		
		},
		runToBall(taken, state) {
			// Бежим к мячу
			state.next = true;
			let ball = taken.state['ball'];
			if (!ball) return;
			if (ball.dist <= 0.5) {
				return;
			}
			if (Math.abs(ball.angle) > 10) return { n: 'turn', v: ball.angle };
			let speed = 100;
			if (ball.dist < 2){
				speed = 30;
			}
			return { n: 'dash', v: speed };
		},
		kick(taken, state){
			state.next = true;
			if (!taken.state['goal']) return {n: 'kick', v: "10 45"};
			let goal = taken.state['goal'];
			return {n: 'kick', v: "100 " + goal.angle};
		}
	}
}	


module.exports = TA;

