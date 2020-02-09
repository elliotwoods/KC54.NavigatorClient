const { ipcRenderer } = require('electron')

class RendererRouter {
	constructor() {
		this.propertyListeners = [];

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

		ipcRenderer.on('changeProperty', (event, arg) => {
			let releventListeners = this.propertyListeners.filter(propertyListener => propertyListener.name == arg);
			releventListeners.map(listener => listener.action());
		});
	}

	onChange(propertyName, action) {
		this.propertyListeners.push({
			name : propertyName,
			action : action
		});
	}
}

let rendererRouter = new RendererRouter();

export { rendererRouter }