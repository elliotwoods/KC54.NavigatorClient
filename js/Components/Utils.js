import { Base } from './Base.js.js'

class Utils extends Base {
	constructor(container, state) {
		super();
		let methodNames = Object.getOwnPropertyNames(Utils.prototype);
		for(let methodName of methodNames) {
			if(methodName == 'constructor') {
				continue;
			}

			let methodNameLong =
				//https://stackoverflow.com/questions/4149276/how-to-convert-camelcase-to-camel-case
				// insert a space before all caps
				methodName.replace(/([A-Z])/g, ' $1')
				// uppercase the first character
				.replace(/^./, function(str){ return str.toUpperCase(); })

			let button = $(`<button type="button" class="btn btn-primary btn-lg btn-block">${methodNameLong}</button>`);
			button.click(this[methodName]);
			container.getElement().append(button);
		}
	}

	importFolderAnimation() {

	}
}

export { Utils }