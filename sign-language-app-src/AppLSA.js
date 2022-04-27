import { Camera } from './Camera.js';
import { Canvas } from './Canvas.js';
import * as rec from './Recognition.js';
import { updateFPS } from "./fpsModule.js"; 

const camera = new Camera();
const canvas = new Canvas();

// Load Networks
rec.loadPoseNet(poseDetection.SupportedModels.MoveNet, {
  modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
});

rec.loadHandNet(handPoseDetection.SupportedModels.MediaPipeHands, {
  runtime: 'tfjs',
  modelType: 'lite'
})

// Event Listeners
camera.getVideo().addEventListener('loadeddata', function() {
    runInference(canvas, camera);
}, false);

const buttonStart = document.getElementById('b-start-webcam');
buttonStart.addEventListener('click', function() { 
  camera.start(canvas);
}, false);

const buttonStop = document.getElementById('b-stop-webcam');
buttonStop.addEventListener('click', function() { 
  camera.stop();
}, false);

async function runInference(canvas, camera) {
  const image = camera.getVideo();

  const poses = await rec.estimatePoses(image);
  const hands = await rec.estimateHands(image, {flipHorizontal: false});

  canvas.drawCameraFrame(camera);
  canvas.drawResultsPoses(poses);
  canvas.drawResultsHands(hands);

  updateFPS();

  requestAnimationFrame(() => runInference(canvas, camera));
}