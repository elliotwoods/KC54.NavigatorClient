import { Inspectable, setDefaultInspectable } from '../Views/Inspector.js'
import { SettingsNamespace } from '../Database.js'
let appSettings = new SettingsNamespace("Application");
appSettings.get(null, {
	draw : {
		person : true,
		forces : true
	}
});

function getAppSettings() {
	return appSettings.get();
}

function setAppSettings(value) {
	appSettings.set(null, value);
}

let appSettingsInspectable = new Inspectable(getAppSettings, setAppSettings, "Application");
setDefaultInspectable(appSettingsInspectable);

export { appSettings }