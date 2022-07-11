import IMask from "imask";

export default function maskIt(input) {
    IMask(input, {
        mask: Number,
        scale: 3,
        signed: true,
        thousandsSeparator: '',
        padFractionalZeros: false,
        normalizeZeros: true,
        radix: '.',
        mapToRadix: ['.'],
        min: 0,
        max: 10000
    });
}