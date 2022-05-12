import { Camera } from './Camera.js';
import { Canvas } from './Canvas.js';
import * as rec from './Recognition.js';
import { updateFPS } from "./fpsModule.js"; 

const camera = new Camera();
const canvas = new Canvas();

let keypoints = [];

// Load Networks
/*rec.loadPoseNet(poseDetection.SupportedModels.MoveNet, {
  modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
});

rec.loadHandNet(handPoseDetection.SupportedModels.MediaPipeHands, {
  runtime: 'tfjs',
  modelType: 'lite'
});

rec.loadFaceNet(faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh, {
  runtime: 'tfjs',
  refineLandmarks: false
});*/

var detectorPoses, detectorHands, detectorFaces;
(async function() {
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

// Event Listeners
camera.getVideo().addEventListener('loadeddata', function() {
    runInference(canvas, camera);
    setTimeout(
      setInterval(function() {
        fetch('https://jsonplaceholder.typicode.com/posts', {
          method: 'POST',
          headers: {
              'Accept': 'application/json, text/plain, */*',
              'Content-type' : 'application/json'
          },
          body: JSON.stringify({
            keypoints: keypoints, //[0]
            timestamp: new Date().toLocaleString()
          })
        })
        .then((res) => res.json())
        .then((data) => console.log(data));
        keypoints = [];
      }, 5000)
    , 5000);
}, false);

const buttonStart = document.getElementById('btn-start-webcam');
buttonStart.addEventListener('click', function() { 
  document.getElementById('overlay').remove();
  countdown(document.getElementById('downcounter'), function() {
    camera.start(canvas);
  });
}, false);

const buttonStops = document.getElementById('btn-stops-webcam');
buttonStops.addEventListener('click', function() { 
  camera.stops();
}, false);

async function runInference(canvas, camera) {
  canvas.clear();
  
  const image = camera.getVideo();

  const promisePoses = rec.estimatePoses(detectorPoses, image, {enableSmoothing: true, flipHorizontal: false});
  const promiseHands = rec.estimateHands(detectorHands, image, {flipHorizontal: false});
  const promiseFaces = rec.estimateFaces(detectorFaces, image, {flipHorizontal: false});

  //canvas.drawCameraFrame(camera);

  Promise.all([promisePoses, promiseHands, promiseFaces])
  .then((responses) => {
    const [poses, hands, faces] = responses;

    if (poses[0] != null) delete poses[0].keypoints3D;
    if (hands[0] != null) delete hands[0].keypoints3D;
    if (hands[1] != null) delete hands[1].keypoints3D;
    if (faces[0] != null) delete faces[0].box;
    //hands.forEach((hand) => delete hand.keypoints3D);

    if (poses[0] != null) poses[0].keypoints.forEach((key) => { delete key.z; delete key.name; delete key.score; });
    if (hands[0] != null) hands[0].keypoints.forEach((key) => { delete key.z; delete key.name; });
    if (hands[1] != null) hands[1].keypoints.forEach((key) => { delete key.z; delete key.name; });
    if (faces[0] != null) faces[0].keypoints.forEach((key) => { delete key.z; delete key.name; });

    keypoints.push({
      posesKeypoints: poses, 
      handsKeypoints: hands,
      facesKeypoints: faces,
    });

    canvas.drawResultsPoses(poses);
    canvas.drawResultsHands(hands);
    canvas.drawResultsFaces(faces);
  });

  updateFPS();

  requestAnimationFrame(() => runInference(canvas, camera));
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