import { Base } from './Base.js'
import { SVG } from '../../node_modules/@svgdotjs/svg.js/dist/svg.esm.js'
import { document, SettingsNamespace, settings } from '../Database.js'
import { rendererRouter } from '../rendererRouter.js';
import { ErrorHandler } from '../Utils/ErrorHandler.js'

import { Element } from './InputTimeline/Element.js'
import { Ruler } from './InputTimeline/Ruler.js'
import { TrackHeaders } from './InputTimeline/TrackHeaders.js'
import { KeyFrames } from './InputTimeline/KeyFrames.js'
import { GuiUtils } from '../Utils/GuiUtils.js';
import { InputTimelineUtils } from '../Utils/InputTimelineUtils.js';
import { outputTimeline } from '../Data/outputTimeline.js'
import { NavigatorServer } from '../Utils/NavigatorServer.js';
import { transport } from '../Data/transport.js'
import { InspectableSettings } from '../Utils/InspectableSettings.js'
import { parseGenerators } from '../Generators/generatorFactoryRegister.js'
import { Inspectable } from './Inspector.js'
const fs = require('fs')

const shortid = require('shortid');
const fastEqual = require('fast-deep-equal');

let settingsNamespace = new SettingsNamespace(["Views", "InputTimeline"]);
let inspectableSettings = new InspectableSettings(settingsNamespace)
let layout = settingsNamespace.get("layout");

// set some defaults for testing
settingsNamespace.defaults(
{
	"layout": {
		trackCaptionAreaWidth: 200,
		trackHeight: 30,
		frameNumbersAreaHeight: 30,
		keyFrame : {
			inspectingColor : '#eef',
			size : 9,
		},
		frameTicks: {
			height: 5,
			color: '#aaa'
		},
		frameCursor: {
			color: '#333'
		},
		backgroundColor: '#efeeee',
		freshFramesColor: '#efffee',
		ruler : {
			forcesArea : {
				height : 8,
				fillColor : '#90e576'
			}
		},
		trackHeaders : {
			disabledColor : '#aaa',
			font : {
				size : 14
			}
		}
	},
	"tracks" : [
	],
	"optimisation" : {
		preferBeamAngles : {
			prior : true,
			weight : 0.01
		},
		calculateForces : {
			enabled : true,
			windProfile : {
				Vref : 5,
				href : 2,
				theta : 0,
				roughness : 0.1,
				drag : 2
			}
		},
		preferences : {
			maxIterations : 200
		}
	},
	"preview" : {
		applyGenerators : true
	},
	"syncToOutputFrameIndex" : false,
	windProfile : {
		Vref : 0,
		href : 2,
		theta : 0,
		roughness : 0.1,
		drag : 2
	}
});

class InputTimeline extends Base {
	constructor(container, state) {
		super(container, state);
		this.container = container;
		this.state = state;

		this.init();
	}

