"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.waitFor = waitFor;
exports.waitForResult = waitForResult;
function waitFor(millis, options) {
    return new Promise((resolve, reject) => {
        if (options?.signal?.aborted) {
            reject(new Error("The operation was aborted."));
            return;
        }
        const timeout = setTimeout(() => {
            resolve();
        }, millis);
        options?.signal?.addEventListener("abort", () => {
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
        await waitFor(delay ?? 0, { signal });
        iteration++;
    }
}
