import { Inspectable } from '../Views/Inspector.js'

class InspectableSettings extends Inspectable {
	constructor(settingsNamespace) {
		super(() => {
			return settingsNamespace.get();
			this.disableEvents = false;
		}
		, (value) => {
			this.disableEvents = true;
			settingsNamespace.set(value);
			this.disableEvents = false;
		},
		settingsNamespace.outerSettingsNameSpace.join('/'));
		settingsNamespace.onChange(() => {
			if(!this.disableEvents) {
				this.notifyValueChange();
			}
		});
	}
}

export { InspectableSettings }