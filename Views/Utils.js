import { Base } from './Base.js'

const { ipcRenderer } = require('electron')

class Utils extends Base {
	constructor(container, state) {
		super();
		this.container = container;
		this.state = state;

		let result = ipcRenderer.sendSync('listUtils');

		for(let methodName of result) {
			let button = $(`<button type="button" class="btn btn-primary btn-lg btn-block">${methodName}</button>`);
			button.click(() => {
				this.callUtil(methodName);
			});
			this.container.getElement().append(button);
		}
	}

	callUtil(methodName) {
		let result = ipcRenderer.sendSync('callUtil', methodName);
		console.log(result);
	}
}

export { Utils }