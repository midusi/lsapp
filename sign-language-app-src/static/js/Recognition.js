export var detectorPoses, detectorHands, detectorFaces;

async function loadNets() {
  detectorPoses = await poseDetection.createDetector(
    poseDetection.SupportedModels.BlazePose, {
      runtime: 'mediapipe',
      solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/pose',
                    // or 'base/node_modules/@mediapipe/pose' in npm.
      modelType: 'lite'
    });

  detectorHands = await handPoseDetection.createDetector(
    handPoseDetection.SupportedModels.MediaPipeHands, {
      runtime: 'mediapipe',
      solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/hands',
                    // or 'base/node_modules/@mediapipe/hands' in npm.
      modelType: 'lite'
    });

  detectorFaces = await 
  faceLandmarksDetection.createDetector(
    faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh, {
      runtime: 'mediapipe',
      solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh',
                    // or 'base/node_modules/@mediapipe/face_mesh' in npm.
      refineLandmarks: false
    });
}

function estimateAll(image, estimationConfigs) {
  return [
    detectorPoses.estimatePoses(image, estimationConfigs.poses),
    detectorHands.estimateHands(image, estimationConfigs.hands),
    detectorFaces.estimateFaces(image, estimationConfigs.faces)
  ];
}

export { loadNets, estimateAll };
