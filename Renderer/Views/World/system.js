import * as THREE from '../../../node_modules/three/build/three.module.js';

import { document, SettingNamespace } from '../../Database.js'
import { rendererRouter } from '../../rendererRouter.js'

let settingsNamespace = new SettingNamespace(["Views", "World"])
let blockMaterial = null;

function initBlockMaterial() {
	let materialSettings = settingsNamespace.get("blockMaterial", {
		color: 11184810,
		metalness: 0.8,
		roughness: 0.1,
		envMapIntensity: 1
	});

	blockMaterial = new THREE.MeshPhysicalMaterial(materialSettings);
}

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

	return block;
}

function makeMomentGeometry(value) {
	let geometry = new THREE.CylinderGeometry(0.2, 0.2, 0.1
		, 12
		, 1
		, false
		, 0
		, value * Math.PI * 2.0);
	return geometry;
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


function makeMoments(forcesItem) {
	var momentData = forcesItem.moment;
	var moments = new THREE.Object3D();

	{
		let momentGeomtry = makeMomentGeometry(momentData.x / 5000);
		let mesh = new THREE.Mesh(momentGeomtry, materialRed);
		mesh.rotateY(Math.PI / 2.0);
		moments.add(mesh);
	}

	{
		let momentGeomtry = makeMomentGeometry(momentData.y / 5000);
		let mesh = new THREE.Mesh(momentGeomtry, materialGreen);
		mesh.rotateX(Math.PI / 2.0);
		moments.add(mesh);
	}

	{
		let momentGeomtry = makeMomentGeometry(momentData.z / 5000);
		let mesh = new THREE.Mesh(momentGeomtry, materialBlue);
		moments.add(mesh);
	}


	return moments;
}

let system = new THREE.Object3D();

function makeSystem() {
	// Build the blocks
	initBlockMaterial();
	let frameData = document.getCurrentOutputFrame();

	let blocks = [];
	for (let blockData of frameData.configuration) {
		let block = makeBlock();
		system.add(block);
		blocks.push(block);
	}

	function setBlockTransforms(frameData) {
		for (let i = 0; i < blocks.length; i++) {
			let block = blocks[i];
			let blockData = frameData.configuration[i];
			block.position.set(blockData.start.x, blockData.start.y, blockData.start.z);
			block.rotation.z = blockData.angleToX;
		}
	}

	setBlockTransforms(frameData)

	// Build the forces
	let showForces = settingsNamespace.get("showForces", false);

	if (showForces && frameData.forces) {
		system.updateMatrixWorld();
		for (let i = 0; i < frameData.forces.length; i++) {
			let positionInBlock = i % 2 == 0
				? new THREE.Vector3(0, 0, 0)
				: new THREE.Vector3(1.0, 0, 0.0);
			let block = blocks[Math.floor(i / 2)];

			let positionInWorld = block.localToWorld(positionInBlock);

			let momentHelper = makeMoments(frameData.forces[i]);
			momentHelper.position.copy(positionInWorld);
			system.add(momentHelper);
		}
	}

	// listen for changes
	let callback = () => {
		setBlockTransforms(document.getCurrentOutputFrame());
	}
	rendererRouter.onChange('outputFrame', callback);
	rendererRouter.onChange('outputFrameData', callback);
}

try {
	makeSystem();
}
catch(error) {
	console.error(error);
}

export { system }