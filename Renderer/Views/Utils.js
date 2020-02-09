import { Base } from './Base.js'

import { rendererRouter } from '../rendererRouter.js'
const fs = require('fs')
const path = require('path')
const shortid = require('shortid')
import { document } from '../Database.js'

class Utils extends Base {
	constructor(container, state) {
		super();
		this.container = container;
		this.state = state;

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

	clearAnimation() {
		document.set('outputFrames', [])
			.write();
	}

	importFolderAnimation() {
		let result = rendererRouter.openDialog({
			properties : ['openDirectory']
		});
		if(result == null) {
			return;
		}

		let framesAdded = 0;

		if (result) {
			let folder = result[0];
			let fileNames = fs.readdirSync(folder).sort();

			let contentToAdd = [];

			for (let fileName of fileNames) {
				let extension = path.extname(fileName);
				if (extension != ".json") {
					continue;
				}
				let baseName = path.basename(fileName);
				baseName = baseName.substr(0, -extension.length);

				if (isNaN(baseName)) {
					//check it's a valid number
					continue;
				}

				let contentAsJson = fs.readFileSync(path.join(folder, fileName), {
					encoding: 'utf8',
					flag: 'r'
				});
				let content = JSON.parse(contentAsJson);

				//validate frame
				if(!('forces' in content && 'configuration' in content)) {
					//skip frame
					console.log("Skipping content for frame " + fileName);
					continue;
				}

				contentToAdd.push({
					'id': shortid.generate(),
					'content': content,
					'importReport': {
						'path': path.join(folder, fileName),
						'date': Date.now()
					}
				});

				console.log(`Importing ${fileName}`);
				framesAdded++;
			}

			document.get('outputFrames')
				.push(...contentToAdd)
				.write();


			console.log(`Imported ${framesAdded} from ${folder}`);
		}
	}

	importFileAnimation() {
		let result = rendererRouter.openDialog({
			properties : ['openFile'],
			filters : [
				{ name : 'Json animations', extensions : ['json'] }
			],
			message : "Open Json animation"
		});
		if (result.length != 1) {
			return;
		}

		let filename = result[0];

		let contentAsJson = fs.readFileSync(filename, {
			encoding: 'utf8',
			flag: 'r'
		});
		let content = JSON.parse(contentAsJson);

		// check format
		{ 
			content = content.map((frame) => {
				if(frame.configuration) {
					return frame;
				}
				else {
					return {
						configuration : frame
					};
				}
			});
		}

		let framesAdded = 0;

		let contentToAdd = [];
		for(let frame of content) {
			contentToAdd.push({
				'id': shortid.generate(),
				'content': frame,
				'importReport': {
					'path': filename,
					'date': Date.now()
				}
			});

			framesAdded++;
		}

		
		document.get('outputFrames')
			.push(...contentToAdd)
			.write();

		console.log(`Imported ${framesAdded} from ${filename}`);
	}
}

export { Utils }