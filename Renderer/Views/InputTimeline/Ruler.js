import { Element } from './Element.js'
import { layout } from './layout.js'

class Ruler extends Element {
	constructor(parent) {
		super(parent.draw.nested());
		this.parent = parent;

		this.draw.x(layout.trackCaptionAreaWidth);

		// Background (for events)
		this.children.background = new Element(this.draw.group()
		, (element) => {
			element.draggingCursor = false;
			element.rect = element.draw.rect(100, layout.frameNumbersAreaHeight)
				.attr({
					fill : layout.backgroundColor
				})
				.mousedown((args) => {
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
			element.rect.width(this.viewWidth - layout.trackCaptionAreaWidth);
		}
		, true);		

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
				this.parent.setFrameIndex(frameIndex);
				break;
			default:
			}
		});
	}
}

export { Ruler }