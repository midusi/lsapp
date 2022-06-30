export class Canvas {
  constructor() {
    this.canvas = document.querySelector('canvas');
    this.ctx = this.canvas.getContext('2d');
  }

  getCanvasElement() {
    return this.canvas;
  }

  setWidthHeight(width, height) {
    this.canvas.width = width;
    this.canvas.height = height;
  }

  clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  drawKeypoints(keypoints) {
    this.ctx.fillStyle = 'orange';
    keypoints.forEach((keypoint) => {
      this.ctx.fillRect(keypoint.x, keypoint.y, 5, 5);
    });
  }
}