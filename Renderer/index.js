import { setup } from './viewLayout.js'
import {} from './Data/appSettings.js'

$(document).ready(() => {
	setup();
	$('[data-toggle=tooltip]').tooltip();
});