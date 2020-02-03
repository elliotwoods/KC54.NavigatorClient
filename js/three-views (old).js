import * as THREE from '/node_modules/three/build/three.module.js';
import { OrbitControls } from '/node_modules/three/examples/jsm/controls/OrbitControls.js';
import { buildScene } from './scene.js.js';
import { RoomGrid } from './roomGrid.js.js';

var cameraPerspective, cameraTop, cameraFront;
var controls, scene, renderer;
let footDistance = 8.0;
var views;

init();
animate();

function init() {
	scene = new THREE.Scene();
	scene.background = new THREE.Color(0xcccccc);
	renderer = new THREE.WebGLRenderer({ antialias: true });

	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setSize(window.innerWidth, window.innerHeight);

	document.body.appendChild(renderer.domElement);

	// cameras
	{
		cameraPerspective = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.001, 100);
		cameraPerspective.position.set(4.0, -10.0, 5.0);
		cameraPerspective.up.set(0, 0, 1);
		
		cameraTop = new THREE.OrthographicCamera(-5.0, 5.0, 5.0, -5.0, -100.0, 100.0);
		cameraTop.position.set(footDistance / 2, 0, 0);

		cameraFront = cameraTop.clone();
		cameraFront.position.set(footDistance / 2, -1.0, 0.0);
		cameraFront.lookAt(footDistance / 2, 0, 0);
	}

	// views
	{
		views = [
			{
				left : 0,
				top : 0.5,
				width : 0.5,
				height : 0.5,
				camera : cameraTop
			},
			{
				left : 0,
				top : 0,
				width : 0.5,
				height : 0.5,
				camera : cameraFront
			},
			{
				left : 0.5,
				top : 0,
				width : 0.5,
				height : 1.0,
				camera : cameraPerspective
			},
			
		];
	}

	// controls
	controls = new OrbitControls(cameraPerspective, renderer.domElement);
	{
		controls.mouseButtons = {
			LEFT: THREE.MOUSE.ROTATE,
			MIDDLE: THREE.MOUSE.DOLLY,
			RIGHT: THREE.MOUSE.PAN
		}
		
		controls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
		controls.dampingFactor = 0.05;
		controls.screenSpacePanning = false;
		controls.minDistance = 0.01;
		controls.maxDistance = 100;
		controls.maxPolarAngle = Math.PI / 2;
	}

	// world
	buildScene(scene);

	// lights
	var light = new THREE.DirectionalLight(0xffffff);
	light.position.set(1, 1, 1);
	scene.add(light);
	var light = new THREE.DirectionalLight(0x002288);
	light.position.set(- 1, - 1, - 1);
	scene.add(light);
	var light = new THREE.AmbientLight(0x222222);
	scene.add(light);

	//axis
	{
		scene.add(new THREE.AxesHelper(1.0));
	}
	
	var roomGrid = new RoomGrid(new THREE.Vector3(-2.0, -3.0, 0.0), new THREE.Vector3(10.0, 3.0, 7.0))
	scene.add(roomGrid);

	window.addEventListener('resize', onWindowResize, false);
	onWindowResize();
}

function onWindowResize() {
	var w = window.innerWidth;
	var h = window.innerHeight;

	cameraPerspective.updateProjectionMatrix();
	renderer.setSize(w, h);

	for(let view of views) {
		view.viewport = {
			left : view.left * w,
			top : view.top * h,
			width : view.width * w,
			height :view.height * h
		};
	}

	let orthographicAspect = w / h;
	cameraPerspective.aspect = 0.5 * w / h;
	cameraPerspective.updateProjectionMatrix();

	let viewWidth = 5.0;

	cameraTop.left = - orthographicAspect * viewWidth;
	cameraTop.right = orthographicAspect * viewWidth;
	cameraTop.top = viewWidth;
	cameraTop.bottom = -viewWidth;
	cameraTop.updateProjectionMatrix();

	cameraFront.left = cameraTop.left;
	cameraFront.right = cameraTop.right;
	cameraFront.bottom = 0.0;
	cameraFront.top = viewWidth * 2.0 / orthographicAspect;
	cameraFront.updateProjectionMatrix();
}

function animate() {
	requestAnimationFrame(animate);
	controls.update(); // only required if controls.enableDamping = true, or if controls.autoRotate = true
	render();
}

function render() {
	for(let view of views) {
		if ('viewport' in view) {
			renderer.setViewport(view.viewport.left, view.viewport.top, view.viewport.width, view.viewport.height);
			renderer.setScissor(view.viewport.left, view.viewport.top, view.viewport.width, view.viewport.height);
			renderer.setScissorTest(true);
			renderer.render(scene, view.camera);
		}
	}
}