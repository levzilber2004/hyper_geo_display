// This function creates the main player.
function createMainPlayer(mainPlayer, jsonList) {
  const labels = createPlayerLabels(mainPlayer);

  const jsonImages = [];
  let imageCounter = 0;
  // This function removes an image from the counter.
  window.removeImageFromCounter = () => {
    imageCounter--;
    if (imageCounter <= 0) {
      labels.counterContainer.remove();
    } else {
      labels.counterElement.text(
        jsonImages.length - imageCounter + '/' + jsonImages.length
      );
    }
  };

  // Creates the player canvas.
  const canvas = $('<canvas class="player-image player-image-style"></canvas>');
  const ctx = canvas[constants.JQUERY_ORIGINAL_ELEMENT_INDEX].getContext('2d');
  mainPlayer.append(canvas);
  window.renderPlayerImage = (image) => {
    // Sets the canvas size to match the image size.
    canvas.attr('width', image.width);
    canvas.attr('height', image.height);

    // Draws the image on the canvas.
    ctx.clearRect(0, 0, image.width, image.height);
    ctx.drawImage(image, 0, 0);
  };

  jsonList.forEach((element) => {
    const image = new Image();
    image.draggable = false;
    image.src = `http://localhost:8000/${element.file}`;

    image.onload = () => {
      removeImageFromCounter();
    };

    image.onerror = () => {
      removeImageFromCounter();
    };
    jsonImages.push(image);
    imageCounter++;
  });

  // This function creates the player interaction.
  createPlayerInteraction(mainPlayer, jsonImages, jsonList);

  // Creates the zoom and pan events.
  createZoomEvents(mainPlayer, canvas[constants.JQUERY_ORIGINAL_ELEMENT_INDEX]);
  createPanEvents(mainPlayer, canvas[constants.JQUERY_ORIGINAL_ELEMENT_INDEX]);
}

// This function creates the player labels.
function createPlayerLabels(mainPlayer) {
  const counterContainer = $(
    '<aside class="box-shadow-element player-label">LOADING IMAGES &gt; </aside>'
  );
  const counterElement = $('<span class="green-color">0/0</span>');
  counterContainer.append(counterElement);
  mainPlayer.append(counterContainer);
  return {
    counterContainer: counterContainer,
    counterElement: counterElement,
  };
}

// This function creates the player buttons and slider interaction as well as starting the player.
function createPlayerInteraction(mainPlayer, jsonImages, jsonList) {
  let currentIndex = constants.DEFAULT_PLAYER_STARTING_INDEX;
  let isRunning = true;
  const playerPauseIcon = $(
    `<img class="player-icon" src="./../images/icon-pause.png" />`
  );

  const playerPlayIcon = $(
    `<img class="player-icon hidden-element" src="./../images/icon-play.png" />`
  );

  const playerSlider = $(
    `<input type="range" class="player-slider slider" min="0" max="${
      jsonImages.length - 1
    }" value="${currentIndex}" />`
  );

  let currentSpeed = constants.DEFAULT_PLAYER_SPEED;
  const getCurrentSpeedText = () => {
    // 10 is the floor number.
    return Math.floor(currentSpeed / 10) + '.' + (currentSpeed % 10);
  };

  // Create container for number and buttons.
  const numberContainer = $(
    '<div class="box-shadow-element player-speed-container speed-element"></div>'
  );
  const leftButton = $(
    '<button class="box-shadow-element pop-button speed-button speed-element">-</button>'
  );

  const speedText = $(
    '<span class="box-shadow-element player-speed-text speed-element">SPEED &gt; <span>'
  );
  const speedNumber = $(
    `<span class="green-color speed-element">${getCurrentSpeedText()}</span>`
  );
  speedText.append(speedNumber);
  const rightButton = $(
    '<button class="box-shadow-element pop-button speed-button speed-element">+</button>'
  );
  numberContainer.append(leftButton, speedText, rightButton);

  mainPlayer.click((event) => {
    if (!panDict.isDragging) {
      if (
        event.target.classList.contains('player-slider') ||
        event.target.classList.contains('speed-element')
      )
        return;
      isRunning = !isRunning;
      playerPauseIcon.toggleClass('hidden-element');
      playerPlayIcon.toggleClass('hidden-element');
    }
  });

  playerSlider.on('input', (event) => {
    const index = parseInt(event.target.value);
    currentIndex = updateDataBasedOnIndex(index);
  });
  mainPlayer.append(playerPauseIcon);
  mainPlayer.append(playerPlayIcon);
  mainPlayer.append(playerSlider);
  mainPlayer.append(numberContainer);

  // This function updates the data based on the index.
  const updateDataBasedOnIndex = (givenIndex) => {
    const index = Math.max(0, Math.min(givenIndex, jsonImages.length - 1));
    renderPlayerImage(jsonImages[index]);
    updateLocation(
      jsonList[index].file,
      jsonList[index].timestamp.replace(/_/g, ' '),
      parseFloat(jsonList[index].latitude),
      parseFloat(jsonList[index].longitude),
      parseFloat(jsonList[index].yaw),
      parseFloat(jsonList[index].pitch),
      parseFloat(jsonList[index].roll)
    );
    return index;
  };

  // This function updates the data based on the current index.
  const playerIntervalFunction = () => {
    if (!isRunning) return;
    if (currentIndex >= jsonImages.length) {
      currentIndex = 0;
    }
    updateDataBasedOnIndex(currentIndex);
    playerSlider.val(currentIndex);
    currentIndex++;
  };

  let playerInterval = setInterval(() => {
    playerIntervalFunction();
  }, currentSpeed * constants.PLAYER_SPEED_MULTIPLIER);

  // This function updates the player interval based on the current speed.
  const updatePlayerInterval = () => {
    clearInterval(playerInterval);
    playerInterval = setInterval(() => {
      playerIntervalFunction();
    }, constants.PLAYER_SPEED_DIVIDER / currentSpeed);
  };

  // This function changes the speed of the player.
  const changeSpeed = (delta) => {
    currentSpeed = Math.min(
      Math.max(constants.PLAYER_MIN_SPEED, currentSpeed + delta),
      constants.PLAYER_MAX_SPEED
    );
    speedNumber.text(getCurrentSpeedText());
    updatePlayerInterval();
  };

  leftButton.on('click', () => changeSpeed(-constants.PLAYER_SPEED_JUMP));
  rightButton.on('click', () => changeSpeed(constants.PLAYER_SPEED_JUMP));
}
