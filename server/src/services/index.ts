import { ContainerModule } from "inversify";
import { Auth } from "./auth";
import { Aws } from "./aws";
import { Cognito } from "./cognito";
import { IRedis, REDIS, Redis } from "./redis";
import { Smtp } from "./smtp";
import { Logger, LOGGER, createLogger } from "./logger";
import { EmailsService } from "./emails";
import { ANALYTICS, AnalyticsService, IAnalyticsService } from "./analytics";

export const servicesModule = new ContainerModule((bind) => {
  bind<Logger>(LOGGER).toDynamicValue(createLogger).inSingletonScope();
  bind<Auth>(Auth).toSelf();
  bind<Aws>(Aws).toSelf().inSingletonScope();
  bind<Cognito>(Cognito).toSelf();
  bind<EmailsService>(EmailsService).toSelf();
  bind<IAnalyticsService>(ANALYTICS).to(AnalyticsService).inSingletonScope();
  bind<IRedis>(REDIS).to(Redis).inSingletonScope();
  bind<Smtp>(Smtp).toSelf().inSingletonScope();
});
