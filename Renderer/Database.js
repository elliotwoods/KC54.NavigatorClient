import { rendererRouter } from './rendererRouter.js'

const low = require('lowdb')
const FileSync = require('../node_modules/lowdb/adapters/FileSync')
const merge = require('deepmerge')

const settings = low(new FileSync('settings.json'));
settings.defaults({
	documentPath: "document.json",
	system: {
		stopperSettings: {
			stopperOffsetDegrees: 5,
			minStopperSizeDegrees: 5
		},
		stoppers: []
	},
	viewLayout: {
	}
}).write();

let documentPath = settings.get('documentPath').value();
const document = new low(new FileSync(documentPath));
document.defaults({
	outputFrames: []
}).write();

document.getCurrentOutputFrame = () => {
	let currentFrameIndex = rendererRouter.appState.get_outputFrameIndex();
	let outputFrames = document.get('outputFrames')
		.value();
	if (outputFrames.length == 0) {
		return {}
	}
	else if (currentFrameIndex >= outputFrames.length) {
		rendererRouter.appState.set_outputFrameIndex(0);
		return outputFrames[0].content;
	}
	else {
		return outputFrames[currentFrameIndex].content;
	}
};

let settingsNamespaceObjects = [];

function namespaceMatchAtCommonDepth (ns1, ns2) {
	if(ns1 && ns2) {
		let length = Math.min(ns1.length, ns2.length);
		for(let i=0; i<length; i++) {
			if(ns1[i] != ns2[i]) {
				return false;
			}
		}
	}
	return true;
}

function mergeNamespace(outer, inner) {
	if(typeof(outer) == "string") {
		outer = [outer];
	}
	if(typeof(inner) == "string") {
		inner = [inner];
	}

	if(outer) {
		if (inner) {
			return [...outer, ...inner];
		}
		return outer;
	}
	else {
		return inner;
	}
}

class SettingsNamespace {
	constructor(outerSettingsNameSpace) {
		this.outerSettingsNameSpace = outerSettingsNameSpace;
		this._onChangeListeners = [];
		settingsNamespaceObjects.push(this);
	}

	totalNamespace(innerSettingsNameSpace) {
		return mergeNamespace(this.outerSettingsNameSpace, innerSettingsNameSpace);
	}

	get(innerSettingsNameSpace) {
		let namespace = this.totalNamespace(innerSettingsNameSpace);
		
		let setting = settings;

		// traverse lodash
		for(let level of namespace) {
			setting = setting.get(level);
		}
		let value = setting.value();
		return value;
	}

	set(value, innerSettingsNameSpace) {
		let namespace = this.totalNamespace(innerSettingsNameSpace);
		
		let setting = settings;
		for(let levelIndex = 0; levelIndex < namespace.length -1; levelIndex++) {
			// traverse lodash and insert blank objects where required
			let levelName = namespace[levelIndex];
			let nextLevel = setting.get(levelName);
			if(nextLevel.value() == undefined) {
				setting.set(levelName, {}).write();
			}
			setting = nextLevel;
		}
		setting.set(namespace[namespace.length - 1], value).write();

		// alert all SettingsNamespace objects of this change
		settingsNamespaceObjects.map(settingsNamespaceObject => settingsNamespaceObject.onGlobalChange(namespace));
	}

	onChange(action, innerNamespace) {
		this._onChangeListeners.push({
			innerNamespace : innerNamespace,
			action :  action
		});
		return () => {
			action(this.get(innerNamespace))
		};
	}

	notifyOnChange(innerNamespace) {
		// notify all listeners with matching namespaces
		this._onChangeListeners
			.filter(listener => namespaceMatchAtCommonDepth(listener.innerNamespace, innerNamespace))
			.map(listener => listener.action(this.get(listener.innerNamespace)));
	}

	onGlobalChange(namespace) {
		let matches = namespaceMatchAtCommonDepth(namespace, this.outerSettingsNameSpace);
		if(!matches) {
			return;
		}

		if(namespace.length > this.outerSettingsNameSpace.length) {
			// it's a child of ours
			this.notifyOnChange(namespace.slice(this.outerSettingsNameSpace.length));
		}
		else {
			// it's a parent of ours
			this.notifyOnChange();
		}
	}

	defaults(values) {
		let value = merge(values, this.get());
		this.set(value);
	}
}

window.db = {};
window.db.document = document;
window.db.settings = settings;

export { settings, document, SettingsNamespace }