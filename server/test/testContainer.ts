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
import { WebhooksWorker } from "../src/workers/queues/WebhooksWorkerQueue";
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

export async function createTestContainer() {
  const container = createContainer();

  await container.unbind(LOGGER);
  container.bind<ILogger>(LOGGER).toConstantValue(console);

  await container.unbind(REDIS);
  container.bind<IRedis>(REDIS).to(MockRedis).inSingletonScope();

  await container.unbind(ANALYTICS);
  container.bind<IAnalyticsService>(ANALYTICS).to(MockAnalyticsService).inSingletonScope();

  await container.unbind(EMAILS);
  container.bind<IEmailsService>(EMAILS).to(MockEmailsService).inSingletonScope();

  await container.unbind(QUEUES_SERVICE);
  container.bind<IQueuesService>(QUEUES_SERVICE).to(MockQueuesService).inSingletonScope();

  await container.unbind(FETCH_SERVICE);
  container.bind<IFetchService>(FETCH_SERVICE).to(MockFetchService).inSingletonScope();

  await container.unbind(STORAGE_SERVICE);
  container.bind<IStorageService>(STORAGE_SERVICE).to(MockStorage).inSingletonScope();

  await container.unbind(AI_ASSISTANT_SERVICE);
  container
    .bind<IAiAssistantService>(AI_ASSISTANT_SERVICE)
    .to(MockAiAssistantService)
    .inSingletonScope();

  await container.unbind(BACKGROUND_CHECK_SERVICE);
  container
    .bind<IBackgroundCheckService>(BACKGROUND_CHECK_SERVICE)
    .to(MockBackgroundCheckService)
    .inSingletonScope();

  await container.unbind(AUTH);
  container.bind<IAuth>(AUTH).to(MockAuth);

  await container.unbind(DOW_JONES_CLIENT);
  container.bind<IDowJonesClient>(DOW_JONES_CLIENT).to(MockDowJonesClient);

  await container.unbind(EINFORMA_PROFILE_EXTERNAL_SOURCE_INTEGRATION);
  container
    .bind<IProfileExternalSourceIntegration>(EINFORMA_PROFILE_EXTERNAL_SOURCE_INTEGRATION)
    .to(MockEInformaProfileExternalSourceIntegration);

  container.bind(WebhooksWorker).toSelf();

  return container;
}
