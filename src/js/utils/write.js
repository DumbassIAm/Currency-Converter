export function writeInnerHTML(targetElement, html = "") {
    if (!targetElement) return;

    targetElement.innerHTML = html;
}

export function writeText(targetElement, text) {
    if (!targetElement) return;

    targetElement.textContent = text;
}