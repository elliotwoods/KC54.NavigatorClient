import { ImportExport } from './Views/ImportExport.js'
import { Timeline } from './Views/Timeline.js'
import { Transport } from './Views/Transport.js'
import { AnglePlots } from './Views/AnglePlots.js'
import { World } from './Views/World.js'
import { Navigator } from './Views/Navigator.js'
import { Inspector } from './Views/Inspector.js'

import { settings } from './Database.js'
import { GuiUtils } from './Utils/GuiUtils.js'

let standardConfig = {
	content: [
		{
			"type": "row",
			"isClosable": true,
			"reorderEnabled": true,
			"title": "",
			"content": [
				{
					"type": "column",
					"isClosable": true,
					"reorderEnabled": true,
					"title": "",
					"width": 50,
					"content": [
						{
							"type": "stack",
							"header": {},
							"isClosable": true,
							"reorderEnabled": true,
							"title": "",
							"activeItemIndex": 0,
							"height": 60.69644164435681,
							"content": [
								{
									"title": "<i class=\"fas fa-eye\" /> Perspective",
									"type": "component",
									"componentName": "World",
									"componentState": {
										"camera": "perspective"
									},
									"isClosable": true,
									"reorderEnabled": true
								}
							]
						},
						{
							"type": "row",
							"isClosable": true,
							"reorderEnabled": true,
							"title": "",
							"height": 21.10272153555951,
							"content": [
								{
									"type": "stack",
									"header": {},
									"isClosable": true,
									"reorderEnabled": true,
									"title": "",
									"activeItemIndex": 0,
									"height": 25,
									"width": 50,
									"content": [
										{
											"title": "<i class=\"fas fa-arrow-down\" /> Top",
											"type": "component",
											"componentName": "World",
											"componentState": {
												"camera": "top"
											},
											"isClosable": true,
											"reorderEnabled": true
										}
									]
								},
								{
									"type": "stack",
									"header": {},
									"isClosable": true,
									"reorderEnabled": true,
									"title": "",
									"activeItemIndex": 0,
									"width": 50,
									"content": [
										{
											"title": "<i class=\"fas fa-arrow-right\" /> Front",
											"type": "component",
											"componentName": "World",
											"componentState": {
												"camera": "front"
											},
											"isClosable": true,
											"reorderEnabled": true
										}
									]
								}
							]
						},
						{
							"type": "stack",
							"header": {},
							"isClosable": true,
							"reorderEnabled": true,
							"title": "",
							"activeItemIndex": 0,
							"width": 50,
							"height": 18.20083682008368,
							"content": [
								{
									"title": "<i class=\"fas fa-play-circle\" /> Transport",
									"type": "component",
									"componentName": "Transport",
									"isClosable": true,
									"reorderEnabled": true
								}
							]
						}
					]
				},
				{
					"type": "column",
					"isClosable": true,
					"reorderEnabled": true,
					"title": "",
					"width": 50,
					"content": [
						{
							"type": "row",
							"isClosable": true,
							"reorderEnabled": true,
							"title": "",
							"height": 31.25,
							"content": [
								{
									"type": "stack",
									"header": {},
									"isClosable": true,
									"reorderEnabled": true,
									"title": "",
									"activeItemIndex": 0,
									"height": 31.25,
									"width": 50,
									"content": [
										{
											"title": "<i class=\"fas fa-file\" /> Import/Export",
											"type": "component",
											"componentName": "ImportExport",
											"isClosable": true,
											"reorderEnabled": true
										}
									]
								},
								{
									"type": "stack",
									"header": {},
									"isClosable": true,
									"reorderEnabled": true,
									"title": "",
									"activeItemIndex": 0,
									"width": 50,
									"content": [
										{
											"title": "<i class=\"fas fa-map-signs\" /> Navigator",
											"type": "component",
											"componentName": "Navigator",
											"isClosable": true,
											"reorderEnabled": true
										}
									]
								}
							]
						},
						{
							"type": "stack",
							"header": {},
							"isClosable": true,
							"reorderEnabled": true,
							"title": "",
							"activeItemIndex": 0,
							"height": 51.79794520547945,
							"content": [
								{
									"title": "<i class=\"fas fa-user-secret\" /> Inspector",
									"type": "component",
									"componentName": "Inspector",
									"isClosable": true,
									"reorderEnabled": true
								},
								{
									"title": "<i class=\"fas fa-weight\" /> AnglePlots",
									"type": "component",
									"componentName": "AnglePlots",
									"isClosable": true,
									"reorderEnabled": true
								}
							]
						},
						{
							"type": "stack",
							"width": 50,
							"isClosable": true,
							"reorderEnabled": true,
							"title": "",
							"activeItemIndex": 0,
							"height": 16.952054794520546,
							"content": [
								{
									"type": "component",
									"componentName": "ViewPalette",
									"componentState": {},
									"isClosable": false,
									"reorderEnabled": true,
									"title": "ViewPalette"
								}
							]
						}
					]
				}
			]
		}
	]
};

let viewPalette = [
	{
		buttonPreferences: {
			icon: `fas fa-file`
		},
		config: {
			title: 'Import/Export',
			type: 'component',
			componentName: 'ImportExport'
		}
	},
	{
		buttonPreferences: {
			icon: `fas fa-eye`
		},
		config: {
			title: 'Perspective',
			type: 'component',
			componentName: 'World',
			componentState: {
				"camera": "perspective"
			}
		}
	},
	{
		buttonPreferences: {
			icon: `fas fa-arrow-down`
		},
		config: {
			title: 'Top',
			type: 'component',
			componentName: 'World',
			componentState: {
				"camera": "top"
			}
		}
	},
	{
		buttonPreferences: {
			icon: `fas fa-arrow-right`
		},
		config: {
			title: 'Front',
			type: 'component',
			componentName: 'World',
			componentState: {
				"camera": "front"
			}
		}
	},
	{
		buttonPreferences: {
			icon: `fas fa-play-circle`
		},
		config: {
			title: 'Transport',
			type: 'component',
			componentName: 'Transport'
		}
	},
	{
		buttonPreferences: {
			icon: `fas fa-stream`
		},
		config: {
			title: 'Timeline',
			type: 'component',
			componentName: 'Timeline'
		}
	},
	{
		buttonPreferences: {
			icon: `fas fa-weight`
		},
		config: {
			title: 'AnglePlots',
			type: 'component',
			componentName: 'AnglePlots'
		}
	},
	{
		buttonPreferences: {
			icon: `fas fa-map-signs`
		},
		config: {
			title: 'Navigator',
			type: 'component',
			componentName: 'Navigator'
		}
	},
	{
		buttonPreferences: {
			icon: `fas fa-user-secret`
		},
		config: {
			title: 'Inspector',
			type: 'component',
			componentName: 'Inspector'
		}
	}
];

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
	Transport.register(goldenLayout);
	Navigator.register(goldenLayout);
	Inspector.register(goldenLayout);

	goldenLayout.registerComponent('Placeholder', function (container, componentState) {
		container.getElement().html('<h2>' + componentState.label + '</h2>');
	});

	goldenLayout.registerComponent('ViewPalette', function (container, componentState) {
		for (let viewPaletteItem of viewPalette) {
			let button = GuiUtils.makeButton(viewPaletteItem.config.title, viewPaletteItem.buttonPreferences);
			container.getElement().append(button);
			let config = viewPaletteItem.config;
			config.title = `<i class="${viewPaletteItem.buttonPreferences.icon}" /> ` + config.title;
			goldenLayout.createDragSource(button, viewPaletteItem.config);
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