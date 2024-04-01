class Controller{
	constructor(acts){
		this.acts = acts;
		this.cur = 0;
	}

	get_current_task(){
		return this.acts[this.cur];
	}
}


module.exports = Controller;
