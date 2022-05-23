import { updateFPS, fpsElement } from "./fpsModule.js";
import { Camera } from './Camera.js';
import { Canvas } from './Canvas.js';
import * as rec from './Recognition.js';
import { startTimer } from "./timerModule.js";

const MAX_FRAMES = 75; // Minimum length of video accepted by the model
const MIN_FRAMES = Math.ceil(MAX_FRAMES * 0.5); // Threshold of frames
const HALPE_SIZE = 136; // Total number of keypoints from Halpe dataset

const sleep = ms => new Promise(r => setTimeout(r, ms)); //Helper

const camera = new Camera();
const canvas = new Canvas();

let rafId = null;
let id = 0;
let frames = [];

const startButtonElement = document.getElementById('btn-start-webcam');
const spinOverlayElement = document.getElementById('overlay');
const toastModelsElement = document.getElementById('toast-models');
const toastFramesElement = document.getElementById('toast-frames');
const toastCameraElement = document.getElementById('toast-camera');
const progressBarElement = document.getElementById('progressbar-models');

// Load networks at the start
var detectorPoses, detectorHands, detectorFaces;
await (async function() {
detectorPoses = await
poseDetection.createDetector(poseDetection.SupportedModels.BlazePose, {
  runtime: 'mediapipe',
  solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/pose',
                // or 'base/node_modules/@mediapipe/pose' in npm.
  modelType: 'lite'
});
detectorHands = await
handPoseDetection.createDetector(handPoseDetection.SupportedModels.MediaPipeHands, {
  runtime: 'mediapipe',
  solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/hands',
                // or 'base/node_modules/@mediapipe/hands' in npm.
  modelType: 'lite'
});
detectorFaces = await
faceLandmarksDetection.createDetector(faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh, {
  runtime: 'mediapipe',
  solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh',
                // or 'base/node_modules/@mediapipe/face_mesh' in npm.
  refineLandmarks: false
});
})();

// Create WebGL context at the start
await (async function() {
const image = new Image(1, 1);
image.src = "data:image/gif;base64,R0lGODlhAQABAAAAACwAAAAAAQABAAA=";
await (rec.estimatePoses(detectorPoses, image, {}))
.then(async () => {
  progressBarElement.style.width = '50%';
  progressBarElement.textContent = 'Cargando Modelos: 50%';
  await sleep(1000);
});
await (rec.estimateHands(detectorHands, image, {}))
.then(async () => {
  progressBarElement.style.width = '75%';
  progressBarElement.textContent = 'Cargando Modelos: 75%';
  await sleep(1000);
});
await (rec.estimateFaces(detectorFaces, image, {}))
.then(async () => {
  progressBarElement.style.width = '100%';
  progressBarElement.textContent = 'Cargando Modelos: 100%';
  await sleep(1000);
});
await sleep(2000);
progressBarElement.parentNode.remove();
startButtonElement.disabled = false;
new bootstrap.Toast(toastModelsElement).show();
})();

// Event listeners
camera.getVideo().addEventListener('loadeddata', function() {
    captureFrames(5000);
}, false);

startButtonElement.addEventListener('click', function() {
  spinOverlayElement.classList.add('d-none');
  startButtonElement.disabled = true;
  countdown(document.getElementById('downcounter'), function() {
      camera.start(canvas, startButtonElement, toastCameraElement, spinOverlayElement);
  });
}, false);

// General purpose functions
function captureFrames(milliseconds) {
  camera.getVideo().hidden = false;

  startTimer(milliseconds);

  const clearAll = function() {
    window.cancelAnimationFrame(rafId);
    camera.stops();
    canvas.clear();
    id = 0;
    frames = []; //Clear Array
    camera.getVideo().hidden = true;
    fpsElement.innerText = '';
    startButtonElement.disabled = false;
    spinOverlayElement.classList.remove('d-none');
  }

  runInference(canvas, camera);

  setTimeout(function() {
    if (frames.length < MIN_FRAMES) {
      new bootstrap.Toast(toastFramesElement).show();
      clearAll();
      return;
    }

    if (frames.length < MAX_FRAMES) {
      interpolateFrames();
    }

    // Keep only 'keypoints' to reduce the size of the packet sent to the API
    frames.forEach((frame) => {
      delete frame.id; delete frame.timestamp; delete frame.delay;
      frame.keypoints.forEach((key) => { delete key.z; delete key.name; delete key.score; });
    });

    sendKeypointsToAPI();

    clearAll();
  }, milliseconds);
}

