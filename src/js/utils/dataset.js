export function getElementDataset(element, datasetAttr) {
    if (element) return element.dataset[datasetAttr];
}

export function setElementDataset(element, datasetAttr, value) {
    if (element) element.dataset[datasetAttr] = value;
}