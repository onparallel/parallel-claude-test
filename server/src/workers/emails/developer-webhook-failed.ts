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
  const orgOwner = await context.organizations.getOrganizationOwner(petition.org_id);
  if (!orgOwner) {
    throw new Error(`Owner not found for Organization:${petition.org_id}`);
  }

  const { emailFrom, ...layoutProps } = await getLayoutProps(petition.org_id, context);
  const { html, text, subject, from } = await buildEmail(
    DeveloperWebhookFailedEmail,
    {
      userName: fullName(orgOwner.first_name, orgOwner.last_name)!,
      errorMessage: payload.error_message,
      postBody: payload.post_body,
      ...layoutProps,
    },
    { locale: petition.locale }
  );
  return await context.emailLogs.createEmail({
    from: buildFrom(from, emailFrom),
    to: orgOwner.email,
    subject,
    text,
    html,
    created_from: `OrgIntegration:${payload.org_integration_id}`,
  });
}
