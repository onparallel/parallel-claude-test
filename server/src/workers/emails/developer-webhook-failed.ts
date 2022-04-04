import { WorkerContext } from "../../context";
import { buildEmail } from "../../emails/buildEmail";
import DeveloperWebhookFailedEmail from "../../emails/emails/DeveloperWebhookFailedEmail";
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
    return; // if the petition was deleted, return without throwing error
  }
  if (!subscription) {
    throw new Error(
      `PetitionEventSubscription not found for payload.petition_event_subscription_id ${payload.petition_event_subscription_id}`
    );
  }
  const subscribedUserData = await context.users.loadUserDataByUserId(subscription.user_id);
  if (!subscribedUserData) {
    throw new Error(
      `UserData not found for User:${subscription.user_id} on PetitionEventSubscription:${payload.petition_event_subscription_id}`
    );
  }

  const { emailFrom, ...layoutProps } = await getLayoutProps(petition.org_id, context);
  const { html, text, subject, from } = await buildEmail(
    DeveloperWebhookFailedEmail,
    {
      userName: fullName(subscribedUserData.first_name, subscribedUserData.last_name)!,
      errorMessage: payload.error_message,
      postBody: payload.post_body,
      ...layoutProps,
    },
    { locale: petition.locale }
  );
  return await context.emailLogs.createEmail({
    from: buildFrom(from, emailFrom),
    to: subscribedUserData.email,
    subject,
    text,
    html,
    created_from: `PetitionEventSubscription:${payload.petition_event_subscription_id}`,
  });
}
