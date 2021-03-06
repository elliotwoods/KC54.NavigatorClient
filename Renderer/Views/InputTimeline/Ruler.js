import { Element } from './Element.js'
import { SettingsNamespace } from '../../Database.js'
import { outputTimeline } from '../../Data/outputTimeline.js'

let settingsNamespace = new SettingsNamespace(["Views", "InputTimeline"]);

class Ruler extends Element {
	constructor(parent) {
		super(parent.draw.nested());
		this.parent = parent;

		let layout = settingsNamespace.get("layout");

		this.draw.x(layout.trackCaptionAreaWidth);

		// Background (for events)
		this.children.background = new Element(this.draw.group()
		, (element) => {
			element.draggingCursor = false;
			element.background = element.draw.rect(100, layout.frameNumbersAreaHeight)
				.attr({
					fill : layout.backgroundColor
				});
			//apply mouse event to the element's draw group
			element.draw.mousedown((args) => {
				element.draggingCursor = true;
				args.preventDefault();
				let newFrameIndex = Math.floor(this.parent.pixelToFrameIndex(args.offsetX - layout.trackCaptionAreaWidth));
				this.parent.setFrameIndex(newFrameIndex);

				this.mouseDragStart = {
					x : args.pageX,
					y : args.pageY,
					frameIndex : newFrameIndex,
					target : element
				};
			});
		}
		, (element) => {
			element.background.width(this.viewWidth - layout.trackCaptionAreaWidth);
		}
		, true);

		// Fresh frame indicator
		this.children.background.children.freshFrameIndicator = new Element(this.children.background.draw.group()
		, null
		, (element) => {
			element.draw.clear();

			let outputFrameCount = outputTimeline.getFrameCount();

			for(let i=this.parent.visibleRangeStart; i<=this.parent.visibleRangeEnd; i+= 1) {
				if(i < outputFrameCount) {
					let dirty = this.parent.isFrameDirtyCached(i);
					
					if(!dirty) {
						// frame isn't dirty
						element.draw.rect(parent.pixelsPerFrame, layout.frameNumbersAreaHeight)
							.x(this.parent.frameIndexToPixel(i))
							.attr({
								fill : layout.freshFramesColor
							});
					}
				}
			}
		}, true);

		// Forces indicator
		this.children.background.children.forcesIndicator = new Element(this.children.background.draw.group()
		, null
		, (element) => {
			element.draw.clear();

			let outputFrameCount = outputTimeline.getFrameCount();

			for(let i=this.parent.visibleRangeStart; i<=this.parent.visibleRangeEnd; i+= 1) {
				if(i < outputFrameCount) {
					let outputFrame = outputTimeline.getFrame(i);
					if(outputFrame.content.forces) {
						// frame has forces
						element.draw.rect(parent.pixelsPerFrame, layout.ruler.forcesArea.height)
							.move(this.parent.frameIndexToPixel(i), layout.frameNumbersAreaHeight - layout.ruler.forcesArea.height)
							.attr({
								'fill' : layout.ruler.forcesArea.fillColor
							});
					}
				}
			}
		}, true);

		// Frame labels
		this.children.frameLabels = new Element(this.draw.group()
		, null
		, (element) => {
			element.draw.clear();
			let markedFrames = [];

			let markFrame = (index) => {
				element.draw.text(index.toString())
					.font({
						size : 10
					})
					.center(this.parent.frameIndexToPixel(index) + this.parent.pixelsPerFrame / 2, layout.frameNumbersAreaHeight / 2);
				markedFrames.push(index);
			};

			let nearest10 = Math.ceil(this.parent.visibleRangeStart / 10) * 10;
			for(let i=nearest10; i<=this.parent.visibleRangeEnd; i+= 10) {
				markFrame(i);
			}
			if(!markedFrames.includes(this.visibleRangeStart)) {
				markFrame(this.parent.visibleRangeStart);
			}
			if(!markedFrames.includes(this.visibleRangeEnd)) {
				markFrame(this.parent.visibleRangeEnd);
			}
		}
		, true);

		// Ticks
		this.children.ticks = new Element(this.draw.group()
		, null
		, (element) => {
			// redraw all frame ticks
			element.draw.clear();
			for(let i=this.parent.visibleRangeStart; i<=this.parent.visibleRangeEnd; i+= 1) {
				element.draw.line(0, layout.frameNumbersAreaHeight - layout.frameTicks.height, 0, layout.frameNumbersAreaHeight)
					.stroke({width : 1, color : layout.frameTicks.color})
					.x(this.parent.frameIndexToPixel(i));
			}
		}
		, true);

		// Current frame cursor
		this.children.frameCursor = new Element(this.draw.group()
		, (element) => {
			element.rectangle = element.draw.rect(this.parent.pixelsPerFrame, layout.frameNumbersAreaHeight)
				.attr({
					'fill': 'none',
					'stroke' : layout.frameCursor.color,
					'stroke-width' : 0.5
				});
		}
		, (element) => {
			element.rectangle
				.width(this.parent.pixelsPerFrame)
				.x(this.parent.frameIndexToPixel(this.parent.currentFrameIndex));
		}
		, true);

		// mouse drag (this should be moved to a universal / handled by Element)
		this.mouseDragStart = null;
		$(window).mouseup((args) => {
			this.mouseDragStart = null;
		});
		$(window).mousemove((args) => {
			if(!this.mouseDragStart) {
				return;
			}

			switch(this.mouseDragStart.target) {
			case this.children.background:
				let frameIndex = this.mouseDragStart.frameIndex + (args.pageX - this.mouseDragStart.x) / parent.pixelsPerFrame;
				if(frameIndex < 0) {
					frameIndex = 0;
				}
				this.parent.setFrameIndex(frameIndex);
				break;
			default:
			}
		});
	}
}

export { Ruler }