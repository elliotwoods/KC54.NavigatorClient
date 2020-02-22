import { Base } from './Base.js'
import { SVG } from '../../node_modules/@svgdotjs/svg.js/dist/svg.esm.js'
import { document, SettingsNamespace } from '../Database.js'
import { rendererRouter } from '../rendererRouter.js';

const shortid = require('shortid');

let settingsNamespace = new SettingsNamespace(["Views", "InputTimeline"]);

// override with set whilst editing
let viewLayout = settingsNamespace.set("viewLayout", {
	trackCaptionAreaWidth : 100,
	trackHeight : 30,
	frameNumbersAreaHeight : 30,
	keyFrameSize : 8,
	frameTicks : {
		height : 5,
		color : '#aaa'
	}
});
viewLayout = settingsNamespace.get("viewLayout");

// set some defaults for testing
settingsNamespace.set("tracks", [
	{
		name : "Track 1",
		id : shortid.generate(),
		keyframes : [
			{
				frameIndex : 0,
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
	},
	{
		name : "Track 2",
		id : shortid.generate(),
		keyframes : [
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

		this.container.on("resize", () => {
			this.tryRefresh();
		});
		this.tryRefresh();
	}

	refresh() {
		let width = this.scrollDiv.width();
		if(width == 0) {
			return;
		}

		this.draw.width(width);

		this.draw.clear();
		
		let tracks = settingsNamespace.get("tracks");

		// frame pixels
		let pixelsPerFrame = (width - viewLayout.trackCaptionAreaWidth) / (this.visibleRangeEnd  + 1 - this.visibleRangeStart);
		let frameIndexToPixel = (frameIndex) => {
			return (frameIndex - this.visibleRangeStart) * pixelsPerFrame;
		};
		let trackAreaHeight = tracks.length * viewLayout.trackHeight;

		// Track names area
		{
			let trackNamesGroup = this.draw.nested();
			trackNamesGroup.y(viewLayout.frameNumbersAreaHeight);
			let y = 0;
			for(let track of tracks) {
				{
					trackNamesGroup.text(track.name)
						.move(10, y);
				}
				y += viewLayout.trackHeight;
			}
		}

		// Frame numbers area
		{
			let frameNumbersGroup = this.draw.nested();
			frameNumbersGroup.x(viewLayout.trackCaptionAreaWidth);

			// labels
			{
				let markedFrames = [];

				let markFrame = (index) => {
					frameNumbersGroup.text(index.toString())
						.font({
							size : 10
						})
						.center(frameIndexToPixel(index) + pixelsPerFrame / 2, viewLayout.frameNumbersAreaHeight / 2);
					markedFrames.push(index);
				};

				let nearest10 = Math.ceil(this.visibleRangeStart / 10) * 10;
				for(let i=nearest10; i<=this.visibleRangeEnd; i+= 10) {
					markFrame(i);
				}
				if(!markedFrames.includes(this.visibleRangeStart)) {
					markFrame(this.visibleRangeStart);
				}
				if(!markedFrames.includes(this.visibleRangeEnd)) {
					markFrame(this.visibleRangeEnd);
				}
			}

			// current frame
			frameNumbersGroup.rect(pixelsPerFrame, viewLayout.frameNumbersAreaHeight)
				.x(frameIndexToPixel(this.currentFrameIndex))
				.attr({
					'fill': 'none',
					'stroke' : '#000',
					'stroke-width' : 0.5
				});

			// ticks
			{
				let frameTicks = frameNumbersGroup.group();
				for(let i=this.visibleRangeStart; i<=this.visibleRangeEnd; i+= 1) {
					frameTicks.line(0, viewLayout.frameNumbersAreaHeight - viewLayout.frameTicks.height, 0, viewLayout.frameNumbersAreaHeight)
						.stroke({width : 1, color : viewLayout.frameTicks.color})
						.x(frameIndexToPixel(i));
				}
			}
				
		}

		// Keyframes area
		{
			let keyFramesGroup = this.draw.nested();
			keyFramesGroup.move(viewLayout.trackCaptionAreaWidth, viewLayout.frameNumbersAreaHeight);

			// define the keyFrame symbol
			let keyFrameSymbol = keyFramesGroup.symbol();
			{
				let s = viewLayout.keyFrameSize / 2;
				keyFrameSymbol.polygon(`${-s},0 0,${s} ${s},0 0,${-s}`).center(pixelsPerFrame / 2, viewLayout.trackHeight / 2)
			}

			// background
			keyFramesGroup.rect(width - viewLayout.trackCaptionAreaWidth, trackAreaHeight)
				.attr({
					'fill' : '#ccc'
				});

			// tracks
			{
				let y = 0;
				for(let track of tracks) {
					if(track.keyframes.length == 0) {
						continue;
					}

					let trackGroup = keyFramesGroup.nested().y(y);
					// draw the frame backgrounds
					for(let keyFrameIndex = 0; keyFrameIndex < track.keyframes.length; keyFrameIndex++) {
						let keyFrame = track.keyframes[keyFrameIndex];
						let nextKeyFrame;
						if(keyFrameIndex + 1 < track.keyframes.length) {
							nextKeyFrame = track.keyframes[keyFrameIndex + 1];
						}
						else {
							nextKeyFrame = keyFrame;
						}

						// skip drawing anything completely outside the visible range
						if(keyFrame.frameIndex < this.visibleRangeStart && nextKeyFrame.frameIndex < this.visibleRangeStart) {
							continue;
						}
						if(keyFrame.frameIndex > this.visibleRangeEnd && nextKeyFrame.frameIndex > this.visibleRangeEnd) {
							continue;
						}

						trackGroup.rect(frameIndexToPixel(nextKeyFrame.frameIndex + 1), viewLayout.trackHeight)
							.move(frameIndexToPixel(keyFrame.frameIndex), 0)
							.attr({
								'fill': '#fff',
								'stroke' : '#000',
								'stroke-width' : 0.5
							});
					}

					// draw the frames
					for(let keyFrame of track.keyframes) {
						if(keyFrame.frameIndex < this.visibleRangeStart || keyFrame.frameIndex > this.visibleRangeEnd) {
							continue;
						}

						trackGroup.use(keyFrameSymbol).x(frameIndexToPixel(keyFrame.frameIndex));
					}

					y += viewLayout.trackHeight;
				}
			}
		}
	}
}

export { InputTimeline }