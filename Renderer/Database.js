import { rendererRouter } from './rendererRouter.js'

const low = require('lowdb')
const FileSync = require('../node_modules/lowdb/adapters/FileSync')

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
	zoomLevel: 1,
	world: {
		showForces: false,
		sunLight: {
			intensity: 0.8,
			castShadow: true,
			showHelper: false,
			nearClip: 50,
			farClip: 200,
			position: [0, -50, 100],
			size: 20,
			mapSize: 2048,
			shadowBias: -0.00001
		},
		postProcessing: {
			enabled: true,
			ambientLight: {
				type: "SAO",
				SAO: {
					saoBias: 0.5,
					saoIntensity: 0.001,
					saoScale: 10,
					saoKernelRadius: 16,
					saoMinResolution: 0,
					saoBlur: true,
					saoBlurRadius: 50,
					saoBlurStdDev: 2,
					saoBlurDepthCutOff: 0.1
				},
				SSAO: {
					kernelRadius: 8,
					minDistance: 0.01,
					maxDistance: 1
				}
			}
		}
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

class SettingNamespace{
	constructor(outerSettingNameSpace) {
		this.outerSettingNameSpace = outerSettingNameSpace;
	}

	totalNamespace(innerSettingNameSpace) {
		return this.outerSettingNameSpace.concat(innerSettingNameSpace);
	}

	get(innerSettingNameSpace, defaultValue) {
		let namespace = this.totalNamespace(innerSettingNameSpace);
		
		let setting = settings;
		for(let level of namespace) {
			setting = setting.get(level);
		}
		let value = setting.value();

		if(value !== undefined) {
			return value;
		}
		else if(defaultValue !== undefined) {
			this.set(innerSettingNameSpace, defaultValue);
			return defaultValue;
		}
	}

	set(innerSettingNameSpace, value) {
		let namespace = this.totalNamespace(innerSettingNameSpace);
		
		let setting = settings;
		for(let levelIndex = 0; levelIndex < namespace.length -1; levelIndex++) {
			let levelName = namespace[levelIndex];
			let nextLevel = setting.get(levelName);
			if(nextLevel.value() == undefined) {
				setting.set(levelName, {}).write();
			}
			setting = nextLevel;
		}
		setting.set(namespace[namespace.length - 1], value).write();
	}

	forceNamespace(namespace, defaultValue) {

	}
}

window.db = {};
window.db.document = document;
window.db.settings = settings;

export { settings, document, SettingNamespace }