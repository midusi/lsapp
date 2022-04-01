import logo from './logo.svg';
import './App.css';
import { useRef, useEffect } from "react";
import * as tf from "@tensorflow/tfjs";
import * as poseDetection from '@tensorflow-models/pose-detection';
import Webcam from "react-webcam";
import { Camera } from "./Camera"

function App() {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);

  const runMoveNet = async () => {
    const model = poseDetection.SupportedModels.MoveNet;
    const detector = await poseDetection.createDetector(model);

    let poses = null;

    setInterval(async () => {
      if (
        typeof webcamRef.current !== "undefined" &&
        webcamRef.current !== null &&
        webcamRef.current.video.readyState === 4
      ) {
        // Get Video Properties
        const video = webcamRef.current.video;
        const videoWidth = webcamRef.current.video.videoWidth;
        const videoHeight = webcamRef.current.video.videoHeight;

        // Set video width
        webcamRef.current.video.width = videoWidth;
        webcamRef.current.video.height = videoHeight;

        // Set canvas height and width
        canvasRef.current.width = videoWidth;
        canvasRef.current.height = videoHeight;

        let image = video;

        poses = await detector.estimatePoses(image);

        console.log(poses)

        // Draw mesh
        const ctx = canvasRef.current.getContext("2d");

        Camera.drawResults(ctx,poses);
      }
    }, 10);
  }

  //https://www.w3schools.com/react/react_useeffect.asp
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
