"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.waitFor = waitFor;
exports.waitForResult = waitForResult;
function waitFor(millis, options) {
    return new Promise((resolve, reject) => {
        var _a, _b;
        if ((_a = options === null || options === void 0 ? void 0 : options.signal) === null || _a === void 0 ? void 0 : _a.aborted) {
            reject(new Error("The operation was aborted."));
            return;
        }
        const timeout = setTimeout(() => {
            resolve();
        }, millis);
        (_b = options === null || options === void 0 ? void 0 : options.signal) === null || _b === void 0 ? void 0 : _b.addEventListener("abort", () => {
            clearTimeout(timeout);
            reject(new Error("The operation was aborted."));
        });
    });
}
async function waitForResult(fn, { signal, delay, message } = {}) {
    let iteration = 0;
    while (!(await fn(iteration, { signal }))) {
        if (message !== undefined) {
            console.log(message);
        }
        await waitFor(delay !== null && delay !== void 0 ? delay : 0, { signal });
        iteration++;
    }
}
