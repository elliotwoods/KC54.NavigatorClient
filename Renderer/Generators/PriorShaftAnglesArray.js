import { NavigatorServer } from '../Utils/NavigatorServer.js'

class PriorShaftAnglesArray {
	static async generate(args, priorFrameContent, frameIndex) {
		return priorFrameContent.shaftAngles;
	}
}

export { PriorShaftAnglesArray };