//--------------------
// GET USER MEDIA CODE
//--------------------

class Camera {
  constructor() {
    this.video = document.querySelector('video');
  }

  startWebcam(canvas) {
    var self = this;
    if (navigator.getUserMedia) {
      navigator.getUserMedia(
        // constraints
        {
        video: true,
        audio: false
        },
        // successCallback
        async function(localMediaStream) {
          self.video.srcObject = localMediaStream;
          self.webcamStream = localMediaStream;

          const {width, height} = camera.getWidthHeight();
          canvas.setWidthHeight(width, height); //callback
        },
        // errorCallback
        function(err) {
          console.log("The following error occured: " + err);
        });
    } else {
      console.log("getUserMedia not supported");
    }
  }

  stopWebcam() {
    this.webcamStream.getTracks().forEach(function(track) {
      track.stop();
    });
  }

  getWidthHeight() {
    return this.webcamStream.getTracks()[0].getSettings();
  }

  getFrame() {
    return this.video;
  }

  setWidthHeight(width, height) {
    this.video.width = width;
    this.video.height = height;
  }
}

//---------------------
// TAKE A SNAPSHOT CODE
//---------------------

class Canvas {
  constructor() {
    // Get the canvas and obtain a context for drawing in it
    this.canvas = document.querySelector('canvas');
    this.ctx = this.canvas.getContext('2d');
  }

  getContext() {
    return this.ctx;
  }

  setWidthHeight(width, height) {
    this.canvas.width = width;
    this.canvas.height = height;
  }

  drawFrame(camera) {
    // Draws current image from the video element into the canvas
    this.ctx.drawImage(camera.getFrame(), 0,0, this.canvas.width, this.canvas.height);
  }
}

async function init() {
  // Load networks
  const detectorConfigPoses = {
    modelType: poseDetection.movenet.modelType.MULTIPOSE_LIGHTNING,
    enableTracking: true,
    trackerType: poseDetection.TrackerType.BoundingBox
  };
  detectorPoses = await poseDetection.createDetector(poseDetection.SupportedModels.MoveNet, detectorConfigPoses);

  const model = handPoseDetection.SupportedModels.MediaPipeHands;
  const detectorConfigHands = {
    runtime: 'tfjs',
  };
  detectorHands = await handPoseDetection.createDetector(model, detectorConfigHands);
}

class AppLSA {
  static async run(camera, canvas) {
    // Loop, detect poses and draw them on canvas
    window.setInterval(async () => {
      const image = camera.getFrame();

      // Make detections
      const poses = await detectorPoses.estimatePoses(image);
      //console.log(poses);

      const estimationConfig = {flipHorizontal: false};
      const hands = await detectorHands.estimateHands(image, estimationConfig);
      //console.log(hands);

      // Draw mesh and update drawing utility
      canvas.drawFrame(camera);
      drawResults(canvas.getContext(), poses);
      drawResultsHands(canvas.getContext(), hands);
    }, 10);
  }
}

const camera = new Camera();
const canvas = new Canvas();

init();
AppLSA.run(camera, canvas);

function startWebcam(){
  camera.startWebcam(canvas);
}

function stopWebcam(){
  camera.stopWebcam();
}

//---------------------------------------------------------
//----------------------DRAW POSES-------------------------
//---------------------------------------------------------

const DEFAULT_LINE_WIDTH = 2;
const DEFAULT_RADIUS = 4;

const STATE = {
  model: '',
  modelConfig: {}
};

const MOVENET_CONFIG = {
  scoreThreshold: 0.3,
  enableTracking: false
};

STATE.modelConfig = {...MOVENET_CONFIG};
STATE.model = poseDetection.SupportedModels.MoveNet;

const params = { STATE, DEFAULT_LINE_WIDTH, DEFAULT_RADIUS };

// #ffffff - White
// #800000 - Maroon
// #469990 - Malachite
// #e6194b - Crimson
// #42d4f4 - Picton Blue
// #fabed4 - Cupid
// #aaffc3 - Mint Green
// #9a6324 - Kumera
// #000075 - Navy Blue
// #f58231 - Jaffa
// #4363d8 - Royal Blue
// #ffd8b1 - Caramel
// #dcbeff - Mauve
// #808000 - Olive
// #ffe119 - Candlelight
// #911eb4 - Seance
// #bfef45 - Inchworm
// #f032e6 - Razzle Dazzle Rose
// #3cb44b - Chateau Green
// #a9a9a9 - Silver Chalice
const COLOR_PALETTE = [
  '#ffffff', '#800000', '#469990', '#e6194b', '#42d4f4', '#fabed4', '#aaffc3',
  '#9a6324', '#000075', '#f58231', '#4363d8', '#ffd8b1', '#dcbeff', '#808000',
  '#ffe119', '#911eb4', '#bfef45', '#f032e6', '#3cb44b', '#a9a9a9'
];
 
/**
 * Draw the keypoints and skeleton on the video.
 * @param poses A list of poses to render.
 */
function drawResults(ctx, poses) {
  for (const pose of poses) {
    drawResult(ctx, pose);
  }
}

/**
 * Draw the keypoints and skeleton on the video.
 * @param pose A pose with keypoints to render.
 */
function drawResult(ctx, pose) {
  if (pose.keypoints != null) {
    drawKeypoints(ctx, pose.keypoints);
    drawSkeleton(ctx, pose.keypoints, pose.id);
  }
}

