var detectorPoses, detectorHands, detectorFaces;

export async function loadPoseNet(model, detectorConfig) {
  detectorPoses = await poseDetection.createDetector(model, detectorConfig);
}

export async function loadHandNet(model, detectorConfig) {
  detectorHands = await handPoseDetection.createDetector(model, detectorConfig);
}

export async function loadFaceNet(model, detectorConfig) {
  detectorFaces = await faceLandmarksDetection.createDetector(model, detectorConfig);
}

export function estimatePoses(image, estimationConfig) {
  return detectorPoses.estimatePoses(image, estimationConfig);
}

export function estimateHands(image, estimationConfig) {
  return detectorHands.estimateHands(image, estimationConfig);
}

export function estimateFaces(image, estimationConfig) {
  return detectorFaces.estimateFaces(image, estimationConfig);
}