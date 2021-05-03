import { WorkerContext } from "../../context";
import { buildEmail } from "../../emails/buildEmail";
import DeveloperWebhookFailedEmail from "../../emails/components/DeveloperWebhookFailedEmail";
import { buildFrom } from "../../emails/utils/buildFrom";
import { fullName } from "../../util/fullName";
import { toGlobalId } from "../../util/globalId";
import { getLayoutProps } from "../helpers/getLayoutProps";

export async function developerWebhookFailed(
  payload: {
    petition_subscription_id: number;
    error_message: string;
    post_body: any;
  },
  context: WorkerContext
) {
  const subscription = await context.subscriptions.loadSubscription(
    payload.petition_subscription_id
  );
  if (!subscription) {
    return;
  }

  const petition = await context.petitions.loadPetition(
    subscription.petition_id
  );

  if (!petition) {
    throw new Error(
      `Petition not found for subscription.petition_id ${subscription.petition_id}`
    );
  }

  const user = await context.users.loadUser(subscription.user_id);
  if (!user) {
    throw new Error(
      `User not found for subscription.user_id ${subscription.user_id}`
    );
  }

  const { html, text, subject, from } = await buildEmail(
    DeveloperWebhookFailedEmail,
    {
      userName: fullName(user.first_name, user.last_name)!,
      errorMessage: payload.error_message,
      subscriptionId: toGlobalId("Subscription", subscription.id),
      postBody: payload.post_body,
      ...(await getLayoutProps(user.org_id, context)),
    },
    { locale: petition.locale }
  );

  return await context.emailLogs.createEmail({
    from: buildFrom(from, context.config.misc.emailFrom),
    to: user.email,
    subject,
    text,
    html,
    created_from: `Subscription:${subscription.id}`,
  });
}
