// This function triggers the main events.
function main() {
  try {
    // Loads the python interface.
    new QWebChannel(qt.webChannelTransport, async function (channel) {
      // Set up the bridge.
      interfaceModule = channel.objects.bridge;
      // Set up the js commands from python.
      interfaceModule.sendJsCommand.connect(function (command) {
        eval(command);
      });
      loadMainElements(
        mainContainer,
        {
          title: 'Select a recordings directory',
          method: 'dir_selector',
        }, //jsonOptions.
        true, //runThread.
        true //awaitedServerCheck.
      );
    });
  } catch {
    // Loads the android interface.
    loadMainElements(
      mainContainer,
      {
        title: 'Select a recordings directory',
        method: 'dir_selector',
      }, //jsonOptions.
      false, //runThread.
      false //awaitedServerCheck.
    );
  }
}

// This function loads the main elements.
async function loadMainElements(
  mainContainer,
  jsonOptions,
  runThread,
  awaitedServerCheck
) {
  // Loads the main map.
  loadMainMap(mainContainer, ids.MAIN_MAP);

  // Creates the attribution elements.
  createAttributionElements(mainContainer);

  // Ask for recordings folder.
  const jsonData = await askForRecordingDir(jsonOptions);

  parameters.currentRecordingsPath = jsonData.path + '/';

  // Start the server and checks if it runs it on a thread or not.
  if (runThread) {
    interfaceModule.run_thread(
      'start_server',
      parameters.currentRecordingsPath
    );
  } else {
    interfaceModule.start_server(parameters.currentRecordingsPath);
  }

  const createElements = () => {
    createMainPlayer(mainPlayer, jsonData.jsonList);
    loadDronePath(jsonData.jsonList);
    clearInterval(waitUntilServerStarted);
  };

  // Creates the main player after awaiting for it with different methods.
  const waitUntilServerStarted = awaitedServerCheck
    ? setInterval(() => {
        interfaceModule.has_server_started().then((hasStarted) => {
          if (hasStarted) {
            // Loads the main player.
            createElements();
          }
        });
      }, 100)
    : setInterval(() => {
        const hasStarted = interfaceModule.has_server_started();
        if (String(hasStarted).trim().toLowerCase() === 'true') {
          createElements();
        }
      }, 100);
}

main();
