const { BrowserWindow  } = require('electron')

class AppRouterTx {
	sendToAllWindows(channel, message) {
		let windows = BrowserWindow.getAllWindows();
		for(let window of windows) {
			window.send(channel, message);
		}
	}
}

let appRouterTx = new AppRouterTx();

module.exports.appRouterTx = appRouterTx;