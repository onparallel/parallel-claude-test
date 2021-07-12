import { IncomingMessage } from "http";
import { injectable } from "inversify";
import { UserRepository } from "../src/db/repositories/UserRepository";
import { IAnalyticsService } from "../src/services/analytics";
import { IAuth } from "../src/services/auth";
import { IAws } from "../src/services/aws";
import { IEmailsService } from "../src/services/emails";
import { IRedis } from "../src/services/redis";
import { IStorage } from "../src/services/storage";

export const USER_COGNITO_ID = "test-cognito-id";

@injectable()
export class MockAuth implements IAuth {
  constructor(private users: UserRepository) {}
  async validateSession(req: IncomingMessage) {
    if (req.headers.authorization?.startsWith("Bearer ")) {
      /*
        if an apiKey is set in headers, return null 
        so authentication can be resolved by UserAuthenticationRepository.validateApiKey method
        This is useful for executing queries/mutations as other users when testing
       */
      return null;
    }
    return await this.users.loadUserByCognitoId(USER_COGNITO_ID);
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
  async waitUntilConnected() {
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
  async sendPetitionSharingNotificationEmail() {}
  async sendPetitionClosedEmail() {}
  async sendPetitionMessageBouncedEmail() {}
  async sendContactAuthenticationRequestEmail() {}
}

@injectable()
export class MockAwsService implements IAws {
  async enqueueMessages() {}
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
    return { url: "" } as any;
  }
  async getSignedDownloadEndpoint() {
    return "";
  }
}
