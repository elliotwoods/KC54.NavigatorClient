const low = require('lowdb')
const FileSync = require('../node_modules/lowdb/adapters/FileSync')

const settings = low(new FileSync('settings.json'));
settings.defaults({
	"documentPath" : "animation.json",
	"zoomLevel" : 1
}).write();

let documentPath = settings.get('documentPath').value();
const document = new low(new FileSync(documentPath));
document.defaults({
	"frames" : []
}).write();

window.db = {};
window.db.document = document;
window.db.settings = settings;

export { settings, document }