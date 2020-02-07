import { document, settings } from '../Database.js'
import { rendererRouter } from '../rendererRouter.js'

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
	getTracks() {
		this.buildTracks();
		return this._cache.tracks;
	}

	getFrameCount() {
		this.buildTracks();
		return this._cache.frameCount;
	}

	getCurrentFrameIndex() {
		return rendererRouter.appState.get_outputFrameIndex();
	}

	getCurrentFrame() {
		let outputFrameIndex = this.getCurrentFrameIndex();
		return  document.get("outputFrames").nth(outputFrameIndex).value();
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
				let outputTrack = new OutputTrack();
				outputTrack.name = trackAddress.join('-');

				// for each frame take the relevant values
				outputTrack.data = forcesPerFrames.map((jointsForces) => {
					let value = jointsForces;
					for(let addressPart of trackAddress) {
						value = value.map((data) => data[addressPart]);
					}
					let valuesPerJoint = jointsForces.map((jointForce) => jointForce[trackAddress[0]][trackAddress[1]]);
					return Math.max(...valuesPerJoint);
				});

				tracks[outputTrack.name] = outputTrack;
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
		this._cache.normalizedData = this.data.map(value =>value / absMaximum);

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