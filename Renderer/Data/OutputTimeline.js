import { document, settings } from '../Database.js'
import { rendererRouter } from '../rendererRouter.js'
import { transport } from './transport.js'

const shortid = require('shortid')

class OutputTimeline {
	constructor() {
		this._cache = {
			dirty: true,
			tracks: {},
			frameCount: 0
		}

		this.trackAddresses = [
			["force", "x"],
			["force", "y"],
			["force", "z"],
			["moment", "x"],
			["moment", "y"],
			["moment", "z"]
		];
	}

	get() {
		return document.get("outputTimeline").value();
	}

	set(value) {
		document.set("outputTimeline").set(value).write();
	}

	getTracks() {
		this.buildTracks();
		return this._cache.tracks;
	}

	getFrameCount() {
		return document.get("outputFrames").size().value();
	}

	getCurrentFrameIndex() {
		return rendererRouter.appState.get_outputFrameIndex();
	}

	getFrame(frameIndex) {
		return document.get("outputFrames").nth(frameIndex).value();
	}

	getCurrentFrame() {
		let outputFrameIndex = this.getCurrentFrameIndex();
		return this.getFrame(outputFrameIndex);
	}

	getLastFrame() {
		let frameCount = this.getFrameCount();
		if (frameCount == 0) {
			throw (new Error("No last frame available"));
		}
		return this.getFrame(frameCount - 1);
	}

	// Add a frame to the end of the sequence
	addFrame(pose, sourceName, renderData) {
		let frameData = {
			id: shortid.generate(),
			content: {
				configuration: pose
			},
			renderData: renderData,
			importReport: {
				source: sourceName,
				date: Date.now()
			}
		};

		document.get('outputFrames')
			.push(frameData)
			.write();

		rendererRouter.notifyChange('outputTimeline');
	}

	setFrame(frameIndex, pose, sourceName, renderData) {
		let priorFrameCount = this.getFrameCount();
		if (frameIndex == priorFrameCount) {
			// append frame
			this.addFrame(pose);
		}
		else if (frameIndex > priorFrameCount) {
			throw (new Error(`Cannot add new frame at ${frameIndex} since current frame count is ${priorFrameCount}`));
		}
		else {
			let frameData = {
				id: shortid.generate(),
				content: {
					configuration: pose
				},
				renderData: renderData,
				importReport: {
					source: sourceName,
					date: Date.now()
				}
			};

			this.setFrameData(frameIndex, frameData);
		}
	}

	setFrameData(frameIndex, frameData) {
		document.get("outputFrames")
			.nth(frameIndex)
			.assign(frameData)
			.write();
		rendererRouter.notifyChange('outputTimeline');
	}

	getFrame(frameIndex) {
		return document.get("outputFrames")
			.nth(frameIndex)
			.value();
	}

	buildTracks() {
		if (!this._cache.dirty) {
			return;
		}

		// create tracks
		{
			let tracks = {};

			let forcesPerFrames = document.get("outputFrames").map("content").map("forces").value();
			// format is forces[frame index][joint index]

			// for each track address, load the data into a track
			for (let trackAddress of this.trackAddresses) {
				try {
					let outputTrack = new OutputTrack();
					outputTrack.name = trackAddress.join('-');

					// for each frame take the relevant values
					outputTrack.data = forcesPerFrames.map((jointsForces) => {
						let value = jointsForces;
						for (let addressPart of trackAddress) {
							value = value.map((data) => data[addressPart]);
						}
						let valuesPerJoint = jointsForces.map((jointForce) => jointForce[trackAddress[0]][trackAddress[1]]);
						return Math.max(...valuesPerJoint);
					});

					tracks[outputTrack.name] = outputTrack;
				}
				catch (exception) {
					console.log(`Cannot add track ${trackAddress}`)
				}
			}

			this._cache.tracks = tracks;
		}

		// calculate frame count
		{
			this._cache.frameCount = Math.max(...Object.values(this._cache.tracks).map(track => track.data.length));
		}

		this._cache.dirty = false;
	}
}

class OutputTrack {
	constructor() {
		this.name = "";
		this.data = [];


		this._cache = {
			dirty: true,
			absMaximum: 0,
			normalizedData: []
		};
	}

	calc() {
		if (!this._cache.dirty) {
			return;
		}

		// calculate range
		let absMaximum = 0;
		this.data.map(x => {
			let absValue = Math.abs(x);
			if (absValue > absMaximum) {
				absMaximum = absValue;
			}
		});
		this._cache.absMaximum = absMaximum;

		//calculate normalized values
		this._cache.normalizedData = this.data.map(value => value / absMaximum);

		this._cache.dirty = false;
	}

	getRange() {
		this.calc();
		return this._cache.normalizedData;
	}

	getNormalizedData() {
		this.calc();
		return this._cache.normalizedData;
	}
}

let outputTimeline = new OutputTimeline();

export { outputTimeline }