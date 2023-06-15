import { range } from "remeda";
import { RateLimitGuard } from "../helpers/RateLimitGuard";
import { assert } from "console";
import { waitFor } from "../../util/promises/waitFor";

describe("RateLimitGuard", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("ratelimits acccordingly on burst calls", async () => {
    const rateLimit = 10;
    const guard = new RateLimitGuard(rateLimit);
    const start = process.hrtime.bigint();
    const spy = jest.fn();
    await Promise.all([
      Promise.all(
        range(0, 100).map(async () => {
          await guard.waitUntilAllowed();
          spy();
        })
      ),
      (async () => {
        while (jest.getTimerCount() > 0) {
          await jest.advanceTimersToNextTimerAsync();
        }
      })(),
    ]);
    expect(spy).toHaveBeenCalledTimes(100);
    expect(process.hrtime.bigint() - start).toBeGreaterThanOrEqual((100 / rateLimit) * 1e9);
  });

  it("ratelimits acccordingly on random calls", async () => {
    const rateLimit = 10;
    const guard = new RateLimitGuard(rateLimit);
    const start = process.hrtime.bigint();
    const spy = jest.fn();
    let lastCall = 0n;
    await Promise.all([
      (async () => {
        for (const i of range(0, 100)) {
          await guard.waitUntilAllowed();
          expect(process.hrtime.bigint() - lastCall).toBeGreaterThanOrEqual((1 / rateLimit) * 1e9);
          spy();
          lastCall = process.hrtime.bigint();
          // random rate limit but still on average more intense than rateLimit
          if (i < 99) {
            await waitFor(Math.floor(Math.random() * (1 / rateLimit) * 0.4 * 1000));
          }
        }
      })(),
      (async () => {
        while (jest.getTimerCount() > 0) {
          await jest.advanceTimersToNextTimerAsync();
        }
      })(),
    ]);
    expect(spy).toHaveBeenCalledTimes(100);
  });
});
