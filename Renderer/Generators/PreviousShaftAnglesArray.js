import { outputTimeline } from '../Data/outputTimeline.js'

class PreviousShaftAnglesArray {
	static async generate(args, priorFrameContent, frameIndex) {
		let frameIndexToLookAt = frameIndex - args.lookBackDistance;
		if(frameIndexToLookAt < 0) {
			throw(new Error("Can't look back that far"));
		}

		return outputTimeline.getFrame(frameIndexToLookAt).content.shaftAngles;
	}
}

export { PreviousShaftAnglesArray };