import { Base } from './Base.js'
import { SVG } from '../../node_modules/@svgdotjs/svg.js/dist/svg.esm.js'
import { document, SettingsNamespace, settings } from '../Database.js'
import { rendererRouter } from '../rendererRouter.js';
import { ErrorHandler } from '../Utils/ErrorHandler.js'

import { layout } from './InputTimeline/layout.js'
import { Element } from './InputTimeline/Element.js'
import { Ruler } from './InputTimeline/Ruler.js'
import { TrackHeaders } from './InputTimeline/TrackHeaders.js'
import { KeyFrames } from './InputTimeline/KeyFrames.js'
import { GuiUtils } from '../Utils/GuiUtils.js';
import { InputTimelineUtils } from '../Utils/InputTimelineUtils.js';
import { outputTimeline } from '../Data/outputTimeline.js'
import { NavigatorServer } from '../Utils/NavigatorServer.js';
import { transport } from '../Data/transport.js'

const shortid = require('shortid');
const fastEqual = require('fast-deep-equal');

let settingsNamespace = new SettingsNamespace(["Views", "InputTimeline"]);


// override with set whilst editing


// set some defaults for testing
settingsNamespace.get("tracks", [
	{
		name : "Track 1",
		id : shortid.generate(),
		keyFrames : [
			{
				frameIndex : 0,
				id : shortid.generate(),
				content : {
					value : 0,
					constant : 1
				}
			},
			{
				frameIndex : 50,
				id : shortid.generate(),
				content : {
					value : 0.5
				}
			},
			{
				frameIndex : 99,
				id : shortid.generate(),
				content : {
					value : 1
				}
			}
		]
	},
	{
		name : "Track 2",
		id : shortid.generate(),
		keyFrames : [
			{
				frameIndex : 50,
				id : shortid.generate(),
				content : {
					value : 0
				}
			},
			{
				frameIndex : 99,
				id : shortid.generate(),
				content : {
					value : 1
				}
			}
		]
	}
]);

class InputTimeline extends Base {
	constructor(container, state) {
		super(container, state);
		this.container = container;
		this.state = state;

		this.init();
	}

