import { Constants } from './Constants.js'
import { settings } from '../Database.js'

class AxisMath {
	static outputFramesToShaftAnglesPerFrame(outputFrames) {
		return outputFrames.map((frame) => {
			let anglesToX = frame.content.configuration.map(block => block.angleToX);
			let shaftAngles = AxisMath.anglesToXToShaftAngles(anglesToX);
			return shaftAngles;
		});
	}

	static shaftAnglesPerFrameToFramesPerShaft(shaftAnglesPerFrame) {
		let framePerShaftAngle = [];
		for(let i = 0; i < Constants.totalShaftCount; i++) {
			let shaftAnglesForOneAxis = shaftAnglesPerFrame.map(frame => frame[i]);
			framePerShaftAngle.push(shaftAnglesForOneAxis);
		}
		return framePerShaftAngle;
	}

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

	static moduloOneCycle(radians) {
		return Math.atan2(Math.sin(radians), Math.cos(radians))
	}

	// see February notes page 19
	static shaftAngleRange(shaftAnglesForOneAxis, epsilon = 1 / 360 * Math.PI * 2) {
		let result = {
			min : 0,
			max : 0
		};

		if(shaftAnglesForOneAxis.length == 0) {
			return result;
		}

		let negativeAngles = [];
		let positiveAngles = [];

		// offset everything to +/- pi
		let normalisedAngles = shaftAnglesForOneAxis.map(angle => AxisMath.moduloOneCycle(angle));

		// get range of angles for + and - individually
		let sortFunction = (a, b) => {
			return a - b;
		};
		negativeAngles = normalisedAngles.filter(angle => angle < 0).sort(sortFunction);
		positiveAngles = normalisedAngles.filter(angle => angle >= 0).sort(sortFunction);

		
		let negativeRange = {
			min : negativeAngles[0],
			max : negativeAngles[negativeAngles.length - 1]
		};
		let positiveRange = {
			min : positiveAngles[0],
			max : positiveAngles[positiveAngles.length - 1]
		};

		if(negativeAngles.length > 0 && positiveAngles.length > 0) {
			// find which section of range is closer (next to 0 or next to pi)
			let distanceAtZero = positiveRange.min - negativeRange.max;
			let distanceAtPi = (negativeRange.min + Math.PI * 2) - positiveRange.max;
			if(distanceAtPi > distanceAtZero) {
				result.min = negativeRange.min;
				result.max = positiveRange.max;
			}
			else {
				result.min = positiveRange.min;
				result.max = negativeRange.max + Math.PI * 2; // keep the range as being from lower value to higher, so we can interpolate across it
			}
		}
		else if(negativeAngles.length > 0) {
			result = negativeRange;
		}
		else { // postitiveAngles.length > 0
			result = positiveRange;
		}

		return result;
	}

	static calculateStopper(shaftAngleRange) {
		// feb 2020 p20

		let stopperSettings = settings.get("system")
			.get("stopperSettings")
			.value();
		let stopperOffset = stopperSettings.stopperOffsetDegrees / 360 * (Math.PI * 2);
		let minStopperSize = stopperSettings.minStopperSizeDegrees / 360 * (Math.PI * 2);

		let rangePassesPi = shaftAngleRange.max < shaftAngleRange.min;

		// check if there's space for a stopper at all
		{
			let usedSize = !rangePassesPi
				? shaftAngleRange.max - shaftAngleRange.min
				: shaftAngleRange.min + (Math.PI * 2) - shaftAngleRange.max;
			let unusedSize = (Math.PI * 2) - usedSize;
			if(unusedSize < stopperOffset * 2 + minStopperSize) {
				// not enough space remaining for stopper
				return null;
			}
		}

		let stopper = {
			min : AxisMath.moduloOneCycle(shaftAngleRange.max + stopperOffset),
			max : AxisMath.moduloOneCycle(shaftAngleRange.min - stopperOffset)
		};

		return stopper;
	}
}

export { AxisMath }