import { NavigatorServer } from '../Utils/NavigatorServer.js'

class SpiralAngleMap {
	static async generate(args, priorFrameContent, frameIndex) {
		if(!args) {
			args = {
				centredness : 0
			};
		}
		if(args.centredness) {
			if(args.centredness < -1.3) {
				args.centredness = -1.3;
				console.log("SpiralAngleMap : centredness is outside of range")
			}
			else if(args.centredness > 1.3) {
				args.centredness = 1.3;
				console.log("SpiralAngleMap : centredness is outside of range")
			}
		}

		let spiral = await NavigatorServer.getSpiral(args);
		
		let spiralMap = {};
		for(let i = 0; i<spiral.pose.length; i++) {
			spiralMap[i] = spiral.pose[i].angleToX;
		}
		return spiralMap;
	}
}

export { SpiralAngleMap };