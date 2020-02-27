import { Base } from './Base.js'
import { GuiUtils } from '../Utils/GuiUtils.js'
import { toggleInspect, isBeingInspected } from '../Views/Inspector.js'
import { rendererRouter } from '../rendererRouter.js'
import { ErrorHandler } from '../Utils/ErrorHandler.js'

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
			let caption = methodName;
			let isAnInspectable = false;
			if(methodName.substr(0, "inspect_".length) == "inspect_") {
				caption = methodName.substr("inspect_".length);
				isAnInspectable = true;
			}

			caption = GuiUtils.camelCapsToLong(caption);

			let button;

			// we might want to clean out inspectables from here?
			if(isAnInspectable) {
				button = GuiUtils.makeButton(caption, preferences[methodName]);
				button.click(() => {
					let inspectable = this[methodName]();
					toggleInspect(inspectable);
				});

				// create an action to be called when button state needs updating
				let refreshButton =  () => {
					let inspectable = this[methodName]();
					if(isBeingInspected(inspectable)) {
						button.addClass("btn-inspect-active");
					}
					else {
						button.removeClass("btn-inspect-active");
					}
				};
				rendererRouter.onChange('inspectTargetChange', refreshButton);
				refreshButton();
			}
			else {

				button = GuiUtils.makeButton(caption, preferences[methodName]);
				button.click(() => {
					ErrorHandler.do(async () => {
						await this[methodName]();
					});
				});
			}

			this.div.append(button);
			this.buttons[methodName] = button;
		}
	}
}

export { Functions }