	init() {
		this.div = $(`<div class="scrollContainerY" />`);

		this.toolBar = $(`<div class="toolBar"/>`);
		this.div.append(this.toolBar);
		this.container.getElement().append(this.div);
		this.draw = SVG().addTo(this.div[0]);

		this.zoomLevel = 1;
		this.visibleRangeStart = 0;
		this.visibleRangeEnd = 99;
		this.currentFrameIndex = 0;

		this.syncToOutputFrameIndex = settingsNamespace.get("syncToOutputFrameIndex");
		this.cachedOutputValuesForThisFrame = {};

		this.refreshRequests = 0;

		this.previewObjectivesInspectable = new Inspectable(() => {
				return this.cachedOutputValuesForThisFrame;
			}
			, null
			, "InputTimeline::objectives");

		this.actions = {
			addTrack: {
				do: () => {
					this.addTrack();
				},
				buttonPreferences: {
					icon: "fas fa-plus"
				}
			},
			removeTrack: {
				do: () => {
					this.removeTrack();
				},
				isEnabled: () => this.getSelectedTrack() != null,
				buttonPreferences: {
					icon: "fas fa-minus"
				}
			},
			newKeyFrame: {
				do: async () => {
					await this.insertKeyFrame();
				},
				isEnabled: () => this.getSelectedTrack() != null,
				buttonPreferences: {
					icon: "fas fa-circle"
				}
			},
			toggleActive : {
				do: () => {
					let track = this.getSelectedTrack();
					InputTimelineUtils.setTrackActive(track, !InputTimelineUtils.getTrackActive(track));
					this.element.children.trackHeaders.markDirty(true);
					this.requestRefresh();
				},
				isEnabled: () => {
					let track = this.getSelectedTrack();
					if(!track) {
						return false;
					}
					if(track.keyFrames.length == 0) {
						return false;
					}
					return true;
				},
				isDown : () => {
					let track = this.getSelectedTrack();
					if(!track) {
						return false;
					}
					return InputTimelineUtils.getTrackActive(track);
				},
				buttonPreferences: {
					icon: "fas fa-check-square"
				}
			},
			deleteKeyFrame: {
				do: () => {
					this.deleteKeyFrame();
				},
				isEnabled: () => this.getSelectedKeyframe() != null,
				buttonPreferences: {
					icon: "fas fa-times"
				}
			},
			renderOneFrame: {
				do: async () => {
					await this.renderOneFrame();
				},
				buttonPreferences: {
					icon: "fas fa-walking"
				}
			},
			renderAllFrames: {
				do: async () => {
					await this.renderAllFrames();
				},
				buttonPreferences: {
					icon: "fas fa-running"
				}
			},
			markDirtyFromHere: {
				do: () => {
					this.markDirtyFromHere();
				},
				buttonPreferences: {
					icon: "fas fa-toilet-paper"
				}
			},
			save: {
				do: () => {
					this.save();
				},
				buttonPreferences: {
					icon: "fas fa-save"
				}
			},
			import : {
				do : () => {
					this.import();
				},
				buttonPreferences : {
					icon : "fas fa-file-import"
				}
			},
			export : {
				do : () => {
					this.export();
				},
				buttonPreferences : {
					icon : "fas fa-file-export"
				}
			},
			settings : {
				do : () => {
					inspectableSettings.toggleInspect();
					this.requestRefresh();
				},
				buttonPreferences : {
					icon: "fas fa-cogs"
				},
				isDown : () => inspectableSettings.isBeingInspected()
			},
			syncToOutputFrameIndex: {
				do: () => {
					this.syncToOutputFrameIndex = !this.syncToOutputFrameIndex;
					if (this.syncToOutputFrameIndex) {
						transport.skipToFrame(this.currentFrameIndex);
					}
					settingsNamespace.set(this.syncToOutputFrameIndex, "syncToOutputFrameIndex");
					this.requestRefresh();
				},
				isDown: () => this.syncToOutputFrameIndex,
				buttonPreferences: {
					icon: "fas fa-sync"
				}
			},
			previewObjectives : {
				do : () => {
					this.previewObjectivesInspectable.toggleInspect();
					this.requestRefresh();
				},
				isDown : () => this.previewObjectivesInspectable.isBeingInspected(),
				buttonPreferences : {
					icon: "fas fa-eye"
				}

			},
			calculateForces : {
				do : async () => {
					await this.calculateForces();
				},
				buttonPreferences : {
					icon : "fas fa-balance-scale-right"
				}
			},
			calculateObjectiveValues : {
				do : async () => {
					await this.calculateObjectiveValues();
				},
				buttonPreferences : {
					icon : "fas fa-bullseye"
				}
			},
			fastRender : {
				do : async () => {
					await this.fastRender();
				},
				buttonPreferences : {
					icon : "fas fa-rocket"
				}
			}
		};

		this.element = new Element(this);

		ErrorHandler.doAsync(async () => {
			this.build();
			await this.markDirtyFrames();
		});


		this.container.on("resize", () => {
			this.resize();
		});

		rendererRouter.onChange('inspectTargetChange', () => {
			this.requestRefresh();
		});
		rendererRouter.onChange('outputTimeline', async () => {
			await this.markDirtyFrames();
		});
		rendererRouter.onChange('outputFrame', () => {
			if (this.syncToOutputFrameIndex) {
				let frameIndex = transport.getCurrentFrameIndex();

				// check if we want to loop
				if(frameIndex > this.visibleRangeEnd) {
					frameIndex = (frameIndex - this.visibleRangeStart) % (this.visibleRangeEnd - this.visibleRangeStart) + this.visibleRangeStart;
				}

				this.setFrameIndex(frameIndex);
			}
		});

		//actions
		for (let actionName in this.actions) {
			let action = this.actions[actionName];
			let button = GuiUtils.makeButton(GuiUtils.camelCapsToLong(actionName), action.buttonPreferences, async () => {
				await action.do();
			});
			action.button = button;
			this.toolBar.append(button);
		}

		// if layout changes, rebuild all
		settingsNamespace.onChange(() => {
			this.element.clear();
			layout = settingsNamespace.get("layout");
			this.build();
			this.requestRefresh();
		}, 'layout');
	}

