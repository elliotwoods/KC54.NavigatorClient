import { Base } from './Base.js'

import { rendererRouter } from '../rendererRouter.js'
const fs = require('fs')
const path = require('path')
const shortid = require('shortid')
import { document, settings } from '../Database.js'
import { AxisMath } from '../Utils/AxisMath.js'
import { Constants } from '../Utils/Constants.js'

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
			if (methodName == 'constructor') {
				continue;
			}
			let methodNameLong =
				//https://stackoverflow.com/questions/4149276/how-to-convert-camelcase-to-camel-case
				// insert a space before all caps
				methodName.replace(/([A-Z])/g, ' $1')
					// uppercase the first character
					.replace(/^./, function (str) { return str.toUpperCase(); })

			let buttonContent = null;
			let buttonPreferences = [];
			let buttonClasses = [];

			// customise based on preferences
			{
				let methodPreferences = preferences[methodName];
				if(methodPreferences) {
					if(methodPreferences.icon) {
						buttonContent = `<i class="${methodPreferences.icon}" />`;
						buttonPreferences.push(`data-toggle="tooltip" data-placement="left" data-original-title="${methodNameLong}"`);
						buttonClasses.push("btn-icon");
					}
				}
			}

			if(!buttonContent) {
				buttonContent = methodNameLong;
			}
			
			let button = $(`<button type="button" class="btn btn-outline-secondary ${buttonClasses.join(" ")}" ${buttonPreferences.join(' ')}></button>`);
			button.append(buttonContent);
			button.click(this[methodName]);
			this.div.append(button);

			this.buttons.methodName = button;
		}
	}
}

export { Functions }