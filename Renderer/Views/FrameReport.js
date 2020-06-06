import { Base } from './Base.js'
import { outputTimeline } from '../Data/outputTimeline.js'
import { document, settings, SettingsNamespace } from '../Database.js'
import { AxisMath } from '../Utils/AxisMath.js'
import { Constants } from '../Utils/Constants.js'
import { rendererRouter } from '../rendererRouter.js'

const radialDomainScale = 8;
const settingsNamespace = new SettingsNamespace(["Views", "FrameReport"]);
// settingsNamespace.defaults({

// });

class FrameReport extends Base {
	constructor(container, state) {
		super(container, state);
		this.container = container;
		this.state = state;

		this.init();
	}

	init() {
		this.div = $(`<div class="scrollContainerAuto" />`);
		this.container.getElement().append(this.div);


		this.title = $(`<h2><h2/>`);
		this.div.append(this.title);

		this.div.append(`<h3>Forces</h3>`)
		this.forcesTable = $(`<table class="table table-hover">
			<thead>
				<th scope="col">Index</th>
				<th scope="col">Mx [Nm]</th>
				<th scope="col">My [Nm]</th>
				<th scope="col">Mz [Nm]</th>
				<th scope="col">Fx [N]</th>
				<th scope="col">Fy [N]</th>
				<th scope="col">Fz [N]</th>
			</thead>
		</table>`);
		this.div.append(this.forcesTable);

		this.tryRefresh();
		rendererRouter.onChange('outputFrame', () => {
			this.refresh();
		})
	}

	async refresh() {
		let currentFrameContent = outputTimeline.getCurrentFrame().content;
		this.title.text(`Frame ${outputTimeline.getCurrentFrameIndex()}`);

		// remove previous rows
		this.forcesTable.find(".data_row").remove();

		{
			let localeOptions = {
				maximumFractionDigits : 1,
				minimumFractionDigits : 1
			};
			for(let forceIndex in currentFrameContent.forces) {
				let forceData = currentFrameContent.forces[forceIndex];
				let row = $(`<tr class="data_row">
					<th scope="row">${forceIndex}</th>
					<td>${forceData.moment.x.toLocaleString("en-GB", localeOptions)}</td>
					<td>${forceData.moment.y.toLocaleString("en-GB", localeOptions)}</td>
					<td>${forceData.moment.z.toLocaleString("en-GB", localeOptions)}</td>
					<td>${forceData.force.x.toLocaleString("en-GB", localeOptions)}</td>
					<td>${forceData.force.y.toLocaleString("en-GB", localeOptions)}</td>
					<td>${forceData.force.z.toLocaleString("en-GB", localeOptions)}</td>
				</tr>`);

				this.forcesTable.append(row);
			}
		}
	}
}

let traceData = null;

export { FrameReport }