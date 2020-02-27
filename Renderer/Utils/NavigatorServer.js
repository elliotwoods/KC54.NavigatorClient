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
		const parkingPose = await NavigatorServer.call('Optimise', {
			initialGuessPose: spiralPose,
			objectives: [
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
			]
		});

		return parkingPose;
	}
}

export { NavigatorServer } 