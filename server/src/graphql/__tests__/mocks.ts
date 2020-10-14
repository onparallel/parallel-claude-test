import { Auth } from "../../services/auth";
import { Cognito } from "../../services/cognito";
import { Redis } from "./../../services/redis";
import { injectable, inject } from "inversify";
import { CONFIG, Config } from "../../config";
import { AnalyticsService } from "../../services/analytics";

export const userCognitoId = "test-cognito-id";

@injectable()
export class MockAuth extends Auth {
  constructor(cognito: Cognito, redis: Redis) {
    super(cognito, redis);
  }
  validateSession: any = () => userCognitoId;
}

@injectable()
export class MockRedis implements Redis {
  public readonly client: any;
  constructor(@inject(CONFIG) config: Config) {}

  async waitUntilConnected() {
    return;
  }

  async get(key: string): Promise<string | null> {
    return null;
  }

  async set(key: string, value: string, duration?: number) {}

  async delete(...keys: string[]): Promise<number> {
    return 0;
  }
}

@injectable()
export class MockAnalyticsService implements AnalyticsService {
  public readonly analytics: any;
  constructor(@inject(CONFIG) config: Config) {}
  async identifyUser() {}
  async trackEvent() {}
}
