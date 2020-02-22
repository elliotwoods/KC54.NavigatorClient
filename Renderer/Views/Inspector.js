import { Base } from './Base.js'
import { rendererRouter } from '../rendererRouter.js'

let inspectors = [];
let currentTarget = null;

class Inspector extends Base {
	constructor(container, state) {
		super();
		this.container = container;
		this.state = state;

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
		}
		else {
			editorContainer.show();
			this.editor.set(currentTarget.get());
		}
	}
}

// this is the main control function
function inspect(target) {
	if(currentTarget == target) {
		return;
	}

	currentTarget = target;
	for(let inspector of inspectors) {
		inspector.refresh();
	}
	rendererRouter.notifyChange('inspectTargetChange');
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
		this.onInspectCallbacks = [];
		this.onDeInspectCallbacks = [];
	}

	inspect() {
		inspect(this);
	}

	isBeingInspected() {
		return isBeingInspected(this);
	}

	onInspect(callback) {
		this.onInspectCallbacks.push(callback);
	}

	onDeInspect(callback) {
		this.onDeInspectCallbacks.push(callback);
	}
}


export { Inspector, Inspectable, inspect, toggleInspect, isBeingInspected }