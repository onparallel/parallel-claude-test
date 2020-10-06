import { WorkerContext } from "../../context";
import { buildEmail } from "../../emails/buildEmail";
import PetitionReviewed from "../../emails/components/PetitionReviewed";
import { buildFrom } from "../../emails/utils/buildFrom";
import { fullName } from "../../util/fullName";
import { eachLimit } from "async";
import { EmailLog } from "../../db/__types";

export async function petitionReviewed(
  payload: {
    user_id: number;
    petition_id: number;
    petition_message_ids: number[];
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
  await eachLimit(payload.petition_message_ids, 5, async (messageId) => {
    const message = await context.petitions.loadMessage(messageId);
    const access = await context.petitions.loadAccess(
      message!.petition_access_id
    );
    const contact = await context.contacts.loadContact(access!.contact_id);
    const { html, text, subject, from } = await buildEmail(
      PetitionReviewed,
      {
        senderName: fullName(sender.first_name, sender.last_name)!,
        senderEmail: sender.email,
        subject: message!.email_subject,
        body: message!.email_body ? JSON.parse(message!.email_body) : [],
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
      created_from: `PetitionReviewed:${messageId}`,
    });

    emails.push(email);

    await context.petitions.processPetitionMessage(messageId, email.id);
  });

  return emails;
}