function interpolateFrames() {
  let framesInterpolated = [];

  // Sort descendent by 'delay' between frames
  let orderedFrames = frames.slice(0); //Copy Array
  orderedFrames.sort((a,b) => (a.delay > b.delay) ? -1 : ((b.delay > a.delay) ? 1 : 0));

  const numFramesLeft = MAX_FRAMES - frames.length;
  for (let i = 0; i < numFramesLeft; i++) {

    let keypointsInterpolated = [];
    const frameAct = frames[orderedFrames[i].id];
    const frameAnt = frames[orderedFrames[i].id - 1];

    for (let j = 0; j < HALPE_SIZE; j++) {
      keypointsInterpolated.push({
        x: (frameAct.keypoints[j].x + frameAnt.keypoints[j].x) * 0.5,
        y: (frameAct.keypoints[j].y + frameAnt.keypoints[j].y) * 0.5
      });
    }

    const frameInterpolated =
      { id: (-1) * frameAct.id,
        keypoints: keypointsInterpolated, timestamp: 0, delay: 0 };

    framesInterpolated.push(frameInterpolated);
  }

  // Sort "ascendent" (due to -1) by 'id'
  framesInterpolated.sort((a,b) => (a.id > b.id) ? -1 : ((b.id > a.id) ? 1 : 0));

  for (let i = 0; i < framesInterpolated.length; i++) {
    // Insert interpolated frames into the frames array in order
    frames.splice(framesInterpolated[i].id * (-1) + i, 0, framesInterpolated[i]);
  }
}

function sendKeypointsToAPI() {
  fetch('http://127.0.0.1:5000/model', {
    method: 'POST',
    headers: {
        'Content-type' : 'application/json'
    },
    body: JSON.stringify({
      frames: frames,
      timestamp: new Date().toLocaleString()
    })
  })
  .then((res) => res.json())
  .then((data) => console.log(data));
}

