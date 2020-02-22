import { Element } from './Element.js'
import { layout } from './layout.js'

class TrackHeaders extends Element {
	constructor(parent) {
		super(parent.draw.nested());
		this.parent = parent;
		this.draw.y(layout.frameNumbersAreaHeight);

		// track labels
		this.children.trackLabels = new Element(this.draw.group()
		, null
		, (element) => {
			element.draw.clear();
			let y = 0;
			for(let track of this.parent.tracks) {
				element.draw.text(track.name)
					.move(10, y);
				y += layout.trackHeight;
			}
		});
	}
}

export { TrackHeaders }