import { Base } from './Base.js'
import { SVG } from '../../node_modules/@svgdotjs/svg.js/dist/svg.esm.js'
import { document, settings } from '../Database.js'
import { outputTimeline } from '../Data/OutputTimeline.js'

const heightPerTrack = 25;
const widthPerFrame = 10;

class Timeline extends Base {
	constructor(container, state) {
		super(container, state);
		this.container = container;
		this.state = state;

		this.init();
	}

	init() {
		this.scrollDiv = $(`<div class="scrollContainer" />`);
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

		let frameCount = 100;

		// let path = new paper.Path();
		// path.strokeColor = 'black';
		// let start = new paper.Point(100, 100);
		// path.moveTo(start);
		// path.lineTo(start.add([100, -50]));
		// paper.view.draw();



		let rows = 5;


		let yGutter = rows * heightPerTrack;
		const gutterHeight = 30;
		let height = yGutter + gutterHeight;
		let width = frameCount * 10;

		// draw tracks
		{
			let foregroundColor = '#f06';
			let backgroundColor = '#ffe6f0';
			//95% value from #f06 on https://www.w3schools.com/colors/colors_picker.asp?colorhex=ff0000

			let trackBackground = this.draw.rect(width, rows * heightPerTrack).attr({ fill: '#fff' });

			let nomralizedData = [];
			{
				let a = 0.0;
				for (let i = 0; i < 100; i++) {
					a += Math.random(1) - 0.5;
					nomralizedData.push(a);
				}
				console.log(nomralizedData);
			}

			let yValues = nomralizedData.map(x => heightPerTrack * (1.0 - Math.abs(x)));

			// draw example result track
			{
				let track = this.draw.nested().move(0, 0);
				let background = track.rect(nomralizedData.length * widthPerFrame, heightPerTrack);
				//background.stroke({ color: '#f06', width: 2 });
				background.fill({ color: '#ffe6f0' })

				if (nomralizedData.length == 0) {

				}
				else if (nomralizedData.length == 1) {
					//draw as rect
					let absValue = absoluteValues[0];
					let rect = track.rect(widthPerFrame, heightPerTrack - yValues[0]).move(0, yValues[0]);
					if (nomralizedData[0] > 0) {
						rect.fill({ color: foregroundColor });
					}
					else {
						rect.fill({ color: '#fff' });
						rect.stroke({ color: foregroundColor });
					}
				}
				else {
					// draw path
					let positive = nomralizedData[0] > 0.0;
					let pathData = [];
					pathData.push(`M0 ${heightPerTrack} V${yValues[0]}`);
					for(let i=0; i<nomralizedData.length; i++) {
						let newPositive = nomralizedData[i] > 0.0;
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
							positive = nomralizedData[i] > 0;
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

				track.text('Mx').move(10, heightPerTrack-20).font({family : 'Helvetica', size : 18});

			}
		}

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



		this.draw.size(width, height);

		window.svg = this.svg;
		window.draw = this.draw;
	}
}

export { Timeline }