const { ipcMain } = require('electron')

ipcMain.on("openDirectoryDialog", (event, args) => {
	let result = dialog.showOpenDialogSync(args);
	return result;
});