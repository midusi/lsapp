import { updateFPS } from "./fpsModule.js"; 

var detectorPoses, detectorHands;

export async function loadPoseNet(model, detectorConfig) {
  detectorPoses = await poseDetection.createDetector(model, detectorConfig);
}

export async function loadHandNet(model, detectorConfig) {
  detectorHands = await handPoseDetection.createDetector(model, detectorConfig);
}

export async function runInference(canvas, camera) {
  const image = camera.getVideo();

  const poses = await detectorPoses.estimatePoses(image);

  const estimationConfig = {flipHorizontal: false};
  const hands = await detectorHands.estimateHands(image, estimationConfig);

  canvas.drawCameraFrame(camera);
  canvas.drawResultsPoses(poses);
  canvas.drawResultsHands(hands);

  updateFPS();

  requestAnimationFrame(() => this.runInference(canvas, camera));
}