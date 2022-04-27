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
export function drawResultsPoses(ctx, poses) {
  for (const pose of poses) {
    drawResultPoses(ctx, pose);
  }
}

/**
 * Draw the keypoints and skeleton on the video.
 * @param pose A pose with keypoints to render.
 */
function drawResultPoses(ctx, pose) {
  if (pose.keypoints != null) {
    drawKeypointsPoses(ctx, pose.keypoints);
    drawSkeletonPoses(ctx, pose.keypoints, pose.id);
  }
}

/**
 * Draw the keypoints on the video.
 * @param keypoints A list of keypoints.
 */
function drawKeypointsPoses(ctx, keypoints) {
  const keypointInd =
      poseDetection.util.getKeypointIndexBySide(params.STATE.model);
  ctx.fillStyle = 'Red';
  ctx.strokeStyle = 'White';
  ctx.lineWidth = params.DEFAULT_LINE_WIDTH;

  for (const i of keypointInd.middle) {
    drawKeypointPoses(ctx, keypoints[i]);
  }

  ctx.fillStyle = 'Green';
  for (const i of keypointInd.left) {
    drawKeypointPoses(ctx, keypoints[i]);
  }

  ctx.fillStyle = 'Orange';
  for (const i of keypointInd.right) {
    drawKeypointPoses(ctx, keypoints[i]);
  }
}

function drawKeypointPoses(ctx, keypoint) {
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
function drawSkeletonPoses(ctx, keypoints, poseId) {
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
export function drawResultsHands(ctx, hands) {
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