import { Base } from './Base.js'
import { outputTimeline } from '../Data/outputTimeline.js'
import { document, settings, SettingsNamespace } from '../Database.js'
import { AxisMath } from '../Utils/AxisMath.js'
import { Constants } from '../Utils/Constants.js'
import { rendererRouter } from '../rendererRouter.js'

const radialDomainScale = 8;
const settingsNamespace = new SettingsNamespace(["Views", "AnglePlots"]);
settingsNamespace.defaults({
	showDebugText : false
});

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

	addOptionsDiv() {
		// options div
		{
			let optionsDiv = $(`<div class="anglePlotsOptions" />`);

			let addOption = (settingName, caption, defaultValue) => {
				let optionDiv = $(`<div class="custom-control custom-switch" />`);
				{

					let checkBox = $(`<input type="checkbox" class="custom-control-input" id="AnglePlots_${settingName}_switch" checked="">`);
					optionDiv.append(checkBox);

					settingsNamespace.defaults({
						settingsName : defaultValue
					});

					let value = settingsNamespace.get(settingName);
					if(!value) {
						checkBox.removeAttr("checked");
					}

					checkBox.change((value) => {
						settingsNamespace.set(value.target.checked, settingName);
					});

					let label = $(`<label class="custom-control-label" for="AnglePlots_${settingName}_switch">${caption}</label>`);
					optionDiv.append(label);
				}

				optionsDiv.append(optionDiv);
			}

			addOption('liveUpdate', 'Live update', true);
			addOption('showDebugText', 'Show debug text', false);

			this.container.getElement().append(optionsDiv);
		}
	}

	async refresh() {
		this.addOptionsDiv();

		let outputFrames = document.get('outputFrames').value();
		let currentFrameIndex = rendererRouter.appState.get_outputFrameIndex();

		if (currentFrameIndex >= outputFrames.length) {
			return;
		}

		// gather the shaft angles for each frame
		let shaftAnglesPerFrame = AxisMath.outputFramesToShaftAnglesPerFrame(outputFrames);

		// invert the dataset so that it is categorised per axis
		let framePerShaftAngle = AxisMath.shaftAnglesPerFrameToFramesPerShaft(shaftAnglesPerFrame);

		// create the plotData
		let plotData = [];
		let markersPlotData = [];
		for (let shaftIndex = 0; shaftIndex < Constants.totalShaftCount; shaftIndex++) {
			let shaftAnglesForOneAxis = framePerShaftAngle[shaftIndex]
			let plot = {
				type: 'scatterpolargl',
				mode: 'lines',
				r: AxisMath.radiansToCycles(shaftAnglesForOneAxis).map(cycles => Math.max(Math.min(cycles, radialDomainScale - 1), - radialDomainScale + 1)),
				theta: AxisMath.radiansToDegrees(shaftAnglesForOneAxis),
				subplot: shaftIndex == 0 ? 'polar' : `polar${shaftIndex + 1}`
			};
			plotData.push(plot);

			// add a marker for the current position
			let traceCurrentPosition = {
				type: 'scatterpolargl',
				mode: 'markers',
				r: AxisMath.radiansToCycles([shaftAnglesForOneAxis[currentFrameIndex]]),
				theta: AxisMath.radiansToDegrees([shaftAnglesForOneAxis[currentFrameIndex]]),
				marker: {
					color: "transparent",
					size: 10,
					line: {
						color: '#000',
						width: 2
					}
				},
				subplot: plot.subplot
			};
			markersPlotData.push(traceCurrentPosition);
		}

		// draw the stoppers
		let stopperPlotData = [];
		{
			let stopperData = settings.get("system")
				.get("stoppers")
				.value();

			if (stopperData.length == Constants.totalShaftCount) {
				for (let shaftIndex = 0; shaftIndex < Constants.totalShaftCount; shaftIndex++) {
					if (stopperData[shaftIndex] == null) {
						continue;
					}
					let min = stopperData[shaftIndex].min;
					let max = stopperData[shaftIndex].max;

					//rectify to positive facing range for drawing
					if (min > max) {
						min -= Math.PI * 2;
					}

					let middleThetaValues = [];
					for (let t = 0; t <= 1; t += 0.01) {
						middleThetaValues.push(t * (max - min) + min);
					}

					let middleRValues = middleThetaValues.map(_ => radialDomainScale);

					let plot = {
						type: "scatterpolargl",
						mode: 'lines',
						r: [-radialDomainScale, radialDomainScale, ...middleRValues, radialDomainScale, -radialDomainScale],
						theta: AxisMath.radiansToDegrees([min, min, ...middleThetaValues, max, max]),
						fill: "toself",
						fillcolor: '#333333',
						line: {
							color: '#333333'
						},
						opacity: 0.5,
						subplot: plotData[shaftIndex].subplot
					};

					stopperPlotData.push(plot);
				}
			}
		}

		let layout = {
			showlegend: false,
			annotations: [],
			autosize: true,
			margin: {
				l: 20,
				r: 20,
				b: 20,
				t: 20,
				pad: 0
			},
			paper_bgcolor: 'rgba(0,0,0,0)',
			plot_bgcolor: 'rgba(0,0,0,0)'
		};

		const padding = 0.01;
		const size = 1 / 12 - padding;
		const colPositions = [1 / 12, 3 / 12, 5 / 12, 7 / 12, 9 / 12, 11 / 12];
		const cols = 12;
		const rows = Constants.totalBlockHeight + 1;

		for (let shaftIndex = 0; shaftIndex < Constants.totalShaftCount; shaftIndex++) {
			// see page 14 of 2020-February notes
			let shaftName = AxisMath.shaftIndexToName(shaftIndex);
			let towerName = shaftName.substr(0, 1);
			let shaftTier = parseInt(shaftName.substr(1));
			let col;
			if (shaftTier == Constants.totalBlockHeight - 1) {
				// top block
				switch (towerName) {
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
				switch (towerName) {
					case 'A':
						col = (shaftTier % 2) * 2 + 1;
						break;
					case 'B':
						col = 11 - (shaftTier % 2) * 2;
						break;
				}
			}
			let row = shaftTier + 1;

			let plotX = col / cols;
			let plotY = row / rows;

			layout[plotData[shaftIndex].subplot] = {
				domain: {
					x: [plotX - size
						, plotX + size],
					y: [plotY - size
						, plotY + size]
				},
				radialaxis: {
					range: [-radialDomainScale, radialDomainScale],
					nticks: 5,
					tickfont: {
						size: 8
					}
				},
				angularaxis: {
					tickfont: {
						size: 8
					},
					dtick: 90
				},
				hole: 0.3
			}

			// Add title in center
			{
				layout.annotations.push({
					"x": plotX,
					"y": plotY,
					"text": `${AxisMath.shaftIndexToName(shaftIndex)}`,
					"xref": "paper",
					"yref": "paper",
					"xanchor": "center",
					"yanchor": "middle",
					"showarrow": false,
					"font": {
						"size": 10
					}
				})
			}
		}

		if(settingsNamespace.get('showDebugText')) {
			{
				let angleToXArray = outputFrames[currentFrameIndex].content.pose.map(config => config.angleToX * (180 / Math.PI));
				let angleToXReport = [];
				for (let i = 0; i < angleToXArray.length; i++) {
					angleToXReport.push(`[${i}] ${angleToXArray[i].toFixed(1)}`);
				}
				angleToXReport = angleToXReport.reverse();
				angleToXReport = ['angleToX:'].concat(angleToXReport);

				layout.annotations.push({
					"x": 0.5,
					"y": (10 / rows),
					"text": angleToXReport.join('<br />'),
					"xref": "paper",
					"yref": "paper",
					"xanchor": "right",
					"yanchor": "top",
					"showarrow": false,
					"font": {
						"size": 12
					}
				});
			}

			{
				let shaftAnglesArray = shaftAnglesPerFrame[currentFrameIndex].map(shaftAngle => shaftAngle * (180 / Math.PI));
				let shaftAnglesReport = [];
				for (let i = 0; i < shaftAnglesArray.length; i++) {
					shaftAnglesReport.push(`[${i}] ${shaftAnglesArray[i].toFixed(1)}`);
				}
				shaftAnglesReport = shaftAnglesReport.reverse();
				shaftAnglesReport = ['shaftAngle:'].concat(shaftAnglesReport);

				layout.annotations.push({
					"x": 0.5,
					"y": (10 / rows),
					"text": shaftAnglesReport.join('<br />'),
					"xref": "paper",
					"yref": "paper",
					"xanchor": "left",
					"yanchor": "top",
					"showarrow": false,
					"font": {
						"size": 12
					}
				});
			}
		}


		let config = {
			responsive: true,
			showEditInChartStudio: true
		};

		this.plotDiv = await Plotly.newPlot(this.div[0], plotData.concat(markersPlotData).concat(stopperPlotData), layout, config);
		$(this.plotDiv).height("100%");
		$(this.plotDiv).width("100%");
		$(this.plotDiv).addClass("AnglePlots_plots");

		rendererRouter.onChange("outputFrame", () => {
			this.needsUpdateTraces = true;
		});

		// start update loop
		this.updateShaftCursors();

		this.container.on("resize", async () => {
			await this.resize();
		});
		this.resize();
	}

	async updateShaftCursors() {
		if (this.needsUpdateTraces && settingsNamespace.get('liveUpdate')) {
			let frame = document.getCurrentOutputFrame();
			let anglesToX = frame.content.pose.map(block => block.angleToX);
			let shaftAngles = AxisMath.anglesToXToShaftAngles(anglesToX);

			let traceIndices = new Array(shaftAngles.length).fill(0).map((_, i) => i + shaftAngles.length);

			traceData = {
				data: shaftAngles.map((shaftAngle) => {
					return {
						r: [shaftAngle / (Math.PI * 2)],
						theta: [shaftAngle / (Math.PI * 2) * 360]
					};
				}),
				traces: traceIndices
			}

			await Plotly.animate(this.div[0], traceData);

			this.needsUpdateTraces = false;
		}

		setTimeout(() => {
			this.updateShaftCursors();
		}, 10);
	}

	async resize() {
		Plotly.relayout(this.plotDiv, {
			width: $(this.plotDiv).width(),
			height: $(this.plotDiv).height()
		});
	}
}

let traceData = null;

export { AnglePlots }