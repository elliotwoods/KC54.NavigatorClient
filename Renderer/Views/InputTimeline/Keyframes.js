import { Element } from './Element.js'
import { layout } from './layout.js'
import { Inspectable, toggleInspect } from '../Inspector.js'

class KeyFrames extends Element {
	constructor(parent) {
		super(parent.draw.nested());
		this.parent = parent;

		this.draw.move(layout.trackCaptionAreaWidth, layout.frameNumbersAreaHeight);

		this.inspectables = {};

		// define the keyFrame symbol
		this.keyFrameSymbol = this.draw.symbol();
		{
			let s = layout.keyFrameSize / 2;
			this.keyFrameSymbol.circle(s);
		}

		// background which changes on resize
		this.children.background = new Element(this.draw
			, (element) => {
				element.rect = element.draw.rect(100, layout.trackAreaHeight)
					.attr({
						'fill' : '#ccc'
					});
			}
			, (element) => {
				element.rect.width(this.width - layout.trackCaptionAreaWidth);
			}
			, true);

		// tracks with keyFrames
		this.children.tracks = new Element(this.draw.group()
		, null
		, (element) => {
			element.draw.clear();

			// build inspectables
			{
				let newInspectables = {};
				for(let track of this.parent.tracks) {
					for(let keyFrame of track.keyFrames) {
						// check if we already have
						if(keyFrame.id in this.inspectables) {
							// move it into new
							newInspectables[keyFrame.id] = this.inspectables[keyFrame.id];
							delete(this.inspectables[keyFrame.id]);
						}
						else {
							// make a new one
							let inspectable = new Inspectable(() => {
								return keyFrame.content;
							}
							, (value) => {
								keyFrame.content = value;
							}
							, `${track.name} : Keyframe ${keyFrame.frameIndex}`);
							inspectable.onInspectChange(() => {
								element.dirty = true;
								element.refresh();
							});
							inspectable.keyFrame = keyFrame;
							inspectable.track = track;
							newInspectables[keyFrame.id] = inspectable;
						}
					}
				}
				// flush old inspectables
				for(let inspectableID in this.inspectables) {
					this.inspectables[inspectableID].destroy();
				}
				this.inspectables = newInspectables;
			}

			let y = 0;
			for(let track of this.parent.tracks) {
				if(track.keyFrames.length == 0) {
					continue;
				}

				let trackGroup = element.draw.nested().y(y);

				// draw the frames
				for(let keyFrameIndex = 0; keyFrameIndex < track.keyFrames.length; keyFrameIndex++) {
					let keyFrame = track.keyFrames[keyFrameIndex];
					let nextKeyFrame;
					if(keyFrameIndex + 1 < track.keyFrames.length) {
						nextKeyFrame = track.keyFrames[keyFrameIndex + 1];
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

					let inspectable = this.inspectables[keyFrame.id];

					// background
					trackGroup.rect(this.parent.frameIndexToPixel(nextKeyFrame.frameIndex + 1), layout.trackHeight)
						.move(this.parent.frameIndexToPixel(keyFrame.frameIndex), 0)
						.attr({
							'fill': inspectable.isBeingInspected() ? '#eef' : '#fff',
							'stroke' : '#000',
							'stroke-width' : 0.5,
							'keyFrameID' : keyFrame.id
						})
						.mousedown(() => {
							inspectable.toggleInspect();
						});

					// We tried to popover on it but failed
					//let rectSelector = $(`rect[keyFrameID=${keyFrame.id}]`);

					// draggable region (first frame)
					trackGroup.rect(this.parent.pixelsPerFrame, layout.trackHeight)
						.move(this.parent.frameIndexToPixel(keyFrame.frameIndex), 0)
						.attr({
							'fill' : '#fff',
							'fill-opacity' : 0,
							'keyFrameID' : keyFrame.id,
							'cursor' : 'col-resize'
						})
						.mousedown((args) => {
							this.mouseDragStart = {
								x : args.pageX,
								y : args.pageY,
								frameIndex : keyFrame.frameIndex,
								keyFrame : keyFrame,
								target : element
							};
							args.preventDefault();
							inspectable.toggleInspect();
						});
					
					// draw the marker for the frame
					if(keyFrame.frameIndex >= this.parent.visibleRangeStart && keyFrame.frameIndex <= this.parent.visibleRangeEnd) {
						trackGroup.use(this.keyFrameSymbol)
							.center(this.parent.frameIndexToPixel(keyFrame.frameIndex + 0.5), layout.trackHeight / 2)
							.dx(-layout.keyFrameSize / 4); // somehow it's offset
					}
				}

				y += layout.trackHeight;
			}
		}
		, true);

		this.children.frameCursor = new Element(this.draw.group()
		, (element) => {
			element.line = element.draw.line(0, 0, 0, 0)
			.stroke({ color : layout.frameCursor.color, width : 1});
		}
		, (element) => {
			let x = this.parent.frameIndexToPixel(this.parent.currentFrameIndex + 0.5);
			element.line.plot(x, 0, x, layout.trackHeight * this.parent.tracks.length)
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
			case this.children.tracks:
				this.mouseDragStart.keyFrame.frameIndex = parent.validateFrameIndex(parent.pixelToFrameIndex(args.offsetX, false));
				this.children.tracks.dirty = true;
				this.refresh();
				break;
			default:
			}
		});
	}
}

export { KeyFrames }