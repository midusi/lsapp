function now() {
  return window.performance ? window.performance.now() : Date.now();
}

var count = 30000;
var delay = 20; //20 ms. This will be only indicative. There's no guarantee the browswer will call the function after exactly this time

var initTick = 0;
export var timerElement = document.getElementById("timer");
function tick() {
 var remaining = (count - (now() - initTick)) / 1000;
//  console.log(remaining);
 remaining = remaining >= 0 ? remaining : 0;
 var secs = remaining.toFixed(0);
 timerElement.innerHTML = secs + " seg";
 if (remaining) setTimeout(tick, delay);
}

// initTick = now();
// console.log(now());
// setTimeout(tick, delay);

export function startTimer(milliseconds) {
  count = milliseconds;
  initTick = now();
  // console.log(now());
  setTimeout(tick, delay);
}