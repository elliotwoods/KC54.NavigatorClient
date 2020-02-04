const { ipcMain } = require('electron')
const { listUtils, callUtil } = require('./Utils.js')
const { document, settings} = require('./database.js')

ipcMain.on('listUtils', (event, arg) => {
	event.returnValue = listUtils();
});

ipcMain.on('callUtil', (event, arg) => {
	event.returnValue = callUtil(arg);
});

ipcMain.on("getTimelineZoomLevel", (event, arg) => {
	event.returnValue = settings
		.get('zoomLevel')
		.value();
});

ipcMain.on("getTimelineOutput", (event, arg) => {
	event.returnValue = document
		.get('outputFrames')
		.value();
});