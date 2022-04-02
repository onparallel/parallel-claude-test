import { IncomingMessage } from "http";
import { injectable } from "inversify";
import { Response } from "node-fetch";
import { UserAuthenticationRepository } from "../src/db/repositories/UserAuthenticationRepository";
import { UserRepository } from "../src/db/repositories/UserRepository";
import { User } from "../src/db/__types";
import { EMAIL_REGEX } from "../src/graphql/helpers/validators/validEmail";
import { IAnalyticsService } from "../src/services/analytics";
import { IAuth } from "../src/services/auth";
import { IAws } from "../src/services/aws";
import { IEmailsService } from "../src/services/emails";
import { IFetchService } from "../src/services/fetch";
import { IRedis } from "../src/services/redis";
import { ISignatureService, SignatureService } from "../src/services/signature";
import { IStorage } from "../src/services/storage";

export const USER_COGNITO_ID = "test-cognito-id";

@injectable()
export class MockAuth implements IAuth {
  constructor(
    private users: UserRepository,
    private userAuthentication: UserAuthenticationRepository
  ) {}
  generateTempAuthToken(userId: number) {
    return `userId:${userId}`;
  }
  async validateRequestAuthentication(req: IncomingMessage) {
    if (req.headers.authorization?.startsWith("Bearer ")) {
      const token = req.headers.authorization.replace(/^Bearer /, "");
      return [await this.userAuthentication.getUserFromUat(token)] as [User];
    }
    // TODO manage users.length >1
    const [user] = await this.users.loadUsersByCognitoId(USER_COGNITO_ID);
    return [user] as [User];
  }
  async guessLogin() {}
  async callback() {}
  async login() {}
  async logout() {}
  async newPassword() {}
  async forgotPassword() {}
  async confirmForgotPassword() {}
}

@injectable()
export class MockRedis implements IRedis {
  async connect() {
    return;
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
  async sendPetitionMessageEmail() {}
  async sendPetitionReminderEmail() {}
  async sendPetitionCompletedEmail() {}
  async sendPetitionCommentsContactNotificationEmail() {}
  async sendPetitionCommentsUserNotificationEmail() {}
  async sendPetitionSharedEmail() {}
  async sendPetitionClosedEmail() {}
  async sendPetitionMessageBouncedEmail() {}
  async sendContactAuthenticationRequestEmail() {}
  async sendPublicPetitionLinkAccessEmail() {}
  async sendOrganizationLimitsReachedEmail() {}
  async sendSignatureCancelledNoCreditsLeftEmail() {}
  async validateEmail(email: string) {
    return EMAIL_REGEX.test(email);
  }
}

@injectable()
export class MockAwsService implements IAws {
  async getUser() {
    return {} as any;
  }
  async forgotPassword() {}
  async resetUserPassword() {}
  async signUpUser() {
    return "";
  }
  async deleteUser() {}
  async resendVerificationCode() {}
  enqueueMessages() {}
  async enqueueEvents() {}
  async createCognitoUser() {
    return "";
  }
  public get fileUploads() {
    return new MockStorage();
  }
  public get publicFiles() {
    return new MockStorage();
  }
  public get temporaryFiles() {
    return new MockStorage();
  }
}

@injectable()
export class MockStorage implements IStorage {
  async uploadFile() {
    return {} as any;
  }
  downloadFile() {
    return {} as any;
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
export class MockFetchService implements IFetchService {
  async fetch() {
    return new Response("OK", { status: 200 });
  }
  async fetchWithTimeout() {
    return new Response("OK", { status: 200 });
  }
}

@injectable()
export class MockSignatureService extends SignatureService implements ISignatureService {
  async checkSignaturitApiKey(): Promise<"sandbox" | "production"> {
    return "sandbox";
  }
}
