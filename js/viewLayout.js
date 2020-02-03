import {Utils} from './Components/Utils.js.js'

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
				componentName: "Placeholder",
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
					"label": "Functions"
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

var myLayout = new GoldenLayout(standardConfig);

myLayout.registerComponent('Placeholder', function(container, componentState){
	container.getElement().html('<h2>' + componentState.label + '</h2>');
});

Utils.register(myLayout);

myLayout.init();

