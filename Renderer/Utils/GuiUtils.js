class GuiUtils {
	static makeButton(toolTip, preferences) {
		let buttonContent = null;
		let buttonPreferences = [];
		let buttonClasses = [];
	
		// customise based on preferences
		{
			if(preferences) {
				if(preferences.icon) {
					buttonContent = `<i class="${preferences.icon}" />`;
					buttonPreferences.push(`data-toggle="tooltip" data-placement="left" data-original-title="${toolTip}"`);
					buttonClasses.push("btn-icon");
				}
			}
		}
	
		if(!buttonContent) {
			buttonContent = toolTip;
		}
		
		let button = $(`<button type="button" class="btn btn-outline-secondary ${buttonClasses.join(" ")}" ${buttonPreferences.join(' ')}></button>`);
		button.append(buttonContent);

		return button;
	}
}

export { GuiUtils }