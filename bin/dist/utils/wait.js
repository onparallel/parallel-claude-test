"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.waitFor = exports.wait = void 0;
async function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
exports.wait = wait;
async function waitFor(fn, message, ms) {
    while (!(await fn())) {
        console.log(message);
        await wait(ms);
    }
}
exports.waitFor = waitFor;
