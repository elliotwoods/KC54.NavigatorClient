import { totalBlockHeight, totalShaftCount } from './Constants.js'

class AxisMath {
	static anglesToXToShaftAngles(anglesToX) {
		// incoming we have 25 numbers from angleToX (for each block, i.e. one frame)
		// we return 26 numbers which represent the downward-facing angles for each shaft (bottom to top on tower A then bottom to top on tower B)
		// 0 shaft angle for the bottom block on each tower means the block is facing in the +x axis away from its downwards joint
		// 0 for other blocks means 'fully folded'
		// positive values are anticlockwise whilst looking down on the block

		let shaftAngles = [];

		shaftAngles.push(anglesToX[0])

		// Tower A (ascending)
		for (let i = 1; i <= totalBlockHeight; i++) {
			shaftAngles.push(anglesToX[i] - anglesToX[i - 1]);
		}

		// Tower B (ascending)
		{
			// first angle should be +90 on test spiral
			shaftAngles.push(270 - anglesToX[anglesToX.length - 1]);

			for (let i = anglesToX.length - 2; i--; shaftAngles.length < totalShaftCount) {
				let inverseAngleToX = 270 - anglesToX[i];
				let priorInverseAngleToX = 270 - anglesToX[i + 1];
				shaftAngles.push(inverseAngleToX - priorInverseAngleToX);
			}
		}

		return shaftAngles;
	}

	static shaftIndexToName(shaftIndex) {
		if(shaftIndex < totalBlockHeight) {
			return 'A' + shaftIndex;
		}
		else {
			return 'B' + (shaftIndex - totalBlockHeight);
		}
	}
}

export { AxisMath }