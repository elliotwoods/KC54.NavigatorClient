class Base {
	static register(goldenLayout) {
		let name = this.name; 
		goldenLayout.registerComponent(name, this.prototype.constructor);
	}
}

export { Base }