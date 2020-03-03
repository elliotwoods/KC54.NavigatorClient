import { Base } from './Base.js'

import * as THREE from '../../node_modules/three/build/three.module.js';
import { OrbitControls } from '../../node_modules/three/examples/jsm/controls/OrbitControls.js';

import { EffectComposer } from '../../node_modules/three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from '../../node_modules/three/examples/jsm/postprocessing/RenderPass.js';
import { SAOPass } from '../../node_modules/three/examples/jsm/postprocessing/SAOPass.js';
import { SSAOPass } from '../../node_modules/three/examples/jsm/postprocessing/SSAOPass.js';
import { FXAAShader } from '../../node_modules/three/examples/jsm/shaders/FXAAShader.js';
import { ShaderPass } from '../../node_modules/three/examples/jsm/postprocessing/ShaderPass.js';

import { scene } from './World/scene.js'

import { Constants } from '../Utils/Constants.js'
import { settings, SettingsNamespace as SettingsNamespace } from '../Database.js'
import { rendererRouter } from '../rendererRouter.js';
import { InspectableSettings } from '../Utils/InspectableSettings.js'

let settingsNamespace = new SettingsNamespace(["Views", "World"]);
let inspectableSettings = new InspectableSettings(settingsNamespace)

settingsNamespace.defaults({
	"renderDirtyTime" : 3
});

let worlds = [];

class World extends Base {
	constructor(container, state) {
		super(container, state);
		this.container = container;
		this.state = state;

		this.markRenderDirty();
		this.init();
		let needsRender = () => {
			this.markRenderDirty();
		};
		rendererRouter.onChange('outputFrame', needsRender);
		rendererRouter.onChange('renderView', needsRender);
		rendererRouter.onChange('outputTimeline', needsRender);
		
		this.container.getElement().mousemove(() => {
			this.markRenderDirty();
		});
	}

	init() {
		this.div = $(`<div class="rendererContainer" />`);
		this.container.getElement().append(this.div);
		this.div.click(() => {
			inspectableSettings.inspect();
		});

		let width = this.div.width();
		let height = this.div.height();

		// setup the renderer
		this.renderer = new THREE.WebGLRenderer({ antialias: true });
		this.renderer.setPixelRatio(window.devicePixelRatio);
		this.renderer.shadowMap.enabled = true;
		this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
		//this.renderer.toneMapping = THREE.LinearToneMapping;

		this.div.append(this.renderer.domElement);

		// setup the camera
		switch (this.state.camera) {
			case "perspective":
				{
					// cameras
					{
						this.camera = new THREE.PerspectiveCamera(60, width / height, 0.01, 1000);
						this.camera.position.set(Constants.footDistance / 2, -9.0, 1.8 - 0.6);
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
						this.controls.maxPolarAngle = Math.PI / 2 * 6 / 5;
						this.controls.target.set(Constants.footDistance / 2, 0, 3);
					}
				}
				break;
			case "top":
				{
					this.camera = new THREE.OrthographicCamera(-6.0, 6.0, 6.0, -6.0, -10000.0, 10000.0);
					this.camera.position.set(Constants.footDistance / 2, 0, 0);
				}
				break;
			case "front":
				{
					this.camera = new THREE.OrthographicCamera(-6.0, 6.0, 6.0, -6.0, -100.0, 100.0);
					this.camera.position.set(Constants.footDistance / 2, -1.0, 3.0);
					this.camera.lookAt(Constants.footDistance / 2, 0, 3);
				}
				break;
		}

		// Post processing
		{
			let postProcessingSettings = settingsNamespace.get("postProcessing", {
				enabled: true,
				ambientOcclusion: {
					type: "SAO",
					SAO: {
						saoBias: 0.5,
						saoIntensity: 0.001,
						saoScale: 10,
						saoKernelRadius: 16,
						saoMinResolution: 0,
						saoBlur: true,
						saoBlurRadius: 50,
						saoBlurStdDev: 2,
						saoBlurDepthCutOff: 0.1
					},
					SSAO: {
						kernelRadius: 8,
						minDistance: 0.01,
						maxDistance: 1
					}
				}
			});

			if (postProcessingSettings.enabled) {
				this.composer = new EffectComposer(this.renderer);
				let renderPass = new RenderPass(scene, this.camera);
				this.composer.addPass(renderPass);

				this.fxaaPass = new ShaderPass( FXAAShader );
				this.composer.addPass(this.fxaaPass);

				let ambientOcclusionSettings = postProcessingSettings.ambientOcclusion
				switch (ambientOcclusionSettings.type) {
					case "SAO":
						{

							let saoPass = new SAOPass(scene, this.camera, false, true);
							this.composer.addPass(saoPass);
							{
								let settings = ambientOcclusionSettings.SAO;
								for (let paramName in settings) {
									saoPass.params[paramName] = settings[paramName];
								}
							}
						}
						break;

					case "SSAO":
						{
							let ssaoPass = new SSAOPass(scene, this.camera);
							this.composer.addPass(ssaoPass);
							{
								let settings = ambientOcclusionSettings.SSAO;
								for (let paramName in settings) {
									ssaoPass[paramName] = settings[paramName];
								}
							}
						}
						break;
				}
			}
		}

		this.container.on("resize", () => {
			this.onResize();
		});

		this.tryRefresh();

		worlds.push(this);
		animate();
	}

	markRenderDirty() {
		this.lastActionTime = new Date();
	}

	onResize() {
		var w = this.div.width();
		var h = this.div.height();

		this.renderer.setSize(w, h);
		this.fxaaPass.material.uniforms['resolution'].value.x = 1 / (w * this.renderer.getPixelRatio());
		this.fxaaPass.material.uniforms['resolution'].value.y = 1 / (h * this.renderer.getPixelRatio());

		let aspect = w / h;
		if (this.camera instanceof THREE.PerspectiveCamera) {
			this.camera.aspect = aspect;
		}
		else {
			let width = this.camera.right - this.camera.left;
			let height = width / aspect;
			this.camera.top = height / 2;
			this.camera.bottom = - height / 2;
		}
		this.camera.updateProjectionMatrix();

		if (this.composer) {
			this.composer.setSize(w, h);
		}

		this.markRenderDirty();
	}

	render() {
		let renderDirtyTime = settingsNamespace.get("renderDirtyTime");
		let timeSinceLastAction = new Date() - this.lastActionTime;
		if(timeSinceLastAction > renderDirtyTime * 1000) {
			return;
		}

		if (this.composer) {
			this.composer.render();
		}
		else {
			this.renderer.render(scene, this.camera);
		}
		
	}

	refresh() {
	}
}

function animate() {
	requestAnimationFrame(animate);
	for (let world of worlds) {
		if (world.controls) {
			world.controls.update();
		}
		world.render();
	}
}

export { World }