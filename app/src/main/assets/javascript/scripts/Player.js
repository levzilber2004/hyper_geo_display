// This function creates the main player with performance optimizations.
function createMainPlayer(mainPlayer, jsonList) {
  const labels = createPlayerLabels(mainPlayer);

  // Performance-optimized image management
  const imagePool = new Map(); // Keep only N images in memory
  const imageCache = new Map(); // Cache processed images
  let imageCounter = 0;
  let loadedImages = 0;
  // This function removes an image from the counter.
  window.removeImageFromCounter = () => {
    imageCounter--;
    if (imageCounter <= 0) {
      labels.counterContainer.remove();
    } else {
      labels.counterElement.text(loadedImages + '/' + jsonList.length);
    }
  };

  // Creates the optimized player canvas.
  const canvasElement = $(
    '<canvas class="player-canvas player-canvas-style"></canvas>'
  )[constants.JQUERY_ORIGINAL_ELEMENT_INDEX];
  const ctx = canvasElement.getContext('2d');

  // Enable canvas optimizations
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  mainPlayer.append(canvasElement);

  let pendingFrame = false;
  let lastFrameTime = 0;
  let frameSkipCount = 0;

  // Optimized image rendering with frame skipping for high speeds
  window.renderPlayerImage = (image, forceRender = false) => {
    if (pendingFrame && !forceRender) return;

    // Check if frame updates should be stopped (but allow manual seeking)
    // Always allow rendering when forceRender is true or when manually seeking
    if (window.stopFrameUpdates && !forceRender && !window.isManualSeek) {
      console.log(
        'renderPlayerImage blocked - stopFrameUpdates:',
        window.stopFrameUpdates,
        'forceRender:',
        forceRender,
        'window.isManualSeek:',
        window.isManualSeek
      );
      return;
    }

    // Complete block during manual seeking (except for the direct jump)
    if (window.blockAllFrameUpdates && !forceRender) {
      console.log('renderPlayerImage blocked - manual seeking in progress');
      return;
    }

    console.log(
      'renderPlayerImage proceeding - stopFrameUpdates:',
      window.stopFrameUpdates,
      'forceRender:',
      forceRender,
      'window.isManualSeek:',
      window.isManualSeek
    );

    const currentTime = performance.now();
    const timeSinceLastFrame = currentTime - lastFrameTime;

    // Frame skipping for high speeds to maintain smoothness
    if (!forceRender && window.currentSpeed > constants.FRAME_SKIP_THRESHOLD) {
      frameSkipCount++;
      if (frameSkipCount % 2 === 0) return; // Skip every other frame at high speeds
    }

    pendingFrame = true;
    const renderStartTime = performance.now();

    // Store the animation frame ID so we can cancel it if needed
    window.currentAnimationFrame = requestAnimationFrame(() => {
      // Double-check if we should still render (in case stop was called during the frame)
      if (window.stopFrameUpdates && !forceRender) {
        pendingFrame = false;
        return;
      }

      // Double-check blockAllFrameUpdates during animation frame
      if (window.blockAllFrameUpdates && !forceRender) {
        pendingFrame = false;
        return;
      }

      try {
        // Optimize canvas size for performance
        const targetWidth = Math.min(image.width, constants.CANVAS_MAX_WIDTH);
        const targetHeight = Math.min(
          image.height,
          constants.CANVAS_MAX_HEIGHT
        );

        if (
          canvasElement.width !== targetWidth ||
          canvasElement.height !== targetHeight
        ) {
          canvasElement.width = targetWidth;
          canvasElement.height = targetHeight;
        }

        // Use optimized drawing with proper scaling
        ctx.clearRect(0, 0, targetWidth, targetHeight);
        ctx.drawImage(image, 0, 0, targetWidth, targetHeight);

        const renderEndTime = performance.now();
        const frameTime = renderEndTime - renderStartTime;

        // Record performance metrics
        if (window.playerPerformanceMonitor) {
          window.playerPerformanceMonitor.recordFrameTime(frameTime);
          window.playerPerformanceMonitor.recordMemoryUsage();
        }

        lastFrameTime = performance.now();
        pendingFrame = false;
        frameSkipCount = 0;
      } catch (error) {
        console.error('Canvas rendering error:', error);
        pendingFrame = false;
      }
    });
  };

  // Smart image loading with pooling
  const loadImage = async (index, priority = false) => {
    if (imagePool.has(index)) return imagePool.get(index);

    return new Promise((resolve, reject) => {
      const image = new Image();
      image.draggable = false;
      // NO crossOrigin changes - keeping original working setup

      // Set loading priority
      if (priority) {
        image.fetchPriority = 'high';
      }

      image.onload = () => {
        loadedImages++;
        removeImageFromCounter();

        // Add to pool and cache
        imagePool.set(index, image);
        imageCache.set(index, {
          image: image,
          lastUsed: Date.now(),
          size: image.width * image.height * 4, // Approximate memory usage
        });

        // Manage pool size
        if (imagePool.size > constants.IMAGE_POOL_SIZE) {
          cleanupOldImages();
        }

        resolve(image);
      };

      image.onerror = () => {
        removeImageFromCounter();
        reject(new Error(`Failed to load image at index ${index}`));
      };

      image.src = `http://localhost:8000/${jsonList[index].file}`;
    });
  };

  // Memory management - remove least recently used images
  const cleanupOldImages = () => {
    if (imagePool.size <= constants.IMAGE_POOL_SIZE) return;

    const entries = Array.from(imageCache.entries());
    entries.sort((a, b) => a[1].lastUsed - b[1].lastUsed);

    const toRemove = entries.slice(
      0,
      imagePool.size - constants.IMAGE_POOL_SIZE
    );
    toRemove.forEach(([index]) => {
      imagePool.delete(index);
      imageCache.delete(index);
    });
  };

  // Lazy loading strategy - load images as needed
  const preloadImages = async (startIndex) => {
    const promises = [];
    for (let i = 0; i < constants.LAZY_LOAD_AHEAD; i++) {
      const index = startIndex + i;
      if (index < jsonList.length && !imagePool.has(index)) {
        promises.push(loadImage(index, i === 0)); // First image gets high priority
      }
    }
    return Promise.allSettled(promises);
  };

  // Initialize loading of first few images
  const initializeImageLoading = async () => {
    try {
      await preloadImages(0);
    } catch (error) {
      console.error('Initial image loading failed:', error);
    }
  };

  // Start loading images
  initializeImageLoading();

  // Memory cleanup interval
  setInterval(cleanupOldImages, constants.MEMORY_CLEANUP_INTERVAL);

  // Make imagePool globally accessible for dashboard
  window.imagePool = imagePool;

  // Create performance dashboard
  createPerformanceDashboard(mainPlayer);

  // This function creates the player interaction.
  createPlayerInteraction(
    mainPlayer,
    imagePool,
    jsonList,
    loadImage,
    preloadImages
  );

  // Creates the zoom and pan events.
  createZoomEvents(mainPlayer, canvasElement);
  createPanEvents(mainPlayer, canvasElement);
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
function createPlayerInteraction(
  mainPlayer,
  imagePool,
  jsonList,
  loadImage,
  preloadImages
) {
  let currentIndex = Math.max(
    0,
    Math.min(constants.DEFAULT_PLAYER_STARTING_INDEX, jsonList.length - 1)
  );
  let isRunning = true;
  let isManualSeek = false; // Flag to prevent auto-increment during manual seeking

  // Initialize global stop flag for frame updates
  window.stopFrameUpdates = false;
  // Make isManualSeek globally accessible for renderPlayerImage
  window.isManualSeek = isManualSeek;
  const playerPauseIcon = $(
    `<img class="player-icon" src="./../images/icon-pause.png" />`
  );

  const playerPlayIcon = $(
    `<img class="player-icon hidden-element" src="./../images/icon-play.png" />`
  );

  // Safety check for jsonList
  if (!jsonList || !Array.isArray(jsonList) || jsonList.length === 0) {
    console.error(
      'Invalid jsonList provided to createPlayerInteraction:',
      jsonList
    );
    return;
  }

  const playerSlider = $(
    `<input type="range" class="player-slider slider" min="0" max="${Math.max(
      0,
      jsonList.length - 1
    )}" value="${Math.max(
      0,
      Math.min(currentIndex, Math.max(0, jsonList.length - 1))
    )}" />`
  );

  let currentSpeed = constants.DEFAULT_PLAYER_SPEED;
  // Make currentSpeed globally accessible for frame skipping
  window.currentSpeed = currentSpeed;
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

      if (!isRunning) {
        // Immediately clear the interval when stopping to prevent frame rolling
        clearInterval(playerInterval);
        // Reset manual seek flag when stopping to ensure clean state
        isManualSeek = false;
        window.isManualSeek = isManualSeek; // Update global flag
        // Set a flag to prevent automatic frame updates from executing
        window.stopFrameUpdates = true;
        // Force stop any pending requestAnimationFrame calls
        if (window.currentAnimationFrame) {
          cancelAnimationFrame(window.currentAnimationFrame);
          window.currentAnimationFrame = null;
        }
      } else {
        // Clear the stop flag when resuming
        window.stopFrameUpdates = false;
        // IMPORTANT: Sync currentIndex with slider position when resuming
        // This ensures the player starts from where the slider is positioned
        const sliderIndex = parseInt(playerSlider.val());
        if (
          !isNaN(sliderIndex) &&
          sliderIndex >= 0 &&
          sliderIndex < jsonList.length
        ) {
          currentIndex = sliderIndex;
          console.log('Resuming playback from slider position:', currentIndex);
        }
        // Restart the interval when resuming
        playerInterval = setInterval(() => {
          playerIntervalFunction();
        }, constants.PLAYER_SPEED_DIVIDER / currentSpeed);
      }

      playerPauseIcon.toggleClass('hidden-element');
      playerPlayIcon.toggleClass('hidden-element');
    }
  });

  // Debounce timer for slider input to prevent rapid frame processing
  let sliderDebounceTimer = null;

  playerSlider.on('input', async (event) => {
    const parsedIndex = parseInt(event.target.value);
    if (isNaN(parsedIndex)) {
      console.warn('Slider value is not a valid number:', event.target.value);
      return;
    }

    console.log(
      'Slider moved to index:',
      parsedIndex,
      'Current flags - stopFrameUpdates:',
      window.stopFrameUpdates,
      'isManualSeek:',
      isManualSeek
    );

    // Clear any existing debounce timer
    if (sliderDebounceTimer) {
      clearTimeout(sliderDebounceTimer);
    }

    // Set manual seek flag to prevent auto-increment
    isManualSeek = true;
    window.isManualSeek = isManualSeek;

    // Debounce the actual frame update - only process after user stops dragging
    sliderDebounceTimer = setTimeout(async () => {
      console.log(
        'Debounce timer expired - processing frame update to:',
        parsedIndex
      );

      // Jump directly to the target frame without playing intermediate frames
      currentIndex = parsedIndex;

      // Force immediate render of the target frame without going through updateDataBasedOnIndex
      try {
        // Load image directly from pool or load it if not available
        let image = imagePool.get(parsedIndex);
        if (!image) {
          image = await loadImage(parsedIndex, true); // High priority for current frame
        }

        if (image) {
          // Render the image immediately
          renderPlayerImage(image, true);

          // Update location data directly
          if (jsonList[parsedIndex]) {
            updateLocation(
              jsonList[parsedIndex].file,
              jsonList[parsedIndex].timestamp.replace(/_/g, ' '),
              parseFloat(jsonList[parsedIndex].latitude),
              parseFloat(jsonList[parsedIndex].longitude),
              parseFloat(jsonList[parsedIndex].yaw),
              parseFloat(jsonList[parsedIndex].pitch),
              parseFloat(jsonList[parsedIndex].roll)
            );
          }

          // Keep slider at the user's intended position
          playerSlider.val(parsedIndex);
          console.log(
            'Successfully jumped directly to index:',
            currentIndex,
            'Slider kept at user position:',
            parsedIndex
          );
        } else {
          console.log(
            'Failed to load image for direct jump to index:',
            parsedIndex
          );
        }
      } catch (error) {
        console.error('Error during direct jump to frame:', error);
      }

      // Set a global flag to completely block ALL frame processing during manual seeking
      window.blockAllFrameUpdates = true;

      // Reset flag after a short delay to allow normal playback to resume
      setTimeout(() => {
        isManualSeek = false;
        window.isManualSeek = isManualSeek;
        window.blockAllFrameUpdates = false;
        console.log(
          'Reset manual seek flag and blockAllFrameUpdates after delay'
        );
      }, constants.MANUAL_SEEK_DELAY);
    }, constants.SLIDER_DEBOUNCE_DELAY); // Use constant for debounce delay
  });
  mainPlayer.append(playerPauseIcon);
  mainPlayer.append(playerPlayIcon);
  mainPlayer.append(playerSlider);
  mainPlayer.append(numberContainer);

  // This function updates the data based on the index.
  const updateDataBasedOnIndex = async (givenIndex) => {
    console.log(
      'updateDataBasedOnIndex called with index:',
      givenIndex,
      'stopFrameUpdates:',
      window.stopFrameUpdates,
      'isManualSeek:',
      isManualSeek,
      'blockAllFrameUpdates:',
      window.blockAllFrameUpdates,
      'currentIndex before update:',
      currentIndex
    );

    // Check if frame updates should be stopped (but allow manual seeking)
    if (window.stopFrameUpdates && !isManualSeek) {
      console.log(
        'updateDataBasedOnIndex blocked - stopFrameUpdates:',
        window.stopFrameUpdates,
        'isManualSeek:',
        isManualSeek
      );
      return currentIndex;
    }

    // Complete block during manual seeking
    if (window.blockAllFrameUpdates) {
      console.log(
        'updateDataBasedOnIndex blocked - manual seeking in progress'
      );
      return currentIndex;
    }

    // Additional safety check for invalid index
    if (typeof givenIndex !== 'number' || isNaN(givenIndex)) {
      console.error(
        'Invalid index provided to updateDataBasedOnIndex:',
        givenIndex
      );
      return currentIndex; // Return current index instead of invalid one
    }

    const index = Math.max(0, Math.min(givenIndex, jsonList.length - 1));

    // Safety check for jsonList bounds
    if (!jsonList[index]) {
      console.error(
        'Index out of bounds:',
        index,
        'jsonList length:',
        jsonList.length
      );
      return currentIndex;
    }

    // Load image from pool or load it if not available
    let image = imagePool.get(index);
    if (!image) {
      try {
        // Check again if we should stop before loading (but allow manual seeking)
        if (window.stopFrameUpdates && !isManualSeek) {
          return currentIndex;
        }

        image = await loadImage(index, true); // High priority for current frame

        // Check again after loading (but allow manual seeking)
        if (window.stopFrameUpdates && !isManualSeek) {
          return currentIndex;
        }

        // Preload upcoming images
        preloadImages(index + 1);
      } catch (error) {
        console.error('Failed to load image at index:', index, error);
        return currentIndex; // Return current index on error
      }
    }

    // Safety check for image
    if (!image) {
      console.error('Failed to get or load image for index:', index);
      return currentIndex;
    }

    // Final check before rendering (but allow manual seeking)
    if (window.stopFrameUpdates && !isManualSeek) {
      return currentIndex;
    }

    // Force render when manually seeking to ensure it works even when stopped
    renderPlayerImage(image, isManualSeek);

    // Check again before updating location (but allow manual seeking)
    if (window.stopFrameUpdates && !isManualSeek) {
      return currentIndex;
    }

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

  // Helper function to sync slider position with current index
  const syncSliderPosition = () => {
    if (typeof currentIndex === 'number' && !isNaN(currentIndex)) {
      playerSlider.val(currentIndex);
    }
  };

  // This function updates the data based on the current index.
  const playerIntervalFunction = () => {
    if (!isRunning) return;

    // Check if frame updates should be stopped globally
    if (window.stopFrameUpdates) return;

    // Complete block during manual seeking
    if (window.blockAllFrameUpdates) {
      console.log(
        'playerIntervalFunction blocked - manual seeking in progress'
      );
      return;
    }

    // Don't auto-increment if manual seeking is happening
    // This prevents any interference during manual seeking
    if (isManualSeek) {
      console.log(
        'playerIntervalFunction blocked - manual seeking in progress'
      );
      return;
    }

    // Safety check: ensure currentIndex is within bounds
    if (currentIndex < 0 || currentIndex >= jsonList.length) {
      currentIndex = Math.max(0, Math.min(currentIndex, jsonList.length - 1));
      console.log('Corrected out-of-bounds currentIndex to:', currentIndex);
    }

    updateDataBasedOnIndex(currentIndex);
    // Only sync slider position when NOT manually seeking
    // This prevents the slider from "jumping back" during manual seeking
    if (!isManualSeek) {
      syncSliderPosition();
    }
    currentIndex++;
  };

  let playerInterval = setInterval(() => {
    playerIntervalFunction();
  }, constants.PLAYER_SPEED_DIVIDER / currentSpeed);

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
    // Update global variable for frame skipping
    window.currentSpeed = currentSpeed;
    speedNumber.text(getCurrentSpeedText());
    updatePlayerInterval();
  };

  leftButton.on('click', () => changeSpeed(-constants.PLAYER_SPEED_JUMP));
  rightButton.on('click', () => changeSpeed(constants.PLAYER_SPEED_JUMP));

  // Utility function to force stop all frame updates
  window.forceStopPlayer = () => {
    isRunning = false;
    isManualSeek = false;
    window.isManualSeek = isManualSeek; // Update global flag
    window.stopFrameUpdates = true;
    clearInterval(playerInterval);
    if (window.currentAnimationFrame) {
      cancelAnimationFrame(window.currentAnimationFrame);
      window.currentAnimationFrame = null;
    }
  };
}

