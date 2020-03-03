import * as THREE from '../../../node_modules/three/build/three.module.js';

import { document, SettingsNamespace } from '../../Database.js'
import { rendererRouter } from '../../rendererRouter.js'
import { ErrorHandler } from '../../Utils/ErrorHandler.js'

let settingsNamespace = new SettingsNamespace(["Views", "World"])
let blockMaterial = null;

settingsNamespace.defaults({
	blockMaterial : {
		metalness: 0.8,
		roughness: 0.1,
		envMapIntensity: 1,
		wireframe : false
	},
	forces : {
		show : true,
		scale : {
			x : 10000,
			y : 10000,
			z : 100
		},
		headSize : 0.05
	}
});

function initBlockMaterial() {
	blockMaterial = new THREE.MeshPhysicalMaterial();
	settingsNamespace.onChange((materialSetings) => {
		for(let key in materialSetings) {
			blockMaterial[key] = materialSetings[key];
		}
		blockMaterial.needsUpdate = true;
	}, "blockMaterial")();
}

let materialRed = new THREE.MeshBasicMaterial({
	color: 0xff0000,
	side: THREE.DoubleSide
});
let materialGreen = new THREE.MeshBasicMaterial({
	color: 0x00ff00,
	side: THREE.DoubleSide
});
let materialBlue = new THREE.MeshBasicMaterial({
	color: 0x0000ff,
	side: THREE.DoubleSide
});

function makeBlock() {
	let block = new THREE.Object3D();

	{
		let geometry = new THREE.BoxGeometry(1.5, 0.3, 0.3);
		let mesh = new THREE.Mesh(geometry, blockMaterial);
		mesh.position.set(0.5, 0.0, 0.15);

		mesh.receiveShadow = true;
		mesh.castShadow = true;

		block.add(mesh);
	}

	{
		let forces = new THREE.Object3D();

		{
			forces.add(new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 0, 0), 1, 0xff0000));
			forces.add(new THREE.ArrowHelper(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 0), 1, 0x00ff00));
			forces.add(new THREE.ArrowHelper(new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 0, 0), 1, 0x0000ff));

			forces.add(new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), new THREE.Vector3(1, 0, 0), 1, 0xff0000));
			forces.add(new THREE.ArrowHelper(new THREE.Vector3(0, 1, 0), new THREE.Vector3(1, 0, 0), 1, 0x00ff00));
			forces.add(new THREE.ArrowHelper(new THREE.Vector3(0, 0, 1), new THREE.Vector3(1, 0, 0), 1, 0x0000ff));
		}

		block.add(forces);
		block.forces = forces;
	}

	return block;
}


let system = new THREE.Object3D();

function makeSystem() {
	// Build the blocks
	initBlockMaterial();
	let frameContent = document.getCurrentOutputFrame();

	let blocks = [];
	for (let blockData of frameContent.configuration) {
		let block = makeBlock();
		system.add(block);
		blocks.push(block);
	}

	function updateBlocks(frameContent) {
		let showForces = settingsNamespace.get(["forces", "show"]);
		let forcesScale = settingsNamespace.get(["forces", "scale"]);
		let forcesHeadSize = settingsNamespace.get(["forces", "headSize"]);

		let updateArrow = (arrowHelper, moment, axis) => {
			let length = moment[axis] / forcesScale[axis];
			arrowHelper.setLength(Math.abs(length), forcesHeadSize, forcesHeadSize);

			let direction = new THREE.Vector3(0, 0, 0);
			direction[axis] = length > 0 ? 1 : -1;
			arrowHelper.setDirection(direction);
		};

		for (let i = 0; i < blocks.length; i++) {
			let block = blocks[i];
			let blockData = frameContent.configuration[i];
			block.position.set(blockData.start.x, blockData.start.y, blockData.start.z);
			block.rotation.z = blockData.angleToX;

			if(showForces && frameContent.forces) {
				block.forces.visible = true;

				updateArrow(block.forces.children[0], frameContent.forces[i * 2 + 0].moment, 'x');
				updateArrow(block.forces.children[1], frameContent.forces[i * 2 + 0].moment, 'y');
				updateArrow(block.forces.children[2], frameContent.forces[i * 2 + 0].moment, 'z');

				updateArrow(block.forces.children[3], frameContent.forces[i * 2 + 1].moment, 'x');
				updateArrow(block.forces.children[4], frameContent.forces[i * 2 + 1].moment, 'y');
				updateArrow(block.forces.children[5], frameContent.forces[i * 2 + 1].moment, 'z');
			}
			else {
				block.forces.visible = false;
			}
		}
	}

	updateBlocks(frameContent);

	// listen for changes
	let callback = () => {
		updateBlocks(document.getCurrentOutputFrame());
	}

	rendererRouter.onChange('outputFrame', callback);
	rendererRouter.onChange('outputTimeline', callback);
	settingsNamespace.onChange(callback);
}

ErrorHandler.do(() => {
	makeSystem();
});

export { system }