import { WorkerContext } from "../../context";
import { buildEmail } from "../../emails/buildEmail";
import DeveloperWebhookFailedEmail from "../../emails/components/DeveloperWebhookFailedEmail";
import { buildFrom } from "../../emails/utils/buildFrom";
import { fullName } from "../../util/fullName";
import { toGlobalId } from "../../util/globalId";

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

  const owner = await context.petitions.loadPetitionOwners(petition.id);
  if (!owner) {
    throw new Error(`Owner user not found for petition with id ${petition.id}`);
  }

  const [org, logoUrl] = await Promise.all([
    context.organizations.loadOrg(owner.org_id),
    context.organizations.getOrgLogoUrl(owner.org_id),
  ]);
  if (!org) {
    throw new Error(`Organization with id ${owner.org_id} not found`);
  }

  const { html, text, subject, from } = await buildEmail(
    DeveloperWebhookFailedEmail,
    {
      senderName: fullName(owner.first_name, owner.last_name)!,
      endpoint: subscription.endpoint,
      errorMessage: payload.error_message,
      subscriptionId: toGlobalId("Subscription", subscription.id),
      postBody: payload.post_body,
      assetsUrl: context.config.misc.assetsUrl,
      parallelUrl: context.config.misc.parallelUrl,
      logoUrl:
        logoUrl ?? `${context.config.misc.assetsUrl}/static/emails/logo.png`,
      logoAlt: logoUrl ? org.name : "Parallel",
    },
    { locale: petition.locale }
  );

  return await context.emailLogs.createEmail({
    from: buildFrom(from, context.config.misc.emailFrom),
    to: owner.email,
    subject,
    text,
    html,
    created_from: `Subscription:${subscription.id}`,
  });
}
