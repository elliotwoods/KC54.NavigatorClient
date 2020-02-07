const { ipcRenderer } = require('electron')

class RendererRouter {
	constructor() {
		// Add local methods for all syncHandler end-points in main app
		{
			let syncHandlerNames = ipcRenderer.sendSync("getSyncHandlerNames");
			for(let syncHandlerName of syncHandlerNames) {
				this[syncHandlerName] = (args) => {
					return ipcRenderer.sendSync(syncHandlerName, args);
				};
			}
		}

		// Add getters/setters for all app state properties
		{
			this.appState = { };

			let appStatePropertyNames = this.getAppStatePropertyNames();
			for(let appStatePropertyName of appStatePropertyNames) {
				this.appState["get_" + appStatePropertyName] = () => {
					return this.getAppStateProperty(appStatePropertyName);
				};
				this.appState["set_" + appStatePropertyName] = (value) => {
					let args = {
						name : appStatePropertyName,
						value : value
					}
					this.setAppStateProperty(args);
				}
			}
		}
	}
}

let rendererRouter = new RendererRouter();

export { rendererRouter }