/**
 * Draw the keypoints on the video.
 * @param keypoints A list of keypoints.
 */
function drawKeypoints(ctx, keypoints) {
  const keypointInd =
      poseDetection.util.getKeypointIndexBySide(params.STATE.model);
  ctx.fillStyle = 'Red';
  ctx.strokeStyle = 'White';
  ctx.lineWidth = params.DEFAULT_LINE_WIDTH;

  for (const i of keypointInd.middle) {
    drawKeypoint(ctx, keypoints[i]);
  }

  ctx.fillStyle = 'Green';
  for (const i of keypointInd.left) {
    drawKeypoint(ctx, keypoints[i]);
  }

  ctx.fillStyle = 'Orange';
  for (const i of keypointInd.right) {
    drawKeypoint(ctx, keypoints[i]);
  }
}

function drawKeypoint(ctx, keypoint) {
  // If score is null, just show the keypoint.
  const score = keypoint.score != null ? keypoint.score : 1;
  const scoreThreshold = params.STATE.modelConfig.scoreThreshold || 0;

  if (score >= scoreThreshold) {
    const circle = new Path2D();
    circle.arc(keypoint.x, keypoint.y, params.DEFAULT_RADIUS, 0, 2 * Math.PI);
    ctx.fill(circle);
    ctx.stroke(circle);
  }
}

/**
 * Draw the skeleton of a body on the video.
 * @param keypoints A list of keypoints.
 */
function drawSkeleton(ctx, keypoints, poseId) {
  // Each poseId is mapped to a color in the color palette.
  const color = params.STATE.modelConfig.enableTracking && poseId != null ?
      COLOR_PALETTE[poseId % 20] :
      'White';
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = params.DEFAULT_LINE_WIDTH;

  poseDetection.util.getAdjacentPairs(params.STATE.model).forEach(([
                                                                    i, j
                                                                  ]) => {
    const kp1 = keypoints[i];
    const kp2 = keypoints[j];

    // If score is null, just show the keypoint.
    const score1 = kp1.score != null ? kp1.score : 1;
    const score2 = kp2.score != null ? kp2.score : 1;
    const scoreThreshold = params.STATE.modelConfig.scoreThreshold || 0;

    if (score1 >= scoreThreshold && score2 >= scoreThreshold) {
      ctx.beginPath();
      ctx.moveTo(kp1.x, kp1.y);
      ctx.lineTo(kp2.x, kp2.y);
      ctx.stroke();
    }
  });
}

//---------------------------------------------------------
//----------------------DRAW HANDS-------------------------
//---------------------------------------------------------

const fingerLookupIndices = {
  thumb: [0, 1, 2, 3, 4],
  indexFinger: [0, 5, 6, 7, 8],
  middleFinger: [0, 9, 10, 11, 12],
  ringFinger: [0, 13, 14, 15, 16],
  pinky: [0, 17, 18, 19, 20],
}; // for rendering each finger as a polyline

const connections = [
  [0, 1], [1, 2], [2, 3], [3,4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [0, 9], [9, 10], [10, 11], [11, 12],
  [0, 13], [13,14], [14, 15], [15, 16],
  [0, 17], [17, 18],[18, 19], [19,20]
];

/**
 * Draw the keypoints on the video.
 * @param hands A list of hands to render.
 */
function drawResultsHands(ctx, hands) {
  // Sort by right to left hands.
  hands.sort((hand1, hand2) => {
    if (hand1.handedness < hand2.handedness) return 1;
    if (hand1.handedness > hand2.handedness) return -1;
    return 0;
  });

  // Pad hands to clear empty scatter GL plots.
  while (hands.length < 2) hands.push({});

  for (let i = 0; i < hands.length; ++i) {
    // Third hand and onwards scatterGL context is set to null since we
    // don't render them.
    drawResultHands(ctx, hands[i]);
  }
}

/**
 * Draw the keypoints on the video.
 * @param hand A hand with keypoints to render.
 * @param ctxt Scatter GL context to render 3D keypoints to.
 */
function drawResultHands(ctx, hand) {
  if (hand.keypoints != null) {
    drawKeypointsHands(ctx, hand.keypoints, hand.handedness);
  }
}

/**
 * Draw the keypoints on the video.
 * @param keypoints A list of keypoints.
 * @param handedness Label of hand (either Left or Right).
 */
function drawKeypointsHands(ctx, keypoints, handedness) {
  const keypointsArray = keypoints;
  ctx.fillStyle = handedness === 'Left' ? 'Red' : 'Blue';
  ctx.strokeStyle = 'White';
  ctx.lineWidth = params.DEFAULT_LINE_WIDTH;

  for (let i = 0; i < keypointsArray.length; i++) {
    const y = keypointsArray[i].x;
    const x = keypointsArray[i].y;
    drawPointHands(ctx, x - 2, y - 2, 3);
  }

  const fingers = Object.keys(fingerLookupIndices);
  for (let i = 0; i < fingers.length; i++) {
    const finger = fingers[i];
    const points = fingerLookupIndices[finger].map(idx => keypoints[idx]);
    drawPathHands(ctx, points, false);
  }
}

function drawPathHands(ctx, points, closePath) {
  const region = new Path2D();
  region.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    const point = points[i];
    region.lineTo(point.x, point.y);
  }

  if (closePath) {
    region.closePath();
  }
  ctx.stroke(region);
}

function drawPointHands(ctx, y, x, r) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, 2 * Math.PI);
  ctx.fill();
}