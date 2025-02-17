import { faker } from "@faker-js/faker/locale/af_ZA";
import { RedisCommandRawReply } from "@redis/client/dist/lib/commands";
import { IncomingMessage } from "http";
import { injectable } from "inversify";
import { Readable } from "stream";
import { ProfileTypeStandardType, User, UserLocale } from "../src/db/__types";
import { EnhancedOrgIntegration } from "../src/db/repositories/IntegrationRepository";
import { UserAuthenticationRepository } from "../src/db/repositories/UserAuthenticationRepository";
import { UserRepository } from "../src/db/repositories/UserRepository";
import { EMAIL_REGEX } from "../src/graphql/helpers/validators/validEmail";
import {
  IDowJonesClient,
  RiskEntityProfilePdfResult,
  RiskEntityProfileResult,
} from "../src/integrations/dow-jones/DowJonesClient";
import {
  IProfileExternalSourceIntegration,
  ProfileExternalSourceRequestError,
} from "../src/integrations/profile-external-source/ProfileExternalSourceIntegration";
import {
  EInformaProfileExternalSourceIntegration,
  EInformaSearchParams,
} from "../src/integrations/profile-external-source/einforma/EInformaProfileExternalSourceIntegration";
import { BackgroundCheckProfileProps } from "../src/pdf/documents/BackgroundCheckProfile";
import { IAiAssistantService } from "../src/services/AiAssistantService";
import { IAnalyticsService } from "../src/services/AnalyticsService";
import { IAuth } from "../src/services/AuthService";
import { IBackgroundCheckService } from "../src/services/BackgroundCheckService";
import { IEmailsService } from "../src/services/EmailsService";
import { IFetchService } from "../src/services/FetchService";
import { IQueuesService } from "../src/services/QueuesService";
import { IRedis } from "../src/services/Redis";
import { IStorageImpl, IStorageService } from "../src/services/StorageService";
import {
  EntityDetailsResponse,
  EntitySearchRequest,
  EntitySearchResponse,
} from "../src/services/background-check-clients/BackgroundCheckClient";
import { random } from "../src/util/token";

export const USER_COGNITO_ID = "test-cognito-id";

@injectable()
export class MockAuth implements IAuth {
  constructor(
    private users: UserRepository,
    private userAuthentication: UserAuthenticationRepository,
  ) {}
  async getOrCreateCognitoUser(): Promise<string> {
    return "";
  }
  async signUpUser(): Promise<string> {
    return random(10);
  }
  async resendVerificationCode() {}
  async resetUserPassword() {}
  async validateRequestAuthentication(req: IncomingMessage) {
    if (req.headers.authorization?.startsWith("Bearer ")) {
      const token = req.headers.authorization.replace(/^Bearer /, "");
      return [await this.userAuthentication.getUserFromUat(token)] as [User];
    }
    // TODO manage users.length >1
    const [user] = await this.users.loadUsersByCognitoId(USER_COGNITO_ID);
    return [user] as [User];
  }
  async verifyCaptcha() {
    return true;
  }
  async guessLogin() {}
  async callback() {}
  async login() {}
  async logout() {}
  async newPassword() {}
  async forgotPassword() {}
  async confirmForgotPassword() {}
  async logoutCallback() {}
  async verifyEmail() {}
  async changePassword() {}
  async updateSessionLogin() {}
  async restoreSessionLogin() {}
  generateTempAuthToken(userId: number) {
    return `userId:${userId}`;
  }
  async resetTempPassword() {}
}

@injectable()
export class MockRedis implements IRedis {
  async sendRawCommand<T = RedisCommandRawReply>(): Promise<T> {
    return null as T;
  }
  async connect() {
    return;
  }
  async withConnection() {
    return {
      async [Symbol.asyncDispose]() {},
    };
  }
  async get(): Promise<string | null> {
    return null;
  }
  async set() {}
  async delete(): Promise<number> {
    return 0;
  }
}

@injectable()
export class MockAnalyticsService implements IAnalyticsService {
  async identifyUser() {}
  async trackEvent() {}
}

