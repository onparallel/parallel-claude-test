import { Container } from "inversify";
import pMap from "p-map";
import { range } from "remeda";
import { GenericContainer, StartedTestContainer, Wait } from "testcontainers";
import { CONFIG, Config } from "../../config";
import { IRateLimitService, RATE_LIMIT_SERVICE, RateLimitService } from "../RateLimitService";
import { IRedis, Redis, REDIS } from "../Redis";

describe("RateLimitService", () => {
  let container: Container;
  let rateLimitService: IRateLimitService;
  let redisInstance: IRedis;
  let redisContainer: StartedTestContainer;

  beforeAll(async () => {
    // Start Redis container
    redisContainer = await new GenericContainer("redis:7.2")
      .withExposedPorts({ container: 6379, host: 6378 })
      .withWaitStrategy(Wait.forLogMessage("Ready to accept connections"))
      .start();

    // Setup InversifyJS container with real Redis instance
    container = new Container();
    container.bind<Config>(CONFIG).toConstantValue({
      redis: {
        host: "localhost",
        port: 6378,
      },
    } as Config);
    container.bind<IRedis>(REDIS).to(Redis).inSingletonScope();
    container.bind<IRateLimitService>(RATE_LIMIT_SERVICE).to(RateLimitService).inSingletonScope();

    redisInstance = container.get<IRedis>(REDIS);
    await redisInstance.connect();

    rateLimitService = container.get<IRateLimitService>(RATE_LIMIT_SERVICE);
  }, 60000); // Increase timeout for container startup

  afterAll(async () => {
    await redisInstance.disconnect();
    await redisContainer.stop();
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
