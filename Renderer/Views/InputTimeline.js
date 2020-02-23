import { Base } from './Base.js'
import { SVG } from '../../node_modules/@svgdotjs/svg.js/dist/svg.esm.js'
import { document, SettingsNamespace } from '../Database.js'
import { rendererRouter } from '../rendererRouter.js';
import { ErrorHandler } from '../Utils/ErrorHandler.js'

import { layout } from './InputTimeline/layout.js'
import { Element } from './InputTimeline/Element.js'
import { Ruler } from './InputTimeline/Ruler.js'
import { TrackHeaders } from './InputTimeline/TrackHeaders.js'
import { KeyFrames } from './InputTimeline/KeyFrames.js'
import { GuiUtils } from '../Utils/GuiUtils.js';
import { InputTimelineUtils } from '../Utils/InputTimelineUtils.js';

const shortid = require('shortid');

let settingsNamespace = new SettingsNamespace(["Views", "InputTimeline"]);


// override with set whilst editing


// set some defaults for testing
settingsNamespace.set("tracks", [
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
		this.scrollDiv = $(`<div class="scrollContainerX" />`);

		this.toolBar = $(`<div class="toolBar"/>`);
		this.scrollDiv.append(this.toolBar);

		this.container.getElement().append(this.scrollDiv);
		this.draw = SVG().addTo(this.scrollDiv[0]);

		this.zoomLevel = 1;
		this.visibleRangeStart = 0;
		this.visibleRangeEnd = 99;
		this.currentFrameIndex = 0;
		
		this.actions = {
			newKeyFrame : {
				do : () => {
					this.insertKeyFrame();
				},
				isEnabled : () => this.getSelectedTrack() != null,
				buttonPreferences : {
					icon : "fas fa-circle"
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
		ErrorHandler.do(() => {
			this.resize();
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
			let button = GuiUtils.makeButton(GuiUtils.camelCapsToLong(actionName), action.buttonPreferences);
			button.click(() => {
				ErrorHandler.do(() => {
					action.do();
				});
			});
			button.prop("disabled", !action.isEnabled());
			action.button = button;
			this.toolBar.append(button);
		}
		rendererRouter.onChange('inspectTargetChange', () => {
			// When the selection changes, update states of buttons
			for(let actionName in this.actions) {
				let action = this.actions[actionName];
				action.button.prop("disabled", !action.isEnabled());
			}
		});
	}

	frameIndexToPixel(frameIndex) {
		return (frameIndex - this.visibleRangeStart) * this.pixelsPerFrame;
	}

	pixelToFrameIndex(pixel) {
		return (pixel / this.pixelsPerFrame) + this.visibleRangeStart;
	}

	resize() {
		let width = this.scrollDiv.width();
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
		this.element.refresh();
	}

	setFrameIndex(frameIndex) {
		this.currentFrameIndex = Math.floor(frameIndex);
		this.element.children.ruler.children.frameCursor.dirty = true;
		this.element.children.keyFrames.children.frameCursor.dirty = true;
		this.refresh();
		
		// Announce to inspsector that rendered values might have changed
		for(let trackID in this.element.children.trackHeaders.inspectables) {
			this.element.children.trackHeaders.inspectables[trackID].notifyValueChange();
		}
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
		this.element.children.keyFrames.children.tracks.dirty = true;
		this.refresh();

		// select this keyFrame
		this.element.children.keyFrames.inspectables[keyFrame.id].inspect();
		return keyFrame;
	}
}

export { InputTimeline }