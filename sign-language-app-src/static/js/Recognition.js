export function estimatePoses(detectorPoses, image, estimationConfig) {
  return detectorPoses.estimatePoses(image, estimationConfig);
}

export function estimateHands(detectorHands, image, estimationConfig) {
  return detectorHands.estimateHands(image, estimationConfig);
}

export function estimateFaces(detectorFaces, image, estimationConfig) {
  return detectorFaces.estimateFaces(image, estimationConfig);
}