// styles
import "../sass/main.scss";

// consts
import { apiKey } from "./consts";

// components
import CurrencyConverter from "./components/Currency-converter";

function run() {
    const ccContainer = document.querySelector(".cc-container");

    new CurrencyConverter({
        container: ccContainer,
        configureData: {
            apiKey: apiKey,
        }
    });
}


document.addEventListener("DOMContentLoaded", () => {
    run();
});