	build() {
		this.draw.clear();

		this.tracks = settingsNamespace.get("tracks");

		this.element.children.ruler = new Ruler(this);
		this.element.children.trackHeaders = new TrackHeaders(this);
		this.element.children.keyFrames = new KeyFrames(this);

	}

	frameIndexToPixel(frameIndex) {
		return (frameIndex - this.visibleRangeStart) * this.pixelsPerFrame;
	}

	pixelToFrameIndex(pixel, ignoreCaptionArea = true) {
		if (!ignoreCaptionArea) {
			pixel -= layout.trackCaptionAreaWidth;
		}
		return (pixel / this.pixelsPerFrame) + this.visibleRangeStart;
	}

	getFrameCount() {
		return Math.max.apply(null, this.tracks.map(track =>
			track.keyFrames.length > 0
				? track.keyFrames[track.keyFrames.length - 1].frameIndex + 1
				: 0));
	}

	resize() {
		let width = this.div.width() - 30;
		if (width == 0) {
			return;
		}

		this.pixelsPerFrame = (width - layout.trackCaptionAreaWidth) / (this.visibleRangeEnd + 1 - this.visibleRangeStart);
		this.element.resize(width);
		this.draw.width(width);

		ErrorHandler.do(() => {
			this.requestRefresh();
		});
	}

	requestRefresh() {
		if(this.refreshRequests > 0) {
			return;
		}

		this.refreshRequests++;

		ErrorHandler.doAsync(async () => {
			await new Promise(resolve => setTimeout(resolve, 20));

			while(this.refreshRequests > 0) {
				this.refreshRequests--;
				await this.refresh();
			}
		});
	}

	async refresh() {
		this.draw.height(layout.frameNumbersAreaHeight + layout.trackHeight * this.tracks.length);

		this.element.refresh();

		// When the selection changes, update states of buttons
		for (let actionName in this.actions) {
			let action = this.actions[actionName];

			if (action.isEnabled) {
				if (action.button.hasClass("btn-waiting")) {
					// don't update the state
				}
				else {
					let actionEnabled = action.isEnabled();
					action.button.prop("disabled", !actionEnabled);
				}
			}

			if (action.isDown) {
				if (action.isDown()) {
					action.button.addClass("btn-toggle-active");
				}
				else {
					action.button.removeClass("btn-toggle-active");
				}
			}
		}

		try {
			this.cachedOutputValuesForThisFrame = await this.getObjectivesForFrame(this.currentFrameIndex
					, !settingsNamespace.get(["preview", "applyGenerators"]));
		}
		catch(error) {
			console.error(error);
			this.cachedOutputValuesForThisFrame = undefined;
		}
		this.previewObjectivesInspectable.notifyValueChange();
	}

