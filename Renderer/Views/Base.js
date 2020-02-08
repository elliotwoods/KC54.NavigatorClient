class Base {
	Base(container, state) {
		this.container = container;
		this.state = state;
	}

	tryRefresh() {
		try {
			this.refresh();
		}
		catch(exception) {
			// print error to container
		}
	}
	
	static register(goldenLayout) {
		let name = this.name; 
		goldenLayout.registerComponent(name, this);
	}
}

export { Base }