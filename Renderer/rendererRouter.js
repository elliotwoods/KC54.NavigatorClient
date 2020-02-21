const { ipcRenderer } = require('electron')

// for reference
let channelNames = [
	'stoppers',
	'outputFrameData',
	'outputFrame',
	'inspectorTargetChange'
];

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
			this.notifyChange(arg);
		});
	}

	onChange(propertyName, action) {
		this.propertyListeners.push({
			name : propertyName,
			action : action
		});
	}

	notifyChange(propertyName) {
		let releventListeners = this.propertyListeners.filter(propertyListener => propertyListener.name == propertyName);
		releventListeners.map(listener => listener.action());
	}
}

let rendererRouter = new RendererRouter();

export { rendererRouter }