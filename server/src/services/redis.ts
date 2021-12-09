import { inject, injectable } from "inversify";
import * as redis from "redis";
import { isDefined } from "remeda";
import { CONFIG, Config } from "../config";

export interface IRedis {
  connect(): Promise<void>;
  get(key: string): Promise<string | null>;
  set(key: string, value: string, duration?: number): Promise<void>;
  delete(...keys: string[]): Promise<number>;
}

export const REDIS = Symbol.for("REDIS");

@injectable()
export class Redis implements IRedis {
  private readonly client: ReturnType<typeof redis.createClient>;

  constructor(@inject(CONFIG) config: Config) {
    this.client = redis.createClient({ socket: { ...config.redis } });
  }

  /**
   * Connect to redis
   */
  async connect() {
    await this.client.connect();
  }

  /**
   * Get the value with the speicified key.
   * @param key The key to use
   */
  async get(key: string) {
    return await this.client.get(key);
  }

  /**
   * Store the value with the specified key for the specified duration or indefinite.
   * @param key The key to use
   * @param value The value to store
   * @param duration Duration in seconds
   */
  async set(key: string, value: string, duration?: number) {
    if (isDefined(duration)) {
      await this.client.set(key, value, { EX: duration });
    } else {
      await this.client.set(key, value);
    }
  }

  /**
   * Deletes the specified cookies returning the number of keys delete
   * @param keys The keys to delete
   */
  async delete(...keys: string[]): Promise<number> {
    return await this.client.del(keys);
  }
}
