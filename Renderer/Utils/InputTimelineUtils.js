class InputTimelineUtils {
	static sortKeyFrames(track) {
		track.keyFrames = track.keyFrames.sort((a, b) => a.frameIndex - b.frameIndex)
	}

	static syncAttributesBetweenKeyFrames(track) {
		// all attributes should be present in the first keyFrame

		if(track.keyFrames.length == 0) {
			return;
		}

		// gather all content into merged data 
		let content = {};
		for(let keyFrame of track.keyFrames) {
			content = {...keyFrame.content, ...content}
		}

		// put the merged data into first keyframe
		track.keyFrames[0].content = content;
	}

	static getPaths(object) {
		let keys = Object.keys(object);
		keys = keys.map(key => [key]); // paths are arrays
		let paths = [];
		for(let key of keys) {
			if(typeof(object[key]) == "object") {
				paths = [...paths, ...InputTimelineUtils.getPaths(object[key]).map(subPath => [key, ...subPath])];
			}
			else {
				paths = [...paths, key];
			}
		}
		return paths;
	}

	static pathToPathString(path) {
		return path.join("/");
	}

	static pathStringToPath(pathString) {
		return pathString.split("/");
	}

	static objectContainsPath(object, path) {
		if(!(path[0] in object)) {
			return false;
		}
		if(path.length > 1) {
			if(typeof(object[path[0]]) == "object") {
				return InputTimelineUtils.objectContainsPath(object[path[0]], path.slice(1));
			}
			else {
				return false;
			}
		}
		else {
			return true;
		}
	}

	static valueAtPath(object, path) {
		if(path.length == 1) {
			return object[path[0]];
		}
		else {
			return InputTimelineUtils.valueAtPath(object[path[0]], path.slice(1));
		}
	}

	static keyFramesPerPath(track, path) {
		let result = {};
		let pathString = this.pathToPathString(path);
		result= []; // we shouldn't need to check if we already have this path in result. all paths should be unique on arrival
		for(let keyFrame of track.keyFrames) {
			if(InputTimelineUtils.objectContainsPath(keyFrame.content, path)) {
				result.push({
					frameIndex : keyFrame.frameIndex,
					value : InputTimelineUtils.valueAtPath(keyFrame.content, path)
				});
			}
		}
		return result;
	}

	static setObjectAtPath(object, path, value) {
		if(path.length == 1) {
			object[path[0]] = value;
		}
		else {
			if(!(path[0] in object)) {
				object[path[0]] = {};
			}
			InputTimelineUtils.setObjectAtPath(object[path[0]], path.slice(1), value);
		}
	}

	static flattenPathObject(pathResult) {
		let result = {};

		for(let pathString in pathResult) {
			let path = InputTimelineUtils.pathStringToPath(pathString);
			InputTimelineUtils.setObjectAtPath(result, path, pathResult[pathString]);
		}

		return result;
	}

	static calculateTrackFrame(track, frameIndex) {
		InputTimelineUtils.syncAttributesBetweenKeyFrames(track);

		if(track.keyFrames.length == 0) {
			return {};
		}
		// FIRST
		else if(frameIndex <= track.keyFrames[0].frameIndex) {
			return track.keyFrames[0].content;
		}

		// Clamp frameIndex for last
		let lastFrameIndex = track.keyFrames[track.keyFrames.length - 1].frameIndex;
		if(frameIndex > lastFrameIndex) {
			trackIndex = lastFrameIndex;
		}

		// TWEEN
		// paths of all variables in track
		let paths = InputTimelineUtils.getPaths(track.keyFrames[0].content); //<-- sync function above pushes everything into first
		let pathStrings = paths.map(path => InputTimelineUtils.pathToPathString(path));

		// find out where all instances of path are (some of this SHOULD be cached per track on edit, rather than on playback)
		let keyFramesPerPaths = {};
		for(let path of paths) {
			keyFramesPerPaths[this.pathToPathString(path)] = InputTimelineUtils.keyFramesPerPath(track, path);
		}

		let result = {};
		for(let pathString of pathStrings) {
			let keyFrames = keyFramesPerPaths[pathString];

			// Clamp to first frame
			if(frameIndex <= keyFrames[0].frameIndex) {
				result[pathString] = keyFrames[0].value;
			}
			// Clamp to last frame
			else if(frameIndex >= keyFrames[keyFrames.length - 1].frameIndex) {
				result[pathString] = keyFrames[keyFrames.length - 1].value;
			}
			else {
				// TWEEN

				// Gather relevant keyframes
				let earlier = null;
				let later = null;
				for(let keyFrame of keyFrames) {
					if(keyFrame.frameIndex > frameIndex) {
						later = keyFrame;
						break;
					}
					else {
						earlier = keyFrame;
					}
				}

				let crossFadeValue = (frameIndex - earlier.frameIndex) / (later.frameIndex - earlier.frameIndex);

				// cross fade
				switch(typeof(earlier.value)) {
					// ONLY NUMBER TWEENING IS SUPPORTED RIGHT NOW
					case "number":
						result[pathString] = (later.value - earlier.value) * crossFadeValue + earlier.value;
						break;
					default:
						result[pathString] = earlier.value;
				}
			}
		}
		return InputTimelineUtils.flattenPathObject(result);
	}

	static getTrackObjectiveType(track) {
		let name = 'Empty Track';
		for(let keyFrame of track.keyFrames) {
			try {
				name = keyFrame.content.objective.type;
			}
			catch {
				continue;
			}
			break;
		}
		return name;
	}
}

export { InputTimelineUtils }