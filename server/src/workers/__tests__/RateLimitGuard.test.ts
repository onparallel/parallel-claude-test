import { range } from "remeda";
import { waitFor } from "../../util/promises/waitFor";
import { RateLimitGuard } from "../helpers/RateLimitGuard";

describe("RateLimitGuard", () => {
  beforeEach(() => {
    // Must include "hrtime" so that process.hrtime.bigint() is faked.
    // Unlike Jest, Vitest does not fake hrtime by default.
    vi.useFakeTimers({
      toFake: ["setTimeout", "clearTimeout", "Date", "hrtime"],
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("ratelimits acccordingly on burst calls", async () => {
    const rateLimit = 14;
    const guard = new RateLimitGuard(rateLimit);
    const start = process.hrtime.bigint();
    const spy = vi.fn();
    await Promise.all([
      ...range(0, 100).map(async () => {
        await guard.waitUntilAllowed();
        spy();
      }),
      (async () => {
        // Use advanceTimersByTimeAsync(1) instead of advanceTimersToNextTimerAsync()
        // to guarantee at least 1ms clock advancement per iteration. RateLimitGuard
        // uses nanosecond-precision hrtime but creates millisecond-precision timers
        // via waitFor, so sub-ms remainders can produce 0ms timers that never
        // advance the faked clock enough.
        while (spy.mock.calls.length < 100) {
          await vi.advanceTimersByTimeAsync(1);
        }
      })(),
    ]);
    expect(spy).toHaveBeenCalledTimes(100);
    expect(process.hrtime.bigint() - start).toBeGreaterThanOrEqual((100 / rateLimit) * 1e9);
  });

  it("ratelimits acccordingly on random calls", async () => {
    const rateLimit = 14;
    const guard = new RateLimitGuard(rateLimit);
    const spy = vi.fn();
    let lastCall = 0n;
    await Promise.all([
      (async () => {
        for (const i of range(0, 100)) {
          await guard.waitUntilAllowed();
          expect(process.hrtime.bigint() - lastCall).toBeGreaterThanOrEqual((1 / rateLimit) * 1e9);
          spy(i);
          lastCall = process.hrtime.bigint();
          // random rate limit but still on average more intense than rateLimit
          if (i < 99) {
            await waitFor(Math.floor(Math.random() * (1 / rateLimit) * 0.4 * 1000));
          }
        }
      })(),
      (async () => {
        while (spy.mock.calls.length < 100) {
          await vi.advanceTimersByTimeAsync(1);
        }
      })(),
    ]);
    let counter = 1;
    for (const i of range(0, 100)) {
      expect(spy).toHaveBeenNthCalledWith(counter++, i);
    }
  });
});
