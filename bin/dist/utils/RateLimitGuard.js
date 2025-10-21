"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RateLimitGuard = void 0;
const wait_1 = require("./wait");
class RateLimitGuard {
    constructor(rateLimitPerSecond) {
        this.lastSlot = 0n;
        this.queue = [];
        this.isRunning = false;
        this.intervalInNs = BigInt(Math.ceil(1e9 / rateLimitPerSecond));
    }
    waitUntilAllowed() {
        const promise = new Promise((resolve) => {
            this.queue.push(() => resolve());
        });
        this.runQueue().then();
        return promise;
    }
    async runQueue() {
        if (this.isRunning) {
            return;
        }
        try {
            this.isRunning = true;
            while (this.queue.length > 0) {
                const now = process.hrtime.bigint();
                const ellapsed = now - this.lastSlot;
                if (ellapsed > this.intervalInNs) {
                    this.lastSlot = now;
                    this.queue.shift()();
                    if (this.queue.length === 0) {
                        return;
                    }
                    await (0, wait_1.waitFor)(Number(this.intervalInNs / BigInt(1e6)));
                }
                else {
                    await (0, wait_1.waitFor)(Number((this.intervalInNs - ellapsed) / BigInt(1e6)));
                }
            }
        }
        finally {
            this.isRunning = false;
        }
    }
}
exports.RateLimitGuard = RateLimitGuard;
