function hideHTMLElement(element) {
  element.classList.add('d-none');
}

function showHTMLElement(element) {
  element.classList.remove('d-none');
}

export { hideHTMLElement, showHTMLElement };