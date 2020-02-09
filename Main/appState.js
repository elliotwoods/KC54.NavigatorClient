const { appRouterTx } = require('./appRouterTx.js')

const frameRate = 10.0;

class AppState {
	constructor() {
		this.outputFrameIndex = 0;
		this.playbackStartTime = null;
		this.playbackStartFrame = null;
		this.playing = false;

		this.update();
	}

	update() {
		if(this.playing) {
			let deltaT = new Date() - this.playbackStartTime;
			deltaT /= 1000.0;
			let deltaFrames = deltaT * frameRate;
			this.set_outputFrameIndex(this.playbackStartFrame + deltaFrames);

			// If we want to detect time run-over, we need to know the number of outputFrames in the app process
		}
	}

	resetPlayHeadCache() {
		if(this.playing) {
			this.playbackStartTime = new Date();
			this.playbackStartFrame = this.outputFrameIndex;
		}
	}

	set_outputFrameIndex(value) {
		this.outputFrameIndex = Math.floor(value);

		this.resetPlayHeadCache();
		
		appRouterTx.announcePropertyChange("outputFrameIndex");
		appRouterTx.announcePropertyChange("outputFrame");
	}

	set_playing(value) {
		if(value == this.playing) {
			return;
		}

		this.playing = value;
		this.resetPlayHeadCache();
	}
}

let appState = new AppState();

function updateLoop() {
	appState.update();
	setTimeout(updateLoop, 100);
}

updateLoop();

module.exports.appState = appState;