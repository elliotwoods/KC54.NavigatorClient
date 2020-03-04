const stackTrace = require('stack-trace');
import { GuiUtils } from "./GuiUtils.js"

import { ServerError } from './ServerError.js'

class ErrorHandler {
	static showError(action, error) {
		let report = $("<span />");

		if(error instanceof ServerError) {
			report.append(`<h3>Server error : ${error.message}</h3>`);

			let table = $(`<table class="table table-hover">
				<thead>
					<tr>
						<th scope="col">Line</th>
						<th scope="col">Filename</th>
						<th scope="col">Class / methodName</th>
					</tr>
				</thead>
			</table>`);
			let tableBody = $(`<tbody />`).appendTo(table);
			for(let traceLine of error.stackTrace) {
				tableBody.append(`<tr>
					<td>${traceLine.lineNumber}</td>
					<td>${traceLine.fileName}</td>
					<td>
						${traceLine.declaringClass} <br />
						<b>${traceLine.methodName}</b>
					</td>
				</tr>`);
			}
			report.append(table);
		} 
		else {
			report.append(`<h3>${error.message}</h3>`);

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