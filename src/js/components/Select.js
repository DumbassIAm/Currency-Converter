// utils
import { getElementDataset, setElementDataset } from "../utils/dataset";
import { writeInnerHTML } from "../utils/write";

export default class Select {
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