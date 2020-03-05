import { Constants } from './Constants.js'
import { settings } from '../Database.js'

class AxisMath {
	static outputFramesToShaftAnglesPerFrame(outputFrames) {
		return outputFrames.map((frame) => {
			let anglesToX = frame.content.pose.map(block => block.angleToX);
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

	// see February notes page 21
	static shaftAngleRange(shaftAnglesForOneAxis) {
		let result = {
			min : 0,
			max : 0
		};

		if(shaftAnglesForOneAxis.length == 0) {
			return result;
		}

		// we need to create contiguous values
		let priorValue = shaftAnglesForOneAxis[0];
		let contiguousValues = [priorValue];
		let findClosestCycle = (newValue, priorValue) => {
			while(newValue - priorValue > Math.PI) {
				newValue -= Math.PI * 2;
			}
			while(newValue - priorValue < - Math.PI) {
				newValue += Math.PI * 2;
			}
			return newValue;
		};
		for(let i = 1; i < shaftAnglesForOneAxis.length; i++) {
			let value = findClosestCycle(shaftAnglesForOneAxis[i], priorValue);
			contiguousValues.push(value);
			priorValue = value;
		}

		let max = Math.max.apply(null, contiguousValues);
		let min = Math.min.apply(null, contiguousValues);

		if(max - min > Math.PI * 2) {
			// we went over one cycle
			result.min = -Math.PI;
			result.max = Math.PI
		}
		else {
			result.min = AxisMath.moduloOneCycle(min);
			result.max = AxisMath.moduloOneCycle(max);
		}

		return result;
	}

	static calculateStopper(shaftAngleRange, shaftIndex) {
		// feb 2020 p20

		let stopperSettings = settings.get("system")
			.get("stopperSettings")
			.value();

		let shaftName = AxisMath.shaftIndexToName(shaftIndex);
		if(shaftName == "A0") {
			return {
				min : (-Math.PI / 2) + stopperSettings.shaft0StopperRangeDegrees / 360 * (Math.PI * 2),
				max : (-Math.PI / 2) - stopperSettings.shaft0StopperRangeDegrees / 360 * (Math.PI * 2)
			};
		}
		else if (shaftName == "B0") {
			return {
				min : (Math.PI / 2) + stopperSettings.shaft0StopperRangeDegrees / 360 * (Math.PI * 2),
				max : (Math.PI / 2) - stopperSettings.shaft0StopperRangeDegrees / 360 * (Math.PI * 2)
			};
		}
		
		let stopperOffset = stopperSettings.stopperOffsetDegrees / 360 * (Math.PI * 2);
		let minStopperSize = stopperSettings.minStopperSizeDegrees / 360 * (Math.PI * 2);

		let rangePassesPi = shaftAngleRange.max < shaftAngleRange.min;

		// check if there's space for a stopper at all
		{
			let usedSize = !rangePassesPi
				? shaftAngleRange.max - shaftAngleRange.min
				: (shaftAngleRange.max + (Math.PI * 2)) - shaftAngleRange.min;
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