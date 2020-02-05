import { document, settings } from '../Database.js'

class OutputTimeline {
	getTracks() {
		tracks = {};
		trackAddresses = [
			"forces.force.x",
			"forces.force.y",
			"forces.force.z",
			"forces.moment.x",
			"forces.moment.y",
			"forces.moment.z"
		];

		// for each track address, load the data into a track
		
	}
}

class OutputTrack {
	constructor() {
		this.name = "";
		this.data = [];


		this._cache = {
			dirty : true,
			maximum : 0,
			normalizedData : []
		};
	}

	calc() {
		if (!this._cache.dirty) {
			return;
		}

		// calculate range
		let maximum = null;
		this.data.map(x => {
			let absValue = Math.abs(x);
			if(maximum == null) {
				maximum = absValue;
			}
			else if (absValue > maximum) {
				maximum = absValue;
			}
		});
		this._cache.maximum = maximum;

		//calculate normalized values
		this._cache.normalizedData = this.data.map(value => {
			value / maximum;
		});

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