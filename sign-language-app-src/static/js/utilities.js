function hideHTMLElement(element) {
  element.classList.add('d-none');
}

function showHTMLElement(element) {
  element.classList.remove('d-none');
}

const sleep = ms => new Promise(r => setTimeout(r, ms)); //Helper

export { hideHTMLElement, showHTMLElement, sleep };