"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stopwatchEnd = exports.withStopwatch = exports.stopwatch = void 0;
async function stopwatch(fn) {
    const time = process.hrtime();
    await fn();
    return stopwatchEnd(time);
}
exports.stopwatch = stopwatch;
async function withStopwatch(fn) {
    let result;
    const time = await stopwatch(async () => {
        result = await fn();
    });
    return { time, result: result };
}
exports.withStopwatch = withStopwatch;
function stopwatchEnd(init) {
    const [seconds, nanoseconds] = process.hrtime(init);
    return seconds * 1000 + Math.round(nanoseconds / 1e6);
}
exports.stopwatchEnd = stopwatchEnd;