async function runInference(canvas, camera) {
  const image = camera.getVideo();

  canvas.clear();

  const promisePoses = rec.estimatePoses(detectorPoses, image, {enableSmoothing: true, flipHorizontal: false});
  const promiseHands = rec.estimateHands(detectorHands, image, {flipHorizontal: false});
  const promiseFaces = rec.estimateFaces(detectorFaces, image, {flipHorizontal: false});

  Promise.all([promisePoses, promiseHands, promiseFaces])
  .then((responses) => {
    const [poses, hands, faces] = responses;

    if (poses[0] == null)
      poses[0] = { keypoints: new Array(33).fill({x: 0.0, y: 0.0}) };
    if (hands[0] == null) //Right
      hands[0] = { keypoints: new Array(21).fill({x: 0.0, y: 0.0}) };
    if (hands[1] == null) //Left
      hands[1] = { keypoints: new Array(21).fill({x: 0.0, y: 0.0}) };
    if (faces[0] == null)
      faces[0] = { keypoints: new Array(468).fill({x: 0.0, y: 0.0}) };

    const neck_x = (poses[0].keypoints[0].x + poses[0].keypoints[12].x + poses[0].keypoints[11].x) / 3;
    const neck_y = (poses[0].keypoints[0].y + poses[0].keypoints[12].y + poses[0].keypoints[11].y) / 3;

    const hip_x = (poses[0].keypoints[24].x + poses[0].keypoints[23].x) * 0.5;
    const hip_y = (poses[0].keypoints[24].y + poses[0].keypoints[23].y) * 0.5;

    frames.push({
      id: id++,
      keypoints:
      [
        //body
        poses[0].keypoints[0], //Nose
        poses[0].keypoints[2], //LEye
        poses[0].keypoints[5], //REye
        poses[0].keypoints[7], //LEar
        poses[0].keypoints[8], //REar
        poses[0].keypoints[11], //LShoulder
        poses[0].keypoints[12], //RShoulder
        poses[0].keypoints[13], //LElbow
        poses[0].keypoints[14], //RElbow
        poses[0].keypoints[15], //LWrist
        poses[0].keypoints[16], //RWrist
        poses[0].keypoints[23], //LHip
        poses[0].keypoints[24], //RHip
        poses[0].keypoints[25], //LKnee
        poses[0].keypoints[26], //Rknee
        poses[0].keypoints[27], //LAnkle
        poses[0].keypoints[28], //RAnkle
        faces[0].keypoints[10], //Head (NOT EXIST)
        {x: neck_x, y: neck_y}, //Neck (NOT EXIST)
        {x: hip_x, y: hip_y}, //Hip  (NOT EXIST)
        poses[0].keypoints[31], //LBigToe
        poses[0].keypoints[32], //RBigToe
        poses[0].keypoints[31], //LSmallToe (NOT EXIST)
        poses[0].keypoints[32], //RSmallToe (NOT EXIST)
        poses[0].keypoints[29], //LHeel
        poses[0].keypoints[30], //RHeel
        //face
        //jaw
        faces[0].keypoints[143],//0
        faces[0].keypoints[116],//1
        faces[0].keypoints[123],//2
        faces[0].keypoints[213],//3
        faces[0].keypoints[192],//4
        faces[0].keypoints[169],//5
        faces[0].keypoints[170],//6
        faces[0].keypoints[171],//7
        faces[0].keypoints[175],//8
        faces[0].keypoints[396],//9
        faces[0].keypoints[395],//10
        faces[0].keypoints[394],//11
        faces[0].keypoints[416],//12
        faces[0].keypoints[433],//13
        faces[0].keypoints[152],//14
        faces[0].keypoints[345],//15
        faces[0].keypoints[372],//16
        //right eyebrow
        faces[0].keypoints[46],//17
        faces[0].keypoints[63],//18
        faces[0].keypoints[52],//19
        faces[0].keypoints[65],//20
        faces[0].keypoints[55],//21
        //left eyebrow
        faces[0].keypoints[285],//22
        faces[0].keypoints[295],//23
        faces[0].keypoints[282],//24
        faces[0].keypoints[293],//25
        faces[0].keypoints[276],//26
        //nose
        faces[0].keypoints[168],//27
        faces[0].keypoints[6],//28
        faces[0].keypoints[195],//29
        faces[0].keypoints[1],//30
        faces[0].keypoints[235],//31
        faces[0].keypoints[99],//32
        faces[0].keypoints[2],//33
        faces[0].keypoints[328],//34
        faces[0].keypoints[455],//35
        //right eye
        faces[0].keypoints[33],//36
        faces[0].keypoints[160],//37
        faces[0].keypoints[158],//38
        faces[0].keypoints[133],//39
        faces[0].keypoints[153],//40
        faces[0].keypoints[144],//41
        //left eye
        faces[0].keypoints[362],//42
        faces[0].keypoints[385],//43
        faces[0].keypoints[387],//44
        faces[0].keypoints[263],//45
        faces[0].keypoints[373],//46
        faces[0].keypoints[380],//47
        //mouth
        faces[0].keypoints[186],//48
        faces[0].keypoints[40],//49
        faces[0].keypoints[37],//50
        faces[0].keypoints[11],//51
        faces[0].keypoints[267],//52
        faces[0].keypoints[270],//53
        faces[0].keypoints[410],//54
        faces[0].keypoints[321],//55
        faces[0].keypoints[314],//56
        faces[0].keypoints[17],//57
        faces[0].keypoints[84],//58
        faces[0].keypoints[91],//59
        faces[0].keypoints[62],//60
        faces[0].keypoints[41],//61
        faces[0].keypoints[12],//62
        faces[0].keypoints[271],//63
        faces[0].keypoints[29],//64
        faces[0].keypoints[403],//65
        faces[0].keypoints[15],//66
        faces[0].keypoints[179],//67
        //left hand
        ...hands[1].keypoints,
        //right hand
        ...hands[0].keypoints,
      ],
      timestamp: Date.now()
    });
    // Add 'delay' property as the difference between two frames
    frames[frames.length-1]['delay']
      = (frames.length > 1) ? frames[frames.length-1]['timestamp'] - frames[frames.length-2]['timestamp'] : 0;

    canvas.drawKeypoints(frames[frames.length-1].keypoints);
  });

  updateFPS();

  rafId = window.requestAnimationFrame(() => runInference(canvas, camera));
}

function countdown( parent, callback ){

  // This is the function we will call every 1000 ms using setInterval

  function count(){

    if( paragraph ){

      // Remove the paragraph if there is one
      paragraph.remove();

    }

    if( texts.length === 0 ){

      // If we ran out of text, use the callback to get started
      // Also, remove the interval
      // Also, return since we dont want this function to run anymore.
      clearInterval( interval );
      callback();
      return;

    }

    // Get the first item of the array out of the array.
    // Your array is now one item shorter.
    var text = texts.shift();

    // Create a paragraph to add to the DOM
    // This new paragraph will trigger an animation
    paragraph = document.createElement("p");
    paragraph.textContent = text;
    paragraph.className = text + " nums";

    parent.appendChild( paragraph );

  }

  // These are all the text we want to display
  var texts = ['3', '2', '1'];

  // This will store the paragraph we are currently displaying
  var paragraph = null;

  // Initiate an interval, but store it in a variable so we can remove it later.
  var interval = setInterval( count, 1000 );

}