import { ContainerModule } from "inversify";
import { ANALYTICS, AnalyticsService, IAnalyticsService } from "./analytics";
import { AUTH, Auth, IAuth } from "./auth";
import { Aws, AWS_SERVICE, IAws } from "./aws";
import { EMAILS, EmailsService, IEmailsService } from "./emails";
import { FetchService, FETCH_SERVICE, IFetchService } from "./fetch";
import { IImageService, ImageService, IMAGE_SERVICE } from "./image";
import { createLogger, ILogger, LOGGER } from "./logger";
import { IPetitionBinder, PetitionBinder, PETITION_BINDER } from "./petition-binder";
import { IPrinter, Printer, PRINTER } from "./printer";
import { IRedis, REDIS, Redis } from "./redis";
import { SIGNATURE, SignatureService } from "./signature";
import { Smtp } from "./smtp";
import { IStorage, Storage, StorageFactory, STORAGE_FACTORY } from "./storage";
import { ITiersService, TiersService, TIERS_SERVICE } from "./tiers";

export const servicesModule = new ContainerModule((bind) => {
  bind<ILogger>(LOGGER).toDynamicValue(createLogger).inSingletonScope();
  bind<IAuth>(AUTH).to(Auth);
  bind<IAws>(AWS_SERVICE).to(Aws).inSingletonScope();
  bind<IEmailsService>(EMAILS).to(EmailsService);
  bind<IAnalyticsService>(ANALYTICS).to(AnalyticsService).inSingletonScope();
  bind<IRedis>(REDIS).to(Redis).inSingletonScope();
  bind<Smtp>(Smtp).toSelf().inSingletonScope();
  bind<IPrinter>(PRINTER).to(Printer);
  bind<SignatureService>(SIGNATURE).to(SignatureService);
  bind<IStorage>(STORAGE_FACTORY).toFactory(() => {
    return ((...args) => new Storage(...args)) as StorageFactory;
  });
  bind<IFetchService>(FETCH_SERVICE).to(FetchService).inSingletonScope();
  bind<IImageService>(IMAGE_SERVICE).to(ImageService).inSingletonScope();
  bind<IPetitionBinder>(PETITION_BINDER).to(PetitionBinder);
  bind<ITiersService>(TIERS_SERVICE).to(TiersService);
});
