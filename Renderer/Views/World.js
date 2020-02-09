import { Base } from './Base.js'

import * as THREE from '../../node_modules/three/build/three.module.js';
import { OrbitControls } from '../../node_modules/three/examples/jsm/controls/OrbitControls.js';

import { scene } from './World/scene.js'

import { Constants } from '../Utils/Constants.js'
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

		let width = this.div.width();
		let height = this.div.height();

		// setup the renderer
		this.renderer = new THREE.WebGLRenderer({ antialias: true });
		this.renderer.setPixelRatio(window.devicePixelRatio);
		this.renderer.shadowMap.enabled = true;
		this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
		this.renderer.toneMapping = THREE.LinearToneMapping;

		this.div.append(this.renderer.domElement);

		// setup the camera
		switch(this.state.camera) {
			case "perspective":
			{
				// cameras
				{
					this.camera = new THREE.PerspectiveCamera(30, width / height, 0.01, 1000);
					this.camera.position.set(4.0, -20.0, 5.0);
					this.camera.up.set(0, 0, 1);
				}

				// controls
				this.controls = new OrbitControls(this.camera, this.renderer.domElement);
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
					this.controls.target.set(Constants.footDistance / 2, 2, 0);
				}
			}
			break;
			case "top":
			{
				this.camera = new THREE.OrthographicCamera(-6.0, 6.0, 6.0, -6.0, -100.0, 100.0);
				this.camera.position.set(Constants.footDistance / 2, 0, 0);
			}
		}
		

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
		
		let aspect = w / h;
		if(this.camera instanceof THREE.PerspectiveCamera) {
			this.camera.aspect = aspect;
		}
		else {
			let width = this.camera.right - this.camera.left;
			let height = width / aspect;
			this.camera.top = height / 2;
			this.camera.bottom = - height / 2;
		}

		this.camera.updateProjectionMatrix();
	}

	render() {
		this.renderer.render(scene, this.camera);
	}

	refresh() {
	}
}

function animate() {
	requestAnimationFrame(animate);
	for(let world of worlds) {
		if(world.controls) {
			world.controls.update();
		}
		world.render();
	}
}

export { World }