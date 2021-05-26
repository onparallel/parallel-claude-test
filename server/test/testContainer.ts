import { createContainer } from "../src/container";
import { ANALYTICS, IAnalyticsService } from "../src/services/analytics";
import { AUTH, IAuth } from "../src/services/auth";
import { AWS_SERVICE, IAws } from "../src/services/aws";
import { EMAILS, IEmailsService } from "../src/services/emails";
import { IRedis, REDIS } from "../src/services/redis";
import {
  IStorage,
  StorageFactory,
  STORAGE_FACTORY,
} from "../src/services/storage";
import {
  MockAnalyticsService,
  MockAuth,
  MockAwsService,
  MockEmailsService,
  MockRedis,
  MockStorage,
} from "./mocks";

export function createTestContainer() {
  const container = createContainer();
  container.rebind<IAuth>(AUTH).to(MockAuth).inSingletonScope();
  container.rebind<IRedis>(REDIS).to(MockRedis);
  container.rebind<IAnalyticsService>(ANALYTICS).to(MockAnalyticsService);
  container
    .rebind<IEmailsService>(EMAILS)
    .to(MockEmailsService)
    .inSingletonScope();
  container.rebind<IAws>(AWS_SERVICE).to(MockAwsService).inSingletonScope();

  container.rebind<IStorage>(STORAGE_FACTORY).toFactory(() => {
    return (() => new MockStorage()) as StorageFactory;
  });
  return container;
}
