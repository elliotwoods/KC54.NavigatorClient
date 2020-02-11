import { ImportExport } from './Views/ImportExport.js'
import { Timeline } from './Views/Timeline.js'
import { AnglePlots } from './Views/AnglePlots.js'
import { World } from './Views/World.js'
import { settings } from './Database.js'

let standardConfig = {
	content: [{
		type: "row",
		content: [{
			type: "column",
			width : 70,
			content: [{
				type: 'column',
				content: [{
					type: 'component',
					componentName: "World",
					height : 60,
					componentState: {
						"camera": "perspective"
					}
				},
				{
					type: 'component',
					componentName: "World",
					height : 20,
					componentState: {
						"camera": "top"
					}
				}]
			},
			{
				type: 'component',
				componentName: "Timeline",
				height : 20,
				componentState: {
					"label": "Timeline"
				}
			}]
		},
		{
			type: "column",
			width : 30,
			content: [{
				type: 'component',
				componentName: "ImportExport"
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
			},
			{
				type: 'component',
				componentName: "AnglePlots",
				componentState: {
					"label": "AnglePlots"
				}
			},
			{
				type : 'component',
				componentName : "ViewPalette",
				componentState : {},
				isClosable : false
			}]
		}]
	}]
};

let viewPalette = [
	{
		icon: `<i class="fas fa-eye"></i>`,
		config: {
			title: 'perspective',
			type: 'component',
			componentName: 'World',
			componentState: {
				"camera": "perspective"
			}
		}
	},
	{
		icon: `<i class="fas fa-arrow-down"></i>`,
		config: {
			title: 'top',
			type: 'component',
			componentName: 'World',
			componentState: {
				"camera": "top"
			}
		}
	},
	{
		icon: `<i class="fas fa-arrow-right"></i>`,
		config: {
			title: 'front',
			type: 'component',
			componentName: 'World',
			componentState: {
				"camera": "front"
			}
		}
	}
]

let goldenLayout = null;

function setup() {
	try {
		let savedState = settings.get("viewLayout")
			.get("state")
			.value();
		if (!savedState.content) {
			throw (null);
		}
		goldenLayout = new GoldenLayout(savedState);
	}
	catch (exception) {
		goldenLayout = new GoldenLayout(standardConfig);
	}

	ImportExport.register(goldenLayout);
	Timeline.register(goldenLayout);
	AnglePlots.register(goldenLayout);
	World.register(goldenLayout);

	goldenLayout.registerComponent('Placeholder', function (container, componentState) {
		container.getElement().html('<h2>' + componentState.label + '</h2>');
	});

	goldenLayout.registerComponent('ViewPalette', function (container, componentState) {
		for (let viewPaletteItem of viewPalette) {
			let icon = $(viewPaletteItem.icon);
			container.getElement().append(icon);
			goldenLayout.createDragSource(icon, viewPaletteItem.config);
		}
	});

	goldenLayout.init();

	goldenLayout.on('stateChanged', () => {
		let state = goldenLayout.toConfig();
		settings.get("viewLayout")
			.set("state", state)
			.write();
	});

	
}

export { goldenLayout, setup }