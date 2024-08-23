"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stopwatch = stopwatch;
exports.withStopwatch = withStopwatch;
exports.stopwatchEnd = stopwatchEnd;
async function stopwatch(fn) {
    const time = process.hrtime();
    await fn();
    return stopwatchEnd(time);
}
async function withStopwatch(fn) {
    let result;
    const time = await stopwatch(async () => {
        result = await fn();
    });
    return { time, result: result };
}
function stopwatchEnd(init) {
    const [seconds, nanoseconds] = process.hrtime(init);
    return seconds * 1000 + Math.round(nanoseconds / 1e6);
}