	init() {
		this.scrollDiv = $(`<div class="scrollContainerY" />`);

		this.toolBar = $(`<div class="toolBar"/>`);
		this.scrollDiv.append(this.toolBar);

		this.container.getElement().append(this.scrollDiv);
		this.draw = SVG().addTo(this.scrollDiv[0]);

		this.zoomLevel = 1;
		this.visibleRangeStart = 0;
		this.visibleRangeEnd = 99;
		this.currentFrameIndex = 0;

		this.syncToOutputFrameIndex = settingsNamespace.get("syncToOutputFrameIndex");

		this.actions = {
			addTrack : {
				do : () => {
					this.addTrack();
				},
				buttonPreferences : {
					icon : "fas fa-plus"
				}
			},
			removeTrack : {
				do : () => {
					this.removeTrack();
				},
				isEnabled : () => this.getSelectedTrack() != null,
				buttonPreferences : {
					icon : "fas fa-minus"
				}
			},
			newKeyFrame : {
				do : () => {
					this.insertKeyFrame();
				},
				isEnabled : () => this.getSelectedTrack() != null,
				buttonPreferences : {
					icon : "fas fa-circle"
				}
			},
			deleteKeyFrame : {
				do : () => {
					this.deleteKeyFrame();
				},
				isEnabled : () => this.getSelectedKeyframe() != null,
				buttonPreferences : {
					icon : "fas fa-times"
				}
			},
			renderOneFrame : {
				do : async () => { 
					await this.renderOneFrame();
				},
				buttonPreferences : {
					icon : "fas fa-walking"
				}
			},
			renderAllFrames : {
				do : async () => { 
					await this.renderAllFrames();
				},
				buttonPreferences : {
					icon : "fas fa-running"
				}
			},
			markDirtyFromHere : {
				do : () => {
					this.markDirtyFromHere();
				},
				buttonPreferences : {
					icon : "fas fa-toilet-paper"
				}
			},
			save : {
				do : () => { 
					this.save();
				},
				buttonPreferences : {
					icon : "fas fa-save"
				}
			},
			syncToOutputFrameIndex : {
				do : () => {
					this.syncToOutputFrameIndex = !this.syncToOutputFrameIndex;
					if(this.syncToOutputFrameIndex) {
						transport.skipToFrame(this.currentFrameIndex);
					}
					settingsNamespace.set("syncToOutputFrameIndex", this.syncToOutputFrameIndex);
					this.refresh();
				},
				isDown : () => this.syncToOutputFrameIndex,
				buttonPreferences : {
					icon : "fas fa-sync"
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
			this.refresh();
		});
		rendererRouter.onChange('outputTimeline', () => {
			this.markDirtyFrames();
			this.element.children.ruler.children.background.markDirty();
			this.refresh();
		});
		rendererRouter.onChange('outputFrame', () => {
			if(this.syncToOutputFrameIndex) {
				this.setFrameIndex(transport.getCurrentFrameIndex());
			}
		});
	}

	build() {
		this.draw.clear();

		this.tracks = settingsNamespace.get("tracks");
		
		this.element.children.ruler = new Ruler(this);
		this.element.children.trackHeaders = new TrackHeaders(this);
		this.element.children.keyFrames = new KeyFrames(this);

		//actions
		for(let actionName in this.actions) {
			let action = this.actions[actionName];
			let button = GuiUtils.makeButton(GuiUtils.camelCapsToLong(actionName), action.buttonPreferences, async () => {
				await action.do();
			});
			action.button = button;
			this.toolBar.append(button);
		}
	}

	frameIndexToPixel(frameIndex) {
		return (frameIndex - this.visibleRangeStart) * this.pixelsPerFrame;
	}

	pixelToFrameIndex(pixel, ignoreCaptionArea = true) {
		if(!ignoreCaptionArea) {
			pixel -= layout.trackCaptionAreaWidth;
		}
		return (pixel / this.pixelsPerFrame) + this.visibleRangeStart;
	}

	getFrameCount() {
		return Math.max.apply(null, this.tracks.map(track => track.keyFrames[track.keyFrames.length - 1].frameIndex + 1));
	}

	resize() {
		let width = this.scrollDiv.width() - 30;
		if(width == 0) {
			return;
		}

		this.pixelsPerFrame = (width - layout.trackCaptionAreaWidth) / (this.visibleRangeEnd + 1 - this.visibleRangeStart);
		this.element.resize(width);
		this.draw.width(width);

		ErrorHandler.do(() => {
			this.refresh();
		});
	}

	refresh() {
		this.markDirtyFrames();

		this.element.refresh();

		// When the selection changes, update states of buttons
		for(let actionName in this.actions) {
			let action = this.actions[actionName];

			if(action.isEnabled) {
				if(action.button.hasClass("btn-waiting")) {
					// don't update the state
				}
				else {
					let actionEnabled = action.isEnabled();
					action.button.prop("disabled", !actionEnabled);
				}
			}

			if(action.isDown) {
				if(action.isDown()) {
					action.button.addClass("btn-toggle-active");
				}
				else {
					action.button.removeClass("btn-toggle-active");
				}
			}
		}
	}

	validateFrameIndex(frameIndex) {
		frameIndex = Math.floor(frameIndex);
		if(frameIndex < 0) {
			frameIndex = 0;
		}
		if(frameIndex >= this.getFrameCount()) {
			frameIndex = this.getFrameCount() - 1;
		}

		// also we need to clamp to max, but we dont have this yet
		return frameIndex;
	}

	setFrameIndex(frameIndex) {
		if(this.currentFrameIndex == frameIndex) {
			return;
		}

		this.currentFrameIndex = this.validateFrameIndex(frameIndex);
		
		this.element.children.ruler.children.frameCursor.dirty = true;
		this.element.children.keyFrames.children.frameCursor.dirty = true;
		this.refresh();
		
		// Announce to inspsector that rendered values might have changed
		for(let trackID in this.element.children.trackHeaders.inspectables) {
			this.element.children.trackHeaders.inspectables[trackID].notifyValueChange();
		}

		if(this.syncToOutputFrameIndex) {
			transport.skipToFrame(this.currentFrameIndex);
		}
	}

	addTrack() {
		this.tracks.push({
			name : "New track",
			id : shortid.generate(),
			keyFrames : []
		});
		this.element.children.trackHeaders.markDirty(true);
		this.element.children.keyFrames.markDirty(true);
		this.refresh();
	}

	removeTrack() {
		this.tracks = this.tracks.filter(track => track.id != this.getSelectedTrack().id);
		this.element.children.trackHeaders.markDirty(true);
		this.element.children.keyFrames.markDirty(true);
		this.refresh();
	}

	getSelectedTrack() {
		for(let trackID in this.element.children.trackHeaders.inspectables) {
			let inspectable = this.element.children.trackHeaders.inspectables[trackID];
			if(inspectable.isBeingInspected()) {
				return inspectable.track;
			}
		}
		for(let keyFrameID in this.element.children.keyFrames.inspectables) {
			let inspectable = this.element.children.keyFrames.inspectables[keyFrameID];
			if(inspectable.isBeingInspected()) {
				return inspectable.track;
			}
		}

		return null;
	}

	getSelectedKeyframe() {
		for(let keyFrameID in this.element.children.keyFrames.inspectables) {
			let inspectable = this.element.children.keyFrames.inspectables[keyFrameID];
			if(inspectable.isBeingInspected()) {
				return inspectable.keyFrame;
			}
		}

		return null;
	}

	timelineDataChange() {
		this.markDirtyFrames();
		this.element.children.keyFrames.markDirty(true);
		this.element.children.trackHeaders.markDirty(true);
		this.element.children.ruler.markDirty(true);
		this.refresh();
	}

	insertKeyFrame() {
		let selectedTrack = this.getSelectedTrack();
		if(!selectedTrack) {
			throw(new Error("No track selected"));
		}

		let keyFrame = {
			frameIndex : this.currentFrameIndex,
			id : shortid.generate(),
			content : {}
		};

		selectedTrack.keyFrames.push(keyFrame);
		InputTimelineUtils.sortKeyFrames(selectedTrack);

		// refresh the view (and the inspectables)
		this.timelineDataChange();

		// select this keyFrame
		this.element.children.keyFrames.inspectables[keyFrame.id].inspect();
		return keyFrame;
	}

	deleteKeyFrame() {
		let selectedKeyframe = this.getSelectedKeyframe();
		if(!selectedKeyframe) {
			throw(new Error("No key frame selected"));
		}
		
		let selectedTrack = this.getSelectedTrack();
		if(!selectedTrack) {
			throw(new Error("No track selected"));
		}

		// delete it
		selectedTrack.keyFrames = selectedTrack.keyFrames.filter(keyFrame => keyFrame.id != selectedKeyframe.id);

		// refresh the view (and the inspectables)
		this.timelineDataChange();
	}

	isFrameDirty(frameIndex, newObjectives) {
		// we don't have this frame yet
		if(frameIndex >= outputTimeline.getFrameCount()) {
			return true;
		}

		let frameData = outputTimeline.getFrame(frameIndex);
		if(!frameData) {
			return true;
		}

		let renderData = frameData.renderData;
		if(!renderData) {
			return true;
		}

		if(renderData.dirty) {
			return true;
		}

		if(newObjectives) {
			if(!fastEqual(renderData.objectives, newObjectives)) {
				return true;
			}
		}

		return false;
	}

	markDirtyFrame(frameIndex) {
		let frameData = outputTimeline.getFrame(frameIndex);
		if(frameData.renderData) {
			frameData.renderData.dirty = true;
		}
		else {
			frameData.renderData = {
				dirty : true
			};
		}
	}

	markDirtyFrames() {
		let frameCount= this.getFrameCount();
		for(let frameIndex=0; frameIndex<frameCount; frameIndex++) {
			let dirty = this.isFrameDirty(frameIndex);
			if(dirty) {
				this.markDirtyFrame(frameIndex);
			}
		}
	}

	getIndexOfFirstDirtyFrame() {
		let frameCount = this.getFrameCount();
		for(let i=0; i<frameCount; i++) {
			if(this.isFrameDirty(i)) {
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
		let priorFrameCount = outputTimeline.getFrameCount();

		// select a prior pose
		let priorPose;
		if(frameIndex <= 0 && priorFrameCount > 0) {
			priorPose = outputTimeline.getFrame(0).content.configuration;
		}
		else if(frameIndex - 1 < priorFrameCount) {
			// previous frame is available in timeline
			priorPose = outputTimeline.getLastFrame().content.configuration;
		}
		else {
			// otherwise start with a spiral pose
			priorPose = await NavigatorServer.getSpiralPose();
		}

		// create objectives
		let objectives = [];
		for(let track of this.tracks) {
			let objective = InputTimelineUtils.calculateTrackFrame(track, frameIndex);
			objectives.push(objective);
		}

		// skip non dirty frames
		if(skipNonDirty) {
			if(!this.isFrameDirty(frameIndex, objectives)) {
				return false;
			}
		}

		// call to the server
		let callStart = performance.now();
		let pose = await NavigatorServer.optimise(priorPose, objectives);
		let callEnd = performance.now();
		outputTimeline.setFrame(frameIndex, pose, "InputTimeline", {
			dirty : false,
			objectives : objectives,
			renderTime : (callEnd - callStart) / 1000
		});

		return true;
	}

	async renderOneFrame() {
		await this.renderAndStoreFrame(this.currentFrameIndex);
	}

	async renderAllFrames() {
		for(let frameIndex=0; frameIndex<this.getFrameCount(); frameIndex++) {
			console.log(`Rendering frame ${frameIndex}...`);
			if (await this.renderAndStoreFrame(frameIndex, true)) {
				transport.skipToFrame(frameIndex);
				console.log(`Done rendering frame ${frameIndex} in ${outputTimeline.getFrame(frameIndex).renderData.renderTime} seconds.`);
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
		this.refresh();
	}

	save() {
		settingsNamespace.set("tracks", this.tracks);
	}
}

export { InputTimeline }