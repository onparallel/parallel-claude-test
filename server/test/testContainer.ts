import { createContainer } from "../src/container";
import { ANALYTICS, IAnalyticsService } from "../src/services/analytics";
import { AUTH, IAuth } from "../src/services/auth";
import { EMAILS, IEmailsService } from "../src/services/emails";
import { FETCH_SERVICE, IFetchService } from "../src/services/fetch";
import { ILogger, LOGGER } from "../src/services/logger";
import { IQueuesService, QUEUES_SERVICE } from "../src/services/queues";
import { IRedis, REDIS } from "../src/services/redis";
import { IStorageService, STORAGE_SERVICE } from "../src/services/storage";
import {
  MockAnalyticsService,
  MockAuth,
  MockEmailsService,
  MockFetchService,
  MockQueuesService,
  MockRedis,
  MockStorage,
} from "./mocks";

export function createTestContainer() {
  const container = createContainer();
  container.rebind<ILogger>(LOGGER).toConstantValue(console);
  container.rebind<IAuth>(AUTH).to(MockAuth).inSingletonScope();
  container.rebind<IRedis>(REDIS).to(MockRedis);
  container.rebind<IAnalyticsService>(ANALYTICS).to(MockAnalyticsService);
  container.rebind<IEmailsService>(EMAILS).to(MockEmailsService).inSingletonScope();
  container.rebind<IQueuesService>(QUEUES_SERVICE).to(MockQueuesService).inSingletonScope();
  container.rebind<IFetchService>(FETCH_SERVICE).to(MockFetchService).inSingletonScope();
  container.rebind<IStorageService>(STORAGE_SERVICE).to(MockStorage);
  return container;
}