	validateFrameIndex(frameIndex) {
		frameIndex = Math.floor(frameIndex);
		if (frameIndex < 0) {
			frameIndex = this.getFrameCount() - 1;
		}

		// Actually we dont want this. If we only have one keyframe, we still want to be able to move the cursor
		// if (frameIndex >= this.getFrameCount()) {
		// 	frameIndex = 0;
		// }

		return frameIndex;
	}

	setFrameIndex(frameIndex) {
		if (this.currentFrameIndex == frameIndex) {
			return;
		}

		this.currentFrameIndex = this.validateFrameIndex(frameIndex);

		this.element.children.ruler.children.frameCursor.dirty = true;
		this.element.children.keyFrames.children.frameCursor.dirty = true;
		this.requestRefresh();

		// Announce to inspsector that rendered values might have changed
		for (let trackID in this.element.children.trackHeaders.inspectables) {
			this.element.children.trackHeaders.inspectables[trackID].notifyValueChange();
		}

		if (this.syncToOutputFrameIndex) {
			transport.skipToFrame(this.currentFrameIndex);
		}
	}

	addTrack() {
		this.tracks.push({
			id: shortid.generate(),
			keyFrames: []
		});
		this.element.children.trackHeaders.markDirty(true);
		this.element.children.keyFrames.markDirty(true);
		this.requestRefresh();
	}

	removeTrack() {
		this.tracks = this.tracks.filter(track => track.id != this.getSelectedTrack().id);
		this.element.children.trackHeaders.markDirty(true);
		this.element.children.keyFrames.markDirty(true);
		this.requestRefresh();
	}

	getSelectedTrack() {
		for (let trackID in this.element.children.trackHeaders.inspectables) {
			let inspectable = this.element.children.trackHeaders.inspectables[trackID];
			if (inspectable.isBeingInspected()) {
				return inspectable.track;
			}
		}
		for (let keyFrameID in this.element.children.keyFrames.inspectables) {
			let inspectable = this.element.children.keyFrames.inspectables[keyFrameID];
			if (inspectable.isBeingInspected()) {
				return inspectable.track;
			}
		}

		return null;
	}

	getSelectedKeyframe() {
		for (let keyFrameID in this.element.children.keyFrames.inspectables) {
			let inspectable = this.element.children.keyFrames.inspectables[keyFrameID];
			if (inspectable.isBeingInspected()) {
				return inspectable.keyFrame;
			}
		}

		return null;
	}

	async timelineDataChange() {
		this.element.children.keyFrames.markDirty(true);
		this.element.children.trackHeaders.markDirty(true);
		this.element.children.ruler.markDirty(true);
		
		await this.markDirtyFrames();
		await this.refresh(); // force a refresh - we also need the inspectables often
	}

	async insertKeyFrame() {
		let frameIndex = this.currentFrameIndex;

		let selectedTrack = this.getSelectedTrack();
		if (!selectedTrack) {
			throw (new Error("No track selected"));
		}

		// check keyFrame doesn't already exist
		for(let keyFrame of selectedTrack.keyFrames) {
			if(keyFrame.frameIndex == frameIndex) {
				throw(new Error("Cannot insert keyframe - one already exists here"));
			}
		}

		let keyFrame = {
			frameIndex: frameIndex,
			id: shortid.generate(),
			content: {}
		};

		selectedTrack.keyFrames.push(keyFrame);
		InputTimelineUtils.sortKeyFrames(selectedTrack);

		// refresh the view (and the inspectables)
		await this.timelineDataChange();

		// select this keyFrame
		this.element.children.keyFrames.inspectables[keyFrame.id].inspect();
		return keyFrame;
	}

