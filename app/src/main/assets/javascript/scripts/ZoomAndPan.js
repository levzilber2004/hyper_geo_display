// Global zoom state tracking
let isZooming = false;
let lastTouchDistance = null;
let pinchZoomRaf = null;
let pinchZoomPending = false;
let pinchZoomEvent = null;

// This function updates the last bounded position dictionary.
function updateLastBoundedPositionDict(boundedPosition) {
  Object.assign(lastBoundedPositionDict, boundedPosition);
}

// Function to reset zoom state when needed
function resetZoomState() {
  isZooming = false;
  lastTouchDistance = null;
  pinchZoomPending = false;
  pinchZoomEvent = null;
  if (pinchZoomRaf) {
    cancelAnimationFrame(pinchZoomRaf);
    pinchZoomRaf = null;
  }
}

// Function to check if currently zooming
function isCurrentlyZooming() {
  return isZooming || lastTouchDistance !== null;
}

// Creates scroll wheel zoom events for a container.
function createZoomEvents(container, canvas) {
  // Initial cursor grabbing.
  container.css('cursor', 'grabbing');

  // Touch pinch zoom for mobile devices.
  // Note: Variables are now declared globally above

  // Add touch events for devices with touch.
  container.on('touchstart', function (event) {
    if (event.touches.length === 2) {
      isZooming = true; // Mark that we're starting to zoom
      lastTouchDistance = Math.hypot(
        event.touches[0].clientX - event.touches[1].clientX,
        event.touches[0].clientY - event.touches[1].clientY
      );
      console.log('Zoom started, isZooming:', isZooming); // Debug log
    }
  });

  // This function handles the pinch zoom.
  function handlePinchZoom() {
    if (!pinchZoomEvent) return;
    const event = pinchZoomEvent;

    const currentDistance = Math.hypot(
      event.touches[0].clientX - event.touches[1].clientX,
      event.touches[0].clientY - event.touches[1].clientY
    );
    const scaleChange = currentDistance / lastTouchDistance;

    zoomDict.scale *= scaleChange;
    zoomDict.scale = Math.max(
      zoomDict.MIN_SCALE,
      Math.min(zoomDict.MAX_SCALE, zoomDict.scale)
    );

    const boundedPosition = getBoundedPosition(
      panDict.translateX,
      panDict.translateY,
      container.height(),
      container.width(),
      canvas.offsetHeight,
      canvas.offsetWidth,
      zoomDict.scale
    );
    panDict.translateX = boundedPosition.x;
    panDict.translateY = boundedPosition.y;

    updateLastBoundedPositionDict(boundedPosition);
    updateImageStyle(boundedPosition);

    lastTouchDistance = currentDistance;
    pinchZoomPending = false;
    pinchZoomEvent = null;
  }

  // Add touch events for devices with touch.
  container.on('touchmove', function (event) {
    if (event.touches.length === 2 && lastTouchDistance !== null) {
      event.preventDefault();
      isZooming = true; // Ensure we're still zooming
      pinchZoomEvent = event;
      if (!pinchZoomPending) {
        pinchZoomPending = true;
        pinchZoomRaf = requestAnimationFrame(handlePinchZoom);
      }
    }
  });

  // Add touch events for devices with touch.
  container.on('touchend touchcancel', function (event) {
    if (event.touches.length < 2) {
      // If we were zooming and now have fewer than 2 touches, stop zooming
      if (isZooming) {
        console.log('Zoom ended, resetting in 150ms'); // Debug log
        // Small delay to prevent immediate pan activation
        setTimeout(() => {
          resetZoomState();
          console.log('Zoom state reset complete'); // Debug log
        }, 150);
      }
    }
  });

  // Adds the scroll wheel zoom event.
  container.on('wheel', function (event) {
    event.preventDefault();
    zoomDict.scale *=
      event.originalEvent.deltaY < 0
        ? zoomDict.SCALE_FACTOR
        : 1 / zoomDict.SCALE_FACTOR;
    zoomDict.scale = Math.max(
      zoomDict.MIN_SCALE,
      Math.min(zoomDict.MAX_SCALE, zoomDict.scale)
    );

    const boundedPosition = getBoundedPosition(
      panDict.translateX,
      panDict.translateY,
      container.height(),
      container.width(),
      canvas.offsetHeight,
      canvas.offsetWidth,
      zoomDict.scale
    );
    panDict.translateX = boundedPosition.x;
    panDict.translateY = boundedPosition.y;

    // Updates the result labels.
    updateLastBoundedPositionDict(boundedPosition);
    updateImageStyle(boundedPosition);
  });
}

