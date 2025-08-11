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
  PLAYER_MIN_SPEED: 2,
  PLAYER_SPEED_JUMP: 2,
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
};

const zoomDict = {
  SCALE_FACTOR: 1.1,
  MIN_SCALE: 1,
  MAX_SCALE: 30,
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
