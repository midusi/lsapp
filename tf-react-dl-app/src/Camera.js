import * as poseDetection from '@tensorflow-models/pose-detection';

// These anchor points allow the pose pointcloud to resize according to its
// position in the input.
const ANCHOR_POINTS = [[0, 0, 0], [0, 1, 0], [-1, 0, 0], [-1, -1, 0]];

const COLOR_PALETTE = [
  '#ffffff', '#800000', '#469990', '#e6194b', '#42d4f4', '#fabed4', '#aaffc3',
  '#9a6324', '#000075', '#f58231', '#4363d8', '#ffd8b1', '#dcbeff', '#808000',
  '#ffe119', '#911eb4', '#bfef45', '#f032e6', '#3cb44b', '#a9a9a9'
];
export class Camera {
 
  /**
   * Draw the keypoints and skeleton on the video.
   * @param poses A list of poses to render.
   */
  static drawResults(ctx,poses) {
    for (const pose of poses) {
      Camera.drawResult(ctx,pose);
    }
  }

  /**
   * Draw the keypoints and skeleton on the video.
   * @param pose A pose with keypoints to render.
   */
  static drawResult(ctx,pose) {
    if (pose.keypoints != null) {
      Camera.drawKeypoints(ctx,pose.keypoints);
      Camera.drawSkeleton(ctx,pose.keypoints, pose.id);
    }
  }

  /**
   * Draw the keypoints on the video.
   * @param keypoints A list of keypoints.
   */
  static drawKeypoints(ctx,keypoints) {
    const keypointInd =
        poseDetection.util.getKeypointIndexBySide(poseDetection.SupportedModels.MoveNet);
    ctx.fillStyle = 'Red';
    ctx.strokeStyle = 'White';
    ctx.lineWidth = 2;

    for (const i of keypointInd.middle) {
      Camera.drawKeypoint(ctx,keypoints[i]);
    }

    ctx.fillStyle = 'Green';
    for (const i of keypointInd.left) {
      Camera.drawKeypoint(ctx,keypoints[i]);
    }

    ctx.fillStyle = 'Orange';
    for (const i of keypointInd.right) {
      Camera.drawKeypoint(ctx,keypoints[i]);
    }
  }

  static drawKeypoint(ctx,keypoint) {
    // If score is null, just show the keypoint.
    const score = keypoint.score != null ? keypoint.score : 1;
    const scoreThreshold = 0.3 || 0;

    if (score >= scoreThreshold) {
      const circle = new Path2D();
      circle.arc(keypoint.x, keypoint.y, 4, 0, 2 * Math.PI);
      ctx.fill(circle);
      ctx.stroke(circle);
    }
  }

  /**
   * Draw the skeleton of a body on the video.
   * @param keypoints A list of keypoints.
   */
  static drawSkeleton(ctx,keypoints, poseId) {
    // Each poseId is mapped to a color in the color palette.
    const color = false && poseId != null ?
        COLOR_PALETTE[poseId % 20] :
        'White';
    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;

    poseDetection.util.getAdjacentPairs(poseDetection.SupportedModels.MoveNet).forEach(([
                                                                      i, j
                                                                    ]) => {
      const kp1 = keypoints[i];
      const kp2 = keypoints[j];

      // If score is null, just show the keypoint.
      const score1 = kp1.score != null ? kp1.score : 1;
      const score2 = kp2.score != null ? kp2.score : 1;
      const scoreThreshold = 0.3 || 0;

      if (score1 >= scoreThreshold && score2 >= scoreThreshold) {
        ctx.beginPath();
        ctx.moveTo(kp1.x, kp1.y);
        ctx.lineTo(kp2.x, kp2.y);
        ctx.stroke();
      }
    });
  }
}