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
		start: {n: "start", e: ["inGoal"]},
		inGoal: {n: "inGoal", e: ["ballfound"]},
		ballfound: {n: "ballfound", e: ["inGoal", "close", "near", "far"]},
		close: { n: "close", e: ["catch"] },
		catch: { n: "catch", e: ["kick"] },
		kick: { n: "kick", e: ["start"] },
		far: {n: "far", e: ["inGoal"]},
		near: { n: "near", e: ["intercept", "inGoal"] },
		intercept: { n: "intercept", e: ["inGoal"] },
	},
	edges: {
		start_inGoal: [{synch: "goBack!"}],
		inGoal_ballfound: [{synch: "lookAround!"}],
		//-----
		ballfound_inGoal: [{synch: "stillHere?"}],
		ballfound_close: [{guard: [{s: "lt", l: {v: "dist"}, r: 2}]}],
		ballfound_near: [{guard: [{s: "lt", l: {v: "dist"}, r: 16}, {s: "lte", l: 2, r: {v: "dist"}}]}],
		ballfound_far: [{guard: [{s: "lte", l: 16, r: {v: "dist"}}]}],
		close_catch: [{synch: "catch!"}],
		catch_kick: [{synch: "kick!"}],
		kick_start: [{synch: "goBack!", assign: [{n: "t", v: 0, type: "timer"}]}],
		far_inGoal: [{ assign: [{ n: 't', v: 0, type: 'timer' }] }],
		near_inGoal: [{synch: "empty!", assign: [{n: "t", v: 0, type: "timer"}]}],
		near_intercept: [{synch: "canIntercept?"}],
		intercept_inGoal: [{synch: 'runToBall!', assign: [{n: "t", v: 0, type: "timer"}]}],
	},
	actions: {
		init(taken, state) {
			// Инициализация игрока
			state.local.goalie = true;
			state.local.catch = 0;
		},
		stillHere(taken, state){
			if (!taken.state['ball']){
				return true;
			}
			return false;
		},
		beforeAction(taken, state) {
			// Действие перед каждым вычислением
			if (taken.state['ball']){
				state.variables.dist = taken.state["ball"].dist;	
			} else {
				state.variables.dist = null;
			}

		},
		goToGoal(taken, state){
			console.log("Taken.state: ", taken.state);
		},
		catch(taken, state) {
			// Ловим мяч
			if (!taken.state['ball']) {
				state.next = true;
				return;
			}
			let angle = taken.state['ball'].angle;
			let dist = taken.state['ball'].dist;
			state.next = false;
			if (dist > 0.5) {
				if (state.local.goalie) {
					if (state.local.catch < 3) {
						state.local.catch++;
						return { n: 'catch', v: angle };
					} else state.local.catch = 0;
				}
				if (Math.abs(angle) > 15) return { n: 'turn', v: angle };
				return { n: 'dash', v: 25 };
			}
			state.next = true;
		},
		kick(taken, state) {
			// Пинаем мяч
			state.next = false;
			if (!taken.state['ball']){
				state.next = true;
				return;
			}
			let dist = taken.state['ball'].dist;
			if (dist > 0.5){
				state.next = true;
				return;
			}
			if (!taken.state['gl']){
				return {n: "turn", v: 45};
			}
			let left_goal = taken.state['gl'];
			return {n: "kick", v: '100 ' + left_goal.angle};
			/*
			let goal = taken.state['goal'];
			let player = 'B';//taken.teamOwn ? taken.teamOwn[0] : null;
			let target; 
			if (goal && player) target = goal.dist < player.dist ? goal : player;
			else if (goal) target = goal;
			else if (player) target = player;
			if (target) return { n: 'kick', v: `${target.dist * 2 + 40} ${target.angle}` };
			*/
		},
		goBack(taken, state) {
			// Возврат к воротам
			state.next = false;
			let goalOwn = taken.state['goal'];
			if (!goalOwn) return { n: 'turn', v: 90 };
			if (Math.abs(goalOwn.angle) > 10) return { n: 'turn', v: goalOwn.angle };
			if (goalOwn.dist < 2) {
				state.next = true;
				return { n: 'turn', v: 180 };
			}
			return { n: 'dash', v: Math.round(goalOwn.dist * 2 + 20) };
		},
		lookAround(taken, state) {
			state.next = false;
			if (!taken.state['ball']) return { n: 'turn', v: 90 };
			else state.next = true;		
		},
		canIntercept(taken, state) {
			// Можем добежать первыми
			let ball = taken.state['ball'];
			let ballPrev = taken.state['ballPrev'];
			return true;
			state.next = true;
			if (!ball) return false;
			if (!ballPrev) return true;
			if (ball.dist <= ballPrev.dist + 0.5) return true;
			return false;
		},
		runToBall(taken, state) {
			// Бежим к мячу
			state.next = true;
			let ball = taken.state['ball'];
			if (!ball) return;
			if (ball.dist <= 2) {
				return;
			}
			if (Math.abs(ball.angle) > 10) return { n: 'turn', v: ball.angle };

			return { n: 'dash', v: 100 };
		},
		ok(taken, state){
			state.next = true;
			return {n: "turn", v: 0}
		},
		empty(taken, state) {
			state.next = true;
		}
	},
}	


module.exports = TA;

