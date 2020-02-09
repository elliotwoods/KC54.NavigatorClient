import * as THREE from '../../../node_modules/three/build/three.module.js';
import { RGBELoader } from '../../../node_modules/three/examples/jsm/loaders/RGBELoader.js';
import { settings } from '../../Database.js'
import { RoomGrid } from './roomGrid.js';
import { system } from './system.js'

const useHDR = false;

let scene = new THREE.Scene();
scene.background = new THREE.Color(0xcccccc); // temporary background

// Environment map
{
	if (useHDR) {
		let pmremGenerator = new THREE.PMREMGenerator(this.renderer);
		pmremGenerator.compileEquirectangularShader();

		// https://github.com/mrdoob/three.js/blob/master/examples/webgl_materials_reflectivity.html
		new RGBELoader()
			.setDataType(THREE.UnsignedByteType)
			.setPath('images/')
			.load('paul_lobe_haus_8k.hdr', (hdrEquirect) => {
				hdrEquirect.minFilter = THREE.NearestFilter;
				hdrEquirect.magFilter = THREE.NearestFilter;

				let hdrCubeRenderTarget = pmremGenerator.fromEquirectangular(hdrEquirect);
				pmremGenerator.dispose();

				scene.environment = hdrCubeRenderTarget.texture;
				scene.background = hdrCubeRenderTarget.texture;

				hdrEquirect.dispose();

			});
	}
	else {
		// https://threejs.org/docs/#api/en/loaders/CubeTextureLoader
		scene.environment = new THREE.CubeTextureLoader()
			.setPath('images/Environment/')
			.load([
				'px.png',
				'nx.png',
				'py.png',
				'ny.png',
				'pz.png',
				'nz.png'
			]);;
		scene.background = new THREE.CubeTextureLoader()
			.setPath('images/Background/')
			.load([
				'px.png',
				'nx.png',
				'py.png',
				'ny.png',
				'pz.png',
				'nz.png'
			]);;
	}
}

// Coordinate helpers
{
	scene.add(new THREE.AxesHelper(1.0));

	let roomGrid = new RoomGrid(new THREE.Vector3(-2.0, -3.0, 0.0), new THREE.Vector3(10.0, 3.0, 7.0))
	scene.add(roomGrid);
}

// Shadow casting light
{
	let sunLightSettings = settings
		.get("world")
		.get("sunLight")
		.value();

	let sunLight = new THREE.DirectionalLight(0xffffff, sunLightSettings.intensity);
	sunLight.position.set(sunLightSettings.position[0], sunLightSettings.position[1], sunLightSettings.position[2]);
	sunLight.castShadow = sunLightSettings.castShadow;
	sunLight.shadow.camera.top = sunLightSettings.size;
	sunLight.shadow.camera.bottom = - sunLightSettings.size;
	sunLight.shadow.camera.left = - sunLightSettings.size;
	sunLight.shadow.camera.right = sunLightSettings.size;
	sunLight.shadow.camera.near = sunLightSettings.nearClip;
	sunLight.shadow.camera.far = sunLightSettings.farClip;
	sunLight.shadow.mapSize.set(sunLightSettings.mapSize, sunLightSettings.mapSize);
	sunLight.shadow.bias = sunLightSettings.shadowBias;

	scene.add(sunLight);

	if (sunLightSettings.showHelper) {
		let shadowCameraHelper = new THREE.CameraHelper(sunLight.shadow.camera);
		shadowCameraHelper.visible = true;
		scene.add(shadowCameraHelper);
	}
}

// Ambient light
{
	let ambientLight = new THREE.AmbientLight(0x555555);
	scene.add(ambientLight);
}

// System
scene.add(system);

export { scene }