// Creates drag move events for a container.
function createPanEvents(container, canvas) {
  let isMouseDown = false;
  let dragStartX = 0;
  let dragStartY = 0;

  // Mouse down event.
  container.on('mousedown', function (event) {
    const target = event.target;
    if (
      !target.classList.contains('player-icon') &&
      !target.classList.contains('player-slider') &&
      !isCurrentlyZooming() // Don't allow mouse panning during touch zoom
    ) {
      isMouseDown = true;
      dragStartX = event.clientX;
      dragStartY = event.clientY;
      container.css('cursor', 'grabbing');
    }
  });

  // Mouse move event.
  container.on('mousemove', (event) => {
    if (isMouseDown && !isCurrentlyZooming()) {
      panDict.isDragging = true;
      const deltaX = event.clientX - dragStartX;
      const deltaY = event.clientY - dragStartY;

      const newTranslateX = panDict.translateX + deltaX / zoomDict.scale;
      const newTranslateY = panDict.translateY + deltaY / zoomDict.scale;

      const boundedPosition = getBoundedPosition(
        newTranslateX,
        newTranslateY,
        container.height(),
        container.width(),
        canvas.offsetHeight,
        canvas.offsetWidth,
        zoomDict.scale
      );

      updateLastBoundedPositionDict(boundedPosition);
      updateImageStyle(boundedPosition);

      panDict.translateX = boundedPosition.x;
      panDict.translateY = boundedPosition.y;

      dragStartX = event.clientX;
      dragStartY = event.clientY;
    }
  });

  // Mouse up event
  container.on('mouseup mouseleave', (e) => {
    if (isMouseDown) {
      isMouseDown = false;
      setTimeout(() => {
        panDict.isDragging = false;
      }, 0);
      container.css('cursor', 'grab');
    }
  });

  // Touch pan support.
  let isTouchPanning = false;
  let lastTouchX = 0;
  let lastTouchY = 0;
  let touchStartTime = 0; // Track when touch started

  // Touch start.
  container.on('touchstart', function (event) {
    if (event.touches.length === 1) {
      // Don't start panning if we're currently zooming or just finished zooming
      if (isCurrentlyZooming()) {
        console.log('Pan blocked - currently zooming or zoom state active'); // Debug log
        return;
      }

      // Don't start panning if the touch target is any player control
      const target = event.target;
      if (
        target.classList.contains('player-slider') ||
        target.closest('.player-slider') !== null ||
        target.classList.contains('player-icon') ||
        target.closest('.player-icon') !== null
      ) {
        console.log('Pan blocked - touching player control'); // Debug log
        return;
      }

      isTouchPanning = true;
      lastTouchX = event.touches[0].clientX;
      lastTouchY = event.touches[0].clientY;
      touchStartTime = Date.now();
      container.css('cursor', 'grabbing');
      console.log('Pan started, isZooming:', isZooming); // Debug log
    }
  });

  // Touch move.
  container.on('touchmove', function (event) {
    // Double-check that we're not zooming before allowing pan movement
    if (isTouchPanning && event.touches.length === 1 && !isCurrentlyZooming()) {
      // Extra safety check - don't pan if touching any player control
      const target = event.target;
      if (
        target.classList.contains('player-slider') ||
        target.closest('.player-slider') !== null ||
        target.classList.contains('player-icon') ||
        target.closest('.player-icon') !== null
      ) {
        console.log('Pan move blocked - touching player control'); // Debug log
        return;
      }

      event.preventDefault();

      panDict.isDragging = true;
      const touch = event.touches[0];
      const deltaX = touch.clientX - lastTouchX;
      const deltaY = touch.clientY - lastTouchY;

      const newTranslateX = panDict.translateX + deltaX / zoomDict.scale;
      const newTranslateY = panDict.translateY + deltaY / zoomDict.scale;

      const boundedPosition = getBoundedPosition(
        newTranslateX,
        newTranslateY,
        container.height(),
        container.width(),
        canvas.offsetHeight,
        canvas.offsetWidth,
        zoomDict.scale
      );

      updateLastBoundedPositionDict(boundedPosition);
      updateImageStyle(boundedPosition);

      panDict.translateX = boundedPosition.x;
      panDict.translateY = boundedPosition.y;

      lastTouchX = touch.clientX;
      lastTouchY = touch.clientY;
    }
  });

  // Touch cancel.
  container.on('touchend touchcancel', function (event) {
    if (isTouchPanning && event.touches.length === 0) {
      isTouchPanning = false;
      setTimeout(() => {
        panDict.isDragging = false;
      }, 0);
      container.css('cursor', 'grab');
    }

    // If we have no touches left and were zooming, ensure zoom state is reset
    if (event.touches.length === 0 && isZooming) {
      console.log('No touches left, resetting zoom state'); // Debug log
      isZooming = false;
    }
  });
}

