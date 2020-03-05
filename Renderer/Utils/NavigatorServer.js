const bent = require('bent')
const post = bent('http://localhost:8080/', 'POST', 'json');
import { ServerError } from './ServerError.js'

const maxConcurrentRequests = 16;
let currentRequestCount = 0;

class NavigatorServer {
	static getMaxConcurrentRequests() {
		return maxConcurrentRequests;
	}

	static async call(requestName, args) {
		try {
			while(currentRequestCount >= maxConcurrentRequests) {
				await new Promise(resolve => setTimeout(resolve, 100));
			}

			currentRequestCount++;
			let response = await post(requestName, args);
			currentRequestCount--;
			
			if (response.success) {
				return response.result;
			}
			else {
				throw (new ServerError(response));
			}

		}
		catch(error) {
			currentRequestCount--;

			error.message = requestName + ' : ' + error.message;
			throw(error);
		}
	}

	static async getSpiral(args) {
		if(!args) {
			args = {
				centredness : 0
			};
		}
		let result = await NavigatorServer.call("SpiralPose", args);
		return result;
	}

	static async getParking() {
		const spiral = await NavigatorServer.getSpiral();
		const result = await NavigatorServer.optimise(spiral.pose
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
					weight: 1e-4
				}
			]);

		return result;
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

	static async ping() {
		return await this.call("Ping");
	}
}

export { NavigatorServer } 