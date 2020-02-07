import { Base } from './Base.js'
import { SVG } from '../../node_modules/@svgdotjs/svg.js/dist/svg.esm.js'
import { document, settings } from '../Database.js'
import { outputTimeline } from '../Data/outputTimeline.js'
import { rendererRouter } from '../rendererRouter.js';

const heightPerTrack = 25;
const widthPerFrame = 10;
const trackSpacing = 5;

class Timeline extends Base {
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
		this.refresh();

		this.timelineOutputCursor = null;
	}

	refresh() {
		this.zoomLevel = settings
			.get('zoomLevel')
			.value();
		this.refreshOutput();
	}

	refreshOutput() {
		// this.outputData = document
		// .get('outputFrames')
		// .value();
		// let frameCount = this.outputData.length;
		let tracks = outputTimeline.getTracks();

		let frameCount = outputTimeline.getFrameCount();

		// draw tracks
		let trackArray = Object.values(tracks);
		let trackCount = trackArray.length;

		let trackBackgroundArea = this.draw.rect(widthPerFrame * frameCount, (heightPerTrack + trackSpacing) * trackCount).attr({ fill: '#fff' });

		for(let trackIndex = 0; trackIndex < trackArray.length; trackIndex++) {
			let trackData = trackArray[trackIndex];
			
			let dimensionName = trackData.name.substr(-1);

			let foregroundColor;
			let backgroundColor;
			switch(dimensionName) {
				case 'x':
					foregroundColor = '#f06';
					backgroundColor = '#ffe6f0';
					break;
				case 'y':
					foregroundColor = '#6f0';
					backgroundColor = '#f0ffe6';
					break;
				case 'z':
					foregroundColor = '#06f';
					backgroundColor = '#e6f0ff';
					break;
				default:
					foregroundColor = '#f06';
					backgroundColor = '#ffe6f0';
					break;
			}
			//95% value from #f06 on https://www.w3schools.com/colors/colors_picker.asp?colorhex=ff0000

			let trackWidth = trackData.data.length * widthPerFrame;

			let normalizedData = trackData.getNormalizedData();

			let yValues = normalizedData.map(x => heightPerTrack * (1.0 - Math.abs(x)));

			// draw example result track
			{
				let track = this.draw.nested().move(0, trackIndex * (heightPerTrack + trackSpacing));
				let background = track.rect(normalizedData.length * widthPerFrame, heightPerTrack);
				
				background.fill({ color: backgroundColor })

				if (normalizedData.length == 0) {

				}
				else if (normalizedData.length == 1) {
					//draw as rect
					let absValue = absoluteValues[0];
					let rect = track.rect(widthPerFrame, heightPerTrack - yValues[0]).move(0, yValues[0]);
					if (normalizedData[0] > 0) {
						rect.fill({ color: foregroundColor });
					}
					else {
						rect.fill({ color: '#fff' });
						rect.stroke({ color: foregroundColor });
					}
				}
				else {
					// draw path
					let positive = normalizedData[0] > 0.0;
					let pathData = [];
					pathData.push(`M0 ${heightPerTrack} V${yValues[0]}`);
					for(let i=0; i<normalizedData.length; i++) {
						let newPositive = normalizedData[i] > 0.0;
						if(newPositive != positive) {
							//end old path and start a new one
							let y_xCrossOver = (i - 0.5) * widthPerFrame;
							pathData.push(`L${y_xCrossOver} ${heightPerTrack}`);
							let path = track.path(pathData.join(' ') + ' Z');
							if(positive) {
								path.fill({color : foregroundColor});
							}
							else {
								path.fill({ color: '#fff' });
								path.stroke({ color: foregroundColor });
							}

							// start new path
							pathData = [`M${y_xCrossOver} ${heightPerTrack}`];
							positive = normalizedData[i] > 0;
						}
						pathData.push(`L${i * widthPerFrame} ${yValues[i]}`);
					}
					pathData.push(`h${widthPerFrame}`)
					pathData.push(`V${heightPerTrack}`)
					let path = track.path(pathData.join(' ') + ' Z')
					path.stroke({ color: foregroundColor });
					if(positive) {
						path.fill({color : foregroundColor});
					}
					else {
						path.fill({ color: '#fff' });
					}
				}

				// draw tittle
				track.text(trackData.name).move(10, heightPerTrack-20).font({family : 'Helvetica', size : 18});
			}
		}

		let yGutter = trackCount * (heightPerTrack + trackSpacing);
		const gutterHeight = 30;
		let height = yGutter + gutterHeight;
		let width = frameCount * 10;

		// draw frame gutter
		{
			let gutter = this.draw.nested().move(0, yGutter);

			gutter.line(0, 0, width, 0).stroke({ color: '#333', width: 2 })

			for (let i = 0; i < frameCount; i++) {
				let x = i * widthPerFrame;
				if (i % 10 == 0) {
					gutter.line(x, 0, x, 20).stroke({ color: '#111', width: 1 });
					gutter.plain(i.toString()).move(x, 10).font({ family: 'Helvetica, Arial', size: 10, anchor: 'start' });
				}
				else {
					gutter.line(x, 0, x, 10).stroke({ color: '#111', width: 1 });;
				}
			}
		}


		this.refreshCursor();

		this.draw.size(width, height);

		window.svg = this.svg;
		window.draw = this.draw;
	}

	refreshCursor() {
		let outputFrameIndex = rendererRouter.appState.get_outputFrameIndex();
		rendererRouter.appState.set_outputFrameIndex(100);
	}
}

export { Timeline }