import { ContainerModule } from "inversify";
import { AUTH, Auth, IAuth } from "./auth";
import { Aws } from "./aws";
import { Cognito } from "./cognito";
import { IRedis, REDIS, Redis } from "./redis";
import { Smtp } from "./smtp";
import { Logger, LOGGER, createLogger } from "./logger";
import { EMAILS, EmailsService, IEmailsService } from "./emails";
import { ANALYTICS, AnalyticsService, IAnalyticsService } from "./analytics";
import { Printer, IPrinter, PRINTER } from "./printer";
import { SIGNATURE, SignatureService } from "./signature";
import { SECURITY, SecurityService } from "./security";
import { Storage, StorageFactory, STORAGE_FACTORY } from "./storage";

export const servicesModule = new ContainerModule((bind) => {
  bind<Logger>(LOGGER).toDynamicValue(createLogger).inSingletonScope();
  bind<IAuth>(AUTH).to(Auth);
  bind<Aws>(Aws).toSelf().inSingletonScope();
  bind<Cognito>(Cognito).toSelf();
  bind<IEmailsService>(EMAILS).to(EmailsService);
  bind<IAnalyticsService>(ANALYTICS).to(AnalyticsService).inSingletonScope();
  bind<IRedis>(REDIS).to(Redis).inSingletonScope();
  bind<Smtp>(Smtp).toSelf().inSingletonScope();
  bind<IPrinter>(PRINTER).to(Printer).inSingletonScope();
  bind<SignatureService>(SIGNATURE).to(SignatureService);
  bind<SecurityService>(SECURITY).to(SecurityService);
  bind<StorageFactory>(STORAGE_FACTORY).toFactory(() => {
    return ((...args) => new Storage(...args)) as StorageFactory;
  });
});
