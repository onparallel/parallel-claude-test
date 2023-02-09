import { ContainerModule } from "inversify";
import { ANALYTICS, AnalyticsService, IAnalyticsService } from "./analytics";
import { AUTH, Auth, IAuth } from "./auth";
import { BankflipService, BANKFLIP_SERVICE, IBankflipService } from "./bankflip";
import {
  BankflipLegacyService,
  BANKFLIP_LEGACY_SERVICE,
  IBankflipLegacyService,
} from "./bankflip-legacy";
import { DowJonesKycService, DOW_JONES_KYC_SERVICE, IDowJonesKycService } from "./dowjones";
import { EMAILS, EmailsService, IEmailsService } from "./emails";
import { FetchService, FETCH_SERVICE, IFetchService } from "./fetch";
import { I18nService, I18N_SERVICE, II18nService } from "./i18n";
import { IImageService, ImageService, IMAGE_SERVICE } from "./image";
import { createLogger, ILogger, LOGGER } from "./logger";
import {
  IOrganizationCreditsService,
  OrganizationCreditsService,
  ORGANIZATION_CREDITS_SERVICE,
} from "./organization-credits";
import {
  IOrganizationLayoutService,
  OrganizationLayoutService,
  ORGANIZATION_LAYOUT_SERVICE,
} from "./organization-layout";
import { IPetitionBinder, PetitionBinder, PETITION_BINDER } from "./petition-binder";
import {
  IPetitionImportExportService,
  PetitionImportExportService,
  PETITION_IMPORT_EXPORT_SERVICE,
} from "./petition-import-export";
import { IPrinter, Printer, PRINTER } from "./printer";
import { IQueuesService, QueuesService, QUEUES_SERVICE } from "./queues";
import { IRedis, REDIS, Redis } from "./redis";
import { ISetupService, SetupService, SETUP_SERVICE } from "./setup";
import { ISignatureService, SIGNATURE, SignatureService } from "./signature";
import { ISmtp, Smtp, SMTP } from "./smtp";
import { IStorageService, StorageService, STORAGE_SERVICE } from "./storage";
import { ITiersService, TiersService, TIERS_SERVICE } from "./tiers";

export const servicesModule = new ContainerModule((bind) => {
  bind<ILogger>(LOGGER).toDynamicValue(createLogger).inSingletonScope();
  bind<IAuth>(AUTH).to(Auth);
  bind<IQueuesService>(QUEUES_SERVICE).to(QueuesService).inSingletonScope();
  bind<IEmailsService>(EMAILS).to(EmailsService);
  bind<IAnalyticsService>(ANALYTICS).to(AnalyticsService).inSingletonScope();
  bind<IRedis>(REDIS).to(Redis).inSingletonScope();
  bind<ISmtp>(SMTP).to(Smtp).inSingletonScope();
  bind<IPrinter>(PRINTER).to(Printer);
  bind<ISignatureService>(SIGNATURE).to(SignatureService);
  bind<IStorageService>(STORAGE_SERVICE).to(StorageService);
  bind<IFetchService>(FETCH_SERVICE).to(FetchService).inSingletonScope();
  bind<IImageService>(IMAGE_SERVICE).to(ImageService).inSingletonScope();
  bind<IPetitionBinder>(PETITION_BINDER).to(PetitionBinder);
  bind<ITiersService>(TIERS_SERVICE).to(TiersService);
  bind<II18nService>(I18N_SERVICE).to(I18nService).inSingletonScope();
  bind<IOrganizationCreditsService>(ORGANIZATION_CREDITS_SERVICE).to(OrganizationCreditsService);
  bind<IDowJonesKycService>(DOW_JONES_KYC_SERVICE).to(DowJonesKycService);
  bind<IBankflipService>(BANKFLIP_SERVICE).to(BankflipService);
  bind<IBankflipLegacyService>(BANKFLIP_LEGACY_SERVICE).to(BankflipLegacyService); // TODO Bankflip Legacy: remove when deprecated
  bind<IPetitionImportExportService>(PETITION_IMPORT_EXPORT_SERVICE).to(
    PetitionImportExportService
  );
  bind<IOrganizationLayoutService>(ORGANIZATION_LAYOUT_SERVICE).to(OrganizationLayoutService);
  bind<ISetupService>(SETUP_SERVICE).to(SetupService);
});