	deleteKeyFrame() {
		let selectedKeyframe = this.getSelectedKeyframe();
		if (!selectedKeyframe) {
			throw (new Error("No key frame selected"));
		}

		let selectedTrack = this.getSelectedTrack();
		if (!selectedTrack) {
			throw (new Error("No track selected"));
		}

		// delete it
		selectedTrack.keyFrames = selectedTrack.keyFrames.filter(keyFrame => keyFrame.id != selectedKeyframe.id);

		// refresh the view (and the inspectables)
		this.timelineDataChange();
	}

	async calculateIfFrameIsDirty(frameIndex, newObjectives) {
		// we don't have this frame yet
		if (frameIndex >= outputTimeline.getFrameCount()) {
			return true;
		}

		// we don't have frame data
		let frameData = outputTimeline.getFrame(frameIndex);
		if (!frameData) {
			return true;
		}

		// we don't have render data
		let renderData = frameData.renderData;
		if (!renderData) {
			return true;
		}

		// frame is marked dirty already
		if (renderData.dirty) {
			return true;
		}

		if(!newObjectives) {
			newObjectives = await this.getObjectivesForFrame(frameIndex, false);
		}

		if (!fastEqual(InputTimelineUtils.stripMovementObjectives(renderData.objectives), InputTimelineUtils.stripMovementObjectives(newObjectives))) {
			return true;
		}

		return false;
	}

	isFrameDirtyCached(frameIndex) {
		let outputFrame = outputTimeline.getFrame(frameIndex) 
		if(outputFrame.renderData) {
			if('dirty' in outputFrame.renderData) {
				return outputFrame.renderData.dirty;
			}
		}
		return true;
	};

	markDirtyFrame(frameIndex) {
		let frameData = outputTimeline.getFrame(frameIndex);
		if (frameData.renderData) {
			frameData.renderData.dirty = true;
		}
		else {
			frameData.renderData = {
				dirty: true
			};
		}
	}

	async markDirtyFrames() {
		let frameCount = Math.min(this.getFrameCount(), outputTimeline.getFrameCount());
		for (let frameIndex = 0; frameIndex < frameCount; frameIndex++) {
			let dirty = await this.calculateIfFrameIsDirty(frameIndex);
			if (dirty) {
				this.markDirtyFrame(frameIndex);
			}
		}
		this.element.children.ruler.markDirty(true);
		this.requestRefresh();
	}

	async getPriorFrameContentForFrame(frameIndex) {
		let priorFrameCount = outputTimeline.getFrameCount();
		if(frameIndex <= 0) {
			return await NavigatorServer.getSpiral();
		}
		else if (frameIndex - 1 < priorFrameCount) {
			// previous frame is available in timeline
			return outputTimeline.getFrame(frameIndex - 1).content;
		}
		else {
			// otherwise start with a spiral pose
			return await NavigatorServer.getSpiral();
		}
	}
	
	async getObjectivesForFrame(frameIndex, dontApplyGenerators, priorFrameContent) {
		let objectives = this.tracks.map(track => InputTimelineUtils.calculateTrackFrame(track, frameIndex));

		// clone copy
		objectives = JSON.parse(JSON.stringify(objectives));

		if(!dontApplyGenerators) {
			if(!priorFrameContent) {
				priorFrameContent = await this.getPriorFrameContentForFrame(frameIndex);
			}
			objectives = await parseGenerators(objectives, priorFrameContent, frameIndex);
		}

		// Remove empty objects from top level
		objectives = objectives.filter(objective => Object.keys(objective).length != 0);
		
		return objectives;
	}

	/**
	 * This function uses the dirty cache
	 *
	 * @returns
	 * @memberof InputTimeline
	 */
	async getIndexOfFirstDirtyFrame() {
		let frameCount = this.getFrameCount();
		for (let i = 0; i < frameCount; i++) {
			let dirty = true;
			try {
				dirty = outputTimeline.getFrame(i).renderData.dirty;
			}
			catch {
				return i;
			}
			if(dirty) {
				return i;
			}
		}
		return frameCount;
	}

