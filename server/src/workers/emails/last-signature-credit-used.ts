import { WorkerContext } from "../../context";
import { buildEmail } from "../../emails/buildEmail";
import OrgAlmostOutOfSignatureCreditsEmail from "../../emails/components/OrgAlmostOutOfSignatureCreditsEmail";
import { buildFrom } from "../../emails/utils/buildFrom";
import { getLayoutProps } from "../helpers/getLayoutProps";

export async function lastSignatureCreditUsed(payload: { org_id: number }, context: WorkerContext) {
  const ownerAndAdmins = await context.organizations.loadOwnerAndAdmins(payload.org_id);
  const { emailFrom, ...layoutProps } = await getLayoutProps(payload.org_id, context);

  const emails = [];
  for (const user of ownerAndAdmins) {
    const { html, text, subject, from } = await buildEmail(
      // reuse same email template as "almost out of signature credits"
      OrgAlmostOutOfSignatureCreditsEmail,
      {
        senderName: user.first_name!,
        total: 1,
        used: 1,
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
