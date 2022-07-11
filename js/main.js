// consts 
const ALLOWED_CHARS = "1234567890.";
const url = "https://v6.exchangerate-api.com/v6/";
const apiKey = "d7f0da26ecc34fc4bcd13a48b6679ec2";

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

        const newActiveOption = dropdownItems.find(item => item.textContent === this.activeOption.text);

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

    reset = () => {
        this._setActiveItem();
    }
}

class CurrencyConverter {
    constructor(opts) {
        this.container = opts.container;

        this.state = {
            currencyInputValue: "",
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
        await this._getCurrencyData();

        this._createConverter();
        this.currencyConverter = this.container.querySelector(".cc");

        this.currencyInput = this.currencyConverter.querySelector(".currency-input");

        this._initSelects();
        this._setCurrentCurrencyData();

        this.currencyInfo = this.currencyConverter.querySelector(".cc__info-message__rate");
        this._setCurrencyInfoMessage();

        this.total = this.currencyConverter.querySelector(".cc__total__value");
        this._setTotal(this.state.currencyInputValue)

        this._bindEvents();
    }

    _bindEvents = () => {
        this.currencyInput && this.currencyInput.addEventListener("input", this._handleCurrencyInput);

        this.baseCurrencySelectElement
            && this.baseCurrencySelectElement.addEventListener("itemChanged", async () => {
                const newBaseCur = this.baseCurrencySelect.getValue().value;

                await this._getCurrencyData(newBaseCur);

                this.targetCurrencySelect.update(this.state.currenciesData.conversion_rates)

                this._setCurrentCurrencyData();
                this._setCurrencyInfoMessage();
                this._setTotal();
            });

        this.targetCurrencySelectElement
            && this.targetCurrencySelectElement.addEventListener("itemChanged", () => {
                this._setCurrentCurrencyData();
                this._setCurrencyInfoMessage();
                this._setTotal();
            });
    }

    // create currency converter makrup functions
    _createConverter = () => {
        const currencyInput = this._createCurrencyInput();

        const currencyConverter = `
        <div class="cc">
            <div class="cc__row currency-info-row">
                <div class="cc__info-message">
                    <div class="cc__info-message__title">Current currency rate:</div>
                    <div class="cc__info-message__rate"></div>
                </div>
            </div>
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
                    <div class="cc__total__value"></div>
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
                    <input type="text" class="field__input currency-input" value="${this.state.currencyInputValue}">
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
                data: this.state.currenciesData.conversion_rates,
            }
        });
        this.targetCurrencySelectElement = this.currencyConverter.querySelector(".target-currency-select .select");
    }

    _configure = () => {
        this.state.configureData.baseLang = navigator.language;
        this.state.configureData.baseCurrency
            = baseCurs.get(this.state.configureData.baseLang) || baseCurs.get("DEFAULT");
    }

    _handleCurrencyInput = e => {
        const value = e.target.value;
        const formattedValue = value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');

        this.state.currencyInputValue = formattedValue;

        this.currencyInput.value = this.state.currencyInputValue;

        this._setTotal();
    }

    _getCurrencyData = async baseCurrency => {
        const apiKey = this.state.configureData.apiKey;
        const baseCur = baseCurrency ?? this.state.configureData.baseCurrency;

        const myHeaders = new Headers();
        myHeaders.append("apikey", apiKey);

        const requestOptions = {
            method: 'GET',
            redirect: 'follow',
            headers: myHeaders
        };

        const response = await fetch(`${url}/0ba7144aa2094c43003bc854/latest/${baseCur}`)
            .then(response => response.json())
            .then(result => this.state.currenciesData = result)
            .catch(error => console.log('error', error));
    }

    _setCurrentCurrencyData = () => {
        const baseCurrencyData = this.baseCurrencySelect.getValue();
        this.state.currentCurrencyData.baseCurrencyName = baseCurrencyData.value;

        const targetCurrencyData = this.targetCurrencySelect.getValue();
        this.state.currentCurrencyData.targetCurrencyName = targetCurrencyData.text;
        this.state.currentCurrencyData.targetCurrencyRate = targetCurrencyData.value;
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

    _setTotal = () => {
        const rate = +this.state.currentCurrencyData.targetCurrencyRate;
        const value = this.state.currencyInputValue;

        const total = value * rate;
        const trimmedTotal = total.toFixed(3);

        const targetCurrencyName = this.state.currentCurrencyData.targetCurrencyName;

        writeText(this.total, `${trimmedTotal} ${targetCurrencyName}`)
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