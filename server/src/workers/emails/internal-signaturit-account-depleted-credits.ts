import { WorkerContext } from "../../context";
import { EmailLog } from "../../db/__types";
import { buildEmail } from "../../emails/buildEmail";
import InternalSignaturitAccountDepletedCredits from "../../emails/emails/InternalSignaturitAccountDepletedCredits";
import { buildFrom } from "../../emails/utils/buildFrom";
import { toGlobalId } from "../../util/globalId";

export async function internalSignaturitAccountDepletedCredits(
  payload: { orgId: number; apiKeyHint: string; petitionId: number },
  context: WorkerContext
) {
  const org = await context.organizations.loadOrg(payload.orgId);

  const { html, text, subject, from } = await buildEmail(
    InternalSignaturitAccountDepletedCredits,
    {
      assetsUrl: context.config.misc.assetsUrl,
      parallelUrl: context.config.misc.parallelUrl,
      logoUrl: `${context.config.misc.assetsUrl}/static/emails/logo.png`,
      logoAlt: "Parallel",
      apiKeyHint: payload.apiKeyHint,
      organizationName: org!.name,
      petitionGID: toGlobalId("Petition", payload.petitionId),
    },
    { locale: "es" }
  );

  const emails: EmailLog[] = [];
  for (const to of ["alex@onparallel.com", "derek@onparallel.com", "support@onparallel.com"]) {
    const email = await context.emailLogs.createEmail({
      from: buildFrom(from, context.config.misc.emailFrom),
      to,
      subject,
      text,
      html,
      created_from: `Petition:${payload.petitionId}`,
    });

    emails.push(email);
  }

  return emails;
}
