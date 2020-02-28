import { document, SettingsNamespace } from '../../Database.js'

let settingsNamespace = new SettingsNamespace(["Views", "InputTimeline"]);
let layout = settingsNamespace.set("layout", {
	trackCaptionAreaWidth : 100,
	trackHeight : 30,
	frameNumbersAreaHeight : 30,
	keyFrameSize : 9,
	frameTicks : {
		height : 5,
		color : '#aaa'
	},
	frameCursor : {
		color : '#333'
	},
	backgroundColor : '#efeeee',
	freshFramesColor : '#efffee'
});
layout = settingsNamespace.get("layout");

export { layout }