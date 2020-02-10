import { Base } from './Base.js'

import { rendererRouter } from '../rendererRouter.js'
const fs = require('fs')
const path = require('path')
const shortid = require('shortid')
import { document, settings } from '../Database.js'
import { AxisMath } from '../Utils/AxisMath.js'
import { Constants } from '../Utils/Constants.js'

class Utils extends Base {
	constructor(container, state) {
		super();
		this.container = container;
		this.state = state;

		let methodNames = Object.getOwnPropertyNames(Utils.prototype);
		for (let methodName of methodNames) {
			if (methodName == 'constructor') {
				continue;
			}

			let methodNameLong =
				//https://stackoverflow.com/questions/4149276/how-to-convert-camelcase-to-camel-case
				// insert a space before all caps
				methodName.replace(/([A-Z])/g, ' $1')
					// uppercase the first character
					.replace(/^./, function (str) { return str.toUpperCase(); })

			let button = $(`<button type="button" class="btn btn-primary btn-lg btn-block">${methodNameLong}</button>`);
			button.click(this[methodName]);
			container.getElement().append(button);
		}
	}

	clearAnimation() {
		document.set('outputFrames', [])
			.write();
	}

	importFolderAnimation() {
		let result = rendererRouter.openDialog({
			properties: ['openDirectory']
		});
		if (result == null) {
			return;
		}

		let framesAdded = 0;

		if (result) {
			let folder = result[0];
			let fileNames = fs.readdirSync(folder).sort();

			let contentToAdd = [];

			for (let fileName of fileNames) {
				let extension = path.extname(fileName);
				if (extension != ".json") {
					continue;
				}
				let baseName = path.basename(fileName);
				baseName = baseName.substr(0, -extension.length);

				if (isNaN(baseName)) {
					//check it's a valid number
					continue;
				}

				let contentAsJson = fs.readFileSync(path.join(folder, fileName), {
					encoding: 'utf8',
					flag: 'r'
				});
				let content = JSON.parse(contentAsJson);

				//validate frame
				if (!('forces' in content && 'configuration' in content)) {
					//skip frame
					console.log("Skipping content for frame " + fileName);
					continue;
				}

				contentToAdd.push({
					'id': shortid.generate(),
					'content': content,
					'importReport': {
						'path': path.join(folder, fileName),
						'date': Date.now()
					}
				});

				console.log(`Importing ${fileName}`);
				framesAdded++;
			}

			document.get('outputFrames')
				.push(...contentToAdd)
				.write();


			console.log(`Imported ${framesAdded} from ${folder}`);
		}
	}

	importFileAnimation() {
		let result = rendererRouter.openDialog({
			properties: ['openFile'],
			filters: [
				{ name: 'Json animations', extensions: ['json'] }
			],
			message: "Open Json animation"
		});
		if (result.length != 1) {
			return;
		}

		let filename = result[0];

		let contentAsJson = fs.readFileSync(filename, {
			encoding: 'utf8',
			flag: 'r'
		});
		let content = JSON.parse(contentAsJson);

		// check format
		{
			content = content.map((frame) => {
				if (frame.configuration) {
					return frame;
				}
				else {
					return {
						configuration: frame
					};
				}
			});
		}

		let framesAdded = 0;

		let contentToAdd = [];
		for (let frame of content) {
			contentToAdd.push({
				'id': shortid.generate(),
				'content': frame,
				'importReport': {
					'path': filename,
					'date': Date.now()
				}
			});

			framesAdded++;
		}


		document.get('outputFrames')
			.push(...contentToAdd)
			.write();

		console.log(`Imported ${framesAdded} from ${filename}`);
	}

	jumpToOutputFrame() {

	}

	calculateStopperAngles() {
		let outputFrames = document.get('outputFrames')
			.value();

		let shaftAnglesPerFrame = AxisMath.outputFramesToShaftAnglesPerFrame(outputFrames);
		let framesPerShaft = AxisMath.shaftAnglesPerFrameToFramesPerShaft(shaftAnglesPerFrame);

		let rangePerShaft = framesPerShaft.map(frames => AxisMath.shaftAngleRange(frames));

		let stoppers = rangePerShaft.map((shaftAngleRange, shaftIndex) => AxisMath.calculateStopper(shaftAngleRange, shaftIndex));

		settings.get("system")
			.set("stoppers", stoppers)
			.write();

		rendererRouter.notifyChange("stoppers");
	}

	exportStopperReport() {
		let saveResult = rendererRouter.saveDialog({
			title: "Export stopper report",
			filters: [
				{ name: 'Text files', extensions: ['txt'] }
			]
		});

		if (!saveResult) {
			return;
		}

		let stoppers = settings.get("system")
			.get("stoppers")
			.value();
		if (stoppers.length != Constants.totalShaftCount) {
			throw ("Stoppers are not correctly calculated");
		}

		let reportRows = [];
		for (let shaftIndex = 0; shaftIndex < Constants.totalShaftCount; shaftIndex++) {
			let shaftName = AxisMath.shaftIndexToName(shaftIndex);
			let stopper = stoppers[shaftIndex];
			reportRows.push(`Stopper on shaft ${shaftName} :`);
			if (stopper) {
				//rectify stopper to be positive range
				let stopperMax = stopper.max < stopper.min ? stopper.max + Math.PI * 2 : stopper.max;
				stopperMax = stopperMax / (Math.PI * 2) * 360;;
				let stopperMin = stopper.min / (Math.PI * 2) * 360;

				reportRows.push(`\tRange : ${stopperMin.toFixed(2)} -> ${stopperMax.toFixed(2)} degrees`);
			}
			else {
				reportRows.push('\tNo stopper');
			}

			// overrides for bottom shafts
			if(shaftName == 'A1' || shaftName == 'B1') {
				reportRows.push(`\tSlip Ring`);
			}
			
			reportRows.push('');
		}

		let reportString = reportRows.join('\n');

		fs.writeFileSync(saveResult, reportString);
	}

	nextOutputFrame() {
		let nextFrameIndex = rendererRouter.appState.get_outputFrameIndex() + 1;
		let outputFrameCount = document.get('outputFrames')
			.value()
			.length;

		if (nextFrameIndex > outputFrameCount) {
			nextFrameIndex = 0;
		}

		rendererRouter.appState.set_outputFrameIndex(nextFrameIndex);
		console.log(rendererRouter.appState.get_outputFrameIndex());
	}

	play() {
		rendererRouter.appState.set_playing(true);
	}

	pause() {
		rendererRouter.appState.set_playing(false);
	}

	stop() {
		rendererRouter.appState.set_playing(false);
		rendererRouter.appState.set_outputFrameIndex(0);
	}

}

export { Utils }