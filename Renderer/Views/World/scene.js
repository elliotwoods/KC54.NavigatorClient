import * as THREE from '../../../node_modules/three/build/three.module.js';
import { RGBELoader } from '../../../node_modules/three/examples/jsm/loaders/RGBELoader.js';
import { GLTFLoader } from '../../../node_modules/three/examples/jsm/loaders/GLTFLoader.js';

import { SettingNamespace } from '../../Database.js'
import { RoomGrid } from './roomGrid.js';
import { system } from './system.js'

import { Constants } from '../../Utils/Constants.js'
let settingsNamespace = new SettingNamespace(["Views", "World"]);


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
	let sunLightSettings = settingsNamespace.get("sunLight", {
		intensity: 0.8,
		castShadow: true,
		showHelper: false,
		nearClip: 50,
		farClip: 200,
		position: [
			0,
			0,
			100
		],
		size: 20,
		mapSize: 2048,
		shadowBias: -0.00001
	});

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
	let ambientLight = new THREE.AmbientLight(0x888888);
	scene.add(ambientLight);
}

// Human
{
	let loader = new GLTFLoader();
	loader.load('models/full_body_scan_with_peel_3d/scene.gltf', (gltf) => {
		gltf.scene.scale.set(0.001, 0.001, 0.001);
		gltf.scene.rotateX(Math.PI / 2);
		gltf.scene.rotateY(Math.PI);
		gltf.scene.position.set(Constants.footDistance / 2, -5, 0.5);
		scene.add(gltf.scene);
	}
		, undefined
		, (error) => {
			console.log(error);
		});
}

// System
scene.add(system);

export { scene }