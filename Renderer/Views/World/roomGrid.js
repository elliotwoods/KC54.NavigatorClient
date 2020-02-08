import * as THREE from '../../../node_modules/three/build/three.module.js';

class RoomGrid extends THREE.Object3D {
	constructor(roomMin = new THREE.Vector3(-1, -1, -1), roomMax = new THREE.Vector3(1, 1, 1)) {
		super();


		let materialFloor = new THREE.MeshBasicMaterial();
		let materialBack = new THREE.MeshBasicMaterial();

		this.texture = new THREE.TextureLoader().load("images/grid-10.png", function (texture) {
			texture.wrapS = THREE.RepeatWrapping;
			texture.wrapT = THREE.RepeatWrapping;

			{
				let textureFloor = texture.clone();
				textureFloor.needsUpdate = true;
				textureFloor.repeat.set(roomMax.x - roomMin.x, roomMax.y - roomMin.y);
				textureFloor.offset.set(roomMin.x, roomMin.y);
				materialFloor.map = textureFloor;
				materialFloor.needsUpdate = true;
			}

			{
				let textureBack = texture.clone();
				textureBack.needsUpdate = true;
				textureBack.repeat.set(roomMax.x - roomMin.x, roomMax.z - roomMin.z);
				textureBack.offset.set(roomMin.x, roomMin.z);
				materialBack.map = textureBack;
				materialBack.needsUpdate = true;
			}
		});

		//floor
		{
			let geometry = new THREE.PlaneGeometry(roomMax.x - roomMin.x, roomMax.y - roomMin.y);
			let mesh = new THREE.Mesh(geometry, materialFloor);
			mesh.position.set((roomMax.x + roomMin.x) / 2.0, (roomMin.y + roomMax.y) / 2.0, roomMin.z);
			this.add(mesh);
		}

		//back
		{
			let geometry = new THREE.PlaneGeometry(roomMax.x - roomMin.x, roomMax.z - roomMin.z);
			let mesh = new THREE.Mesh(geometry, materialBack);
			mesh.rotateX(Math.PI / 2.0)
			mesh.position.set((roomMax.x + roomMin.x) / 2.0, roomMax.y, (roomMax.z + roomMin.z) / 2.0);
			this.add(mesh);
		}

	}
}

export { RoomGrid }