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
		this.container.getElement().append(this.scrollDiv);
		this.draw = SVG().addTo(this.scrollDiv[0]);

		this.zoomLevel = 1;
		this.visibleRangeStart = 0;
		this.visibleRangeEnd = 99;
		this.currentFrameIndex = 0;
		
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

	frameIndexToPixel(frameIndex) {
		return (frameIndex - this.visibleRangeStart) * this.pixelsPerFrame;
	}

	pixelToFrameIndex(pixel) {
		return (pixel / this.pixelsPerFrame) + this.visibleRangeStart;
	}

	build() {
		this.draw.clear();

		this.tracks = settingsNamespace.get("tracks");

		this.element.children.ruler = new Ruler(this);
		this.element.children.trackHeaders = new TrackHeaders(this);
		this.element.children.keyFrames = new KeyFrames(this);
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
		this.element.children.ruler.children.currentFrame.dirty = true;
		this.refresh();
	}
}

export { InputTimeline }