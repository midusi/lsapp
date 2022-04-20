 //--------------------
  // GET USER MEDIA CODE
  //--------------------
  navigator.getUserMedia = ( navigator.getUserMedia ||
    navigator.webkitGetUserMedia ||
    navigator.mozGetUserMedia ||
    navigator.msGetUserMedia);

var video;
var webcamStream;

function startWebcam() {
if (navigator.getUserMedia) {
navigator.getUserMedia (

// constraints
{
video: true,
audio: false
},

// successCallback
function(localMediaStream) {
video = document.querySelector('video');
video.srcObject=localMediaStream;
webcamStream = localMediaStream;

// const canvas = document.querySelector('canvas');
// canvas.width = video.videoWidth;
// canvas.height = video.videoHeight;

},

// errorCallback
function(err) {
console.log("The following error occured: " + err);
}
);
} else {
console.log("getUserMedia not supported");
}  
}

function stopWebcam() {
webcamStream.stop();
}
//---------------------
// TAKE A SNAPSHOT CODE
//---------------------
var canvas, ctx;

function init() {
// Get the canvas and obtain a context for
// drawing in it
canvas = document.getElementById("myCanvas");
ctx = canvas.getContext('2d');
}

function snapshot() {
// Draws current image from the video element into the canvas
ctx.drawImage(video, 0,0, canvas.width, canvas.height);
}

// var intervalID = window.setInterval(miFuncion, 500, 'Parametro 1', 'Parametro 2');

async function run(){
  const model = poseDetection.SupportedModels.MoveNet;
  const detector = await poseDetection.createDetector(model);

  var intervalID = window.setInterval(async () => {

    ctx.drawImage(video, 0,0, canvas.width, canvas.height);

    // Make detections
    image = video;
    poses = await detector.estimatePoses(image);
    console.log(poses);

    // Draw mesh and update drawing utility
    drawResults(ctx, poses);
  }, 10);
}

run();

function miFuncion(a,b) {
  // Aquí va tu código
  // Los parámetros son opcionales completamente
  console.log(a);
  console.log(b);
}

async function getwh() {
let stream = await navigator.mediaDevices.getUserMedia({video: true});
let {width, height} = stream.getTracks()[0].getSettings();
console.log(`${width}x${height}`); // 640x480
}

getwh();















/////////////

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