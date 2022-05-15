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

//const image = document.createElement('canvas').getContext('2d').getImageData(0,0,1,1);
const image = new Image(1,1);
image.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAMSURBVBhXY/j//z8ABf4C/qc1gYQAAAAASUVORK5CYII=';

const progressBar = document.querySelector('.progress-bar');

//Create WebGL context at start
await (rec.estimatePoses(detectorPoses, image, {}))
.then(async () => {
  progressBar.style.width = '50%';
  progressBar.textContent = 'Cargando Modelos: 50%';
  await new Promise(r => setTimeout(r, 1000)); //Sleep
});
await (rec.estimateHands(detectorHands, image, {}))
.then(async () => {
  progressBar.style.width = '75%';
  progressBar.textContent = 'Cargando Modelos: 75%';
  await new Promise(r => setTimeout(r, 1000)); //Sleep
});
await (rec.estimateFaces(detectorFaces, image, {}))
.then(async () => {
  progressBar.style.width = '100%';
  progressBar.textContent = 'Cargando Modelos: 100%';
  await new Promise(r => setTimeout(r, 1000)); //Sleep
});

//$('.toast').toast('show')
new bootstrap.Toast(document.querySelector('.toast')).show();
await new Promise(r => setTimeout(r, 2000)); //Sleep
document.querySelector('.progress').classList.add("d-none");
document.querySelector("#btn-start-webcam").disabled = false;
document.querySelector("#btn-stops-webcam").disabled = false;
})();

// Event Listeners
camera.getVideo().addEventListener('loadeddata', function() {
    runInference(canvas, camera);
    setTimeout(
      setInterval(function() {
        fetch('http://127.0.0.1:5000/model', {
          method: 'POST',
          headers: {
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

    //Poses
    if (poses[0] != null) 
    {
      delete poses[0].keypoints3D;
      poses[0].keypoints.forEach((key) => { delete key.z; delete key.name; delete key.score; });
    }
    else 
    {
      poses[0] = {
        keypoints: new Array(33).fill({x: 0.0, y: 0.0})
      }
    }
    //Hands
    if (hands[0] != null) //Right
    {
      delete hands[0].keypoints3D;
      delete hands[0].score;
      hands[0].keypoints.forEach((key) => { delete key.z; delete key.name; });
    }
    else
    {
      hands[0] = {
        handedness: "Right",
        keypoints: new Array(21).fill({x: 0.0, y: 0.0})
      }
    }
    if (hands[1] != null) //Left
    {
      delete hands[1].keypoints3D;
      delete hands[1].score;
      hands[1].keypoints.forEach((key) => { delete key.z; delete key.name; });
    }
    else
    {
      hands[1] = {
        handedness: "Left",
        keypoints: new Array(21).fill({x: 0.0, y: 0.0})
      }
    }
    //Faces
    if (faces[0] != null) 
    {
      delete faces[0].box;
      faces[0].keypoints.forEach((key) => { delete key.z; delete key.name; });
    }
    else
    {
      faces[0] = {
        keypoints: new Array(468).fill({x: 0.0, y: 0.0})
      }
    }

    /*keypoints.push({
      posesKeypoints: poses, 
      handsKeypoints: hands,
      facesKeypoints: faces,
    });*/

    keypoints.push(
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
        {x: 0.0, y: 0.0}, //Head (NOT EXIST)
        {x: 0.0, y: 0.0}, //Neck (NOT EXIST)
        {x: 0.0, y: 0.0}, //Hip  (NOT EXIST)
        poses[0].keypoints[31], //LBigToe
        poses[0].keypoints[32], //RBigToe
        {x: 0.0, y: 0.0}, //LSmallToe (NOT EXIST)
        {x: 0.0, y: 0.0}, //RSmallToe (NOT EXIST)
        poses[0].keypoints[29], //LHeel
        poses[0].keypoints[30], //RHeel
        //face (ToDo)
        ...faces[0].keypoints,
        //left hand
        ...hands[1].keypoints,
        //right hand
        ...hands[0].keypoints,
      ]
    )

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