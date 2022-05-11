import { drawResultsPoses, drawResultsHands, drawResultsFaces } from "./utilities.js";

export class Canvas {
  constructor() {
    this.canvas = document.querySelector('canvas');
    this.ctx = this.canvas.getContext('2d');
  }

  setWidthHeight(width, height) {
    this.canvas.width = width;
    this.canvas.height = height;
  }

  clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  drawResultsPoses(poses) {
    drawResultsPoses(this.ctx, poses);
  }

  drawResultsHands(hands) {
    drawResultsHands(this.ctx, hands);
  }

  drawResultsFaces(faces) {
    drawResultsFaces(this.ctx, faces, false, true);
  }

  /*drawCameraFrame(camera) {
    this.ctx.drawImage(camera.getVideo(), 0,0, this.canvas.width, this.canvas.height);
  }*/
}