export class Camera {
  constructor() {
    navigator.getUserMedia = ( navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia );
    this.video = document.querySelector('video');
  }

  start(canvas) {
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
          self.video.srcObject = localMediaStream;
          self.webcamStream = localMediaStream;

          const {width, height} = self.webcamStream.getTracks()[0].getSettings();;
          canvas.setWidthHeight(width, height);

          self.video.width = width; //self.video.videoWidth;
          self.video.height = height; //self.video.videoWidth;
        },
        // errorCallback
        function(err) {
          console.log("The following error occured: " + err);
        });
    } else {
      console.log("getUserMedia not supported");
    }  
  }

  stop() {
    this.webcamStream.getTracks().forEach(function(track) {
      track.stop();
    });
  }

  getVideo() {
    return this.video;
  }
}