// Performance monitoring and dashboard
class PerformanceMonitor {
  constructor() {
    this.frameTimes = [];
    this.memoryUsage = [];
    this.maxSamples = 60; // Keep last 60 samples
  }

  recordFrameTime(frameTime) {
    this.frameTimes.push(frameTime);
    if (this.frameTimes.length > this.maxSamples) {
      this.frameTimes.shift();
    }
  }

  recordMemoryUsage() {
    if (window.imagePool) {
      const poolSize = window.imagePool.size;
      const totalMemory = Array.from(window.imagePool.values()).reduce(
        (total, img) => {
          return total + img.width * img.height * 4; // Approximate memory usage
        },
        0
      );

      this.memoryUsage.push({
        poolSize,
        totalMemory: Math.round(totalMemory / (1024 * 1024)), // Convert to MB
      });

      if (this.memoryUsage.length > this.maxSamples) {
        this.memoryUsage.shift();
      }
    }
  }

  getAverageFPS() {
    if (this.frameTimes.length === 0) return 0;
    const avgFrameTime =
      this.frameTimes.reduce((sum, time) => sum + time, 0) /
      this.frameTimes.length;
    return Math.round(1000 / avgFrameTime);
  }

  getCurrentMemoryUsage() {
    if (this.memoryUsage.length === 0) return { poolSize: 0, totalMemory: 0 };
    return this.memoryUsage[this.memoryUsage.length - 1];
  }
}

