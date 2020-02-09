import { Constants } from './Constants.js'

class AxisMath {

	static anglesToXToShaftAngles(anglesToX) {
		// incoming we have 25 numbers from angleToX (for each block, i.e. one frame)
		// we return 26 numbers which represent the downward-facing angles for each shaft (bottom to top on tower A then bottom to top on tower B)
		// 0 shaft angle for the bottom block on each tower means the block is facing in the +x axis away from its downwards joint
		// 0 for other blocks means 'fully extended'
		// positive values are anticlockwise whilst looking down on the block

		let shaftAngles = [];

		shaftAngles.push(anglesToX[0])

		// Tower A (ascending)
		for (let i = 1; i < Constants.totalBlockHeight; i++) {
			shaftAngles.push(anglesToX[i] - anglesToX[i - 1]);
		}

		// Tower B (ascending)
		{
			let invertAngle = (angle) => {
				return angle + Math.PI;
			};
			// first angle should be +90 on test spiral
			shaftAngles.push(invertAngle(anglesToX[anglesToX.length - 1]));

			let i = anglesToX.length - 2;
			while(i > Constants.totalBlockHeight - 2) {
				shaftAngles.push(invertAngle(anglesToX[i]) - invertAngle(anglesToX[i + 1]));
				i--;
			}
		}

		return shaftAngles;
	}

	static shaftIndexToName(shaftIndex) {
		if(shaftIndex < Constants.totalBlockHeight) {
			return 'A' + shaftIndex;
		}
		else {
			return 'B' + (shaftIndex - Constants.totalBlockHeight);
		}
	}

	static radiansToDegrees(arrayOfRadians) {
		return arrayOfRadians.map(radians  => radians / (Math.PI * 2.0) * 360.0);
	}

	static radiansToCycles(arrayOfRadians) {
		return arrayOfRadians.map(radians  => radians / (Math.PI * 2.0));
	}
}

export { AxisMath }