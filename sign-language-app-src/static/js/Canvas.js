const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');

function getCanvasElement() {
  return canvas;
}

function setWidthHeight(width, height) {
  canvas.width = width;
  canvas.height = height;
}

function clear() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function drawKeypoints(keypoints) {
  ctx.fillStyle = 'orange';
  keypoints.forEach((keypoint) => {
    ctx.fillRect(keypoint.x, keypoint.y, 5, 5);
  });
}

export { getCanvasElement, setWidthHeight, clear, drawKeypoints };