// Gets the bounded position based on parameters.
function getBoundedPosition(
  x,
  y,
  containerHeight,
  containerWidth,
  imageHeight,
  imageWidth,
  zoomScale
) {
  // OAT stands for origin and translate.
  let scaleMarginOATY = Math.abs(
    (containerHeight - imageHeight * zoomScale) / 2
  );
  let scaleMarginOATX = Math.abs((containerWidth - imageWidth * zoomScale) / 2);

  // Limits the x and y values with the origin and translate scale margin.
  const scaledX = Math.min(scaleMarginOATX, Math.max(-scaleMarginOATX, x));
  const scaledY = Math.min(scaleMarginOATY, Math.max(-scaleMarginOATY, y));

  // Creates the origin and translate.
  const originAndTranslateX = scaledX - scaledX * (1 - zoomScale);
  const originAndTranslateY = scaledY - scaledY * (1 - zoomScale);

  // Creates the scale margin for the x and y.
  const scaleMarginX =
    originAndTranslateX !== 0
      ? Math.abs((scaleMarginOATX * scaledX) / originAndTranslateX)
      : scaleMarginOATX;
  const scaleMarginY =
    originAndTranslateY !== 0
      ? Math.abs((scaleMarginOATY * scaledY) / originAndTranslateY)
      : scaleMarginOATY;

  // Limits the origin and translate x by its scale margin.
  const scaledOATX = Math.min(
    scaleMarginOATX,
    Math.max(-scaleMarginOATX, originAndTranslateX)
  );
  const scaledOATY = Math.min(
    scaleMarginOATY,
    Math.max(-scaleMarginOATY, originAndTranslateY)
  );

  // Creates the drag difference for incase the user puts a very high x and y value, to remove those values from the drag
  // the calculation adds the symbol of the y, if its negative ydif will be negative, if positive ydif will be positive.
  const xDifference =
    (x !== 0 ? Math.abs(x) / x : 1) * Math.max(Math.abs(x) - scaleMarginX, 0);
  const yDifference =
    (y !== 0 ? Math.abs(y) / y : 1) * Math.max(Math.abs(y) - scaleMarginY, 0);

  return {
    x: Math.min(scaleMarginX, Math.max(-scaleMarginX, scaledX)),
    y: Math.min(scaleMarginY, Math.max(-scaleMarginY, scaledY)),
    originAndTranslateX: scaledOATX,
    originAndTranslateY: scaledOATY,
    scale: zoomScale,
    xDifference: xDifference,
    yDifference: yDifference,
  };
}

// This function updates the image style.
function updateImageStyle(boundPosition) {
  const id = ids.PLAYER_IMAGE_STYLE;

  // Remove old style if it exists.
  $(`#${id}`).remove();

  // Creates and appends new style.
  $('<style>', {
    id: id,
    text: `
        .player-canvas {
          transform: translate(${boundPosition.originAndTranslateX}px, ${boundPosition.originAndTranslateY}px) scale(${boundPosition.scale});
        }
      `,
  }).appendTo('head');
}
