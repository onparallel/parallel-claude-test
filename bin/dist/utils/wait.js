"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.wait = wait;
exports.waitFor = waitFor;
async function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
async function waitFor(fn, message, ms) {
    const _ms = typeof message === "number" ? message : ms;
    const _message = typeof message === "number" ? undefined : message;
    let iteration = 0;
    while (!(await fn(iteration))) {
        if (_message !== undefined) {
            console.log(_message);
        }
        await wait(_ms);
        iteration++;
    }
}
