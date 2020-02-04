class Base {
	Base(container, state) {
		this.container = container;
		this.state = state;
	}

	refresh() {

	}
	
	static register(goldenLayout) {
		let name = this.name; 
		goldenLayout.registerComponent(name, this);
	}
}

export { Base }