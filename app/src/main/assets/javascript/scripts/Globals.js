const ids = {
  MAIN_CONTAINER: 'main-container',
  MAIN_MAP: 'main-map',
  MAIN_PLAYER: 'main-player',
  PLAYER_IMAGE_STYLE: 'player-image-style',
};

const parameters = {
  currentRecordingsPath: '',
};

const constants = {
  JQUERY_ORIGINAL_ELEMENT_INDEX: 0,
  INITIAL_LAT: 0.0,
  INITIAL_LON: 0.0,
  INVALID_VALUE: -500.0,
  DEFAULT_PLAYER_STARTING_INDEX: 0,
  DEFAULT_PLAYER_SPEED: 10,
  PLAYER_MAX_SPEED: 100,
  PLAYER_MIN_SPEED: 5,
  PLAYER_SPEED_JUMP: 5,
  PLAYER_SPEED_MULTIPLIER: 100,
  PLAYER_SPEED_DIVIDER: 10000,
  // Performance optimization constants
  IMAGE_POOL_SIZE: 10, // Number of images to keep in memory
  FRAME_SKIP_THRESHOLD: 20, // Speed threshold for frame skipping
  CANVAS_MAX_WIDTH: 1920, // Maximum canvas width for performance
  CANVAS_MAX_HEIGHT: 1080, // Maximum canvas height for performance
  LAZY_LOAD_AHEAD: 3, // Number of frames to preload ahead
  MEMORY_CLEANUP_INTERVAL: 5000, // Memory cleanup interval in ms
  MANUAL_SEEK_DELAY: 100, // Delay before resuming auto-playback after manual seeking (ms)
  SLIDER_DEBOUNCE_DELAY: 100, // Debounce delay for slider input to prevent rapid frame processing (ms)

  // Zoom tier configuration for dynamic resolution
  ZOOM_TIERS: [
    {
      minZoom: 20.0,
      maxZoom: 45.0,
      resolution: 1.0,
      name: 'Extreme zoom (2000%+) - full resolution',
    },
    {
      minZoom: 15.0,
      maxZoom: 20.0,
      resolution: 0.9,
      name: 'Ultra-high zoom (1500-2000%) - 90% resolution',
    },
    {
      minZoom: 10.0,
      maxZoom: 15.0,
      resolution: 0.8,
      name: 'Ultra zoom (1000-1500%) - 80% resolution',
    },
    {
      minZoom: 7.0,
      maxZoom: 10.0,
      resolution: 0.7,
      name: 'Very high zoom (700-1000%) - 70% resolution',
    },
    {
      minZoom: 5.0,
      maxZoom: 7.0,
      resolution: 0.6,
      name: 'High zoom (500-700%) - 60% resolution',
    },
    {
      minZoom: 3.0,
      maxZoom: 5.0,
      resolution: 0.55,
      name: 'Medium-high zoom (300-500%) - 55% resolution',
    },
    {
      minZoom: 2.0,
      maxZoom: 3.0,
      resolution: 0.5,
      name: 'Medium zoom (200-300%) - 50% resolution',
    },
    {
      minZoom: 1.5,
      maxZoom: 2.0,
      resolution: 0.45,
      name: 'Normal zoom (150-200%) - 45% resolution',
    },
    {
      minZoom: 1.0,
      maxZoom: 1.5,
      resolution: 0.4,
      name: 'Base zoom (100-150%) - 40% resolution',
    },
  ],
};

const zoomDict = {
  SCALE_FACTOR: 1.1,
  MIN_SCALE: 1,
  MAX_SCALE: 40,
  scale: 1.0,
};

const panDict = {
  translateX: 0,
  translateY: 0,
  newTranslateX: 0,
  newTranslateY: 0,
  isDragging: false,
};

let lastBoundedPositionDict = {
  x: 0,
  y: 0,
  originAndTranslateX: 0,
  originAndTranslateY: 0,
  scale: zoomDict.scale,
};

// This functions are used for async file selection.
let resumeFileSelection;
let resumeDirSelection;

const elements = {};
const mainContainer = (elements[ids.MAIN_CONTAINER] = $(
  `#${ids.MAIN_CONTAINER}`
));
const mainMap = (elements[ids.MAIN_MAP] = $(`#${ids.MAIN_MAP}`));
const mainPlayer = (elements[ids.MAIN_PLAYER] = $(`#${ids.MAIN_PLAYER}`));
