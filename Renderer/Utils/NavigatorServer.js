const bent = require('bent')
const post = bent('http://localhost:8080/', 'POST', 'json');

class NavigatorServer {
	static async call(requestName, args) {
		let response = await post(requestName, args);
		if (response.success) {
			return response.result;
		}
		else {
			throw (new Error(response.result));
		}
	}

	static async getSpiralPose() {
		return await NavigatorServer.call("SpiralPose");
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
						},
					},
					weight: 1
				}
			]);

		return parkingPose;
	}

	static async optimise(priorPose, objectives) {
		// do we need to await here since we already return a Promise
		return await NavigatorServer.call("Optimise", {
			initialGuessPose : priorPose,
			objectives : objectives
		});
	}

	static async calculateForces(pose, windProfile) {
		return await NavigatorServer.call("CalculateForces", {
			pose : pose,
			windProfile : windProfile
		});
	};
}

export { NavigatorServer } 