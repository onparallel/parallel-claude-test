import { faker } from "@faker-js/faker/locale/af_ZA";
import { RedisCommandRawReply } from "@redis/client/dist/lib/commands";
import { IncomingMessage } from "http";
import { inject, injectable } from "inversify";
import { isDeepEqual, isNonNullish, keys, pick } from "remeda";
import { Readable } from "stream";
import { ProfileTypeFieldType, ProfileTypeStandardType, User, UserLocale } from "../src/db/__types";
import {
  EnhancedOrgIntegration,
  IntegrationRepository,
} from "../src/db/repositories/IntegrationRepository";
import { UserAuthenticationRepository } from "../src/db/repositories/UserAuthenticationRepository";
import { UserRepository } from "../src/db/repositories/UserRepository";
import { isValidEmail } from "../src/graphql/helpers/validators/validEmail";
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
import {
  ISapOdataClient,
  SapODataQueryParams,
} from "../src/integrations/profile-sync/sap/SapOdataClient";
import { ISapProfileSyncIntegrationSettingsValidator } from "../src/integrations/profile-sync/sap/SapProfileSyncIntegrationSettingsValidator";
import { MockSapOdataClientError } from "../src/integrations/profile-sync/sap/errors";
import { SapEntityDefinition } from "../src/integrations/profile-sync/sap/types";
import { BackgroundCheckProfileProps } from "../src/pdf/documents/BackgroundCheckProfileTypst";
import {
  AdverseMediaSearchService,
  IAdverseMediaSearchService,
} from "../src/services/AdverseMediaSearchService";
import {
  AI_ASSISTANT_SERVICE,
  AiAssistantService,
  IAiAssistantService,
} from "../src/services/AiAssistantService";
import { IAnalyticsService } from "../src/services/AnalyticsService";
import { IAuth } from "../src/services/AuthService";
import {
  BackgroundCheckService,
  EntityDetailsResponse,
  EntitySearchRequest,
  EntitySearchResponse,
  IBackgroundCheckService,
} from "../src/services/BackgroundCheckService";
import { IEmailsService } from "../src/services/EmailsService";
import { ENCRYPTION_SERVICE, EncryptionService } from "../src/services/EncryptionService";
import { FETCH_SERVICE, IFetchService } from "../src/services/FetchService";
import { I18N_SERVICE, II18nService } from "../src/services/I18nService";
import { ILogger, LOGGER } from "../src/services/Logger";
import { IQueuesService } from "../src/services/QueuesService";
import { IRedis, REDIS } from "../src/services/Redis";
import { IStorageImpl, IStorageService } from "../src/services/StorageService";
import {
  AdverseMediaArticle,
  ArticleSearchResponse,
  SearchTerm,
} from "../src/services/adverse-media-search-clients/AdverseMediaSearchClient";
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
  client: any;
  async sendRawCommand<T = RedisCommandRawReply>(): Promise<T> {
    return null as T;
  }
  async connect() {}
  async disconnect() {}
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
  async onPetitionMessageBounced() {}
  async onPetitionReminderBounced() {}
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
  async sendInvitationEmail() {}
  async validateEmail(email: string) {
    return isValidEmail(email);
  }
}

@injectable()
export class MockQueuesService implements IQueuesService {
  constructor() {}
  async enqueueMessages() {}
  async enqueueEvents() {}
  async enqueueEventsWithDelay() {}
  async enqueueEventsWithLowPriority() {}
  async waitForPendingMessages() {}
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
  private _fileUploads = new MockStorageImpl();
  private _publicFiles = new MockStorageImpl();
  private _temporaryFiles = new MockStorageImpl();

