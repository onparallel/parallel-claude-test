import { WorkerContext } from "../../context";
import { buildEmail } from "../../emails/buildEmail";
import MessageBouncedEmail from "../../emails/components/MessageBouncedEmail";
import { buildFrom } from "../../emails/utils/buildFrom";
import { fullName } from "../../util/fullName";
import { toGlobalId } from "../../util/globalId";

export async function petitionMessageBounced(
  payload: { email_log_id: number },
  context: WorkerContext
) {
  const message = await context.petitions.loadMessageByEmailLogId(
    payload.email_log_id
  );
  if (!message) {
    // if the bounce doesn't come from a PetitionMessage, ignore it
    return;
  }
  const [petition, sender, access] = await Promise.all([
    context.petitions.loadPetition(message.petition_id),
    context.users.loadUser(message.sender_id),
    context.petitions.loadAccess(message.petition_access_id),
  ]);
  if (!petition) {
    throw new Error(
      `Petition not found for petition_message.petition_id ${message.petition_id}`
    );
  }
  if (!sender) {
    throw new Error(
      `User not found for petition_message.sender_id ${message.sender_id}`
    );
  }
  if (!access) {
    throw new Error(
      `Petition access not found for petition_message.petition_access_id ${message.petition_access_id}`
    );
  }
  const [contact, org] = await Promise.all([
    context.contacts.loadContact(access.contact_id),
    context.organizations.loadOrg(sender.org_id),
  ]);
  if (!org) {
    throw new Error(
      `Organization not found for user.org_id ${access.contact_id}`
    );
  }
  const logoUrl = org.logo_url;

  if (!contact) {
    throw new Error(
      `Contact not found for petition_access.contact_id ${access.contact_id}`
    );
  }

  const { html, text, subject, from } = await buildEmail(
    MessageBouncedEmail,
    {
      senderName: fullName(sender.first_name, sender.last_name)!,
      petitionId: toGlobalId("Petition", petition.id),
      petitionName: petition.name,
      body: message.email_body ? JSON.parse(message.email_body) : [],
      contactEmail: contact.email,
      contactFullName: fullName(contact.first_name, contact.last_name)!,
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
    to: sender.email,
    subject,
    text,
    html,
    created_from: `EmailLog:${payload.email_log_id}`,
  });
}
