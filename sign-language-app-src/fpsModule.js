window.requestAnimationFrame = (function() {
  return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.ieRequestAnimationFrame || function(callback) {
    window.setTimeout(callback, 1000 / 60);
  };
})();

let fpsElement = document.getElementById("fps");
let then = Date.now() / 1000;  // get time in seconds

export function updateFPS() {
  let now = Date.now() / 1000;  // get time in seconds

  // compute time since last frame
  let elapsedTime = now - then;
  then = now;

  // compute fps
  let fps = 1 / elapsedTime;
  fpsElement.innerText = fps.toFixed(2);
}