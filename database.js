const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')

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
module.exports.settings = settings;
module.exports.document = document;