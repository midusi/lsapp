navigator.getUserMedia = ( navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia );
export var video = document.querySelector('video');
var webcamStream;
export var media_recorder;
export var blobs_recorded;

function start(successCallback, errorCallback) {
  var self = this;
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
        successCallback(width, height);

        video.width = width;
        video.height = height;

        // set MIME type of recording as video/webm
        media_recorder = new MediaRecorder(webcamStream, { mimeType: 'video/webm' });

        // event : new recorded video blob available
        media_recorder.addEventListener('dataavailable', function(e) {
          this.blobs_recorded.push(e.data);
        });

        // event : recording stopped & all blobs sent
        media_recorder.addEventListener('stop', function() {
          // create local object URL from the recorded video blobs
          let video_local = URL.createObjectURL(new Blob(blobs_recorded, { type: 'video/webm' }));
          recordedVidElement.src = showRecording ? video_local : "";
        });
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

export { start, stop };