var detectorPoses, detectorHands;

export async function loadPoseNet(model, detectorConfig) {
  detectorPoses = await poseDetection.createDetector(model, detectorConfig);
}

export async function loadHandNet(model, detectorConfig) {
  detectorHands = await handPoseDetection.createDetector(model, detectorConfig);
}

export function estimatePoses(image) {
  return detectorPoses.estimatePoses(image);
}

export function estimateHands(image, estimationConfig) {
  return detectorHands.estimateHands(image, estimationConfig);
}