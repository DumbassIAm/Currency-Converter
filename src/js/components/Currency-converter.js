// utils
import { writeInnerHTML, writeText } from "../utils/write";

// consts
import { url } from "../consts";

// components
import Select from "./Select";

// langs
import cursMap from "../langs";

import maskIt from "../utils/maskIt";
import debounce from "../utils/debounce";

export default class CurrencyConverter {
    constructor(opts) {
        this.container = opts.container;

        this.state = {
            currencyInputValue: 0,
            configureData: {
                apiKey: opts.configureData.apiKey,
            },
            currentCurrencyData: {},
            currenciesData: {}
        }

        this._init();
    }

    // init functions
    _init = async () => {
        this._configure();
        await this._fetchCurrenices();

        this._createConverter();
        this.currencyConverter = this.container.querySelector(".cc");

        this.currencyInput = this.currencyConverter.querySelector(".currency-input");
        maskIt(this.currencyInput);

        this._initSelects();
        this._setCurrentCurrencyInfo();

        this.currencyInfo = this.currencyConverter.querySelector(".cc__info-message__rate");
        this._setCurrencyInfoMessage();

        this.totalElement = this.currencyConverter.querySelector(".cc__total__value");
        const total = await this._calcTotal();
        this._setTotal(total);

        this._bindEvents();
    }

    _configure = () => {
        this.state.configureData.baseLang = navigator.language;
        this.state.configureData.baseCurrency
            = cursMap.get(this.state.configureData.baseLang) || cursMap.get("DEFAULT");
    }

    _bindEvents = () => {
        const debouncedHandleInput = debounce(this._handleCurrencyInput, 250);
        this.currencyInput && this.currencyInput.addEventListener("input", debouncedHandleInput);

        this.baseCurrencySelectElement
            && this.baseCurrencySelectElement.addEventListener("itemChanged", async () => {
                this._setCurrentCurrencyInfo();
                this._setCurrencyInfoMessage();

                const total = await this._calcTotal();
                this._setTotal(total);
            });

        this.targetCurrencySelectElement
            && this.targetCurrencySelectElement.addEventListener("itemChanged", async () => {
                this._setCurrentCurrencyInfo();
                this._setCurrencyInfoMessage();

                const total = await this._calcTotal();
                this._setTotal(total);
            });
    }

    // create currency converter makrup functions
    _createConverter = () => {
        const currencyInput = this._createCurrencyInput();

        const currencyConverter = `
        <div class="cc">
            <div class="cc__row">${currencyInput}</div>
            <div class="cc__row">
                <div class="field cc__field">
                    <div class="field__title">Base currency:</div>
                    <div class="field__input-container base-currency-select"></div>
                </div>
                <div class="field cc__field">
                    <div class="field__title">Target currency:</div>
                    <div class="field__input-container target-currency-select"></div>
                </div>
            </div>
            <div class="cc__row currency-total-row">
                <div class="cc__total">
                    <div class="cc__total__title">You get:</div>
                    <span class="cc__total__value"></span>
                </div>
            </div>
        </div>`;

        writeInnerHTML(this.container, currencyConverter);
    }

    _createCurrencyInput = () => {
        return `
            <div class="field cc__field">
                <div class="field__title">Fill amount you want:</div>
                <div class="field__input-container">
                    <input type="text" class="field__input currency-input" maxlength="20" value="${this.state.currencyInputValue}">
                </div>
            </div>`;
    }

    // init converter Selects
    _initSelects = () => {
        const copiedCur = {};
        for (let key in this.state.currenciesData.conversion_rates) {
            copiedCur[key] = key;
        }

        this.baseCurrencySelect = new Select({
            container: this.currencyConverter.querySelector(".base-currency-select"),
            selectData: {
                data: copiedCur,
                activeOption: this.state.currenciesData.base_code,
            }
        });
        this.baseCurrencySelectElement = this.currencyConverter.querySelector(".base-currency-select .select");

        this.targetCurrencySelect = new Select({
            container: this.currencyConverter.querySelector(".target-currency-select"),
            selectData: {
                data: copiedCur,
                activeOption: Object.keys(copiedCur)[1]
            }
        });
        this.targetCurrencySelectElement = this.currencyConverter.querySelector(".target-currency-select .select");
    }

    _handleCurrencyInput = async e => {
        const value = e.target.value;

        this.state.currencyInputValue = value;
        this.currencyInput.value = this.state.currencyInputValue;

        const total = await this._calcTotal();
        this._setTotal(total);
    }

    _fetchCurrenices = async baseCurrency => {
        const apiKey = this.state.configureData.apiKey;
        const baseCur = baseCurrency ?? this.state.configureData.baseCurrency;

        const response = await fetch(`${url}/${apiKey}/latest/${baseCur}`)
            .then(response => response.json())
            .then(result => {
                this.state.currenciesData = {
                    base_code: result.base_code,
                    conversion_rates: result.conversion_rates,
                }

                return this.state.currenciesData;
            })
            .catch(error => console.log('error', error));
    }

    _fetchConversionRate = async () => {
        const baseCurrencyName = this.state.currentCurrencyData.baseCurrencyName;
        const targetCurrencyName = this.state.currentCurrencyData.targetCurrencyName;

        const apiKey = this.state.configureData.apiKey;

        const conversion_rate = await fetch(`${url}/${apiKey}/pair/${baseCurrencyName}/${targetCurrencyName}`)
            .then(response => response.json())
            .then(result => result.conversion_rate)
            .catch(error => console.log('error', error));

        return conversion_rate;
    }

    _setCurrentCurrencyInfo = () => {
        const baseCurrencyData = this.baseCurrencySelect.getValue();
        this.state.currentCurrencyData.baseCurrencyName = baseCurrencyData.value;

        const targetCurrencyData = this.targetCurrencySelect.getValue();
        this.state.currentCurrencyData.targetCurrencyName = targetCurrencyData.value;
    }

    _setCurrencyInfoMessage = () => {
        writeText(this.currencyInfo, "");

        const baseCurrencyName = this.state.currentCurrencyData.baseCurrencyName;

        const targetCurrencyRate = this.state.currentCurrencyData.targetCurrencyRate;
        const targetCurrencyName = this.state.currentCurrencyData.targetCurrencyName;

        if (!(baseCurrencyName && targetCurrencyRate && targetCurrencyName)) return;

        const text = `1 ${baseCurrencyName} = ${targetCurrencyRate} ${targetCurrencyName}`;

        writeText(this.currencyInfo, text);
    }

    _calcTotal = async () => {
        this._disableSelects("disable");
        this._setLoading("loading");

        const rate = await this._fetchConversionRate();
        const value = this.state.currencyInputValue || 0;

        this._disableSelects("enable");
        this._setLoading("finished");

        const total = value * rate;
        const trimmedTotal = total % 10 ? total.toFixed(3) : total;

        return trimmedTotal;
    }

    _setTotal = total => {
        const targetCurrencyName = this.state.currentCurrencyData.targetCurrencyName;

        writeText(this.totalElement, `${total} ${targetCurrencyName}`)
    }

    _disableSelects = disable => {
        this.baseCurrencySelect.disable(disable);
        this.targetCurrencySelect.disable(disable);
    }

    _setLoading = loading => {
        if (loading !== "loading" && loading !== "finished") return;

        const method = loading === "loading" ? "add" : "remove";
        this.currencyConverter.classList[method]("loading");
    }
}