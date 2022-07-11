// consts 
const ALLOWED_CHARS = "1234567890.";
const url = "https://v6.exchangerate-api.com/v6/";
const apiKey = "0ba7144aa2094c43003bc854";

function debounce(callee, timeoutMs) {
    return function perform(...args) {
        let previousCall = this.lastCall;

        this.lastCall = Date.now();

        if (previousCall && this.lastCall - previousCall <= timeoutMs) {
            clearTimeout(this.lastCallTimer);
        }

        this.lastCallTimer = setTimeout(() => callee(...args), timeoutMs);
    };
}

// api
const baseCurs = new Map()
baseCurs.set("ru-RU", "RUB");
baseCurs.set("en-US", "USD");
baseCurs.set("DEFAULT", "EUR");

// utils
function getElementDataset(element, datasetAttr) {
    if (element) return element.dataset[datasetAttr];
}

function setElementDataset(element, datasetAttr, value) {
    if (element) element.dataset[datasetAttr] = value;
}

function writeInnerHTML(targetElement, html = "") {
    if (!targetElement) return;

    targetElement.innerHTML = html;
}

function writeText(targetElement, text) {
    if (!targetElement) return;

    targetElement.textContent = text;
}

function contains(stringValue, charValue) {
    return stringValue.indexOf(charValue) > -1;
}

class Select {
    constructor(opts) {
        this.container = opts.container;

        this.selectData = {
            data: opts.selectData.data,
            activeOption: opts.selectData.activeOption,
        }

        this.activeOption = {
            value: "",
            text: "",
        }

        this._init();
        this._bindEvents();
    }

    // init functions
    _init = () => {
        this._createSelect();

        this.select = this.container.querySelector(".select");

        this.activeBlock = this.select.querySelector(".select__active-block");
        this.activeBlockText = this.activeBlock.querySelector(".select__active-block__text");

        this.dropdown = this.select.querySelector(".select__dropdown");

        const activeItem = this.selectData.activeOption
            ? this.dropdown.querySelector(`.select__dropdown__item[data-option-value="${this.selectData.activeOption}"]`)
            : this.dropdown.querySelector(".select__dropdown__item");
        this._setActiveItem(activeItem);
    }

    _bindEvents = () => {
        document.addEventListener("click", event => {
            if (!event.target.closest(".select")) this.toggleOpened("close");
        })

        this.activeBlock.addEventListener("click", event => {
            if (this.select.classList.contains("disabled")) return;

            this.select.classList.contains("opened") ? this.toggleOpened("close") : this.toggleOpened("open");
        });

        this.dropdown.addEventListener("click", this._handleItemClick);
    }

    // create currency converter makrup functions
    _createSelect = () => {
        let options = "";

        for (let key in this.selectData.data) {
            const transferData = {
                optionValue: this.selectData.data[key],
                optionText: key,
            }

            options += this._createSelectOption(transferData);
        }

        const select =
            `<div class="select">
                <div class="select__active-block">
                    <div class="select__active-block__text"></div>
                </div>
                <div class="select__dropdown">
                    <div class="select__dropdown-list">${options}</div>
                </div>
            </div>`;

        writeInnerHTML(this.container, select);
    }

    _createSelectOption = optionData => {
        return `
            <div class="select__dropdown__item" data-option-value="${optionData.optionValue}">
                <div class="select__dropdown__item__text">${optionData.optionText}</div>
            </div>`;
    }

    // select event listeners
    _handleItemClick = event => {
        const item = event.target.closest(".select__dropdown__item");
        if (!item) return;

        this._resetItems();
        this._setActiveItem(item);

        this.toggleOpened("close");

        this.select.dispatchEvent(new CustomEvent("itemChanged"));
    }

    // toggle select dropdown visibility
    toggleOpened = action => {
        if (action !== "open" && action !== "close") return;

        const method = action === "open" ? "add" : "remove";
        this.select.classList[method]("opened");
    }

    // active item setters
    _setActiveItem = (item = "first") => {
        if (item === "first") item = this.dropdown.querySelector(".select__dropdown__item");
        if (!item) return;

        item.classList.add("select__dropdown__item_active");
        const value = getElementDataset(item, "optionValue");
        const text = item.textContent.trim();

        const itemText = item.querySelector(".select__dropdown__item__text")?.textContent;
        this.activeBlockText.textContent = itemText;

        setElementDataset(this.select, "value", value);
        setElementDataset(this.select, "activeOptionText", text);

        this.activeOption.value = value;
        this.activeOption.text = text;
    }

    _resetItems = () => {
        const items = this.dropdown.querySelectorAll(".select__dropdown__item");
        items.forEach(item => item.classList.remove("select__dropdown__item_active"));
    }

    _refresh = () => {
        const dropdownItems = Array.from(this.dropdown.querySelectorAll(`.select__dropdown__item`));

        const newActiveOption = dropdownItems.find(item => {
            const formattedText = item.textContent.replace(/\n/g, "").trim();
            return formattedText === this.activeOption.text;
        });

        this._resetItems();
        this._setActiveItem(newActiveOption);
    }

    // api
    update = newData => {
        this.selectData.data = newData;

        let options = "";

        for (let key in this.selectData.data) {
            const transferData = {
                optionValue: this.selectData.data[key],
                optionText: key,
            }

            options += this._createSelectOption(transferData);
        }

        const dropdownList = this.dropdown.querySelector(".select__dropdown-list");
        writeInnerHTML(dropdownList, options);

        this._refresh();
    }

    getValue = () => ({
        value: getElementDataset(this.select, "value") ?? "",
        text: getElementDataset(this.select, "activeOptionText") ?? ""
    });

    disable = value => {
        if (value !== "enable" && value !== "disable") return;

        const method = value === "disable" ? "add" : "remove";
        this.select.classList[method]("disabled");
    }

    reset = () => {
        this._setActiveItem();
    }
}

class CurrencyConverter {
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

        this._initSelects();
        this._setCurrentCurrencyInfo();

        this.currencyInfo = this.currencyConverter.querySelector(".cc__info-message__rate");
        this._setCurrencyInfoMessage();

        this.totalElement = this.currencyConverter.querySelector(".cc__total__value");
        const total = await this._calcTotal();
        this._setTotal(total);

        this._bindEvents();
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

    _configure = () => {
        this.state.configureData.baseLang = navigator.language;
        this.state.configureData.baseCurrency
            = baseCurs.get(this.state.configureData.baseLang) || baseCurs.get("DEFAULT");
    }

    _handleCurrencyInput = async e => {
        const value = e.target.value;
        if (!Number(value)) return;

        this.state.currencyInputValue = value || 0;
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

document.addEventListener("DOMContentLoaded", async event => {
    const selectFields = document.querySelectorAll(".select");
    selectFields.forEach(field => new Select(field));

    const ccContainer = document.querySelector(".cc-container");

    new CurrencyConverter({
        container: ccContainer,
        configureData: {
            apiKey: apiKey,
        }
    })
});