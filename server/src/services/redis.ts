import { injectable, inject } from "inversify";
import { CONFIG, Config } from "../config";
import redis, { RedisClient } from "redis";
import { promisify } from "util";

export interface IRedis {
  waitUntilConnected(): Promise<void>;
  get(key: string): Promise<string | null>;
  set(key: string, value: string, duration?: number): Promise<void>;
  delete(...keys: string[]): Promise<number>;
}

export const REDIS = Symbol.for("REDIS");

@injectable()
export class Redis implements IRedis {
  public readonly client: RedisClient;

  constructor(@inject(CONFIG) config: Config) {
    this.client = redis.createClient(config.redis);
  }

  /**
   * Wait until the connection is stablished.
   */
  async waitUntilConnected() {
    if (this.client.connected) {
      return;
    } else {
      await new Promise((r) => this.client.on("ready", r));
    }
  }

  /**
   * Get the value with the speicified key.
   * @param key The key to use
   */
  async get(key: string): Promise<string | null> {
    const get = promisify(this.client.get.bind(this.client));
    return await get(key);
  }

  /**
   * Store the value with the specified key for the specified duration or indefinite.
   * @param key The key to use
   * @param value The value to store
   * @param duration Duration in seconds
   */
  async set(key: string, value: string, duration?: number) {
    const set: any = promisify(this.client.set.bind(this.client));
    if (duration) {
      await set(key, value, "EX", duration);
    } else {
      await set(key, value);
    }
  }

  /**
   * Deletes the specified cookies returning the number of keys delete
   * @param keys The keys to delete
   */
  async delete(...keys: string[]): Promise<number> {
    const del: any = promisify(this.client.del.bind(this.client));
    return await del(...keys);
  }
}
