import { ErrorHandler } from '../Utils/ErrorHandler.js'

class Base {
	Base(container, state) {
		this.container = container;
		this.state = state;
	}

	tryRefresh() {
		ErrorHandler.do(() => {
			this.refresh();
		});
	}
	
	static register(goldenLayout) {
		let name = this.name; 
		goldenLayout.registerComponent(name, this);
	}
}

export { Base }