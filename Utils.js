
const dialog = require('electron').dialog;
const fs = require('fs');
const path = require('path');
const { document, settings } = require('./database');
const shortid = require('shortid')

function importFolderAnimation() {
	let result = dialog.showOpenDialogSync({
		properties: ['openDirectory']
	});

	let count = 0;

	if(result) {
		let folder = result[0];
		let fileNames = fs.readdirSync(folder).sort();
		for(let fileName of fileNames) {
			let extension = path.extname(fileName);
			if(extension != ".json") {
				continue;
			}
			let baseName = path.basename(fileName);
			baseName = baseName.substr(0, -extension.length);

			if(isNaN(baseName)) {
				//check it's a valid number
				continue;
			}

			let contentAsJson = fs.readFileSync(path.join(folder, fileName), {
				encoding : 'utf8',
				flag : 'r'
			});
			let content = JSON.parse(contentAsJson);
			
			document.get('frames')
				.push({
					'id' : shortid.generate(),
					'content': content,
					'importReport' : {
						'path' : path.join(folder, fileName),
						'date' : Date.now()
					}
				}).write();

			console.log(`Imported ${fileName}`);
			count++;
		}
	}
	return {
		'importedFrames' : count
	};
}

let utils = {
	'Import folder animation' : importFolderAnimation
};

module.exports.listUtils = function() {
	return Object.keys(utils);
};

module.exports.callUtil = function(utilName) {
	return utils[utilName]();
};