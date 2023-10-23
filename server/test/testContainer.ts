import { createContainer } from "../src/container";
import { ANALYTICS, IAnalyticsService } from "../src/services/AnalyticsService";
import { AUTH, IAuth } from "../src/services/AuthService";
import { DOW_JONES_CLIENT, IDowJonesClient } from "../src/services/DowJonesClient";
import { EMAILS, IEmailsService } from "../src/services/EmailsService";
import { FETCH_SERVICE, IFetchService } from "../src/services/FetchService";
import { ILogger, LOGGER } from "../src/services/Logger";
import { IQueuesService, QUEUES_SERVICE } from "../src/services/QueuesService";
import { IRedis, REDIS } from "../src/services/Redis";
import { IStorageService, STORAGE_SERVICE } from "../src/services/StorageService";
import {
  MockAnalyticsService,
  MockAuth,
  MockDowJonesClient,
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
  container.rebind<IDowJonesClient>(DOW_JONES_CLIENT).to(MockDowJonesClient);
  return container;
}
