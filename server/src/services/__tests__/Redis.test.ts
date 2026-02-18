import { Container } from "inversify";
import { createTestContainer } from "../../../test/testContainer";
import { waitFor } from "../../util/promises/waitFor";
import { IRedis, REDIS } from "../Redis";

describe("Redis", () => {
  let container: Container;
  let redisInstance: IRedis;

  beforeAll(async () => {
    container = await createTestContainer();

    redisInstance = container.get<IRedis>(REDIS);
    await redisInstance.connect();
  });

  afterAll(async () => {
    await redisInstance.disconnect();
  });

  afterEach(async () => {
    await redisInstance.client.flushDb();
  });

  describe("withLock", () => {
    it("acquires a lock when no one else holds it", async () => {
      const lock = await redisInstance.withLock({ key: "test-lock", maxTime: 10 });

      expect(lock.alreadyLocked).toBe(false);

      await lock[Symbol.asyncDispose]();
    });

    it("reports alreadyLocked when the lock is already held", async () => {
      const lock1 = await redisInstance.withLock({ key: "test-lock", maxTime: 10 });
      const lock2 = await redisInstance.withLock({ key: "test-lock", maxTime: 10 });

      expect(lock1.alreadyLocked).toBe(false);
      expect(lock2.alreadyLocked).toBe(true);

      await lock2[Symbol.asyncDispose]();
      await lock1[Symbol.asyncDispose]();
    });

    it("allows re-acquiring the lock after it is released", async () => {
      const lock1 = await redisInstance.withLock({ key: "test-lock", maxTime: 10 });
      await lock1[Symbol.asyncDispose]();

      const lock2 = await redisInstance.withLock({ key: "test-lock", maxTime: 10 });
      expect(lock2.alreadyLocked).toBe(false);

      await lock2[Symbol.asyncDispose]();
    });

    it("does not release a lock it did not acquire", async () => {
      const lock1 = await redisInstance.withLock({ key: "test-lock", maxTime: 10 });
      const lock2 = await redisInstance.withLock({ key: "test-lock", maxTime: 10 });

      // Disposing lock2 should not release the lock since it didn't acquire it
      await lock2[Symbol.asyncDispose]();

      const lock3 = await redisInstance.withLock({ key: "test-lock", maxTime: 10 });
      expect(lock3.alreadyLocked).toBe(true);

      await lock1[Symbol.asyncDispose]();
    });

    it("uses separate locks for different keys", async () => {
      const lock1 = await redisInstance.withLock({ key: "lock-a", maxTime: 10 });
      const lock2 = await redisInstance.withLock({ key: "lock-b", maxTime: 10 });

      expect(lock1.alreadyLocked).toBe(false);
      expect(lock2.alreadyLocked).toBe(false);

      await lock1[Symbol.asyncDispose]();
      await lock2[Symbol.asyncDispose]();
    });

    it("auto-expires after maxTime", async () => {
      const lock1 = await redisInstance.withLock({ key: "test-lock", maxTime: 1 });
      expect(lock1.alreadyLocked).toBe(false);

      await waitFor(1100);

      const lock2 = await redisInstance.withLock({ key: "test-lock", maxTime: 10 });
      expect(lock2.alreadyLocked).toBe(false);

      await lock2[Symbol.asyncDispose]();
    });

    it("works with await using syntax", async () => {
      {
        await using lock = await redisInstance.withLock({ key: "test-lock", maxTime: 10 });
        expect(lock.alreadyLocked).toBe(false);
      }
      // Lock should be released after block exits
      const lock2 = await redisInstance.withLock({ key: "test-lock", maxTime: 10 });
      expect(lock2.alreadyLocked).toBe(false);

      await lock2[Symbol.asyncDispose]();
    });
  });
});
