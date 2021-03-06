import { ErrorHandler } from './ErrorHandler.js'

function isPromise(p) {
	return p && Object.prototype.toString.call(p) === "[object Promise]";
}

class GuiUtils {
	static makeButton(toolTip, preferences, action) {
		let buttonContent = null;
		let buttonPreferences = [];
		let buttonClasses = [];

		// customise based on preferences
		{
			if (preferences) {
				if (preferences.icon) {
					buttonContent = $(`<i class="${preferences.icon}" />`);
					buttonPreferences.push(`data-toggle="tooltip" data-placement="bottom" data-original-title="${toolTip}"`);
					buttonClasses.push("btn-icon");
				}
			}
		}

		if (!buttonContent) {
			buttonContent = $(`<span>${toolTip}</span>`);
		}

		let button = $(`<button type="button" class="btn btn-outline-secondary ${buttonClasses.join(" ")}" ${buttonPreferences.join(' ')}></button>`);
		button.append(buttonContent);
		button.click(async () => {
			button.tooltip("hide");

			if (action) {
				let actionIsAync = action.__proto__.constructor.name == "AsyncFunction";
				if (actionIsAync) {
					button.prop('disabled', true);
					button.addClass("btn-waiting");

					let busyIcon = $(`<span><i class="fas fa-spinner fa-pulse fa-xs" /></span>`);
					button.append(busyIcon);

					let cleanButton = () => {
						busyIcon.remove();

						button.removeClass("btn-waiting");
						button.prop('disabled', false);
					}

					await ErrorHandler.doAsync(action);
					cleanButton();
				}
				else {
					ErrorHandler.do(action);
				}
			}
		});

		return button;
	}

	static camelCapsToLong(camelCaps) {
		//https://stackoverflow.com/questions/4149276/how-to-convert-camelcase-to-camel-case
		// insert a space before all caps
		return camelCaps.replace(/([A-Z])/g, ' $1')
			// uppercase the first character
			.replace(/^./, function (str) { return str.toUpperCase(); })
	}

	static modalDialog(title, body, actions) {
		$("#modal_title").text(title);
		$("#modal_body").empty();
		$("#modal_body").append(body);

		$("#modal_footer").empty();
		if (actions) {
			for (let actionName in actions) {
				let methodNameLong = GuiUtils.camelCapsToLong(actionName);
				let button = $(`<button type="button" class="btn" data-dismiss="modal">${methodNameLong}</button>`);
				button.click(actions[actionName]);
				$("#modal_footer").append(button);
			}
		}

		//Dismiss button
		{
			let button = $(`<button type="button" class="btn btn-primary" data-dismiss="modal">Dismiss</button>`);
			$("#modal_footer").append(button);
		}

		// make it big if we've been passed a jquery html object
		if (typeof (body) == "object") {
			$("#modal_dialog").addClass("modal-lg");
		}
		else {
			$("#modal_dialog").removeClass("modal-lg");
		}

		$("#modal").modal();
	}
}

export { GuiUtils }