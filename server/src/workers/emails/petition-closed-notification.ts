import { WorkerContext } from "../../context";
import { buildEmail } from "../../emails/buildEmail";
import PetitionClosedNotification from "../../emails/components/PetitionClosedNotification";
import { buildFrom } from "../../emails/utils/buildFrom";
import { fullName } from "../../util/fullName";
import { EmailLog } from "../../db/__types";

export async function petitionClosedNotification(
  payload: {
    user_id: number;
    petition_id: number;
    petition_access_ids: number[];
    message: any;
    attach_petition: boolean;
  },
  context: WorkerContext
) {
  const [petition, sender] = await Promise.all([
    context.petitions.loadPetition(payload.petition_id),
    context.users.loadUser(payload.user_id),
  ]);

  if (!petition) {
    throw new Error(`Petition with id ${payload.petition_id} not found.`);
  }
  if (!sender) {
    throw new Error(`User not found for user_id ${payload.user_id}`);
  }

  const [org, logoUrl] = await Promise.all([
    context.organizations.loadOrg(sender.org_id),
    context.organizations.getOrgLogoUrl(sender.org_id),
  ]);

  const emails: EmailLog[] = [];
  for (const accessId of payload.petition_access_ids) {
    const access = await context.petitions.loadAccess(accessId);
    const contact = await context.contacts.loadContact(access!.contact_id);

    const { html, text, subject, from } = await buildEmail(
      PetitionClosedNotification,
      {
        contactFullName: fullName(
          contact?.first_name ?? null,
          contact?.last_name ?? null
        ),
        senderName: fullName(sender.first_name, sender.last_name)!,
        senderEmail: sender.email,
        body: payload.message,
        assetsUrl: context.config.misc.assetsUrl,
        parallelUrl: context.config.misc.parallelUrl,
        logoUrl:
          logoUrl ?? `${context.config.misc.assetsUrl}/static/emails/logo.png`,
        logoAlt: logoUrl ? org!.name : "Parallel",
      },
      { locale: petition.locale }
    );
    const email = await context.emailLogs.createEmail({
      from: buildFrom(from, context.config.misc.emailFrom),
      to: contact!.email,
      subject,
      text,
      html,
      reply_to: sender.email,
      track_opens: true,
      created_from: `PetitionClosedNotification:${accessId}`,
    });

    emails.push(email);
  }

  return emails;
}
