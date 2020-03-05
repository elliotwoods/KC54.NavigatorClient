import { NavigatorServer } from '../Utils/NavigatorServer.js'

class PriorAnglesMap {
	static async generate(args, priorFrameContent, frameIndex) {
		let map = {};
		for(let i = 0; i<priorFrameContent.pose.length; i++) {
			map[i] = priorFrameContent.pose[i].angleToX;
		}
		return map;
	}
}

export { PriorAnglesMap };