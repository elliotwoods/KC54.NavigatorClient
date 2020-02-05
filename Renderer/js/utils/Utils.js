function addToDictionaryWithUniqueName(group, item) {
	if(item.name in group) {
		// Check if there's already a number
		let lastSpacePosition = item.name.lastIndexOf(' ');
		
		let nameTrunk = item.name;
		let lastWordAsNumber = 1;

		if(lastSpacePosition != -1) {
			let lastWord = item.name.substr(lastSpacePosition);
			let parseLastWordAsNumber = parseInt(lastWord);
			if(!isNaN(parseLastWordAsNumber)) {
				lastWordAsNumber = parseLastWordAsNumber;
				nameTrunk = item.name.substr(0, lastSpacePosition);
			}
		}

		while(item.name in group) {
			lastWordAsNumber++;
			item.name = nameTrunk + ' ' + lastWordAsNumber;
		}
	}
	group[item.name] = item;
}

export { addToDictionaryWithUniqueName }