	/**
	 *
	 *
	 * @param {*} frameIndex
	 * @param {*} skipNonDirty
	 * @param {*} additionalObjectives These will not be stored in the renderData objectives
	 * @returns {bool} frameSkipped - Frame was skipped because it is non-dirty
	 * @memberof InputTimeline
	 */
	async renderAndStoreFrame(frameIndex, skipNonDirty, additionalObjectives, priorFrameContent) {
		if(!priorFrameContent) {
			priorFrameContent = await this.getPriorFrameContentForFrame(frameIndex);
		}

		// create objectives
		let objectives = await this.getObjectivesForFrame(frameIndex, false, priorFrameContent);

		// skip non dirty frames
		if (skipNonDirty) {
			if (!await this.calculateIfFrameIsDirty(frameIndex, objectives)) {
				return false;
			}
		}

		// call to the server
		let callStart = performance.now();
		let objectivesForCall = additionalObjectives ? [...objectives, ...additionalObjectives] : objectives;
		let frameContent = await NavigatorServer.optimise(priorFrameContent.pose
			, objectivesForCall
			, settingsNamespace.get(["optimisation", "preferences"]));
		let callEnd = performance.now();


		outputTimeline.setFrame(frameIndex, frameContent, "InputTimeline", {
			dirty: false,
			objectives: objectives,
			additionalObjectives: additionalObjectives,
			renderTime: (callEnd - callStart) / 1000,
			timestamp : new Date()
		});

		console.log(`Done rendering frame ${frameIndex} in ${outputTimeline.getFrame(frameIndex).renderData.renderTime} seconds.`);

		this.element.children.ruler.markDirty(true);
		this.requestRefresh();

		return true;
	}

	async renderOneFrame() {
		await this.renderAndStoreFrame(this.currentFrameIndex);
		this.requestRefresh();
	}

	async renderAllFrames() {
		for (let frameIndex = 0; frameIndex <= this.getFrameCount(); frameIndex++) {
			if (await this.renderAndStoreFrame(frameIndex, true)) {
				transport.skipToFrame(frameIndex);
			}
			else {
				// Frame was skipped
			}
		}
	}

	markDirtyFromHere() {
		let outputFrames = document.get("outputFrames").value();
		outputFrames.map((outputFrame, index) => {
			if (index >= this.currentFrameIndex) {
				this.markDirtyFrame(index);
			}
		});
		this.element.children.ruler.markDirty(true);
		this.requestRefresh();
	}

	save() {
		settingsNamespace.set(this.tracks, "tracks");
	}

	async import() {
		let result = rendererRouter.openDialog({
			properties: ['openFile'],
			filters: [
				{ name: 'Animation tracks', extensions: ['json'] }
			],
			message: "Import tracks from JSON file"
		});
		if(!result) {
			return;
		}
		let filename = result[0];
		let fileContents = fs.readFileSync(filename, {
			encoding: 'utf8'
		});
		let data = JSON.parse(fileContents);

		if(data) {
			this.tracks = data.tracks;
			outputTimeline.set(data.outputTimeline);
			this.element.markDirty(true);
			this.requestRefresh();
			this.markDirtyFrames(); // run this async detached
		}
	}

	export() {
		let result = rendererRouter.saveDialog({
			properties: ['saveFile'],
			filters: [
				{ name: 'Animation tracks', extensions: ['json'] }
			],
			message: "Export tracks as JSON file"
		});
		if(!result) {
			return;
		}
		let filename = result;

		let data = {
			tracks : this.tracks,
			outputTimeline : outputTimeline.get()
		};
		fs.writeFileSync(filename, JSON.stringify(data, null, 4), {
			encoding: 'utf8'
		});
	}

