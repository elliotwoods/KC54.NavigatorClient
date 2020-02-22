import { Element } from './Element.js'
import { layout } from './layout.js'

class Keyframes extends Element {
	constructor(parent) {
		super(parent.draw.nested());
		this.parent = parent;

		this.draw.move(layout.trackCaptionAreaWidth, layout.frameNumbersAreaHeight);

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

		// tracks with keyframes
		this.children.tracks = new Element(this.draw.group()
		, null
		, (element) => {
			element.draw.clear();

			let y = 0;
			for(let track of this.parent.tracks) {
				if(track.keyframes.length == 0) {
					continue;
				}

				let trackGroup = element.draw.nested().y(y);
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

					trackGroup.rect(this.parent.frameIndexToPixel(nextKeyFrame.frameIndex + 1), layout.trackHeight)
						.move(this.parent.frameIndexToPixel(keyFrame.frameIndex), 0)
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

					trackGroup.use(this.keyFrameSymbol).center(this.parent.frameIndexToPixel(keyFrame.frameIndex + 0.5), layout.trackHeight / 2);
				}

				y += layout.trackHeight;
			}
		}
		, true);
	}
}

export { Keyframes }