import { Functions } from './Functions.js'

import { rendererRouter } from '../rendererRouter.js'
const fs = require('fs')
const path = require('path')
const shortid = require('shortid')
import { document, settings } from '../Database.js'
import { AxisMath } from '../Utils/AxisMath.js'
import { Constants } from '../Utils/Constants.js'
import { Inspectable } from './Inspector.js'

const bent = require('bent')
const getJSON = bent('json')
const post = bent('http://localhost:8080/', 'POST', 'json');

let testObjective = [
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
];

let testObjectiveInspectable = new Inspectable(() => {
	return testObjective;
}, (value) => {
	testObjective = value;
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
		let response = await getJSON('http://localhost:8080/ping', { json: true });
		console.log(response);
	}

	async parkingPose() {
		const response = await post('parkingPose', {});

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
	}

	async spiralPose() {
		const response = await post('spiralPose', {});

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
	}

	inspect_testObjectives() {
		return testObjectiveInspectable;
	}

	async optimise() {
		let currentOutputFrame = document.getCurrentOutputFrame();

		try {
			const response = await post('optimise', {
				initialGuess : currentOutputFrame.configuration,
				objective : testObjective
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
		catch (error) {
			console.log(error);
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