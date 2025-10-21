import { waitFor } from "./wait";

export class RateLimitGuard {
  private intervalInNs: bigint;
  private lastSlot: bigint = 0n;
  private queue: (() => void)[] = [];
  private isRunning: boolean = false;

  constructor(rateLimitPerSecond: number) {
    this.intervalInNs = BigInt(Math.ceil(1e9 / rateLimitPerSecond));
  }

  waitUntilAllowed(): Promise<void> {
    const promise = new Promise<void>((resolve) => {
      this.queue.push(() => resolve());
    });
    this.runQueue().then();
    return promise;
  }

  private async runQueue() {
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
          this.queue.shift()!();
          if (this.queue.length === 0) {
            return;
          }
          await waitFor(Number(this.intervalInNs / BigInt(1e6)));
        } else {
          await waitFor(Number((this.intervalInNs - ellapsed) / BigInt(1e6)));
        }
      }
    } finally {
      this.isRunning = false;
    }
  }
}