@injectable()
export class MockEmailsService implements IEmailsService {
  async sendBackgroundCheckMonitoringChangesEmail() {}
  async sendAppSumoActivateAccountEmail() {}
  async sendPetitionMessageEmail() {}
  async sendPetitionReminderEmail() {}
  async sendPetitionCompletedEmail() {}
  async sendPetitionCommentsContactNotificationEmail() {}
  async sendPetitionCommentsUserNotificationEmail() {}
  async sendPetitionSharedEmail() {}
  async sendPetitionClosedEmail() {}
  async sendPetitionMessageBouncedEmail() {}
  async sendAccessDelegatedEmail() {}
  async sendDeveloperWebhookFailedEmail() {}
  async sendContactAuthenticationRequestEmail() {}
  async sendPublicPetitionLinkAccessEmail() {}
  async sendOrganizationLimitsReachedEmail() {}
  async sendSignatureCancelledNoCreditsLeftEmail() {}
  async sendInternalSignaturitAccountDepletedCreditsEmail() {}
  async sendSignatureCancelledRequestErrorEmail() {}
  async sendSignatureCancelledDeclinedBySignerEmail() {}
  async sendTransferParallelsEmail() {}
  async sendProfilesExpiringPropertiesEmail() {}
  async sendPetitionApprovalRequestStepPendingEmail() {}
  async sendPetitionApprovalRequestStepReminderEmail() {}
  async sendPetitionApprovalRequestStepApprovedEmail() {}
  async sendPetitionApprovalRequestStepRejectedEmail() {}
  async sendPetitionApprovalRequestStepCanceledEmail() {}
  async validateEmail(email: string) {
    return EMAIL_REGEX.test(email);
  }
}

@injectable()
export class MockQueuesService implements IQueuesService {
  constructor() {}
  async enqueueMessages() {}
  async enqueueEvents() {}
}

class MockStorageImpl implements IStorageImpl {
  async uploadFile() {
    return { ContentLength: 0 } as any;
  }
  async downloadFile() {
    return {} as any;
  }
  async downloadFileBase64() {
    return "";
  }
  async getFileMetadata() {
    return {} as any;
  }
  async deleteFile() {}
  async getSignedUploadEndpoint() {
    return { url: "", fields: {} } as any;
  }
  async getSignedDownloadEndpoint() {
    return "";
  }
}

@injectable()
export class MockStorage implements IStorageService {
  public get fileUploads() {
    return new MockStorageImpl();
  }
  public get publicFiles() {
    return new MockStorageImpl();
  }
  public get temporaryFiles() {
    return new MockStorageImpl();
  }
}

@injectable()
export class MockFetchService implements IFetchService {
  async fetch() {
    return new Response("OK", { status: 200 });
  }
}

@injectable()
export class MockDowJonesClient implements IDowJonesClient {
  async riskEntitySearch() {
    return { meta: { total_count: 0 }, data: [] };
  }
  async riskEntityProfile(): Promise<RiskEntityProfileResult> {
    return {
      data: {
        id: faker.string.uuid(),
        attributes: {
          basic: {
            type: "Person",
            name_details: {
              primary_name: {
                name: faker.person.fullName(),
                first_name: faker.person.firstName(),
                surname: faker.person.lastName(),
              },
            },
          },
        },
      },
    };
  }
  async riskEntityProfilePdf(): Promise<RiskEntityProfilePdfResult> {
    return {
      mime_type: "application/pdf",
      binary_encoding: "base64",
      binary_stream: "",
    };
  }
  entityFullName() {
    return "Mocked FullName";
  }
}

@injectable()
export class MockBackgroundCheckService implements IBackgroundCheckService {
  constructor() {}
  async entitySearch(query: EntitySearchRequest): Promise<EntitySearchResponse> {
    if (query.type === "PERSON") {
      return {
        totalCount: 1,
        items: [
          {
            id: "Q7747",
            type: "Person",
            name: "Vladimir Vladimirovich PUTIN",
            properties: {},
          },
        ],
        createdAt: new Date(),
      };
    } else if (query.type === "COMPANY") {
      return {
        totalCount: 1,
        items: [
          {
            id: "rupep-company-718",
            type: "Company",
            name: "Putin Consulting LLC",
            properties: {},
          },
        ],
        createdAt: new Date(),
      };
    } else {
      return {
        totalCount: 2,
        items: [
          {
            id: "Q7747",
            type: "Person",
            name: "Vladimir Vladimirovich PUTIN",
            properties: {},
          },
          {
            id: "rupep-company-718",
            type: "Company",
            name: "Putin Consulting LLC",
            properties: {},
          },
        ],
        createdAt: new Date(),
      };
    }
  }
  async entityProfileDetails(entityId: string, userId: number): Promise<EntityDetailsResponse> {
    if (entityId !== "Q7747") {
      throw new Error("PROFILE_NOT_FOUND");
    }

    return {
      id: "Q7747",
      name: "Vladimir Vladimirovich PUTIN",
      type: "Person",
      properties: {},
      createdAt: new Date(),
    };
  }
  async entityProfileDetailsPdf(userId: number, props: BackgroundCheckProfileProps) {
    return {
      mime_type: "application/pdf",
      binary_stream: Readable.from(""),
    };
  }
}

