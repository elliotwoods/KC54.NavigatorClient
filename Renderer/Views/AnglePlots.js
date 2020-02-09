import { Base } from './Base.js'
import { outputTimeline } from '../Data/outputTimeline.js'
import { document } from '../Database.js'
import { AxisMath } from '../Utils/AxisMath.js'
import { Constants } from '../Utils/Constants.js'
import { rendererRouter } from '../rendererRouter.js'

class AnglePlots extends Base {
	constructor(container, state) {
		super(container, state);
		this.container = container;
		this.state = state;
		this.needsUpdateTraces = true;

		this.init();
	}

	init() {
		this.div = $(`<div class="scrollContainerAuto" />`);
		this.container.getElement().append(this.div);
		
		this.tryRefresh();
	}

	refresh() {
		let outputFrames = document.get('outputFrames').value();
		let currentFrameIndex = rendererRouter.appState.get_outputFrameIndex();

		if(currentFrameIndex >= outputFrames.length) {
			return;
		}
 
		// gather the shaft angles for each frame
		let shaftAnglesPerFrame = outputFrames.map((frame) => {
			let anglesToX = frame.content.configuration.map(block => block.angleToX);
			let shaftAngles = AxisMath.anglesToXToShaftAngles(anglesToX);
			return shaftAngles;
		});

		// invert the dataset so that it is categorised per axis
		let framePerShaftAngle = [];
		for(let i = 0; i < Constants.totalShaftCount; i++) {
			let shaftAnglesForOneAxis = shaftAnglesPerFrame.map(frame => frame[i]);
			framePerShaftAngle.push(shaftAnglesForOneAxis);
		}

		// create the plotData
		let plotData = [];
		let markersData = [];
		for(let shaftIndex = 0; shaftIndex < Constants.totalShaftCount; shaftIndex++) {
			let shaftAnglesForOneAxis = framePerShaftAngle[shaftIndex]
			let plot = {
				type : 'scatterpolar',
				mode : 'lines',
				r : AxisMath.radiansToCycles(shaftAnglesForOneAxis),
				theta : AxisMath.radiansToDegrees(shaftAnglesForOneAxis),
				subplot : shaftIndex == 0 ? 'polar' : `polar${shaftIndex + 1}`
			};
			plotData.push(plot);

			// add a marker for the current position
			let traceCurrentPosition = {
				type : 'scatterpolar',
				mode : 'markers',
				r : AxisMath.radiansToCycles([shaftAnglesForOneAxis[currentFrameIndex]]),
				theta : AxisMath.radiansToDegrees([shaftAnglesForOneAxis[currentFrameIndex]]),
				marker : {
					color : "transparent",
					size : 10,
					line : {
						color : '#000',
						width : 2
					}
				},
				subplot : plot.subplot
			};
			markersData.push(traceCurrentPosition);
		}
		
		let layout = {
			showlegend : false,
			annotations : [],
			autosize : true,
			height : 1000,
			margin : { 
				l : 20,
				r : 20,
				b : 20,
				t : 20,
				pad : 0
			}
		};

		const padding = 0.01;
		const size = 1/12 - padding;
		const colPositions = [1/12, 3/12, 5/12, 7/12, 9/12, 11/12];
		const cols = 12;
		const rows = Constants.totalBlockHeight + 1;

		for(let shaftIndex = 0; shaftIndex < Constants.totalShaftCount; shaftIndex++) {
			// see page 14 of 2020-February notes
			let shaftName = AxisMath.shaftIndexToName(shaftIndex);
			let towerName = shaftName.substr(0, 1);
			let shaftTier = parseInt(shaftName.substr(1));
			let col;
			if(shaftTier == Constants.totalBlockHeight - 1) {
				// top block
				switch(towerName) {
					case 'A':
						col = 5;
						break;
					case 'B':
						col = 7;
						break;
				}
			}
			else {
				// other blocks
				switch(towerName) {
					case 'A':
						col = (shaftTier % 2) * 2 + 1;
						break;
					case 'B':
						col = 11 - (shaftTier % 2) * 2;
						break;
				}
			}
			let row = shaftTier + 1;

			let plotX = col  / cols;
			let plotY = row / rows;
			
			layout[plotData[shaftIndex].subplot] = {
				domain : {
					x : [plotX - size
						, plotX + size],
					y : [plotY - size
						, plotY + size]
				},
				radialaxis : {
					range : [-4, 4],
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
				},
				hole : 0.3
			}

			// Add title in center
			{
				layout.annotations.push({
					"x" : plotX,
					"y" : plotY,
					"text" : `${AxisMath.shaftIndexToName(shaftIndex)}`,
					"xref": "paper",
					"yref": "paper",
					"xanchor": "center",
					"yanchor": "middle",
					"showarrow" : false,
					"font" : {
						"size" : 10
					}
				})
			}

			// Add current frame data in top-left
			{
				let shaftAngle = shaftAnglesPerFrame[currentFrameIndex][shaftIndex] * (180 / Math.PI);

				layout.annotations.push({
					"x" : plotX - size * 0.8,
					"y" : plotY + size * 0.8,
					"text" : `${shaftAngle.toFixed(1)}`,
					"xref": "paper",
					"yref": "paper",
					"xanchor": "left",
					"yanchor": "top",
					"showarrow" : false,
					"font" : {
						"size" : 10
					}
				})
			}
		}

		{
			let angleToXArray = outputFrames[currentFrameIndex].content.configuration.map(config => config.angleToX * (180 / Math.PI));
			let angleToXReport = [];
			for(let i = 0; i < angleToXArray.length; i++) {
				angleToXReport.push(`[${i}] ${angleToXArray[i].toFixed(1)}`);
			}
			angleToXReport = angleToXReport.reverse();
			angleToXReport = ['angleToX:'].concat(angleToXReport);

			layout.annotations.push({
				"x" : 0.5,
				"y" : (10 / rows),
				"text" : angleToXReport.join('<br />'),
				"xref": "paper",
				"yref": "paper",
				"xanchor": "right",
				"yanchor": "top",
				"showarrow" : false,
				"font" : {
					"size" : 12
				}
			});
		}

		{
			let shaftAnglesArray = shaftAnglesPerFrame[currentFrameIndex].map(shaftAngle => shaftAngle * (180 / Math.PI));
			let shaftAnglesReport = [];
			for(let i = 0; i < shaftAnglesArray.length; i++) {
				shaftAnglesReport.push(`[${i}] ${shaftAnglesArray[i].toFixed(1)}`);
			}
			shaftAnglesReport = shaftAnglesReport.reverse();
			shaftAnglesReport = ['shaftAngle:'].concat(shaftAnglesReport);

			layout.annotations.push({
				"x" : 0.5,
				"y" : (10 / rows),
				"text" : shaftAnglesReport.join('<br />'),
				"xref": "paper",
				"yref": "paper",
				"xanchor": "left",
				"yanchor": "top",
				"showarrow" : false,
				"font" : {
					"size" : 12
				}
			});
		}

		let config = {
			responsive : true,
			showEditInChartStudio : true
		};

		this.plot = Plotly.newPlot(this.div[0], plotData.concat(markersData), layout, config);
		this.plot.then((plotDiv) => {
			$(plotDiv).height("100%");
			this.plotDiv = plotDiv;

			rendererRouter.onChange("outputFrame", () => {
				this.needsUpdateTraces = true;
			});
		});

		// start update loop
		this.updateShaftCursors();

		// for debug
		window.axisMath = AxisMath;
		window.anglePlots = this;
		window.anglesToX = shaftAnglesPerFrame[0];
	}

	async updateShaftCursors() {
		if(this.needsUpdateTraces) {
			let frame = document.getCurrentOutputFrame();
			let anglesToX = frame.configuration.map(block => block.angleToX);
			let shaftAngles = AxisMath.anglesToXToShaftAngles(anglesToX);
	
			let traceIndices = new Array(shaftAngles.length).fill(0).map((_, i) => i + shaftAngles.length);
	
			traceData = {
				data : shaftAngles.map((shaftAngle) => {
					return {
						r : [shaftAngle / (Math.PI * 2)],
						theta : [shaftAngle / (Math.PI * 2) * 360]
					};
				}),
				traces : traceIndices
			}
	
			await Plotly.animate(this.div[0], traceData);

			this.needsUpdateTraces = false;
		}
		
		setTimeout(() => {
			this.updateShaftCursors();
		}, 10);
	}
}

let traceData = null;

export { AnglePlots }