import { ContainerModule } from "inversify";
import { ANALYTICS, AnalyticsService, IAnalyticsService } from "./analytics";
import { AUTH, Auth, IAuth } from "./auth";
import { Aws, AWS_SERVICE, IAws } from "./aws";
import { EMAILS, EmailsService, IEmailsService } from "./emails";
import { FetchService, FETCH_SERVICE, IFetchService } from "./fetch";
import { createLogger, Logger, LOGGER } from "./logger";
import { IPrinter, Printer, PRINTER } from "./printer";
import { IRedis, REDIS, Redis } from "./redis";
import { SECURITY, SecurityService } from "./security";
import { SIGNATURE, SignatureService } from "./signature";
import { Smtp } from "./smtp";
import { IStorage, Storage, StorageFactory, STORAGE_FACTORY } from "./storage";

export const servicesModule = new ContainerModule((bind) => {
  bind<Logger>(LOGGER).toDynamicValue(createLogger).inSingletonScope();
  bind<IAuth>(AUTH).to(Auth);
  bind<IAws>(AWS_SERVICE).to(Aws).inSingletonScope();
  bind<IEmailsService>(EMAILS).to(EmailsService);
  bind<IAnalyticsService>(ANALYTICS).to(AnalyticsService).inSingletonScope();
  bind<IRedis>(REDIS).to(Redis).inSingletonScope();
  bind<Smtp>(Smtp).toSelf().inSingletonScope();
  bind<IPrinter>(PRINTER).to(Printer).inSingletonScope();
  bind<SignatureService>(SIGNATURE).to(SignatureService);
  bind<SecurityService>(SECURITY).to(SecurityService);
  bind<IStorage>(STORAGE_FACTORY).toFactory(() => {
    return ((...args) => new Storage(...args)) as StorageFactory;
  });
  bind<IFetchService>(FETCH_SERVICE).to(FetchService);
});
