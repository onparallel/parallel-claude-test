import { injectable } from "inversify";
import { IAnalyticsService } from "../src/services/analytics";
import { IAuth } from "../src/services/auth";
import { IAws } from "../src/services/aws";
import { IEmailsService } from "../src/services/emails";
import { IRedis } from "../src/services/redis";
import { IStorage } from "../src/services/storage";

export const userCognitoId = "test-cognito-id";

@injectable()
export class MockAuth implements IAuth {
  async validateSession() {
    return userCognitoId;
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
    return "";
  }
  async getSignedDownloadEndpoint() {
    return "";
  }
}
