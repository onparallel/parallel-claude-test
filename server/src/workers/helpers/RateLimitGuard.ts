import { waitFor } from "../../util/promises/waitFor";

interface RateLimitBucket {
  lastSlot: bigint;
  queue: (() => void)[];
  isRunning: boolean;
}

export class RateLimitGuard {
  private intervalInNs: bigint;
  private buckets: Record<string, RateLimitBucket> = {};

  constructor(rateLimitPerSecond: number) {
    this.intervalInNs = BigInt(Math.ceil(1e9 / rateLimitPerSecond));
  }

  waitUntilAllowed(bucketName = "undefined"): Promise<void> {
    const promise = new Promise<void>((resolve) => {
      this.buckets[bucketName] ??= { lastSlot: 0n, queue: [], isRunning: false };
      this.buckets[bucketName].queue.push(() => resolve());
    });
    this.runQueue(bucketName).then();
    return promise;
  }

  private async runQueue(bucketName: string) {
    if (this.buckets[bucketName].isRunning) {
      return;
    }
    try {
      this.buckets[bucketName].isRunning = true;
      while (this.buckets[bucketName].queue.length > 0) {
        const now = process.hrtime.bigint();
        const ellapsed = now - this.buckets[bucketName].lastSlot;
        if (ellapsed > this.intervalInNs) {
          this.buckets[bucketName].lastSlot = now;
          this.buckets[bucketName].queue.shift()!();
          if (this.buckets[bucketName].queue.length === 0) {
            return;
          }
          await waitFor(Number(this.intervalInNs / BigInt(1e6)));
        } else {
          await waitFor(Number((this.intervalInNs - ellapsed) / BigInt(1e6)));
        }
      }
    } finally {
      this.buckets[bucketName].isRunning = false;
    }
  }
}
