import { Utils } from './Views/Utils.js'
import { Timeline } from './Views/Timeline.js'

let standardConfig = {
	content: [{
		type: "row",
		content: [{
			type: "column",
			content: [{
				type: 'component',
				componentName: "Placeholder",
				componentState: {
					"label": "3D View (solid, perspective)"
				}
			},
			{
				type: 'component',
				componentName: "Timeline",
				componentState: {
					"label": "Timeline"
				}
			}]
		},
		{
			type: "column",
			content: [{
				type: 'component',
				componentName: "Utils",
				componentState: {
					"label": "Utils"
				}
			},
			{
				type: 'component',
				componentName: "Placeholder",
				componentState: {
					"label": "Parameters"
				}
			},
			{
				type: 'component',
				componentName: "Placeholder",
				componentState: {
					"label": "Transport"
				}
			}]
		}]
	}]
};

let goldenLayout = null;

function setup() {
	goldenLayout = new GoldenLayout(standardConfig);

	Utils.register(goldenLayout);
	Timeline.register(goldenLayout);

	goldenLayout.registerComponent('Placeholder', function(container, componentState){
		container.getElement().html('<h2>' + componentState.label + '</h2>');
	});
	
	goldenLayout.init();
}

export { goldenLayout, setup }