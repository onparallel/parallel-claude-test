import { WorkerContext } from "../../context";
import { buildEmail } from "../../emails/buildEmail";
import DeveloperWebhookFailedEmail from "../../emails/emails/app/DeveloperWebhookFailedEmail";
import { buildFrom } from "../../emails/utils/buildFrom";
import { fullName } from "../../util/fullName";

export async function developerWebhookFailed(
  payload: {
    event_subscription_id: number;
    error_message: string;
    post_body: any;
  },
  context: WorkerContext,
) {
  const subscription = await context.subscriptions.loadEventSubscription(
    payload.event_subscription_id,
  );

  if (!subscription) {
    throw new Error(`EventSubscription:${payload.event_subscription_id} not found`);
  }
  const user = await context.users.loadUser(subscription.user_id);
  if (!user) {
    throw new Error(`User:${subscription.user_id} not found`);
  }
  if (user.status !== "ACTIVE") {
    return;
  }

  const subscribedUserData = await context.users.loadUserDataByUserId(subscription.user_id);
  if (!subscribedUserData) {
    throw new Error(
      `UserData not found for User:${subscription.user_id} on EventSubscription:${payload.event_subscription_id}`,
    );
  }

  const { emailFrom, ...layoutProps } = await context.layouts.getLayoutProps(user.org_id);
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
  return await context.emailLogs.createEmail({
    from: buildFrom(from, emailFrom),
    to: subscribedUserData.email,
    subject,
    text,
    html,
    created_from: `EventSubscription:${payload.event_subscription_id}`,
  });
}
