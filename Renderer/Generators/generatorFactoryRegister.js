let generators = [];
let genKey = '__generator';

function register(generatorType) {
	generators.push(generatorType);
}

async function generate(configuration, priorPose) {
	for(let generator of generators) {
		if(generator.name == configuration.type) {
			return await generator.generate(configuration.args, priorPose)
		}
	}
	throw(new Error(`No generator type '${configuration.type}'`));
}

async function parseGenerators(object, priorPose) {
	// find a child which is an object and contains key "__generator"
	if(typeof(object) == "object") {
		for(let childKey in object) {
			if(typeof(object[childKey]) == "object") {
				let grandChildKeys = Object.keys(object[childKey]);
				if(grandChildKeys.includes(genKey)) {
					// it's a generator
					object[childKey] = await generate(object[childKey][genKey], priorPose);
				}
				else {
					// go down the tree
					await parseGenerators(object[childKey], priorPose);
				}
			}
		}
	}
	return object; // just in case
}

import { SpiralMap } from './SpiralMap.js'

register(SpiralMap);

export { parseGenerators }