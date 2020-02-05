const { ipcRenderer } = require('electron')

function openDirectoryDialog(properties) {
	return ipcRenderer.sendSync("openDirectoryDialog", properties);
}

export { openDirectoryDialog }