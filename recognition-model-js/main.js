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

var intervalID = window.setInterval(snapshot, 10);

function miFuncion(a,b) {
  // Aquí va tu código
  // Los parámetros son opcionales completamente
  console.log(a);
  console.log(b);
}