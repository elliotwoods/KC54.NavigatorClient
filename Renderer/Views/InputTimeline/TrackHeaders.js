import { Element } from './Element.js'
import { layout } from './layout.js'
import { InputTimelineUtils} from '../../Utils/InputTimelineUtils.js'
import { Inspectable } from '../Inspector.js'

class TrackHeaders extends Element {
	constructor(parent) {
		super(parent.draw.nested());
		this.parent = parent;
		this.draw.y(layout.frameNumbersAreaHeight);

		this.inspectables = {};

		// track labels
		this.children.trackLabels = new Element(this.draw.group()
		, null
		, (element) => {
			element.draw.clear();

			// build inspectables
			{
				let newInspectables = {};
				for(let track of this.parent.tracks) {
					// check if we already have
					if(track.id in this.inspectables) {
						// move it into new
						newInspectables[track.id] = this.inspectables[track.id];
						delete(this.inspectables[track.id]);
					}
					else {
						// make a new one
						let inspectable = new Inspectable(() => {
							return InputTimelineUtils.calculateTrackFrame(track, parent.currentFrameIndex);
						}
						, null // no set function
						, `${track.name}`);
						inspectable.onInspectChange(() => {
							element.dirty = true;
							element.refresh();
						});
						newInspectables[track.id] = inspectable;
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
				let inspectable = this.inspectables[track.id];
				element.draw.rect(layout.trackCaptionAreaWidth, layout.trackHeight)
					.move(0, y)
					.attr({
						fill : layout.backgroundColor
					})
					.mousedown(() => {
						inspectable.toggleInspect();
					});
				element.draw.text(track.name)
					.move(10, y)
					.font({ weight : inspectable.isBeingInspected() ? 400 : 200 });
				y += layout.trackHeight;
			}
		});
	}
}

export { TrackHeaders }