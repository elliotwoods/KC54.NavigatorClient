import { Base } from './Base.js'
import { rendererRouter } from '../rendererRouter.js'

let inspectors = [];
let currentTarget = null;

class Inspector extends Base {
	constructor(container, state) {
		super();
		this.container = container;
		this.state = state;

		this.title = $(`<h4 class="Inspector_title"></h4>`);
		this.container.getElement().append(this.title);
		this.div = $(`<div class="container Inspector_container"/>`);
		this.container.getElement().append(this.div);
		let options = {
			modes : ['tree', 'form', 'code'],
			onChange : () => {
				if(currentTarget != null) {
					currentTarget.set(this.editor.get());
				}
			}
		};
		this.editor = new JSONEditor(this.div[0], options);

		inspectors.push(this);

		this.refresh();
	}

	destroy() {
		//this doesn't seem to be called
		inspectors = array.filter(inspector => inspector !== this);
		this.editor.destroy();
	}

	refresh() {
		let editorContainer = $(this.editor.container);
		if(currentTarget == null) {
			editorContainer.hide();
			this.title.text("Inspector")
		}
		else {
			editorContainer.show();
			this.editor.set(currentTarget.get());
			this.title.text(currentTarget.name)
		}
	}
}

// this is the main control function
function inspect(target) {
	if(currentTarget == target) {
		return;
	}

	currentTarget = target;

	if(currentTarget) {
		currentTarget.notifyDeInspect();
		currentTarget.notifyInspectChange();
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

	destroy() {
		this.deInspect();
	}
}


export { Inspector, Inspectable, inspect, toggleInspect, isBeingInspected }