// Create and display performance dashboard
function createPerformanceDashboard(mainPlayer) {
  // Initialize performance monitor
  window.playerPerformanceMonitor = new PerformanceMonitor();

  // Create dashboard overlay
  const dashboard = $(`
    <div class="performance-dashboard hidden-element">
      <div class="dashboard-header">Performance Monitor</div>
      <div class="dashboard-content">
        <div class="metric">
          <span class="metric-label">FPS:</span>
          <span class="metric-value" id="fps-display">0</span>
        </div>
        <div class="metric">
          <span class="metric-label">Pool Size:</span>
          <span class="metric-value" id="pool-size-display">0</span>
        </div>
        <div class="metric">
          <span class="metric-label">Memory:</span>
          <span class="metric-value" id="memory-display">0 MB</span>
        </div>
      </div>
      <div class="dashboard-toggle">Press P to toggle</div>
    </div>
  `);

  mainPlayer.append(dashboard);

  // Add keyboard shortcut to toggle dashboard
  $(document).on('keydown', function (event) {
    if (event.key.toLowerCase() === 'p') {
      dashboard.toggleClass('hidden-element');
    }
  });

  // Update dashboard every 500ms
  setInterval(() => {
    const fps = window.playerPerformanceMonitor.getAverageFPS();
    const memory = window.playerPerformanceMonitor.getCurrentMemoryUsage();

    $('#fps-display').text(fps);
    $('#pool-size-display').text(memory.poolSize);
    $('#memory-display').text(memory.totalMemory + ' MB');
  }, 500);
}
