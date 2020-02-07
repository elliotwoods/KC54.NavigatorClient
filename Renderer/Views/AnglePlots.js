import { Base } from './Base.js'
import { outputTimeline } from '../Data/outputTimeline.js'
import { document } from '../Database.js'

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

		let axisCount = outputFrames[0].content.configuration.length;

		let axesData = [];
		for(let i = 0; i < axisCount; i++) {
			let axisData = outputFrames.map(outputFrame => outputFrame.content.configuration[i].angleToX);
			axesData.push(axisData);
		}

		let plotData = [];
		for(let axisIndex = 0; axisIndex < axisCount; axisIndex++) {
			let axisData = axesData[axisIndex]
			let plot = {
				type : 'scatterpolargl',
				mode : 'lines',
				r : axisData.map(radians => radians / (2.0 * Math.PI)),
				theta : axisData.map(radians => radians / (2.0 * Math.PI) * 360.0),
				subplot : axisIndex == 0 ? 'polar' : `polar${axisIndex + 1}`
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
		const rows = Math.ceil(axisCount / cols);
		const padding = 0.03;

		for(let axisIndex = 0; axisIndex < axisCount; axisIndex++) {
			let col  = axisIndex % cols;
			let row = Math.floor(axisIndex / cols);

			layout[plotData[axisIndex].subplot] = {
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
					}
				}
			}

			{
				let titleX = layout[plotData[axisIndex].subplot].domain.x[0] + layout[plotData[axisIndex].subplot].domain.x[1];
				titleX /= 2.0;
				let titleY = layout[plotData[axisIndex].subplot].domain.y[0] - padding;

				layout.annotations.push({
					"x" : titleX,
					"y" : titleY - padding / 4,
					"text" : `Axis ${axisIndex}`,
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