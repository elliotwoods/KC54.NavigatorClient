import { NavigatorServer } from '../Utils/NavigatorServer.js'

class SpiralPositionMap {
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
		
		let map = {};
		for(let i = 0; i<spiral.pose.length; i++) {
			map[i] = {
				x : spiral.pose[i].start.x,
				y : spiral.pose[i].start.y
			};
		}
		return map;
	}
}

export { SpiralPositionMap };