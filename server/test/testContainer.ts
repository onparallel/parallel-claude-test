import { createContainer } from "../src/container";
import { ANALYTICS, IAnalyticsService } from "../src/services/analytics";
import { AUTH, IAuth } from "../src/services/auth";
import { AWS_SERVICE, IAws } from "../src/services/aws";
import { EMAILS, IEmailsService } from "../src/services/emails";
import { FETCH_SERVICE, IFetchService } from "../src/services/fetch";
import { ILogger, LOGGER } from "../src/services/logger";
import { IRedis, REDIS } from "../src/services/redis";
import { ISignatureService, SIGNATURE } from "../src/services/signature";
import { IStorageService, STORAGE_SERVICE } from "../src/services/storage";
import {
  MockAnalyticsService,
  MockAuth,
  MockAwsService,
  MockEmailsService,
  MockFetchService,
  MockRedis,
  MockSignatureService,
  MockStorage,
} from "./mocks";

export function createTestContainer() {
  const container = createContainer();
  container.rebind<ILogger>(LOGGER).toConstantValue(console);
  container.rebind<IAuth>(AUTH).to(MockAuth).inSingletonScope();
  container.rebind<IRedis>(REDIS).to(MockRedis);
  container.rebind<IAnalyticsService>(ANALYTICS).to(MockAnalyticsService);
  container.rebind<IEmailsService>(EMAILS).to(MockEmailsService).inSingletonScope();
  container.rebind<IAws>(AWS_SERVICE).to(MockAwsService).inSingletonScope();
  container.rebind<IFetchService>(FETCH_SERVICE).to(MockFetchService).inSingletonScope();
  container.rebind<ISignatureService>(SIGNATURE).to(MockSignatureService).inSingletonScope();
  container.rebind<IStorageService>(STORAGE_SERVICE).to(MockStorage);
  return container;
}
