const stackTrace = require('stack-trace');
import { GuiUtils } from "./GuiUtils.js"

class ErrorHandler {
	static showError(action, error) {
		let report = $("<span />");

		report.append(`<h3>${error.message}</h3>`);

		{
			let trace = stackTrace.parse(error);
			let table = $(`<table class="table table-hover">
				<thead>
					<tr>
						<th scope="col">Line</th>
						<th scope="col">Column</th>
						<th scope="col">Filename</th>
					</tr>
				</thead>
			</table>`);
			let tableBody = $(`<tbody />`).appendTo(table);
			for(let traceLine of trace) {
				tableBody.append(`<tr>
					<td>${traceLine.lineNumber}</td>
					<td>${traceLine.columnNumber}</td>
					<td>${traceLine.fileName}</td>
				</tr>`);
			}
			report.append(table);
		}

		GuiUtils.modalDialog(action.name + " : Error", report);
	}

	static do(action) {
		try {
			return action(...arguments);
		}
		catch(error) {
			ErrorHandler.showError(action, error);
		}
	}

	static async doAsync(action) {
		try {
			return await action(...arguments);
		}
		catch(error) {
			ErrorHandler.showError(action, error);
		}
	}
}

export { ErrorHandler }