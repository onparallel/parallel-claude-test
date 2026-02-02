import { inject, injectable } from "inversify";
import * as redis from "redis";
import { isNonNullish } from "remeda";
import { CONFIG, Config } from "../config";

export interface IRedis {
  /**
   * Connect to redis
   */
  connect(): Promise<void>;

  sendRawCommand: RedisClient["sendCommand"];

  withConnection(): Promise<AsyncDisposable>;

  /**
   * Get the value with the speicified key.
   * @param key The key to use
   */
  get(key: string): Promise<string | null>;

  /**
   * Store the value with the specified key for the specified duration or indefinite.
   * @param key The key to use
   * @param value The value to store
   * @param duration Duration in seconds
   */
  set(key: string, value: string, duration?: number): Promise<void>;

  /**
   * Deletes the specified cookies returning the number of keys delete
   * @param keys The keys to delete
   */
  delete(...keys: string[]): Promise<number>;
}

export const REDIS = Symbol.for("REDIS");

type RedisClient = ReturnType<typeof redis.createClient>;

@injectable()
export class Redis implements IRedis {
  private readonly client: RedisClient;
  public readonly sendRawCommand: RedisClient["sendCommand"];

  constructor(@inject(CONFIG) config: Config) {
    this.client = redis.createClient({
      socket: {
        ...config.redis,
        ...(process.env.NODE_ENV === "production" ? { tls: true } : {}),
      },
    });
    this.sendRawCommand = this.client.sendCommand.bind(this.client);
  }

  async connect() {
    await this.client.connect();
  }

  async withConnection(): Promise<AsyncDisposable> {
    if (this.client.isOpen) {
      return {
        [Symbol.asyncDispose]: async () => {},
      };
    }
    await this.client.connect();
    return {
      [Symbol.asyncDispose]: async () => {
        await this.client.disconnect();
      },
    };
  }

  async get(key: string) {
    return await this.client.get(key);
  }

  async set(key: string, value: string, duration?: number) {
    if (isNonNullish(duration)) {
      await this.client.set(key, value, { EX: duration });
    } else {
      await this.client.set(key, value);
    }
  }

  async delete(...keys: string[]): Promise<number> {
    return await this.client.del(keys);
  }
}
