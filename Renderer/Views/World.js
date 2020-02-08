import { Base } from './Base.js'

import * as THREE from '../../node_modules/three/build/three.module.js';
import { OrbitControls } from '../../node_modules/three/examples/jsm/controls/OrbitControls.js';
import { RoomGrid } from './World/roomGrid.js';
import { buildScene } from './World/buildScene.js';

import { document } from '../Database.js'
import { AxisMath } from '../Utils/AxisMath.js'
import { totalBlockHeight, totalShaftCount } from '../Utils/Constants.js'
import { rendererRouter } from '../rendererRouter.js'

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
		this.scene.background = new THREE.Color(0xcccccc);
		this.renderer = new THREE.WebGLRenderer({ antialias: true });

		let width = this.div.width();
		let height = this.div.height();

		this.renderer.setPixelRatio(window.devicePixelRatio);

		this.div.append(this.renderer.domElement);

		// cameras
		{
			this.cameraPerspective = new THREE.PerspectiveCamera(60, width / height, 0.001, 100);
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

		this.scene.add(new THREE.AxesHelper(1.0));

		this.roomGrid = new RoomGrid(new THREE.Vector3(-2.0, -3.0, 0.0), new THREE.Vector3(10.0, 3.0, 7.0))
		this.scene.add(this.roomGrid);

		buildScene(this.scene);

		new ResizeSensor(this.div[0], () => {
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