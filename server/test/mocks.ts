import { faker } from "@faker-js/faker/locale/af_ZA";
import { RedisCommandRawReply } from "@redis/client/dist/lib/commands";
import { IncomingMessage } from "http";
import { injectable } from "inversify";
import { Response } from "node-fetch";
import { Readable } from "stream";
import { User } from "../src/db/__types";
import { UserAuthenticationRepository } from "../src/db/repositories/UserAuthenticationRepository";
import { UserRepository } from "../src/db/repositories/UserRepository";
import { EMAIL_REGEX } from "../src/graphql/helpers/validators/validEmail";
import { BackgroundCheckProfileProps } from "../src/pdf/documents/BackgroundCheckProfile";
import { IAnalyticsService } from "../src/services/AnalyticsService";
import { IAuth } from "../src/services/AuthService";
import { IBackgroundCheckService } from "../src/services/BackgroundCheckService";
import {
  IDowJonesClient,
  RiskEntityProfilePdfResult,
  RiskEntityProfileResult,
} from "../src/integrations/dow-jones/DowJonesClient";
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
