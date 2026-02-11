/**
 * NotificationService - Handles sending notifications to users via multiple channels.
 *
 * This service manages email, SMS, and push notification delivery
 * with retry logic and delivery tracking.
 */
export class NotificationService {
  private readonly maxRetries = 3;

  constructor(
    private emailProvider: EmailProvider,
    private smsProvider: SmsProvider,
  ) {}

  async sendEmail(userId: string, subject: string, body: string): Promise<NotificationResult> {
    return this.withRetry(() => this.emailProvider.send(userId, subject, body));
  }

  async sendSms(userId: string, message: string): Promise<NotificationResult> {
    return this.withRetry(() => this.smsProvider.send(userId, message));
  }

  async sendBulkNotification(
    userIds: string[],
    channel: NotificationChannel,
    content: NotificationContent,
  ): Promise<BulkNotificationResult> {
    const results = await Promise.allSettled(
      userIds.map((userId) => this.sendToChannel(userId, channel, content)),
    );

    return {
      total: userIds.length,
      successful: results.filter((r) => r.status === "fulfilled").length,
      failed: results.filter((r) => r.status === "rejected").length,
    };
  }

  private async sendToChannel(
    userId: string,
    channel: NotificationChannel,
    content: NotificationContent,
  ): Promise<NotificationResult> {
    switch (channel) {
      case "email":
        return this.sendEmail(userId, content.subject ?? "", content.body);
      case "sms":
        return this.sendSms(userId, content.body);
      default:
        throw new Error(`Unsupported notification channel: ${channel}`);
    }
  }

  private async withRetry<T>(fn: () => Promise<T>): Promise<T> {
    let lastError: Error | undefined;
    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
      }
    }
    throw lastError;
  }
}

// Types
export type NotificationChannel = "email" | "sms";

export interface NotificationContent {
  subject?: string;
  body: string;
}

export interface NotificationResult {
  success: boolean;
  messageId: string;
}

export interface BulkNotificationResult {
  total: number;
  successful: number;
  failed: number;
}

export interface EmailProvider {
  send(userId: string, subject: string, body: string): Promise<NotificationResult>;
}

export interface SmsProvider {
  send(userId: string, message: string): Promise<NotificationResult>;
}