@injectable()
export class MockAiAssistantService implements IAiAssistantService {
  async getJsonCompletion() {
    return null;
  }
}

@injectable()
export class MockEInformaProfileExternalSourceIntegration
  extends EInformaProfileExternalSourceIntegration
  implements IProfileExternalSourceIntegration
{
  public override async fetchAccessToken() {
    return "mocked-access-token";
  }

  protected override async withCredentials<TResult>(
    orgIntegrationId: number,
    handler: (credentials: any, context: any) => Promise<TResult>,
  ): Promise<TResult> {
    const integration = await this.integrations.loadIntegration(orgIntegrationId);

    const context = this.getContext(
      integration as EnhancedOrgIntegration<"PROFILE_EXTERNAL_SOURCE", "EINFORMA", false>,
    );

    return await handler({}, context);
  }

  protected override async entitySearchByName(
    integrationId: number,
    standardType: ProfileTypeStandardType,
    locale: UserLocale,
    search: EInformaSearchParams,
  ): Promise<any> {
    if (!this.STANDARD_TYPES.includes(standardType)) {
      throw new ProfileExternalSourceRequestError(400, "BAD_REQUEST");
    }

    if (standardType === "INDIVIDUAL" && search.companySearch === "Mike Ross") {
      return {
        type: "MULTIPLE_RESULTS",
        totalCount: 3,
        results: {
          key: "id",
          columns: [
            {
              key: "denominacion",
              label: "Name or company name",
            },
            {
              key: "provincia",
              label: "Province",
            },
          ],
          rows: [
            { id: "1", denominacion: "Mike Ross (1)", provincia: "Barcelona" },
            { id: "2", denominacion: "Mike Ross (2)", provincia: "Barcelona" },
            { id: "3", denominacion: "Mike Ross (3)", provincia: "Barcelona" },
          ],
        },
      };
    } else if (standardType === "LEGAL_ENTITY" && search.companySearch === "Parallel") {
      return {
        type: "MULTIPLE_RESULTS",
        totalCount: 2,
        results: {
          key: "id",
          columns: [
            {
              key: "denominacion",
              label: "Name or company name",
            },
            {
              key: "provincia",
              label: "Province",
            },
          ],
          rows: [
            { id: "4", denominacion: "Parallel Solutions S.L. (1)", provincia: "Barcelona" },
            { id: "5", denominacion: "Parallel Solutions S.L. (2)", provincia: "Barcelona" },
          ],
        },
      };
    } else {
      return {
        type: "MULTIPLE_RESULTS",
        totalCount: 0,
        results: {
          key: "id",
          columns: [],
          rows: [],
        },
      };
    }
  }

  public override async entityDetails(
    integrationId: number,
    standardType: ProfileTypeStandardType,
    externalId: string,
  ) {
    if (!this.STANDARD_TYPES.includes(standardType)) {
      throw new ProfileExternalSourceRequestError(400, "BAD_REQUEST");
    }

    if (externalId === "Y1234567A") {
      return {
        type: "FOUND" as const,
        rawResponse: {
          identificativo: "Y1234567A",
          denominacion: "Mike Ross",
          email: "mike@onparallel.com",
          cargoPrincipal: "Lawyer",
          domicilioSocial: "Fake St. 123",
          localidad: "08025 Barcelona (Barcelona)",
        },
      };
    } else if (externalId === "B67505586") {
      return {
        type: "FOUND" as const,
        rawResponse: {
          identificativo: "B67505586",
          denominacion: "Parallel Solutions S.L.",
          domicilioSocial: "Fake St. 123",
          localidad: "08025 Barcelona (Barcelona)",
          fechaConstitucion: "2020-01-01",
        },
      };
    } else {
      throw new ProfileExternalSourceRequestError(404, "NOT_FOUND");
    }
  }

  protected override async parseFullName(value: string) {
    const [firstName, lastName] = value.split(" ");
    return { firstName, lastName };
  }
}
