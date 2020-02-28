import { Base } from './Base.js'
import { rendererRouter } from '../rendererRouter.js'

let inspectors = [];
let currentTarget = null;

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
					if(currentTarget != null) {
						currentTarget.set(this.editor.get());
					}
				}
			};
			this.editor = new JSONEditor(this.editorDiv[0], options);
		}
		
		{
			this.viewerDiv = $(`<div class="container Inspector_container"/>`);
			this.container.getElement().append(this.viewerDiv);
			let viewOnlyOptions = {...options};
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

		let editorContainer = $(this.editor.container);
		let viewerContainer = $(this.viewer.container);

		if(currentTarget == null) {
			editorContainer.hide();
			viewerContainer.hide();
			this.title.text("")
		}
		else {
			this.title.text(currentTarget.name)

			if(currentTarget.set) {
				// EDIT
				this.editor.set(currentTarget.get());
				this.editor.expandAll();
				editorContainer.show();
				viewerContainer.hide();
			}
			else {
				// VIEW ONLY
				this.viewer.set(currentTarget.get());
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


export { Inspector, Inspectable, inspect, toggleInspect, isBeingInspected }