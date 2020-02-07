import { Base } from './Base.js'
import { outputTimeline } from '../Data/outputTimeline.js'
import { document } from '../Database.js'
import { AxisMath } from '../Utils/AxisMath.js'
import { totalBlockHeight, totalShaftCount } from '../Utils/Constants.js'

class AnglePlots extends Base {
	constructor(container, state) {
		super(container, state);
		this.container = container;
		this.state = state;

		this.init();
	}

	init() {
		this.div = $(`<div class="scrollContainerAuto" />`);
		this.container.getElement().append(this.div);
		
		this.refresh();
	}

	refresh() {
		let outputFrames = document.get('outputFrames').value();

		// gather the shaft angles for each frame
		let shaftAnglesPerFrame = outputFrames.map((frame) => {
			let anglesToX = frame.content.configuration.map(block => block.angleToX);
			let shaftAngles = AxisMath.anglesToXToShaftAngles(anglesToX);
			return shaftAngles;
		});

		// invert the dataset so that it is categorised per axis
		let framePerShaftAngle = [];
		for(let i = 0; i < totalShaftCount; i++) {
			let shaftAnglesForOneAxis = shaftAnglesPerFrame.map(frame => frame[i]);
			framePerShaftAngle.push(shaftAnglesForOneAxis);
		}

		// create the plotData
		let plotData = [];
		for(let shaftIndex = 0; shaftIndex < totalShaftCount; shaftIndex++) {
			let shaftAnglesForOneAxis = framePerShaftAngle[shaftIndex]
			let plot = {
				type : 'scatterpolargl',
				mode : 'lines',
				r : shaftAnglesForOneAxis.map(radians => radians / (2.0 * Math.PI)),
				theta : shaftAnglesForOneAxis.map(radians => radians / (2.0 * Math.PI) * 360.0),
				subplot : shaftIndex == 0 ? 'polar' : `polar${shaftIndex + 1}`
			};
			plotData.push(plot);
		}
		
		let layout = {
			showlegend : false,
			annotations : [],
			autosize : true,
			height : 1000
		};

		const cols = 4;
		const rows = Math.ceil(totalShaftCount / cols);
		const padding = 0.03;

		for(let shaftIndex = 0; shaftIndex < totalShaftCount; shaftIndex++) {
			let col  = shaftIndex % cols;
			let row = Math.floor(shaftIndex / cols);

			layout[plotData[shaftIndex].subplot] = {
				domain : {
					x : [col  / cols + padding
						, (col + 1) / cols - padding
					],
					y : [row / rows + padding
						, (row + 1) / rows - padding]
				},
				radialaxis : {
					range : [-2, 2],
					nticks : 5,
					tickfont : {
						size : 8
					}
				},
				angularaxis : {
					//thetaunit: "radians"
					tickfont : {
						size : 8
					},
					dtick : 90
				}
			}

			{
				let titleX = layout[plotData[shaftIndex].subplot].domain.x[0] + layout[plotData[shaftIndex].subplot].domain.x[1];
				titleX /= 2.0;
				let titleY = layout[plotData[shaftIndex].subplot].domain.y[0] - padding;

				layout.annotations.push({
					"x" : titleX,
					"y" : titleY - padding / 4,
					"text" : `${AxisMath.shaftIndexToName(shaftIndex)}`,
					"xref": "paper",
					"yref": "paper",
					"xanchor": "center",
					"yanchor": "bottom",
					"showarrow" : false,
					"font" : {
						"size" : 10
					}
				})
			}
		}

		let config = {
			responsive : true,
			showEditInChartStudio : true
		};

		this.plot = Plotly.newPlot(this.div[0], plotData, layout, config);
		this.plot.then((plotDiv) => {
			$(plotDiv).height("100%");
		});
		window.anglePlots = this;
	}
}

export { AnglePlots }