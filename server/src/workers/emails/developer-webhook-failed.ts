import { WorkerContext } from "../../context";
import { buildEmail } from "../../emails/buildEmail";
import DeveloperWebhookFailedEmail from "../../emails/components/DeveloperWebhookFailedEmail";
import { buildFrom } from "../../emails/utils/buildFrom";
import { fullName } from "../../util/fullName";
import { getLayoutProps } from "../helpers/getLayoutProps";

export async function developerWebhookFailed(
  payload: {
    org_integration_id: number;
    petition_id: number;
    error_message: string;
    post_body: any;
  },
  context: WorkerContext
) {
  const petition = await context.petitions.loadPetition(payload.petition_id);
  if (!petition) {
    throw new Error(`Petition not found for payload.petition_id ${payload.petition_id}`);
  }
  const integration = await context.integrations.loadIntegration(payload.org_integration_id);
  if (!integration) {
    throw new Error(
      `OrgIntegration not found for payload.org_integration_id ${payload.org_integration_id}`
    );
  }
  const integrationUser = await context.users.loadUser(integration.settings.USER_ID);
  if (!integrationUser) {
    throw new Error(`User not found for OrgIntegration:${payload.org_integration_id}`);
  }

  const { emailFrom, ...layoutProps } = await getLayoutProps(petition.org_id, context);
  const { html, text, subject, from } = await buildEmail(
    DeveloperWebhookFailedEmail,
    {
      userName: fullName(integrationUser.first_name, integrationUser.last_name)!,
      errorMessage: payload.error_message,
      postBody: payload.post_body,
      ...layoutProps,
    },
    { locale: petition.locale }
  );
  return await context.emailLogs.createEmail({
    from: buildFrom(from, emailFrom),
    to: integrationUser.email,
    subject,
    text,
    html,
    created_from: `OrgIntegration:${payload.org_integration_id}`,
  });
}
