const bent = require('bent')
const post = bent('http://localhost:8080/', 'POST', 'json');
import { ServerError } from './ServerError.js'

class NavigatorServer {
	static async call(requestName, args) {
		try {
			let response = await post(requestName, args);
			if (response.success) {
				return response.result;
			}
			else {
				throw (new ServerError(response));
			}
		}
		catch(error) {
			error.message = requestName + ' : ' + error.message;
			throw(error);
		}
	}

	static async getSpiralPose(configuration) {
		let result = await NavigatorServer.call("SpiralPose", configuration);
		return result;
	}

	static async getParkingPose() {
		const spiralPose = await NavigatorServer.getSpiralPose();
		const parkingPose = NavigatorServer.optimise(spiralPose
			, [
				{
					objective: {
						type: "MinimiseMoments",
						momentWeight: {
							x: 1,
							y: 1,
							z: 50
						}
					},
					weight: 1
				}
			]);

		return parkingPose;
	}

	static async optimise(priorPose, objectives, preferences) {
		let request = {
			initialGuessPose : priorPose,
			objectives : objectives
		};
		if(preferences) {
			request = {...request, ...preferences};
		}
		
		return await NavigatorServer.call("Optimise", request);
	}

	static async calculateForces(pose, windProfile) {
		if(!windProfile) {
			windProfile = {
				Vref : 0,
				href : 2,
				theta : 0,
				roughness : 0.1,
				drag : 2
			}
		}
		return await NavigatorServer.call("CalculateForces", {
			pose : pose,
			windProfile : windProfile
		});
	};

	static async calculateObjectiveValues(pose, objectives) {
		return await NavigatorServer.call("CalculateObjectiveValues", {
			pose : pose,
			objective : objectives
		});
	}
}

export { NavigatorServer } 