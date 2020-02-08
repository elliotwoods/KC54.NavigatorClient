import * as THREE from '../../../node_modules/three/build/three.module.js';
import { document } from '../../Database.js'

function makeBlock() {
	let block = new THREE.Object3D();

	{
		let geometry = new THREE.BoxGeometry(1.5, 0.3, 0.3);
		let material = new THREE.MeshBasicMaterial({
			color: 0x001100,
			wireframe: true
		});
		let cube = new THREE.Mesh(geometry, material);
		cube.position.set(0.5, 0.0, 0.15);
		block.add(cube);
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

async function buildScene(scene) {
	let system = new THREE.Object3D();
	scene.add(system);

	let frameData = document.getCurrentOutputFrame();

	let blocks = [];
	for (let blockData of frameData.configuration) {
		let block = makeBlock();
		block.position.set(blockData.start.x, blockData.start.y, blockData.start.z);
		block.rotateZ(blockData.angleToX);
		system.add(block);
		blocks.push(block);
	}

	scene.updateMatrixWorld();
	if (frameData.forces) {
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
}

export { buildScene }