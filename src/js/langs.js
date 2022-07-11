const cursObj = {
    "ru-RU": "RUB",
    "en-US": "USD",
    "DEFAULT": "EUR",
}

const cursMap = new Map();
for (let key in cursObj) {
    cursMap.set(key, cursObj[key]);
}

export default cursMap;