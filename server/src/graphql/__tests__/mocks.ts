import { injectable } from "inversify";
import { IAnalyticsService } from "../../services/analytics";
import { IAuth } from "../../services/auth";
import { IAws } from "../../services/aws";
import { IEmailsService } from "../../services/emails";
import { IRedis } from "../../services/redis";

export const userCognitoId = "test-cognito-id";

@injectable()
export class MockAuth implements IAuth {
  async validateSession() {
    return userCognitoId;
  }
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
  readonly sqs = null as any;
  async enqueueMessages() {}
  async createCognitoUser() {
    return "";
  }
}
