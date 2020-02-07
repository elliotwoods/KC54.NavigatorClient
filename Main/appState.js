const { appRouterTx } = require('./appRouterTx.js')

class AppState {
	constructor() {
		this.outputFrameIndex = 0;
	}

	set_outputFrameIndex(value) {
		this._outputFrameIndex = value;
		appRouterTx.sendToAllWindows("change", "outputFrameIndex");
	}
}

let appState = new AppState();

module.exports.appState = appState;