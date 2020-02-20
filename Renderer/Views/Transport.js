import { Functions } from './Functions.js'

import { rendererRouter } from '../rendererRouter.js'
const fs = require('fs')
const path = require('path')
const shortid = require('shortid')
import { document, settings } from '../Database.js'
import { AxisMath } from '../Utils/AxisMath.js'
import { Constants } from '../Utils/Constants.js'

class Transport extends Functions {
	constructor(container, state, childType) {
		super(container, state, Transport, {
			previousOutputFrame: {
				icon: "fas fa-step-backward"
			},
			playPause: {
				icon: "fas fa-play"
			},
			nextOutputFrame: {
				icon: "fas fa-step-forward"
			},
			stop: {
				icon: "fas fa-stop"
			}
		});

		this._updatePlayState();
		rendererRouter.onChange("playing", () => {
			this._updatePlayState();
		});
	}

	previousOutputFrame() {
		let nextFrameIndex = rendererRouter.appState.get_outputFrameIndex() - 1;
		let outputFrameCount = document.get('outputFrames')
			.value()
			.length;

		if (nextFrameIndex < 0) {
			nextFrameIndex = outputFrameCount - 1;
		}

		rendererRouter.appState.set_outputFrameIndex(nextFrameIndex);
	}

	playPause() {
		if (!rendererRouter.appState.get_playing()) {
			rendererRouter.appState.set_playing(true);
		}
		else {
			rendererRouter.appState.set_playing(false);
		}
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
	}

	stop() {
		rendererRouter.appState.set_playing(false);
		rendererRouter.appState.set_outputFrameIndex(0);
	}

	_updatePlayState() {
		let button = this.buttons["playPause"];
		let icon = button.find("i");
		if (rendererRouter.appState.get_playing()) {
			button.addClass("btn-play-pressed");
			icon.removeClass("fa-play");
			icon.addClass("fa-pause");
		}
		else {
			button.removeClass("btn-play-pressed");
			icon.addClass("fa-play");
			icon.removeClass("fa-pause");
		}
	}
}

export { Transport }