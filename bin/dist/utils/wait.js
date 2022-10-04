"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.waitFor = exports.wait = void 0;
async function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
exports.wait = wait;
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
exports.waitFor = waitFor;
