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
		// Setup buttons
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
			},
			skipToBeginning : {
				icon: "fas fa-fast-backward"
			},
			skipToEnd : {
				icon: "fas fa-fast-forward"
			}
		});

		{
			this.timeStatusDiv = $(`<div class="Transport_timeStatus_div">`);
			this.div.append(this.timeStatusDiv);

			this.playCursor = $(`<input type="range" class="custom-slider Transport_playCursor">`);
			this.playCursor.on('input', (args) => {
				this._jumpToFrame(parseInt(this.playCursor.val()));
			});
			this.div.append(this.playCursor);

			let redraw = () => {
				this._updateTimeStatus();
			};
			rendererRouter.onChange('outputFrame', redraw);
			rendererRouter.onChange('outputFrameData', redraw);
			redraw();
		}

		this._updatePlayState();
		rendererRouter.onChange("playing", () => {
			this._updatePlayState();
		});
	}

	skipToBeginning() {
		this._jumpToFrame(0);
	}

	previousOutputFrame() {
		let nextFrameIndex = rendererRouter.appState.get_outputFrameIndex() - 1;
		this._jumpToFrame(nextFrameIndex);
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
		this._jumpToFrame(nextFrameIndex);
	}

	skipToEnd() {
		this._jumpToFrame(-1);
	}

	stop() {
		rendererRouter.appState.set_playing(false);
		rendererRouter.appState.set_outputFrameIndex(0);
	}

	_updatePlayState() {
		let button = this.buttons["playPause"];
		let icon = button.find("svg"); // other font awesome versions keep the i tag, but ours changes it to an svg
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

	_updateTimeStatus() {
		this.timeStatusDiv.empty();
		let outputFrameIndex = rendererRouter.appState.get_outputFrameIndex();
		let outputFrameCount = document.get('outputFrames')
			.value()
			.length;

		$(`<span class="Transport_timeStatus_frames">`)
			.text(`${outputFrameIndex} / ${outputFrameCount} frames`)
			.appendTo(this.timeStatusDiv);

		$(`<span class="Transport_timeStatus_seconds">`)
			.text(`${outputFrameIndex / Constants.frameRate} / ${outputFrameCount / Constants.frameRate}s`)
			.appendTo(this.timeStatusDiv);


		this.playCursor.attr("min", 0);
		this.playCursor.attr("max", outputFrameCount - 1);
		this.playCursor.val(outputFrameIndex);
	}


	_jumpToFrame(frameIndex) {
		let outputFrameCount = document.get('outputFrames')
			.value()
			.length;

		
		if (frameIndex > outputFrameCount) {
			frameIndex = 0;
		}
		else if(frameIndex < 0) {
			frameIndex = outputFrameCount - 1;
		}
	
		rendererRouter.appState.set_outputFrameIndex(frameIndex);
	}
}

export { Transport }