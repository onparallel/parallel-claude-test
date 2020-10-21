import { injectable } from "inversify";
import { IAnalyticsService } from "../../services/analytics";
import { IRedis } from "../../services/redis";
import { Maybe } from "../../db/__types";
import { MaybeArray } from "../../util/types";

export const userCognitoId = "test-cognito-id";

@injectable()
export class MockAuth {
  validateSession: any = () => userCognitoId;
}

@injectable()
export class MockRedis implements IRedis {
  async waitUntilConnected() {
    return;
  }

  async get(key: string): Promise<string | null> {
    return null;
  }

  async set(key: string, value: string, duration?: number) {}

  async delete(...keys: string[]): Promise<number> {
    return 0;
  }
}

@injectable()
export class MockAnalyticsService implements IAnalyticsService {
  async identifyUser() {}
  async trackEvent() {}
}

export class MockEmailsService {
  async sendPetitionMessageEmail(messageIds: MaybeArray<number>) {}
  async sendPetitionReminderEmail(reminderIds: MaybeArray<number>) {}
  async sendPetitionCompletedEmail(accessIds: MaybeArray<number>) {}
  async sendPetitionCommentsContactNotificationEmail(
    petitionId: number,
    userId: number,
    accessIds: number[],
    commentIds: number[]
  ) {}
  async sendPetitionCommentsUserNotificationEmail(
    petitionId: number,
    accessId: number,
    userIds: number[],
    commentIds: number[]
  ) {}
  async sendPetitionSharingNotificationEmail(
    userId: number,
    petitionUserIds: MaybeArray<number>,
    message: Maybe<string>
  ) {}
  async sendPetitionClosedEmail(
    petitionId: number,
    userId: number,
    petitionAccessIds: MaybeArray<number>,
    emailBody: any
  ) {}
}
