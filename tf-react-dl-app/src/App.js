// Import dependencies
import './App.css';
import { useRef, useEffect } from "react";
import Webcam from "react-webcam";
import * as tf from "@tensorflow/tfjs";
// Import required model
import * as poseDetection from '@tensorflow-models/pose-detection';
// Import drawing utility
import { drawResults } from "./utilities";

function App() {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);

  // Main function
  const runMoveNet = async () => {
    // Load network
    const model = poseDetection.SupportedModels.MoveNet;
    const detector = await poseDetection.createDetector(model);

    let poses = null;
    let image = null;

    // Loop, detect poses and draw them on canvas
    setInterval(async () => {
      // Check data is available
      if (
        typeof webcamRef.current !== "undefined" &&
        webcamRef.current !== null &&
        webcamRef.current.video.readyState === 4
      ) {
        // Get video properties
        const video = webcamRef.current.video;
        const videoWidth = webcamRef.current.video.videoWidth;
        const videoHeight = webcamRef.current.video.videoHeight;

        // Set video width and height
        webcamRef.current.video.width = videoWidth;
        webcamRef.current.video.height = videoHeight;

        // Set canvas width and height
        canvasRef.current.width = videoWidth;
        canvasRef.current.height = videoHeight;

        // Make detections
        image = video;
        poses = await detector.estimatePoses(image);
        console.log(poses);

        // Draw mesh and update drawing utility
        const ctx = canvasRef.current.getContext("2d");
        drawResults(ctx, poses);
      }
    }, 10);
  }

  useEffect(() => {
    //Runs only on the first render
    runMoveNet()
  }, []);

  return (
    <div className="App">
      <header className="App-header">
      <Webcam
          ref={webcamRef}
          muted={true} 
          style={{
            position: "absolute",
            marginLeft: "auto",
            marginRight: "auto",
            left: 0,
            right: 0,
            textAlign: "center",
            zindex: 9,
            width: 640,
            height: 480,
          }}
        />

        <canvas
          ref={canvasRef}
          style={{
            position: "absolute",
            marginLeft: "auto",
            marginRight: "auto",
            left: 0,
            right: 0,
            textAlign: "center",
            zindex: 8,
            width: 640,
            height: 480,
          }}
        />
      </header>
    </div>
  );
}

export default App;
