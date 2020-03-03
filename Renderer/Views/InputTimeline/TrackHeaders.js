import { Element } from './Element.js'
import { SettingsNamespace } from '../../Database.js'
import { InputTimelineUtils} from '../../Utils/InputTimelineUtils.js'
import { Inspectable } from '../Inspector.js'
import { ErrorHandler } from '../../Utils/ErrorHandler.js'

let settingsNamespace = new SettingsNamespace(["Views", "InputTimeline"]);

class TrackHeaders extends Element {
	constructor(parent) {
		super(parent.draw.nested());
		this.parent = parent;
		this.draw.y(settingsNamespace.get(["layout", "frameNumbersAreaHeight"]));

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
							let result = ErrorHandler.do(() => {
								return InputTimelineUtils.calculateTrackFrame(track, parent.currentFrameIndex);
							});
							return result;
						}
						, null // no set function
						, () => InputTimelineUtils.getTrackCaption(track));
						inspectable.onInspectChange(() => {
							element.dirty = true;
							element.refresh();
						});
						inspectable.track = track;
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
			let layout = settingsNamespace.get("layout");
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
				element.draw.text(InputTimelineUtils.getTrackCaption(track))
					.move(10, y)
					.font({ weight : inspectable.isBeingInspected() ? 400 : 200 });
				y += layout.trackHeight;
			}
		});
	}
}

export { TrackHeaders }