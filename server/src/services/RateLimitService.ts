import { inject, injectable } from "inversify";
import { RateLimiterQueue, RateLimiterRedis } from "rate-limiter-flexible";
import { IRedis, REDIS } from "./Redis";

export interface RateLimiterOptions {
  /**
   * Maximum number of points (requests/operations) allowed
   */
  points: number;

  /**
   * Time window in seconds for the rate limit
   * @default 1
   */
  duration?: number;
}

export interface IRateLimitService {
  getRateLimiter(options: RateLimiterOptions): RateLimiterQueue;
}

export const RATE_LIMIT_SERVICE = Symbol.for("RATE_LIMIT_SERVICE");

@injectable()
export class RateLimitService implements IRateLimitService {
  constructor(@inject(REDIS) private redis: IRedis) {}

  getRateLimiter(options: RateLimiterOptions): RateLimiterQueue {
    const { points, duration = 1 } = options;

    const rateLimiterRedis = new RateLimiterRedis({
      storeClient: this.redis.client,
      points,
      duration,
      keyPrefix: "rl",
      execEvenly: false,
      blockDuration: 0,
    });

    return new RateLimiterQueue(rateLimiterRedis, {});
  }
}
