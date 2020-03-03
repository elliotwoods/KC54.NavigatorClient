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

const shortid = require('shortid');
const fastEqual = require('fast-deep-equal');

let settingsNamespace = new SettingsNamespace(["Views", "InputTimeline"]);
let inspectableSettings = new InspectableSettings(settingsNamespace)
let layout = settingsNamespace.get("layout");

// set some defaults for testing
settingsNamespace.defaults(
{
	"layout": {
		trackCaptionAreaWidth: 150,
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
				height : 5,
				fillColor : '#ccc'
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
	},
	"syncToOutputFrameIndex" : false
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

		this.viewDataInspectable = new Inspectable(() => {
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
			viewResult : {
				do : () => {
					this.viewDataInspectable.toggleInspect();
					this.requestRefresh();
				},
				isDown : () => this.viewDataInspectable.isBeingInspected(),
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
			}
		};

		this.element = new Element(this);

		ErrorHandler.do(() => {
			this.build();
		});

		this.container.on("resize", () => {
			this.resize();
		});

		rendererRouter.onChange('inspectTargetChange', () => {
			this.requestRefresh();
		});
		rendererRouter.onChange('outputTimeline', async () => {
			await this.markDirtyFrames();
			this.element.children.ruler.children.background.markDirty();
			this.requestRefresh();
		});
		rendererRouter.onChange('outputFrame', () => {
			if (this.syncToOutputFrameIndex) {
				this.setFrameIndex(transport.getCurrentFrameIndex());
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
		if(this.refreshQueued) {
			return;
		}

		// wait a little
		this.refreshQueued = true;
		setTimeout(() => {
			this.refreshQueued = false;
			this.refresh();
		}, 20)
	}

	async refresh() {
		await this.markDirtyFrames();

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
			this.cachedOutputValuesForThisFrame = await this.getObjectivesForFrame(this.currentFrameIndex);
		}
		catch(error) {
			console.error(error);
			this.cachedOutputValuesForThisFrame = undefined;
		}
		this.viewDataInspectable.notifyValueChange();
	}

	validateFrameIndex(frameIndex) {
		frameIndex = Math.floor(frameIndex);
		if (frameIndex < 0) {
			frameIndex = this.getFrameCount() - 1;
		}
		if (frameIndex >= this.getFrameCount()) {
			frameIndex = 0;
		}

		// also we need to clamp to max, but we dont have this yet
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
		let selectedTrack = this.getSelectedTrack();
		if (!selectedTrack) {
			throw (new Error("No track selected"));
		}

		let keyFrame = {
			frameIndex: this.currentFrameIndex,
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

	async isFrameDirty(frameIndex, newObjectives) {
		// we don't have this frame yet
		if (frameIndex >= outputTimeline.getFrameCount()) {
			return true;
		}

		let frameData = outputTimeline.getFrame(frameIndex);
		if (!frameData) {
			return true;
		}

		let renderData = frameData.renderData;
		if (!renderData) {
			return true;
		}

		if (renderData.dirty) {
			return true;
		}

		if(!newObjectives) {
			newObjectives = await this.getObjectivesForFrame(frameIndex);
		}

		if (!fastEqual(renderData.objectives, newObjectives)) {
			return true;
		}

		return false;
	}

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
		let frameCount = this.getFrameCount();
		for (let frameIndex = 0; frameIndex < frameCount; frameIndex++) {
			let dirty = await this.isFrameDirty(frameIndex);
			if (dirty) {
				this.markDirtyFrame(frameIndex);
			}
		}
	}

	async getPriorPoseForFrame(frameIndex) {
		let priorFrameCount = outputTimeline.getFrameCount();
		if (frameIndex <= 0 && priorFrameCount > 0) {
			return outputTimeline.getFrame(0).content.configuration;
		}
		else if (frameIndex - 1 < priorFrameCount) {
			// previous frame is available in timeline
			return outputTimeline.getLastFrame().content.configuration;
		}
		else {
			// otherwise start with a spiral pose
			return await NavigatorServer.getSpiralPose();
		}
	}
	
	async getObjectivesForFrame(frameIndex) {
		let objectives = this.tracks.map(track => InputTimelineUtils.calculateTrackFrame(track, frameIndex));
		
		// clone copy
		objectives = JSON.parse(JSON.stringify(objectives));

		let priorPose = await this.getPriorPoseForFrame(frameIndex);
		await parseGenerators(objectives, priorPose);
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
	 * @returns {bool} frameSkipped - Frame was skipped because it is non-dirty
	 * @memberof InputTimeline
	 */
	async renderAndStoreFrame(frameIndex, skipNonDirty) {
		// select a prior pose
		let priorPose = await this.getPriorPoseForFrame(frameIndex);

		// create objectives
		let objectives = await this.getObjectivesForFrame(frameIndex);

		// skip non dirty frames
		if (skipNonDirty) {
			if (!await this.isFrameDirty(frameIndex, objectives)) {
				return false;
			}
		}
		
		// inject prior pose as a PreferBeamAngles
		let objectivesWithPriorPose = [...objectives];
		{
			if(!priorPose) {
				priorPose = await this.getPriorPoseForFrame(frameIndex);
			}

			if(settingsNamespace.get(["optimisation", "preferBeamAngles", "prior"])) {
				let preferBeamAnglesObjective = {
					objective : {
						type : "PreferBeamAngles",
						desiredAngles : {}
					},
					weight : settingsNamespace.get(["optimisation", "preferBeamAngles", "weight"])
				}
				for(let i = 0; i<priorPose.length; i++) {
					preferBeamAnglesObjective.objective.desiredAngles[i] = priorPose[i].angleToX
				}
				objectivesWithPriorPose.push(preferBeamAnglesObjective);
			}
		}
		
		// call to the server
		let callStart = performance.now();
		let pose = await NavigatorServer.optimise(priorPose, objectivesWithPriorPose);
		let callEnd = performance.now();
		outputTimeline.setFrame(frameIndex, pose, "InputTimeline", {
			dirty: false,
			objectives: objectives,
			renderTime: (callEnd - callStart) / 1000,
			timestamp : new Date()
		});

		console.log(`Done rendering frame ${frameIndex} in ${outputTimeline.getFrame(frameIndex).renderData.renderTime} seconds.`);
		this.requestRefresh();

		return true;
	}

	async renderOneFrame() {
		await this.renderAndStoreFrame(this.currentFrameIndex);
		this.requestRefresh();
	}

	async renderAllFrames() {
		for (let frameIndex = 0; frameIndex < this.getFrameCount(); frameIndex++) {
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
		this.element.children.ruler.children.background.markDirty();
		this.requestRefresh();
	}

	save() {
		settingsNamespace.set(this.tracks, "tracks");
	}

	async calculateForces() {
		let freshFrameCount = await this.getIndexOfFirstDirtyFrame();
		for(let i = 0; i<freshFrameCount; i++) {
			let outputFrame = outputTimeline.getFrame(i);
			
			let callStart = performance.now();
			outputFrame.forces = await NavigatorServer.calculateForces(outputFrame.configuration);
			let callEnd = performance.now();

			outputFrame.forcesRenderData = {
				renderTime : (callEnd - callStart) / 1000,
				windProfile : windProfile,
				timestamp : new Date()
			};

			this.element.children.ruler.markDirty(true);
			this.requestRefresh();
		}
	}
}

export { InputTimeline }