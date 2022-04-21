import {Camera} from './Camera.js';
import {Canvas} from './Canvas.js';
import * as app from './AppLSA.js';

const camera = new Camera();
const canvas = new Canvas();

// Load Networks
app.loadPoseNet(poseDetection.SupportedModels.MoveNet, {
  modelType: poseDetection.movenet.modelType.MULTIPOSE_LIGHTNING,
  enableTracking: true,
  trackerType: poseDetection.TrackerType.BoundingBox
});

app.loadHandNet(handPoseDetection.SupportedModels.MediaPipeHands, {
  runtime: 'tfjs',
})

// Event Listeners
camera.getVideo().addEventListener('loadeddata', function() {
  //setInterval(() => {
    app.runInference(canvas, camera);
  //}, 10);*/
}, false);

const buttonStart = document.getElementById('b-start-webcam');
buttonStart.addEventListener('click', function() { 
  camera.start(canvas);
}, false);

const buttonStop = document.getElementById('b-stop-webcam');
buttonStop.addEventListener('click', function() { 
  camera.stop();
}, false);