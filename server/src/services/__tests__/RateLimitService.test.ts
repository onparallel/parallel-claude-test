import { Container } from "inversify";
import pMap from "p-map";
import { range } from "remeda";
import { createTestContainer } from "../../../test/testContainer";
import { IRateLimitService, RATE_LIMIT_SERVICE } from "../RateLimitService";
import { IRedis, REDIS } from "../Redis";

describe("RateLimitService", () => {
  let container: Container;
  let rateLimitService: IRateLimitService;
  let redisInstance: IRedis;

  beforeAll(async () => {
    container = await createTestContainer();
    redisInstance = container.get<IRedis>(REDIS);
    await redisInstance.connect();

    rateLimitService = container.get<IRateLimitService>(RATE_LIMIT_SERVICE);
  });

  afterAll(async () => {
    await redisInstance.disconnect();
  });

  afterEach(async () => {
    // Clear Redis data between tests
    await redisInstance.client.flushDb();
  });

  it("maintains separate limits for different keys", async () => {
    const rateLimiter = rateLimitService.getRateLimiter({
      points: 2,
      duration: 10,
    });

    const key1 = "x1";
    const key2 = "x2";

    // Consume all tokens for key1
    await rateLimiter.removeTokens(1, key1);
    await rateLimiter.removeTokens(1, key1);

    // key2 should still have tokens available and complete quickly
    const start = Date.now();
    await rateLimiter.removeTokens(1, key2);
    await rateLimiter.removeTokens(1, key2);

    expect(Date.now() - start).toBeLessThan(50);
  });

  it("handles high concurrency without exceeding limits", async () => {
    const rateLimiter = rateLimitService.getRateLimiter({
      points: 5,
      duration: 1,
    });
    const start = Date.now();
    await pMap(range(0, 20), async (i) => {
      await rateLimiter.removeTokens(1, `xxx`);
      expect(Date.now() - start).toBeGreaterThan(Math.floor(i / 5) * 1000);
      expect(Date.now() - start).toBeLessThan(Math.floor(i / 5) * 1000 + 200);
    });
  });
});
