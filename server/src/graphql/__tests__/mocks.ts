import { injectable } from "inversify";
import { IAnalyticsService } from "../../services/analytics";
import { IRedis } from "../../services/redis";

export const userCognitoId = "test-cognito-id";

@injectable()
export class MockAuth {
  validateSession: any = () => userCognitoId;
}

@injectable()
export class MockRedis implements IRedis {
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
export class MockAnalyticsService implements IAnalyticsService {
  async identifyUser() {}
  async trackEvent() {}
}
