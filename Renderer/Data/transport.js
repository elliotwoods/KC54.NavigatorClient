import { document, settings } from '../Database.js'
import { rendererRouter } from '../rendererRouter.js'

class Transport {
	frameCount() {
		return document.get('outputFrames')
		.size()
		.value();
	}

	getCurrentFrameIndex() {
		return rendererRouter.appState.get_outputFrameIndex();
	}

	skipToFrame(frameIndex) {
		if(isNaN(frameIndex)) {
			throw(new Error(`Cannot skip top ${frameIndex}`));
		}

		if(frameIndex == this.getCurrentFrameIndex()) {
			return;
		}

		let frameCount = this.frameCount();
		if(frameIndex >= frameCount) {
			frameIndex = 0;
		}
		if(frameIndex < 0) {
			frameIndex = frameCount - 1;
		}

		rendererRouter.appState.set_outputFrameIndex(frameIndex);
	}

	skipToEnd() {
		this.skipToFrame(document.get('outputFrames').size().value() - 1);
	}

	skipToBeginning() {
		this.skipToFrame(0);
	}

	previousFrame() {
		this.skipToFrame(rendererRouter.appState.get_outputFrameIndex() - 1);
	}

	nextFrame() {
		this.skipToFrame(rendererRouter.appState.get_outputFrameIndex() + 1);
	}
}

let transport = new Transport();
export { transport }