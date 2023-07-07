import { ContainerModule } from "inversify";
import {
  ACCOUNT_SETUP_SERVICE,
  AccountSetupService,
  IAccountSetupService,
} from "./AccountSetupService";
import { ANALYTICS, AnalyticsService, IAnalyticsService } from "./AnalyticsService";
import { AUTH, Auth, IAuth } from "./AuthService";
import { BANKFLIP_SERVICE, BankflipService, IBankflipService } from "./BankflipService";
import { DOW_JONES_CLIENT, DowJonesClient, IDowJonesClient } from "./DowJonesClient";
import { EMAILS, EmailsService, IEmailsService } from "./EmailsService";
import { ENCRYPTION_SERVICE, EncryptionService, IEncryptionService } from "./EncryptionService";
import { FETCH_SERVICE, FetchService, IFetchService } from "./FetchService";
import { I18N_SERVICE, I18nService, II18nService } from "./I18nService";
import { IImageService, IMAGE_SERVICE, ImageService } from "./ImageService";
import {
  IIntegrationsSetupService,
  INTEGRATIONS_SETUP_SERVICE,
  IntegrationsSetupService,
} from "./IntegrationsSetupService";
import { ILogger, LOGGER, createLogger } from "./Logger";
import {
  IOrganizationCreditsService,
  ORGANIZATION_CREDITS_SERVICE,
  OrganizationCreditsService,
} from "./OrganizationCreditsService";
import {
  IOrganizationLayoutService,
  ORGANIZATION_LAYOUT_SERVICE,
  OrganizationLayoutService,
} from "./OrganizationLayoutService";
import { IPetitionBinder, PETITION_BINDER, PetitionBinder } from "./PetitionBinder";
import {
  IPetitionImportExportService,
  PETITION_IMPORT_EXPORT_SERVICE,
  PetitionImportExportService,
} from "./PetitionImportExportService";
import {
  IPetitionMessageContextService,
  PETITION_MESSAGE_CONTEXT_SERVICE,
  PetitionMessageContextService,
} from "./PetitionMessageContextService";
import { IPrinter, PRINTER, Printer } from "./Printer";
import {
  IProfilesSetupService,
  PROFILES_SETUP_SERVICE,
  ProfilesSetupService,
} from "./ProfilesSetupService";
import { IQueuesService, QUEUES_SERVICE, QueuesService } from "./QueuesService";
import { IRedis, REDIS, Redis } from "./Redis";
import { IReportsService, REPORTS_SERVICE, ReportsService } from "./ReportsService";
import { ISignatureService, SIGNATURE, SignatureService } from "./SignatureService";
import { ISmtp, SMTP, Smtp } from "./Smtp";
import { IStorageService, STORAGE_SERVICE, StorageService } from "./StorageService";
import { ITiersService, TIERS_SERVICE, TiersService } from "./TiersService";

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
  bind<IEncryptionService>(ENCRYPTION_SERVICE).to(EncryptionService).inSingletonScope();
  bind<IOrganizationCreditsService>(ORGANIZATION_CREDITS_SERVICE).to(OrganizationCreditsService);
  bind<IDowJonesClient>(DOW_JONES_CLIENT).to(DowJonesClient);
  bind<IBankflipService>(BANKFLIP_SERVICE).to(BankflipService);
  bind<IPetitionImportExportService>(PETITION_IMPORT_EXPORT_SERVICE).to(
    PetitionImportExportService,
  );
  bind<IOrganizationLayoutService>(ORGANIZATION_LAYOUT_SERVICE).to(OrganizationLayoutService);
  bind<IReportsService>(REPORTS_SERVICE).to(ReportsService);
  bind<IAccountSetupService>(ACCOUNT_SETUP_SERVICE).to(AccountSetupService);
  bind<IIntegrationsSetupService>(INTEGRATIONS_SETUP_SERVICE).to(IntegrationsSetupService);
  bind<IProfilesSetupService>(PROFILES_SETUP_SERVICE).to(ProfilesSetupService);
  bind<IPetitionMessageContextService>(PETITION_MESSAGE_CONTEXT_SERVICE).to(
    PetitionMessageContextService,
  );
});
