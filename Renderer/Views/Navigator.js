import { Functions } from './Functions.js'

import { rendererRouter } from '../rendererRouter.js'
const fs = require('fs')
const path = require('path')
import { document, SettingsNamespace } from '../Database.js'
import { AxisMath } from '../Utils/AxisMath.js'
import { Constants } from '../Utils/Constants.js'
import { Inspectable } from './Inspector.js'
import { NavigatorServer } from '../Utils/NavigatorServer.js'
import { outputTimeline } from '../Data/outputTimeline.js'

let settingsNamespace = new SettingsNamespace(["Views", "Navigator"]);

//set defaults for testObjective
settingsNamespace.get("testObjective", [
	{
		"objective": {
			"type": "BeSpringLike"
		},
		"weight": 1.234
	},
	{
		"objective": {
			"scale": 20,
			"type": "StayInTheGarden"
		},
		"weight": 2.345
	},
	{
		"objective": {
			"firstBeam": 15,
			"secondBeam": 17,
			"type": "HoldHands"
		},
		"weight": 0.1
	},
	{
		"objective": {
			"standardDeviation": 0.3,
			"type": "DoNotCollide"
		},
		"weight": 1
	}
]);

let testObjectiveInspectable = new Inspectable(() => {
	return settingsNamespace.get("testObjective");
}, (value) => {
	settingsNamespace.set("testObjective", value);
}, "Test objectives");

class Navigator extends Functions {
	constructor(container, state, childType) {
		super(container, state, Navigator, {
			ping: {
				icon: "fas fa-table-tennis"
			},
			parkingPose: {
				icon: "fas fa-parking"
			},
			spiralPose: {
				icon: "fab fa-stumbleupon"
			},
			optimise: {
				icon: "fas fa-chart-line"
			},
			deleteLastFrame: {
				icon: "fas fa-backspace"
			},
		});
	}

	async ping() {
		let response = await post('Ping');
		console.log(response);
	}

	async parkingPose() {
		let pose = await NavigatorServer.getParkingPose();
		outputTimeline.addFrame(pose, "Navigator::parkingPose");
	}

	async spiralPose() {
		let pose = await NavigatorServer.getSpiralPose();
		outputTimeline.addFrame(pose, "Navigator::spiralPose");
	}

	inspect_testObjectives() {
		return testObjectiveInspectable;
	}

	async optimise() {
		let currentOutputFrame = document.getCurrentOutputFrame();

		const response = await post('optimise', {
			initialGuess : currentOutputFrame.configuration,
			objective : settingsNamespace.get("testObjective")
		});

		let frameData = {
			id: shortid.generate(),
			content: {
				configuration: response
			},
			importReport: {
				source: 'Navigator',
				data: Date.now()
			}
		};
		document.get('outputFrames')
			.push(frameData)
			.write();

		rendererRouter.notifyChange('outputFrameData');
		console.log(response);

		// jump to last frame
		{
			let outputFrameCount = document.get('outputFrames')
				.size()
				.value();
			rendererRouter.appState.set_outputFrameIndex(outputFrameCount - 1);
		}
	}

	deleteLastFrame() {
		let frameCount = document.get('outputFrames').size().value();
		if (frameCount > 0) {
			let idOfLast = document.get(`outputFrames[${frameCount - 1}].id`).value();
			document.get('outputFrames')
				.remove({ id: idOfLast })
				.write()
			rendererRouter.notifyChange('outputFrameData');
		}
	}

}

export { Navigator }