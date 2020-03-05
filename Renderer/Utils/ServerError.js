class ServerError {
	constructor(serverResponse) {
		let errorReport = JSON.parse(serverResponse.result)
		this.stackTrace = errorReport[1];
		this.message = errorReport[0];
	}
}

export { ServerError }