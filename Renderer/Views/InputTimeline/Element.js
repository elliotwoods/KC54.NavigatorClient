class Element {
	constructor(draw, onBuild, onRefresh, dirtyOnResize) {
		this.dirty = true;
		this.draw = draw;
		this.children = {};
		this.viewWidth = 100;

		this.onBuild = onBuild;
		this.onRefresh = onRefresh;
		this.dirtyOnResize = dirtyOnResize;

		this.dirty = true;

		this.build();
	}

	build() {
		if(this.onBuild) {
			this.onBuild(this);
		}
	}
	
	resize(viewWidth) {
		this.viewWidth = viewWidth;
		
		if(this.dirtyOnResize) {
			this.dirty = true;
		}
		if(this.onResize) {
			this.onResize(this);	
		}
		for(let childName in this.children) {
			this.children[childName].resize(viewWidth);
		}
	}

	refresh() {
		if(this.onRefresh && this.dirty) {
			this.onRefresh(this);
		}
		for(let childName in this.children) {
			this.children[childName].refresh();
		}
		this.dirty = false;
	}

	markDirty(recursive) {
		this.dirty = true;
		if(recursive) {
			for(let childName in this.children) {
				this.children[childName].markDirty(true);
			}
		}
	}
}

export { Element }