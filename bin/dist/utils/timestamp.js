"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.timestamp = void 0;
function timestamp() {
    const date = new Date();
    return [
        date.getFullYear(),
        date.getMonth() + 1,
        date.getDate(),
        date.getHours(),
        date.getMinutes(),
        date.getSeconds(),
    ]
        .map((n) => (n < 10 ? "0" : "") + n)
        .join("");
}
exports.timestamp = timestamp;