	async calculateForces() {
		let windProfile = settingsNamespace.get("windProfile");

		let promises = [];

		for(let i = this.visibleRangeStart; i < this.visibleRangeEnd; i++) {
			if(this.isFrameDirtyCached(i)) {
				continue;
			}

			let frameData = outputTimeline.getFrame(i);
			
			let call = async() => {
				let callStart = performance.now();
				frameData.content.forces = await NavigatorServer.calculateForces(frameData.content.pose, windProfile);
				let callEnd = performance.now();
	
				frameData.forcesRenderData = {
					renderTime : (callEnd - callStart) / 1000,
					windProfile : windProfile,
					timestamp : new Date()
				};
	
				outputTimeline.setFrameData(i, frameData);
	
				this.element.children.ruler.markDirty(true);
				this.requestRefresh();
			};

			// handle multiple at once
			promises.push(call());

			// when we get to 4 wait for them all to finish
			if(promises.length >= NavigatorServer.getMaxConcurrentRequests()) {
				for(let promise of promises) {
					await promise;
				}
				promises = [];
			}
		}

		for(let promise of promises) {
			await promise;
		}
	}

	async calculateObjectiveValues() {
		let pose = outputTimeline.getFrame(this.currentFrameIndex).content.pose;
		let objectives = this.getObjectivesForFrame(this.currentFrameIndex, false);

		console.log(JSON.stringify(InputTimelineUtils.getFramesToCalculate(0, 9, 8)));
		console.log(await NavigatorServer.calculateObjectiveValues(pose, objectives));

		// this needs to be completed
	}

