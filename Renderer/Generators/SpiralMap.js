import { NavigatorServer } from '../Utils/NavigatorServer.js'

class SpiralMap {
	static async generate(args, priorPose) {
		if(!args) {
			args = {
				centredness : 0
			};
		}
		if(args.centredness) {
			if(args.centredness < -1.3) {
				args.centredness = -1.3;
				console.log("SpiralMap : centredness is outside of range")
			}
			else if(args.centredness > 1.3) {
				args.centredness = 1.3;
				console.log("SpiralMap : centredness is outside of range")
			}
		}

		let spiralPose = await NavigatorServer.getSpiralPose(args);
		
		let spiralMap = {};
		for(let i = 0; i<spiralPose.length; i++) {
			spiralMap[i] = spiralPose[i].angleToX;
		}
		return spiralMap;
	}
}

export { SpiralMap };