import { ContainerModule } from "inversify";
import { AUTH, Auth, IAuth } from "./auth";
import { Aws } from "./aws";
import { Cognito } from "./cognito";
import { IRedis, REDIS, Redis } from "./redis";
import { Smtp } from "./smtp";
import { Logger, LOGGER, createLogger } from "./logger";
import { EMAILS, EmailsService, IEmailsService } from "./emails";
import { ANALYTICS, AnalyticsService, IAnalyticsService } from "./analytics";

export const servicesModule = new ContainerModule((bind) => {
  bind<Logger>(LOGGER).toDynamicValue(createLogger).inSingletonScope();
  bind<IAuth>(AUTH).to(Auth);
  bind<Aws>(Aws).toSelf().inSingletonScope();
  bind<Cognito>(Cognito).toSelf();
  bind<IEmailsService>(EMAILS).to(EmailsService);
  bind<IAnalyticsService>(ANALYTICS).to(AnalyticsService).inSingletonScope();
  bind<IRedis>(REDIS).to(Redis).inSingletonScope();
  bind<Smtp>(Smtp).toSelf().inSingletonScope();
});
