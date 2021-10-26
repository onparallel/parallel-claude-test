import { WorkerContext } from "../../context";
import { buildEmail } from "../../emails/buildEmail";
import DeveloperWebhookFailedEmail from "../../emails/components/DeveloperWebhookFailedEmail";
import { buildFrom } from "../../emails/utils/buildFrom";
import { fullName } from "../../util/fullName";
import { getLayoutProps } from "../helpers/getLayoutProps";

export async function developerWebhookFailed(
  payload: {
    petition_event_subscription_id: number;
    petition_id: number;
    error_message: string;
    post_body: any;
  },
  context: WorkerContext
) {
  const [petition, subscription] = await Promise.all([
    context.petitions.loadPetition(payload.petition_id),
    context.subscriptions.loadSubscription(payload.petition_event_subscription_id),
  ]);
  if (!petition) {
    throw new Error(`Petition not found for payload.petition_id ${payload.petition_id}`);
  }
  if (!subscription) {
    throw new Error(
      `PetitionEventSubscription not found for payload.petition_event_subscription_id ${payload.petition_event_subscription_id}`
    );
  }
  const subscribedUser = await context.users.loadUser(subscription.user_id);
  if (!subscribedUser) {
    throw new Error(
      `User not found for PetitionEventSubscription:${payload.petition_event_subscription_id}`
    );
  }

  const { emailFrom, ...layoutProps } = await getLayoutProps(petition.org_id, context);
  const { html, text, subject, from } = await buildEmail(
    DeveloperWebhookFailedEmail,
    {
      userName: fullName(subscribedUser.first_name, subscribedUser.last_name)!,
      errorMessage: payload.error_message,
      postBody: payload.post_body,
      ...layoutProps,
    },
    { locale: petition.locale }
  );
  return await context.emailLogs.createEmail({
    from: buildFrom(from, emailFrom),
    to: subscribedUser.email,
    subject,
    text,
    html,
    created_from: `PetitionEventSubscription:${payload.petition_event_subscription_id}`,
  });
}
