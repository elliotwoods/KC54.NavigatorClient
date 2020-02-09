const { BrowserWindow  } = require('electron')

class AppRouterTx {
	sendToAllWindows(channel, message) {
		let windows = BrowserWindow.getAllWindows();
		for(let window of windows) {
			window.send(channel, message);
		}
	}

	announcePropertyChange(propertyName) {
		this.sendToAllWindows('changeProperty', propertyName);
	}
}

let appRouterTx = new AppRouterTx();

module.exports.appRouterTx = appRouterTx;