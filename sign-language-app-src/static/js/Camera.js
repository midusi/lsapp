navigator.getUserMedia = ( 
  navigator.getUserMedia || 
  navigator.webkitGetUserMedia || 
  navigator.mozGetUserMedia || 
  navigator.msGetUserMedia );

var webcamStream, media_recorder, blobs_recorded;
const video = document.querySelector('video');
const recordedVideo = document.getElementById('recorded-video');

function getVideo() {
  return video;
}

function showRecordingElement(state) {
  recordedVideo.hidden = !state;
}

// start recording with each recorded blob having 1 second video
function startRecording(milliseconds) {
  media_recorder.start(milliseconds);
}

function stopRecording() {
  media_recorder.stop();
  blobs_recorded = []; //Clear Array
}

function start(successCallback, errorCallback) {
  if (navigator.getUserMedia) {
    navigator.getUserMedia(
      // constraints
      {
      video: true,
      audio: false
      },
      // successCallback
      async function(localMediaStream) {
        video.srcObject = localMediaStream;
        webcamStream = localMediaStream;

        const {width, height} = webcamStream.getTracks()[0].getSettings();

        video.width = width;
        video.height = height;

        successCallback(width, height);

        setupMediaRecorder();
      },
      // errorCallback
      function(err) {
        errorCallback();
        console.log("The following error occured: " + err);
      });
  } else {
    console.log("getUserMedia not supported");
  }
}

function stop() {
  webcamStream.getTracks().forEach(function(track) {
    track.stop();
  });
}

function setupMediaRecorder() {
  // set MIME type of recording as video/webm
  media_recorder = new MediaRecorder(webcamStream, { mimeType: 'video/webm' });

  // event : new recorded video blob available
  media_recorder.addEventListener('dataavailable', function(e) {
    blobs_recorded.push(e.data);
  });

  // event : recording stopped & all blobs sent
  media_recorder.addEventListener('stop', function() {
    // create local object URL from the recorded video blobs
    recordedVideo.src = URL.createObjectURL(new Blob(blobs_recorded, { type: 'video/webm' }));
  });
}

export { getVideo, showRecordingElement, start, stop, startRecording, stopRecording };