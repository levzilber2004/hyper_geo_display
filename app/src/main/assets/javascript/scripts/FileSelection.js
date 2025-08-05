// This function asks for a JSON file and starts the server.
async function askForJSONFile(options) {
  const path = await interfaceModule.file_selector(options);
  const wait = new Promise((resolve) => {
    resumeFileSelection = resolve;
  });
  if (typeof path == 'string') {
    continueFileSelection(path);
  }
  const result = await wait;
  return result;
}

// This function asks for a JSON file and starts the server.
async function askForRecordingDir(options) {
  const path = await interfaceModule.dir_selector(options);
  const wait = new Promise((resolve) => {
    resumeDirSelection = resolve;
  });
  if (typeof path == 'string') {
    continueDirSelection(path);
  }
  const result = await wait;
  return result;
}

// This function continues the askForJSONFile.
async function continueFileSelection(path) {
  const jsonText = await interfaceModule.read_json_as_text(path);
  if (resumeFileSelection) {
    resumeFileSelection({ path: path, jsonText: jsonText });
    resumeFileSelection = null; // prevent double calls.
  }
}

// This function continues the askForJSONFile.
async function continueDirSelection(path) {
  let jsonList;
  let jsonPath = path;

  // Checks if the path is of a recording or a dji.
  if (path.includes('recording_')) {
    const splitPath = path.split('recording_');
    jsonPath =
      splitPath[0].replace(/recordings/g, 'logs') +
      'recording_' +
      splitPath[1] +
      '.json';

    const jsonText = await interfaceModule.read_json_as_text(jsonPath);
    // Creates the jsonList and adds the file.
    jsonList = jsonText
      .split('}')
      .filter((s) => s.trim())
      .map((s) => {
        const jsonObject = JSON.parse(s + '}');
        jsonObject.file = jsonObject.timestamp + '.jpg';
        return jsonObject;
      });
  } else {
    const jsonText = await interfaceModule.read_dji_images(path);
    jsonList = JSON.parse(jsonText);
  }

  if (resumeDirSelection) {
    resumeDirSelection({ path: path, jsonList: jsonList });
    resumeDirSelection = null; // prevent double calls.
  }
}