  public get fileUploads() {
    return this._fileUploads;
  }
  public get publicFiles() {
    return this._publicFiles;
  }
  public get temporaryFiles() {
    return this._temporaryFiles;
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
export class MockBackgroundCheckService
  extends BackgroundCheckService
  implements IBackgroundCheckService
{
  override async entitySearch(query: EntitySearchRequest): Promise<EntitySearchResponse> {
    if (query.name === "UNKNOWN") {
      return {
        totalCount: 0,
        items: [],
        createdAt: new Date(),
      };
    }

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
  override async entityProfileDetails(
    entityId: string,
    userId: number,
  ): Promise<EntityDetailsResponse> {
    if (entityId === "Q7747") {
      return {
        id: "Q7747",
        name: "Vladimir Vladimirovich PUTIN",
        type: "Person",
        properties: {},
        createdAt: new Date(),
      };
    } else if (entityId === "rupep-company-718") {
      return {
        id: "rupep-company-718",
        name: "Putin Consulting LLC",
        type: "Company",
        properties: {},
        createdAt: new Date(),
      };
    }

    throw new Error("PROFILE_NOT_FOUND");
  }

  override async entityProfileDetailsPdf(userId: number, props: BackgroundCheckProfileProps) {
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
  constructor(
    @inject(IntegrationRepository) integrations: IntegrationRepository,
    @inject(I18N_SERVICE) i18n: II18nService,
    @inject(ENCRYPTION_SERVICE) encryption: EncryptionService,
    @inject(FETCH_SERVICE) fetch: IFetchService,
    @inject(REDIS) redis: IRedis,
    @inject(LOGGER) logger: ILogger,
    @inject(AI_ASSISTANT_SERVICE) aiAssistant: AiAssistantService,
  ) {
    super(integrations, i18n, encryption, fetch, redis, logger, aiAssistant);
  }

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

@injectable()
export class MockAdverseMediaSearchService
  extends AdverseMediaSearchService
  implements IAdverseMediaSearchService
{
  private ITEMS: AdverseMediaArticle[] = [
    {
      id: "JOHN_DOE",
      url: "https://www.google.com",
      author: "John Doe",
      source: "Google",
      header: "John Doe is a good person",
      body: "John Doe is a good person",
      summary: "John Doe is a good person",
      timestamp: 1,
      images: ["https://www.google.com/image.jpg"],
    },
    {
      id: "JANE_SMITH",
      url: "https://www.example.com",
      author: "Reporter Name",
      source: "News Daily",
      header: "Jane Smith wins prestigious award",
      body: "Jane Smith, a renowned researcher, has been recognized for her groundbreaking work in artificial intelligence.",
      summary: "Jane Smith receives award for contributions to AI research",
      timestamp: 2,
      images: ["https://www.example.com/jane_smith.jpg"],
      quotes: ["I'm honored to receive this recognition", "This award belongs to my entire team"],
    },
    {
      id: "VLADIMIR_PUTIN",
      url: "https://www.newssite.com/politics",
      author: "Political Correspondent",
      source: "International News",
      header: "Vladimir Putin makes controversial statement",
      body: "Russian President Vladimir Putin has made a series of controversial statements regarding international relations during a press conference on Monday.",
      summary: "Putin's remarks spark international debate",
      timestamp: 3,
      images: ["https://www.newssite.com/putin_conference.jpg"],
      quotes: [
        "We must protect our national interests",
        "Cooperation is possible only on equal terms",
      ],
    },
    {
      id: "ELON_MUSK",
      url: "https://www.techjournal.com/business",
      author: "Tech Reporter",
      source: "Tech Journal",
      header: "Elon Musk announces new AI venture",
      body: "Tesla and SpaceX CEO Elon Musk has announced a new artificial intelligence company that aims to develop safe and beneficial AI systems. The announcement comes amid growing concerns about AI regulation.",
      summary: "Musk launches new company focused on ethical AI development",
      timestamp: 4,
      images: ["https://www.techjournal.com/musk_announcement.jpg"],
      quotes: [
        "We need to ensure AI remains aligned with human values",
        "This venture will prioritize safety above all else",
      ],
    },
    {
      id: "FINANCIAL_SCANDAL",
      url: "https://www.financenews.com/investigations",
      author: "Investigative Journalist",
      source: "Finance News Network",
      header: "Major bank implicated in money laundering scheme",
      body: "A major international bank has been implicated in a sophisticated money laundering operation involving billions of dollars. Regulatory authorities from multiple countries are coordinating their investigation into the allegations.",
      summary: "Banking giant faces scrutiny over alleged money laundering activities",
      timestamp: 5,
      images: [
        "https://www.financenews.com/bank_headquarters.jpg",
        "https://www.financenews.com/evidence_documents.jpg",
      ],
      quotes: [
        "This appears to be one of the largest financial scandals of the decade",
        "The investigation has uncovered systematic failures in compliance procedures",
      ],
    },
  ];

  override async suggestEntities() {
    return [];
  }

  override async searchArticles(searchTerms: SearchTerm[]): Promise<ArticleSearchResponse> {
    if (searchTerms.some((t: any) => isNonNullish(t.term))) {
      return {
        totalCount: this.ITEMS.length,
        items: this.ITEMS.map(pick(["id", "header", "timestamp", "source"])),
        createdAt: new Date(),
      };
    }

    const filteredItems = this.ITEMS.filter((i) =>
      searchTerms.some((t: any) => t.entityId === i.id),
    );

    return {
      totalCount: filteredItems.length,
      items: filteredItems.map(pick(["id", "header", "timestamp", "source"])),
      createdAt: new Date(),
    };
  }

  override async fetchArticle(id: string) {
    const article = this.ITEMS.find((i) => i.id === id);
    if (!article) {
      throw new Error("ARTICLE_NOT_FOUND");
    }

    return article;
  }
}

@injectable()
export class MockSapOdataClient implements ISapOdataClient {
  clearCache(): void {}

  [Symbol.dispose]() {}

  private calls: MockSapOdataClientMethodCall[] = [];

  private assert(condition: boolean, message: string) {
    if (!condition) {
      throw new MockSapOdataClientError(message);
    }
  }

  getMetadata(servicePath: string): Promise<string> {
    const [args, result] = this.getNextCall("getMetadata");
    this.checkNextCallArguments("getMetadata", () => {
      this.assert(
        args[0] === servicePath,
        `servicePath is not equal. Expected: ${JSON.stringify(args[0])}, Actual: ${JSON.stringify(servicePath)}`,
      );
    });
    return Promise.resolve(result);
  }

  getEntitySet(
    entityDefinition: SapEntityDefinition,
    params?: SapODataQueryParams,
  ): Promise<{ results: any[] }> {
    const [args, result] = this.getNextCall("getEntitySet");
    this.checkNextCallArguments("getEntitySet", () => {
      this.compareEntityDefinition(args[0], entityDefinition);
      this.compareSapODataQueryParams(args[1], params);
    });
    return Promise.resolve(result);
  }

  getEntity(
    entityDefinition: SapEntityDefinition,
    entityKey: Record<string, any>,
    params?: SapODataQueryParams,
  ): Promise<any> {
    const [args, result] = this.getNextCall("getEntity");
    this.checkNextCallArguments("getEntity", () => {
      this.compareEntityDefinition(args[0], entityDefinition);
      this.compareEntityKey(args[1], entityKey);
      this.compareSapODataQueryParams(args[2], params);
    });
    return Promise.resolve(result);
  }

  getEntityNavigationProperty(
    entityDefinition: SapEntityDefinition,
    navigationProperty: string,
    entityKey: Record<string, any>,
    params?: SapODataQueryParams,
  ): Promise<any> {
    const [args, result] = this.getNextCall("getEntityNavigationProperty");
    this.checkNextCallArguments("getEntityNavigationProperty", () => {
      this.compareEntityDefinition(args[0], entityDefinition);
      this.assert(
        args[1] === navigationProperty,
        `navigationProperty is not equal. Expected: ${JSON.stringify(navigationProperty)}, Actual: ${JSON.stringify(args[1])}`,
      );
      this.compareEntityKey(args[2], entityKey);
      this.compareSapODataQueryParams(args[3], params);
    });
    return Promise.resolve(result);
  }

  updateEntity(
    entityDefinition: SapEntityDefinition,
    entityKey: Record<string, any>,
    values: Record<string, any>,
  ): Promise<any> {
    const [args, result] = this.getNextCall("updateEntity");
    this.checkNextCallArguments("updateEntity", () => {
      this.compareEntityDefinition(args[0], entityDefinition);
      this.compareEntityKey(args[1], entityKey);

      this.compareValuesWithRegex(args[2], values);
    });
    return Promise.resolve(result);
  }

  configure(): void {}

  private getNextCall(call: MockSapOdataClientMethod) {
    const next = this.calls.shift()!;
    this.assert(
      next !== undefined,
      `Expected next SapODataClient method call to be ${call}, but got undefined`,
    );
    const [nextCall, params, result] = next;
    this.assert(
      nextCall === call,
      `Expected next SapODataClient method call to be ${call}, but got ${nextCall}`,
    );
    return [params, result];
  }

  private checkNextCallArguments(method: MockSapOdataClientMethod, checkfn: () => void) {
    try {
      checkfn();
    } catch (error) {
      if (error instanceof MockSapOdataClientError) {
        throw new MockSapOdataClientError(
          `SapODataClient.${method} called with unexpected arguments: ${error.message}`,
        );
      } else {
        throw error;
      }
    }
  }

  private compareEntityDefinition(expected: SapEntityDefinition, actual: SapEntityDefinition) {
    this.assert(
      isDeepEqual(expected, actual),
      `entityDefinition is not equal. Expected: ${JSON.stringify(expected)}, Actual: ${JSON.stringify(actual)}`,
    );
  }

  private compareSapODataQueryParams(
    expected: SapODataQueryParams | undefined,
    actual: SapODataQueryParams | undefined,
  ) {
    this.assert(
      isDeepEqual(expected?.$orderby, actual?.$orderby),
      `params.$orderby parameters are not equal. Expected: ${JSON.stringify(expected?.$orderby)}, Actual: ${JSON.stringify(actual?.$orderby)}`,
    );
    this.assert(
      isDeepEqual(expected?.$filter, actual?.$filter),
      `params.$filter parameters are not equal. Expected: ${JSON.stringify(expected?.$filter)}, Actual: ${JSON.stringify(actual?.$filter)}`,
    );
    const expectedSelect = Array.from(expected?.$select ?? []).sort();
    const actualSelect = Array.from(actual?.$select ?? []).sort();
    this.assert(
      isDeepEqual(expectedSelect, actualSelect),
      `params.$select parameters are not equal. Expected: ${JSON.stringify(expectedSelect)}, Actual: ${JSON.stringify(actualSelect)}`,
    );
    const expectedExpand = Array.from(expected?.$expand ?? []).sort();
    const actualExpand = Array.from(actual?.$expand ?? []).sort();
    this.assert(
      isDeepEqual(expectedExpand, actualExpand),
      `params.$expand parameters are not equal. Expected: ${JSON.stringify(expectedExpand)}, Actual: ${JSON.stringify(actualExpand)}`,
    );
    return true;
  }

  private compareEntityKey(expected: Record<string, any>, actual: Record<string, any>) {
    this.assert(
      isDeepEqual(expected, pick(actual, keys(expected))),
      `entityKey is not equal. Expected: ${JSON.stringify(expected)}, Actual: ${JSON.stringify(actual)}`,
    );
  }

  private compareValuesWithRegex(expected: Record<string, any>, actual: Record<string, any>) {
    const expectedKeys = keys(expected);
    const actualKeys = keys(actual);

    this.assert(
      isDeepEqual(expectedKeys.sort(), actualKeys.sort()),
      `values keys are not equal. Expected: ${JSON.stringify(expectedKeys)}, Actual: ${JSON.stringify(actualKeys)}`,
    );

    for (const key of expectedKeys) {
      const expectedValue = expected[key];
      const actualValue = actual[key];

      if (expectedValue instanceof RegExp) {
        this.assert(
          expectedValue.test(String(actualValue)),
          `values.${key} does not match regex. Expected: ${expectedValue}, Actual: ${JSON.stringify(actualValue)}`,
        );
      } else {
        this.assert(
          isDeepEqual(expectedValue, actualValue),
          `values.${key} is not equal. Expected: ${JSON.stringify(expectedValue)}, Actual: ${JSON.stringify(actualValue)}`,
        );
      }
    }
  }

  public setNextExpectedCalls(calls: MockSapOdataClientMethodCall[]) {
    this.calls = calls;
  }

  public assertNoMoreCalls() {
    this.assert(
      this.calls.length === 0,
      `Expected no more calls, but got ${this.calls.length} left.`,
    );
  }
}

type MockSapOdataClientMethod =
  | "getMetadata"
  | "getEntity"
  | "getEntitySet"
  | "getEntityNavigationProperty"
  | "updateEntity";

export type MockSapOdataClientMethodCall = {
  [K in MockSapOdataClientMethod]: readonly [
    K,
    readonly [...Parameters<ISapOdataClient[K]>],
    Awaited<ReturnType<ISapOdataClient[K]>>,
  ];
}[MockSapOdataClientMethod];

@injectable()
export class MockSapProfileSyncIntegrationSettingsValidator
  implements ISapProfileSyncIntegrationSettingsValidator
{
  allowedFieldTypes: ProfileTypeFieldType[] = [
    "SHORT_TEXT",
    "TEXT",
    "SELECT",
    "PHONE",
    "NUMBER",
    "DATE",
    "USER_ASSIGNMENT",
  ];

  async validate() {
    return Promise.resolve();
  }
}
