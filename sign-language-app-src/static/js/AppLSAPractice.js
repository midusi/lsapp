import * as camera from './Camera.js';
import * as canvas from './Canvas.js';
import * as rec from './Recognition.js';
import { hideHTMLElement, showHTMLElement } from './utilities.js';
import { countdown } from "./countdownModule.js";
import { startTimer, timerElement } from "./timerModule.js";
import { fpsElement } from "./fpsModule.js";
import { signs } from "../signs.js"


function frames_reduction_transform(clip, max_frames) {
  var frs = [];
  for (var i = 0; i < clip.length; i++) {
    var frame = clip[i];
    if (i % Math.ceil(clip.length / max_frames) == 0) {
      frs.push(frame);
    }
  }
  while (frs.length < max_frames) {
    frs.push(frs[frs.length - 1])
  }
  return frs;
}

function argmax(arr) {
  if (arr.length === 0) {
      return -1;
  }
  var max = arr[0];
  var maxIndex = 0;
  for (var i = 1; i < arr.length; i++) {
      if (arr[i] > max) {
          maxIndex = i;
          max = arr[i];
      }
  }
  return {maxIndex, max};
}

function getMaxSign(preds) {
  let maxs = []
  for (let i = 0; i < 5; i++) {
    let am = argmax(preds)
    let sign = (signs.filter((sign) => sign.id == (am.maxIndex + 1))[0])
    maxs.push({
      ...am,
      sign: sign
    })
    preds[am.maxIndex] = 0
  }
  console.log(maxs)
  return maxs
}

let formatSigns = (preds) => (
  `<ol>
    ${preds.map(({sign, max}) => `<li>${sign.name} - ${max}</li>`).join(' ')}
  </ol>`
)


const MAX_FRAMES = 20; // Minimum length of video accepted by the model
const MIN_FRAMES = Math.ceil(MAX_FRAMES * 0.5); // Threshold of frames

let rafId = null;
let frames = [];
let tf_frames = null

const startButtonElement = document.getElementById('btn-start-webcam');
const textOverlayElement = document.getElementById('text-overlay');
const spinOverlayElement = document.getElementById('spin-overlay');
const toastFramesElement = document.getElementById('toast-frames');
const toastCameraElement = document.getElementById('toast-camera');


// Create WebGL context at the start
await (async function () {

  hideHTMLElement(textOverlayElement);
  showHTMLElement(spinOverlayElement);

  // Load networks at the start
  await rec.loadNets();

  const image = new Image(1, 1);
  image.src = "data:image/gif;base64,R0lGODlhAQABAAAAACwAAAAAAQABAAA=";

  rec.estimateAll(image, {});

  hideHTMLElement(spinOverlayElement);
  showHTMLElement(textOverlayElement);

  startButtonElement.disabled = false;
})();

// Event listeners
camera.getVideo().addEventListener('loadeddata', function () {
  captureFrames(3000);
}, false);

startButtonElement.addEventListener('click', function () {
  canvas.getCanvasElement().scrollIntoView(); //Focus
  startButtonElement.disabled = true;
  hideHTMLElement(textOverlayElement);
  camera.showRecordingElement(false);
  countdown(document.getElementById('downcounter'), function () {
    camera.start(function (width, height) { //successCallback
      canvas.setWidthHeight(width, height);
    }, function () { //errorCallback
      startButtonElement.disabled = false;
      showHTMLElement(textOverlayElement);
      new bootstrap.Toast(toastCameraElement).show();
    });
  });
}, false);

// General purpose functions
function captureFrames(milliseconds) {
  showHTMLElement(camera.getVideo());

  showHTMLElement(timerElement.parentNode);

  startTimer(milliseconds);

  const clearAll = function () {
    window.cancelAnimationFrame(rafId);
    camera.stopRecording();
    showRecording && camera.showRecordingElement(true);
    camera.stop();
    canvas.clear();
    frames = []; //Clear Array
    fpsElement.innerText = '';
    showHTMLElement(textOverlayElement);
    hideHTMLElement(camera.getVideo());
    hideHTMLElement(timerElement.parentNode);
    startButtonElement.disabled = false;
  }

  let showRecording = true;

  camera.startRecording();

  runInference(canvas, camera);

  setTimeout(async function () {
    try {
      if (frames.length < MIN_FRAMES) {
        startButtonElement.disabled = false;
        showRecording = false;
        new bootstrap.Toast(toastFramesElement).show();
        return;
      }

      frames = frames_reduction_transform(frames, MAX_FRAMES)
      frames = frames.map(keys => keys.map(key => key ? [key.x/640, key.y/480, isNaN(key.z) ? 0 : key.z / 2] : [0.0, 0.0, 0.0]).flat())
      tf_frames = tf.tensor([frames])
      tf.loadLayersModel('../static/model_lstm_js/model.json').then(model => {
        let preds = Array.from(model.predict(tf_frames).dataSync())
        document.getElementById("results").innerHTML = formatSigns(getMaxSign(preds))
      })
    } finally {
      clearAll();
    }
  }, milliseconds);
}

async function runInference(canvas, camera) {
  const image = camera.getVideo();

  canvas.clear();

  const arrPromises = rec.estimateAll(image, {
    poses: { enableSmoothing: true, flipHorizontal: false },
    hands: { flipHorizontal: false },
    faces: { flipHorizontal: false },
  });

  Promise.all(arrPromises)
    .then((responses) => {
      const [poses, hands, faces] = responses;

      if (poses[0] == null)
        poses[0] = { keypoints: new Array(33).fill({x:0.0, y:0.0, z:0.0}) };
      if (hands[0] == null) //Right
        hands[0] = { keypoints: new Array(21).fill({x:0.0, y:0.0, z:0.0}) };
      if (hands[1] == null) //Left
        hands[1] = { keypoints: new Array(21).fill({x:0.0, y:0.0, z:0.0}) };
      if (faces[0] == null)
        faces[0] = { keypoints: new Array(468).fill({x:0.0, y:0.0, z:0.0}) };

      frames.push([
        ...poses[0].keypoints,
        // ...faces[0].keypoints,
        ...hands[0].keypoints,
        ...hands[1].keypoints
      ]);

      canvas.drawKeypoints(frames[frames.length-1])
    });

  rafId = window.requestAnimationFrame(() => runInference(canvas, camera));
}