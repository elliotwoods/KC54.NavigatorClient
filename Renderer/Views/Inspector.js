import { Base } from './Base.js'
import { rendererRouter } from '../rendererRouter.js'

let inspectors = [];
let currentTarget = null;
let defaultTarget = null;

class Inspector extends Base {
	constructor(container, state) {
		super();
		this.container = container;
		this.state = state;

		this.target = null;
		this.title = $(`<h4 class="Inspector_title"></h4>`);
		this.container.getElement().append(this.title);
		
		let options;
		{
			this.editorDiv = $(`<div class="container Inspector_container"/>`);
			this.container.getElement().append(this.editorDiv);
			options = {
				modes : ['tree', 'form', 'code'],
				onChange : () => {
					try {
						if(this.target != null) {
							this.target.set(this.editor.get());
						}
					}
					catch {
						// json is not valid, ignore
					}
				}
			};
			this.editor = new JSONEditor(this.editorDiv[0], options);
		}
		
		{
			this.viewerDiv = $(`<div class="container Inspector_container"/>`);
			this.container.getElement().append(this.viewerDiv);
			let viewOnlyOptions = {...options}; // clone object
			viewOnlyOptions.modes = ['view'];
			this.viewer = new JSONEditor(this.viewerDiv[0], viewOnlyOptions);
		}

		inspectors.push(this);

		this.refresh();
	}

	destroy() {
		//this doesn't seem to be called
		inspectors = array.filter(inspector => inspector !== this);
		this.editor.destroy();
		this.viewer.destroy();
	}

	refresh() {
		// unless we can lock an inspector
		this.target = currentTarget;

		// if there is no target, look at the default inspectable
		if(!this.target) {
			this.target = defaultTarget;
		}

		let editorContainer = $(this.editor.container);
		let viewerContainer = $(this.viewer.container);

		if(this.target == null) {
			editorContainer.hide();
			viewerContainer.hide();
			this.title.text("")
		}
		else {
			let name = this.target.name;
			// if we gave a lambda for the name, use that
			if(typeof(name) == "function") {
				name = name();
			}
			this.title.text(name)

			if(this.target.set) {
				// EDIT
				this.editor.set(this.target.get());
				viewerContainer.hide();
				editorContainer.show();

				if(this.editor.expandAll) {
					// Expand if we're in code view
					this.editor.expandAll();
				}
			}
			else {
				// VIEW ONLY
				this.viewer.set(this.target.get());
				this.viewer.expandAll();
				viewerContainer.show();
				editorContainer.hide();
			}
		}
	}
}

// this is the main control function
function inspect(target) {
	if(currentTarget == target) {
		return;
	}

	let oldTarget = currentTarget;
	currentTarget = target;

	if(oldTarget) {
		oldTarget.notifyDeInspect();
		oldTarget.notifyInspectChange();
	}

	if(target) {
		target.notifyInspect();
		target.notifyInspectChange();
	}

	for(let inspector of inspectors) {
		inspector.refresh();
	}
	rendererRouter.notifyChange('inspectTargetChange');
}

function deInspect(target) {
	if(currentTarget == target) {
		inspect(null);
	}
}

function toggleInspect(target) {
	if(currentTarget != target) {
		inspect(target);
	}
	else {
		inspect(null);
	}
}

function setDefaultInspectable(inspectable) {
	defaultTarget = inspectable;
}

function isBeingInspected(target) {
	return target == currentTarget;
}

class Inspectable {
	constructor(get, set, name) {
		this.get = get;
		this.set = set;
		this.name = name;
		this._onInspectCallbacks = [];
		this._onDeInspectCallbacks = [];
		this._onInspectChangeCallbacks = [];
		this._onInspectorChangeValueCallbacks = [];
	}

	inspect() {
		inspect(this);
	}

	deInspect() {
		deInspect(this);
	}

	toggleInspect() {
		toggleInspect(this);
	}

	isBeingInspected() {
		return isBeingInspected(this);
	}

	onInspect(callback) {
		this._onInspectCallbacks.push(callback);
	}

	onDeInspect(callback) {
		this._onDeInspectCallbacks.push(callback);
	}

	onInspectChange(callback) {
		this._onInspectChangeCallbacks.push(callback);
	}

	onInspectorChangeValue(callback) {
		this._onInspectorChangeValueCallbacks.push(callback);
	}

	notifyInspect() {
		for(let callback of this._onInspectCallbacks) {
			callback();
		}
	}

	notifyDeInspect() {
		for(let callback of this._onDeInspectCallbacks) {
			callback();
		}
	}

	notifyInspectChange() {
		for(let callback of this._onInspectChangeCallbacks) {
			callback();
		}
	}

	notifyInspectorChangeValue() {
		for(let callback of this._onInspectorChangeValueCallbacks) {
			callback();
		}
	}
	

	notifyValueChange() {
		for(let inspector of inspectors) {
			if(inspector.target == this) {
				inspector.refresh();
			}
		}
	}

	destroy() {
		this.deInspect();
	}
}


export { Inspector, Inspectable, inspect, toggleInspect, isBeingInspected, setDefaultInspectable }