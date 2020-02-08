const { ipcMain, dialog } = require('electron')
const { appState } = require('./appState.js')

class SyncHandlers {
	static getSyncHandlerNames() {
		return appRouterRx.syncHandlerNames;
	}

	static openDialog(args) {
		let result = dialog.showOpenDialogSync(args);
		return result;
	}

	static getAppStatePropertyNames() {
		let propertyNames = Object.getOwnPropertyNames(appState);
		return propertyNames;
	}

	static getAppStateProperty(name) {
		// use custom getter if exists
		let getterName = "get_" + name;
		if(getterName in appState) {
			return appState[getterName]();
		}
		else {
			return appState[name];
		}
	}

	static setAppStateProperty(args) {
		// use custom setter if exists
		let setterName = "set_" + args.name;
		if(setterName in appState) {
			return appState[setterName](args.value);
		}
		else {
			appState[args.name] = args.value;
		}
	}
}

class AsyncHandlers {
	
}

class AppRouterRx {
	constructor() {
		this.syncHandlerNames = [];
		this.asyncHandlerNames = [];

		// SyncHandlers
		{
			let handlerNames = Object.getOwnPropertyNames(SyncHandlers)
				.filter(prop => typeof SyncHandlers[prop] == "function");
			
			for(let handlerName of handlerNames) {
				ipcMain.on(handlerName, (event, args) => {
					let result = SyncHandlers[handlerName](args);
					event.returnValue = result;
				});
				this.syncHandlerNames.push(handlerName);
			}
		}

		//AsyncHandlers
		{
			let handlerNames = Object.getOwnPropertyNames(AsyncHandlers)
				.filter(prop => typeof AsyncHandlers[prop] == "function");
			
			for(let handlerName of handlerNames) {
				ipcMain.on(handlerName, (event, args) => {
					let result = AsyncHandlers[handlerName](args);
					if(typeof result !== "undefined") {
						event.reply("reply_" + handlerName, result);
					}
				});
				this.asyncHandlerNames.push(handlerName);
			}
		}
	}
}

let appRouterRx = new AppRouterRx();

module.exports.appRouterRx = appRouterRx;
