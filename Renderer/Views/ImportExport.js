import { Functions } from './Functions.js'

import { rendererRouter } from '../rendererRouter.js'
const fs = require('fs')
const path = require('path')
const shortid = require('shortid')
import { document, settings } from '../Database.js'
import { AxisMath } from '../Utils/AxisMath.js'
import { Constants } from '../Utils/Constants.js'
import { GuiUtils } from '../Utils/GuiUtils.js'
import { ErrorHandler } from '../Utils/ErrorHandler.js'
import { outputTimeline } from '../Data/outputTimeline.js'

class ImportExport extends Functions {
	constructor(container, state, childType) {
		super(container, state, ImportExport, {
			clearAnimation: {
				icon: "fas fa-trash"
			},
			importFolderAnimation: {
				icon: "fas fa-folder-open"
			},
			importFileAnimation: {
				icon: "fas fa-file-import"
			},
			calculateStopperAngles: {
				icon: "fas fa-circle-notch"
			},
			exportStopperReport: {
				icon: "fas fa-file-contract"
			},
			exportFrameForRhino : {
				icon : "fas fa-file-csv"
			}
		});
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
						'source' : 'importFolderAnimation',
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
			rendererRouter.notifyChange('outputTimeline');
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
		if(!result) {
			return;
		}
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
					return {
						pose : frame.configuration
					};
				} else if (frame.pose) {
					return frame
				}
				else {
					return {
						pose: frame
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
					'source' : 'importFileAnimation',
					'path': filename,
					'date': Date.now()
				}
			});

			framesAdded++;
		}


		document.get('outputFrames')
			.push(...contentToAdd)
			.write();

		rendererRouter.notifyChange('outputTimeline');
		console.log(`Imported ${framesAdded} from ${filename}`);
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
			if (shaftName == 'A1' || shaftName == 'B1') {
				reportRows.push(`\tSlip Ring`);
			}

			reportRows.push('');
		}

		let reportString = reportRows.join('\n');

		fs.writeFileSync(saveResult, reportString);
	}

	exportFrameForRhino() {
		let saveResult = rendererRouter.saveDialog({
			title: "Export pose frame for Rhino analysis",
			filters: [
				{ name: 'CSV', extensions: ['csv'] }
			]
		});

		if (!saveResult) {
			return;
		}

		let frame = outputTimeline.getCurrentFrame();

		let frameStrings = frame.content.pose.map(joint => joint.angleToX.toString());
		let frameString = frameStrings.join('\n');
		fs.writeFileSync(saveResult, frameString);
	}
/*
	testModal() {
		GuiUtils.modalDialog("Test modal huh", "HEre is some stuff I've heard", {
			doThis : () => {
				console.log("this");
			},
			doThat : () => {
				console.log("that")
			}
		});
	}

	testError() {
		throw(Error("Fucking error all right"));
	}

	async testErrorAsync() {
		await new Promise(resolve => setTimeout(resolve, 1000));
		throw(Error("Fucking error all right"));
	}
*/
}

export { ImportExport }