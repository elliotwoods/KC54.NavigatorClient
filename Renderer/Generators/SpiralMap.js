import { NavigatorServer } from '../Utils/NavigatorServer.js'

class SpiralMap {
	static async generate(args, priorPose) {
		let spiralPose = await NavigatorServer.getSpiralPose(args);
		let spiralMap = {};
		for(let i = 0; i<spiralPose.length; i++) {
			spiralMap[i] = spiralPose[i].angleToX;
		}
		return spiralMap;
	}
}

export { SpiralMap };