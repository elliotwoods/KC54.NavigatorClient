import { Base } from './Base.js'
import { GuiUtils } from '../Utils/GuiUtils.js'

class Functions extends Base {
	constructor(container, state, childType, preferences) {
		super();
		this.container = container;
		this.state = state;

		this.div = $(`<div class="container scrollContainerY functionsContainer"/>`);
		this.container.getElement().append(this.div);

		this.buttons = {};

		let methodNames = Object.getOwnPropertyNames(childType.prototype);
		
		let itemsPerCol = Math.floor(methodNames.length) / 1;
		let indexToColChange = itemsPerCol;
		for (let methodName of methodNames) {
			if (methodName == 'constructor' || methodName[0] == "_") {
				continue;
			}
			let methodNameLong =
				//https://stackoverflow.com/questions/4149276/how-to-convert-camelcase-to-camel-case
				// insert a space before all caps
				methodName.replace(/([A-Z])/g, ' $1')
					// uppercase the first character
					.replace(/^./, function (str) { return str.toUpperCase(); })


			let button = GuiUtils.makeButton(methodNameLong, preferences[methodName]);
			button.click(() => {
				this[methodName]();
			});
			this.div.append(button);

			this.buttons[methodName] = button;
		}
	}
}

export { Functions }