import { WorkerContext } from "../../context";
import { buildEmail } from "../../emails/buildEmail";
import OrgAlmostOutOfSignatureCreditsEmail from "../../emails/components/OrgAlmostOutOfSignatureCreditsEmail";
import { buildFrom } from "../../emails/utils/buildFrom";
import { getLayoutProps } from "../helpers/getLayoutProps";

export async function orgAlmostOutOfSignatureCredits(
  payload: { org_id: number },
  context: WorkerContext
) {
  const [usageLimit, ownerAndAdmins, parallelOrg] = await Promise.all([
    context.organizations.getOrganizationCurrentUsageLimit(
      payload.org_id,
      "SIGNATURIT_SHARED_APIKEY"
    ),
    context.organizations.loadOwnerAndAdmins(payload.org_id),
    context.organizations.loadRootOrganization(),
  ]);

  if (!usageLimit) {
    throw new Error(
      `Could not find SIGNATURIT_SHARED_APIKEY usage limit for Organization:${payload.org_id}`
    );
  }

  const { emailFrom, ...layoutProps } = await getLayoutProps(parallelOrg.id, context);

  const emails = [];
  for (const user of ownerAndAdmins) {
    const { html, text, subject, from } = await buildEmail(
      OrgAlmostOutOfSignatureCreditsEmail,
      {
        senderName: user.first_name!,
        total: usageLimit.limit,
        used: usageLimit.used,
        ...layoutProps,
      },
      { locale: user.details?.preferredLocale ?? "es" }
    );

    emails.push(
      await context.emailLogs.createEmail({
        from: buildFrom(from, emailFrom),
        to: user.email,
        subject,
        text,
        html,
        created_from: `Organization:${payload.org_id}`,
      })
    );
  }

  return emails;
}
