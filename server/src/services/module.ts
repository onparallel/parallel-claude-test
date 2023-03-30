import { ContainerModule } from "inversify";
import { ANALYTICS, AnalyticsService, IAnalyticsService } from "./AnalyticsService";
import { AUTH, Auth, IAuth } from "./AuthService";
import { BankflipService, BANKFLIP_SERVICE, IBankflipService } from "./BankflipService";
import {
  BankflipLegacyService,
  BANKFLIP_LEGACY_SERVICE,
  IBankflipLegacyService,
} from "./BankflipLegacyService";
import { DowJonesClient, DOW_JONES_CLIENT, IDowJonesClient } from "./DowJonesClient";
import { EMAILS, EmailsService, IEmailsService } from "./EmailsService";
import { FetchService, FETCH_SERVICE, IFetchService } from "./FetchService";
import { I18nService, I18N_SERVICE, II18nService } from "./I18nService";
import { IImageService, ImageService, IMAGE_SERVICE } from "./ImageService";
import { createLogger, ILogger, LOGGER } from "./Logger";
import {
  IOrganizationCreditsService,
  OrganizationCreditsService,
  ORGANIZATION_CREDITS_SERVICE,
} from "./OrganizationCreditsService";
import {
  IOrganizationLayoutService,
  OrganizationLayoutService,
  ORGANIZATION_LAYOUT_SERVICE,
} from "./OrganizationLayoutService";
import { IPetitionBinder, PetitionBinder, PETITION_BINDER } from "./PetitionBinder";
import {
  IPetitionImportExportService,
  PetitionImportExportService,
  PETITION_IMPORT_EXPORT_SERVICE,
} from "./PetitionImportExportService";
import { IPrinter, Printer, PRINTER } from "./Printer";
import { IQueuesService, QueuesService, QUEUES_SERVICE } from "./QueuesService";
import { IRedis, REDIS, Redis } from "./Redis";
import { IReportsService, ReportsService, REPORTS_SERVICE } from "./ReportsService";
import { IEncryptionService, EncryptionService, ENCRYPTION_SERVICE } from "./EncryptionService";
import { ISetupService, SetupService, SETUP_SERVICE } from "./setup";
import { ISignatureService, SIGNATURE, SignatureService } from "./SignatureService";
import { ISmtp, Smtp, SMTP } from "./Smtp";
import { IStorageService, StorageService, STORAGE_SERVICE } from "./StorageService";
import { ITiersService, TiersService, TIERS_SERVICE } from "./TiersService";

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
  bind<IDowJonesClient>(DOW_JONES_CLIENT).to(DowJonesClient);
  bind<IBankflipService>(BANKFLIP_SERVICE).to(BankflipService);
  bind<IBankflipLegacyService>(BANKFLIP_LEGACY_SERVICE).to(BankflipLegacyService); // TODO Bankflip Legacy: remove when deprecated
  bind<IPetitionImportExportService>(PETITION_IMPORT_EXPORT_SERVICE).to(
    PetitionImportExportService
  );
  bind<IOrganizationLayoutService>(ORGANIZATION_LAYOUT_SERVICE).to(OrganizationLayoutService);
  bind<ISetupService>(SETUP_SERVICE).to(SetupService);
  bind<IReportsService>(REPORTS_SERVICE).to(ReportsService);
  bind<IEncryptionService>(ENCRYPTION_SERVICE).to(EncryptionService);
});