	async fastRender() {
		let start = 0;
		let end = 97;
		let stride = 8;
		let maxIterations = 1000;

		let renderDependencies = {};

		const maxAcceleration = 0.1;
		const maxVelocity = 0.1;

		console.log("Starting fast render");
		let startTime = performance.now();

		// forward march
		for(let frameIndex = start; frameIndex < end; frameIndex += stride) {
			if(frameIndex - stride > 0) {
				if(frameIndex - stride * 2 > 0) {
					renderDependencies[frameIndex] = [frameIndex - stride, frameIndex - stride*2];
				}
				else {
					renderDependencies[frameIndex] = [frameIndex - stride];
				}
			}
		}

		// center filling
		for(let frameIndex = start; frameIndex < end; frameIndex += stride / 2) {
			if(!(frameIndex in renderDependencies)) {
				renderDependencies[frameIndex] = [frameIndex - stride / 2, frameIndex + stride / 2]
			}
		}

		for(let frameIndex = start; frameIndex < end; frameIndex += stride / 4) {
			if(!(frameIndex in renderDependencies)) {
				renderDependencies[frameIndex] = [frameIndex - stride / 4, frameIndex + stride / 4]
			}
		}

		for(let frameIndex = start; frameIndex < end; frameIndex += stride / 8) {
			if(!(frameIndex in renderDependencies)) {
				renderDependencies[frameIndex] = [frameIndex - stride / 8, frameIndex + stride / 8]
			}
		}

		renderDependencies[0] = [];
		renderDependencies[stride] = [0];

		let getDependencies = (frameIndex) => {
			let dependencies = new Set();
			for(let dependency of renderDependencies[frameIndex]) {
				// check if this is already fresh
				if(!this.isFrameDirtyCached(dependency)) {
					continue;
				}

				dependencies.add(dependency);

				let subDependencies = getDependencies(dependency);
				if(subDependencies.size != 0) {
					dependencies.add(...subDependencies);
				}
			}
			return dependencies;
		};

		// flatten dependencies
		let fullDependencies = {}
		for(let frameIndex = start; frameIndex < end; frameIndex += 1) {
			fullDependencies[frameIndex] = getDependencies(frameIndex); // make unique
		}

		// remove completed frames
		for(let frameIndexString in fullDependencies) {
			let frameIndex = parseInt(frameIndexString);
			if(!this.isFrameDirtyCached(frameIndex)) {
				delete fullDependencies[frameIndex];
			}
		}

		let rounds = [];

		for(let i=0; i<maxIterations; i++) {
			// find all frames with no dependencies
			let actions = [];
			let toRemove = [];

			for(let frameIndexString in fullDependencies) {
				let frameIndex = parseInt(frameIndexString);
				if(fullDependencies[frameIndex].size == 0) {
					actions.push({
						frameIndex : frameIndex,
						directDependencies : renderDependencies[frameIndex]
					});
					toRemove.push(frameIndex);
				}
			}


			toRemove.map(frameIndexString => {
				// remove myself
				delete fullDependencies[frameIndexString];

				let frameIndex = parseInt(frameIndexString);

				// tell all others that i'm done
				for(let otherFrameIndexString in fullDependencies) {
					let otherFrameIndex = parseInt(otherFrameIndexString);
					if(fullDependencies[otherFrameIndex].has(frameIndex)) {
						fullDependencies[otherFrameIndex].delete(frameIndex);
					}
				}
			})

			if(actions.length == 0) {
				break;
			}
			else {
				rounds.push(actions);
			}
		}

		let renderFrameCount = 0;
		for(let round of rounds) {
			console.log(`Rendering round [${round.map(action => action.frameIndex)}]`)
			
			let promises = round.map(action => {
				let additionalObjectives = []
				let priorPose = null;

				if(action.directDependencies.length == 1) {
					// limit forwards with 1 prior frame
					let tminus1Frame = outputTimeline.getFrame(action.directDependencies[0]).content;

					let tminus1 = tminus1Frame.shaftAngles;
					let stride = action.frameIndex - action.directDependencies[0];
					additionalObjectives.push({
						objective : {
							type : "LimitShaftAngleVelocityAndAccelerationForward",
							tminus1 : tminus1,
							tminus2 : tminus1,
							maxAcceleration : maxAcceleration,
							maxVelocity : maxVelocity,
							stride : stride
						},
						weight : 1
					});

					priorPose = tminus1Frame;
				}
				else if(action.directDependencies.length == 2) {
					let isCentral = action.directDependencies[1] > action.frameIndex;
					if(isCentral) {
						// central
						let stride = action.frameIndex - action.directDependencies[0];
						let tminus1Frame = outputTimeline.getFrame(action.directDependencies[0]).content;
						let tminus1 = tminus1Frame.shaftAngles;
						let tplus1 = outputTimeline.getFrame(action.directDependencies[1]).content.shaftAngles;

						additionalObjectives.push({
							objective : {
								type : "LimitShaftAngleVelocityAndAccelerationCentral",
								tminus1 : tminus1,
								tplus1 : tplus1,
								maxAcceleration : maxAcceleration,
								maxVelocity : maxVelocity,
								stride : stride
							},
							weight : 1
						});

						// HACK - remove for this one
						return false;

						priorPose = tminus1Frame;
					}
					else {
						// forward
						let stride = action.frameIndex - action.directDependencies[1];
						let tminus1Frame = outputTimeline.getFrame(action.directDependencies[1]).content;
						let tminus1 = tminus1Frame.shaftAngles;
						let tminus2 = outputTimeline.getFrame(action.directDependencies[0]).content.shaftAngles;

						additionalObjectives.push({
							objective : {
								type : "LimitShaftAngleVelocityAndAccelerationForward",
								tminus1 : tminus1,
								tminus1 : tminus2,
								maxAcceleration : maxAcceleration,
								maxVelocity : maxVelocity,
								stride : stride
							},
							weight : 1
						});

						priorPose = tminus1Frame;
					}
				}

				return this.renderAndStoreFrame(action.frameIndex, true, additionalObjectives, priorPose);
			});

			for(let promise of promises) {
				renderFrameCount++;
				await promise;
			}
			this.requestRefresh();
		}

		let totalTime = (performance.now() - startTime) / 1000;
		console.log(`Renderered ${renderFrameCount} frames in ${totalTime}s`)
	}
}

export { InputTimeline }