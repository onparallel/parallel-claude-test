import { inject, injectable } from "inversify";
import { EmailLogRepository } from "../../../db/repositories/EmailLogRepository";
import { SubscriptionRepository } from "../../../db/repositories/SubscriptionRepository";
import { UserRepository } from "../../../db/repositories/UserRepository";
import { buildEmail } from "../../../emails/buildEmail";
import DeveloperWebhookFailedEmail from "../../../emails/emails/app/DeveloperWebhookFailedEmail";
import { buildFrom } from "../../../emails/utils/buildFrom";
import {
  IOrganizationLayoutService,
  ORGANIZATION_LAYOUT_SERVICE,
} from "../../../services/OrganizationLayoutService";
import { fullName } from "../../../util/fullName";
import { EmailBuilder } from "../EmailSenderQueue";

interface DeveloperWebhookFailedEmailPayload {
  event_subscription_id: number;
  error_message: string;
  post_body: any;
}

@injectable()
export class DeveloperWebhookFailedEmailBuilder
  implements EmailBuilder<DeveloperWebhookFailedEmailPayload>
{
  constructor(
    @inject(ORGANIZATION_LAYOUT_SERVICE) private layouts: IOrganizationLayoutService,
    @inject(SubscriptionRepository) private subscriptions: SubscriptionRepository,
    @inject(UserRepository) private users: UserRepository,
    @inject(EmailLogRepository) private emailLogs: EmailLogRepository,
  ) {}

  async build(payload: DeveloperWebhookFailedEmailPayload) {
    const subscription = await this.subscriptions.loadEventSubscription(
      payload.event_subscription_id,
    );

    if (!subscription) {
      throw new Error(`EventSubscription:${payload.event_subscription_id} not found`);
    }
    const user = await this.users.loadUser(subscription.user_id);
    if (!user) {
      throw new Error(`User:${subscription.user_id} not found`);
    }
    if (user.status !== "ACTIVE") {
      return [];
    }

    const subscribedUserData = await this.users.loadUserDataByUserId(subscription.user_id);
    if (!subscribedUserData) {
      throw new Error(
        `UserData not found for User:${subscription.user_id} on EventSubscription:${payload.event_subscription_id}`,
      );
    }

    const { emailFrom, ...layoutProps } = await this.layouts.getLayoutProps(user.org_id);
    const { html, text, subject, from } = await buildEmail(
      DeveloperWebhookFailedEmail,
      {
        userName: fullName(subscribedUserData.first_name, subscribedUserData.last_name)!,
        errorMessage: payload.error_message,
        postBody: payload.post_body,
        ...layoutProps,
      },
      { locale: subscribedUserData.preferred_locale },
    );
    const email = await this.emailLogs.createEmail({
      from: buildFrom(from, emailFrom),
      to: subscribedUserData.email,
      subject,
      text,
      html,
      created_from: `EventSubscription:${payload.event_subscription_id}`,
    });

    return [email];
  }
}
