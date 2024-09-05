import { createContainer } from "../src/container";
import { DOW_JONES_CLIENT, IDowJonesClient } from "../src/integrations/dow-jones/DowJonesClient";
import { EINFORMA_PROFILE_EXTERNAL_SOURCE_INTEGRATION } from "../src/integrations/profile-external-source/einforma/EInformaProfileExternalSourceIntegration";
import { IProfileExternalSourceIntegration } from "../src/integrations/profile-external-source/ProfileExternalSourceIntegration";
import { AI_ASSISTANT_SERVICE, IAiAssistantService } from "../src/services/AiAssistantService";
import { ANALYTICS, IAnalyticsService } from "../src/services/AnalyticsService";
import { AUTH, IAuth } from "../src/services/AuthService";
import {
  BACKGROUND_CHECK_SERVICE,
  IBackgroundCheckService,
} from "../src/services/BackgroundCheckService";
import { EMAILS, IEmailsService } from "../src/services/EmailsService";
import { FETCH_SERVICE, IFetchService } from "../src/services/FetchService";
import { ILogger, LOGGER } from "../src/services/Logger";
import { IQueuesService, QUEUES_SERVICE } from "../src/services/QueuesService";
import { IRedis, REDIS } from "../src/services/Redis";
import { IStorageService, STORAGE_SERVICE } from "../src/services/StorageService";
import {
  MockAiAssistantService,
  MockAnalyticsService,
  MockAuth,
  MockBackgroundCheckService,
  MockDowJonesClient,
  MockEInformaProfileExternalSourceIntegration,
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
  container
    .rebind<IBackgroundCheckService>(BACKGROUND_CHECK_SERVICE)
    .to(MockBackgroundCheckService)
    .inSingletonScope();
  container
    .rebind<IAiAssistantService>(AI_ASSISTANT_SERVICE)
    .to(MockAiAssistantService)
    .inSingletonScope();
  container
    .rebind<IProfileExternalSourceIntegration>(EINFORMA_PROFILE_EXTERNAL_SOURCE_INTEGRATION)
    .to(MockEInformaProfileExternalSourceIntegration)
    .inSingletonScope();

  return container;
}
