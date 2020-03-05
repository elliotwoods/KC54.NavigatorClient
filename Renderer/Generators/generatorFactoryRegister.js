let generators = [];
let genKey = '__generator';
let activeKey = '__active';

function register(generatorType) {
	generators.push(generatorType);
}

async function generate(configuration, priorFrameContent, frameIndex) {
	for(let generator of generators) {
		if(generator.name == configuration.type) {
			return await generator.generate(configuration.args, priorFrameContent, frameIndex)
		}
	}
	throw(new Error(`No generator type '${configuration.type}'`));
}

async function parseGenerators(object, priorFrameContent, frameIndex) {
	// find a child which is an object and contains key "__generator"
	if(typeof(object) == "object") {
		for(let childKey in object) {
			if(typeof(object[childKey]) == "object") {
				let grandChildKeys = Object.keys(object[childKey]);

				// Check if this branch is deactivated
				if(grandChildKeys.includes(activeKey)) {
					if(!object[childKey][activeKey]) {
						delete object[childKey];
						continue;
					}
				}

				if(grandChildKeys.includes(genKey)) {
					// it's a generator
					object[childKey] = await generate(object[childKey][genKey], priorFrameContent, frameIndex);
				}
				else {
					// go down the tree
					object[childKey] = await parseGenerators(object[childKey], priorFrameContent, frameIndex);
				}
			}
		}
	}
	if(Array.isArray(object)) {
		object = object.filter(element => element); // remove null/undefined elements
	}
	return object; // just in case
}

import { SpiralAngleMap } from './SpiralAngleMap.js'
import { SpiralPositionMap } from './SpiralPositionMap.js'
import { PriorAnglesMap } from './PriorAnglesMap.js'
import { PriorShaftAnglesArray } from './PriorShaftAnglesArray.js'
import { PreviousShaftAnglesArray } from './PreviousShaftAnglesArray.js'

register(SpiralAngleMap);
register(SpiralPositionMap);
register(PriorAnglesMap);
register(PriorShaftAnglesArray);
register(PreviousShaftAnglesArray);

export { parseGenerators }