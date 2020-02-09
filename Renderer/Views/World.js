import { Base } from './Base.js'

import * as THREE from '../../node_modules/three/build/three.module.js';
import { RGBELoader } from '../../node_modules/three/examples/jsm/loaders/RGBELoader.js';
import { OrbitControls } from '../../node_modules/three/examples/jsm/controls/OrbitControls.js';

import { RoomGrid } from './World/roomGrid.js';
import { buildScene } from './World/buildScene.js';

import { document } from '../Database.js'
import { AxisMath } from '../Utils/AxisMath.js'
import { totalBlockHeight, totalShaftCount } from '../Utils/Constants.js'
import { rendererRouter } from '../rendererRouter.js'
import { settings } from '../Database.js'

let worlds = [];

class World extends Base {
	constructor(container, state) {
		super(container, state);
		this.container = container;
		this.state = state;

		this.init();
	}

	init() {
		this.div = $(`<div class="rendererContainer" />`);
		this.container.getElement().append(this.div);

		this.scene = new THREE.Scene();
		this.scene.background = new THREE.Color(0xcccccc); // temporary background

		let width = this.div.width();
		let height = this.div.height();

		// setup the renderer
		this.renderer = new THREE.WebGLRenderer({ antialias: true });
		this.renderer.setPixelRatio(window.devicePixelRatio);
		this.renderer.shadowMap.enabled = true;
		this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
		this.renderer.toneMapping = THREE.LinearToneMapping;

		this.div.append(this.renderer.domElement);

		// cameras
		{
			this.cameraPerspective = new THREE.PerspectiveCamera(60, width / height, 0.01, 1000);
			this.cameraPerspective.position.set(4.0, -10.0, 5.0);
			this.cameraPerspective.up.set(0, 0, 1);
		}

		// controls
		this.controls = new OrbitControls(this.cameraPerspective, this.renderer.domElement);
		{
			this.controls.mouseButtons = {
				LEFT: THREE.MOUSE.ROTATE,
				MIDDLE: THREE.MOUSE.DOLLY,
				RIGHT: THREE.MOUSE.PAN
			}
			
			this.controls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
			this.controls.dampingFactor = 0.05;
			this.controls.screenSpacePanning = false;
			this.controls.minDistance = 0.01;
			this.controls.maxDistance = 100;
			this.controls.maxPolarAngle = Math.PI / 2;
		}

		// Environment map
		{
			let pmremGenerator = new THREE.PMREMGenerator(this.renderer);
			pmremGenerator.compileEquirectangularShader();

			const useHDR = false;
			if(useHDR) {
				// https://github.com/mrdoob/three.js/blob/master/examples/webgl_materials_reflectivity.html
				new RGBELoader()
					.setDataType(THREE.UnsignedByteType)
					.setPath('images/')
					.load('paul_lobe_haus_8k.hdr', (hdrEquirect) => {
						hdrEquirect.minFilter = THREE.NearestFilter;
						hdrEquirect.magFilter = THREE.NearestFilter;
	
						let hdrCubeRenderTarget = pmremGenerator.fromEquirectangular(hdrEquirect);
						pmremGenerator.dispose();
	
						this.scene.environment = hdrCubeRenderTarget.texture;
						this.scene.background = hdrCubeRenderTarget.texture;
	
						hdrEquirect.dispose();
	
					});
			}
			else {
				// https://threejs.org/docs/#api/en/loaders/CubeTextureLoader
				this.scene.environment = new THREE.CubeTextureLoader()
				.setPath('images/Environment/')
				.load([
					'px.png',
					'nx.png',
					'py.png',
					'ny.png',
					'pz.png',
					'nz.png'			
				]);;
				this.scene.background = new THREE.CubeTextureLoader()
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
			this.scene.add(new THREE.AxesHelper(1.0));

			this.roomGrid = new RoomGrid(new THREE.Vector3(-2.0, -3.0, 0.0), new THREE.Vector3(10.0, 3.0, 7.0))
			this.scene.add(this.roomGrid);
		}

		// Shadow casting light
		{
			let sunLightSettings = settings
				.get("world")
				.get("sunLight")
				.value();
				
			let sunLight = new THREE.DirectionalLight( 0xffffff, sunLightSettings.intensity );
			sunLight.position.set( sunLightSettings.position[0], sunLightSettings.position[1], sunLightSettings.position[2]);
			sunLight.castShadow = sunLightSettings.castShadow;
			sunLight.shadow.camera.top = sunLightSettings.size;
			sunLight.shadow.camera.bottom = - sunLightSettings.size;
			sunLight.shadow.camera.left = - sunLightSettings.size;
			sunLight.shadow.camera.right = sunLightSettings.size;
			sunLight.shadow.camera.near = sunLightSettings.nearClip;
			sunLight.shadow.camera.far = sunLightSettings.farClip;
			sunLight.shadow.mapSize.set( sunLightSettings.mapSize, sunLightSettings.mapSize );
			sunLight.shadow.bias = sunLightSettings.shadowBias;

			this.scene.add(sunLight);

			if(sunLightSettings.showHelper) {
				let shadowCameraHelper = new THREE.CameraHelper(sunLight.shadow.camera);
				shadowCameraHelper.visible = true;
				this.scene.add(shadowCameraHelper);
			}
		}

		// Ambient light
		{
			let ambientLight = new THREE.AmbientLight(0x555555);
			this.scene.add(ambientLight);
		}

		buildScene(this.scene);

		this.container.on("resize", () => {
			this.onResize();
		});

		this.tryRefresh();

		worlds.push(this);
		animate();
	}

	onResize() {
		var w = this.div.width();
		var h = this.div.height();
	
		this.renderer.setSize(w, h);

		this.cameraPerspective.aspect = w / h;
		this.cameraPerspective.updateProjectionMatrix();
	}

	render() {
		this.renderer.render(this.scene, this.cameraPerspective);
	}

	refresh() {
	}
}

function animate() {
	requestAnimationFrame(animate);
	for(let world of worlds) {
		world.controls.update();
		world.render();
	}
}

export { World }