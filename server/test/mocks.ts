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
import { IS3Service, IStorage } from "../src/services/storage";
import { random } from "../src/util/token";

export const USER_COGNITO_ID = "test-cognito-id";

@injectable()
export class MockAuth implements IAuth {
  constructor(
    private users: UserRepository,
    private userAuthentication: UserAuthenticationRepository
  ) {}
  async getOrCreateCognitoUser(): Promise<string> {
    return "";
  }
  async signUpUser(): Promise<string> {
    return random(10);
  }
  async deleteUser() {}
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
  async validateEmail(email: string) {
    return EMAIL_REGEX.test(email);
  }
}

@injectable()
export class MockAwsService implements IAws {
  constructor() {}
  enqueueMessages() {}
  async enqueueEvents() {}
}

class MockS3Service implements IS3Service {
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
export class MockStorage implements IStorage {
  public get fileUploads() {
    return new MockS3Service();
  }
  public get publicFiles() {
    return new MockS3Service();
  }
  public get temporaryFiles() {
    return new MockS3Service();
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
