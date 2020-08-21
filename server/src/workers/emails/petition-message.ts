import { WorkerContext } from "../../context";
import { pick } from "remeda";
import { EmailPayload } from "./types";
import { buildEmail } from "../../emails/buildEmail";
import { buildFrom } from "../../emails/utils/buildFrom";
import PetitionMessage from "../../emails/components/PetitionMessage";
import { EmailLog } from "../../db/__types";

export async function petitionMessage(
  payload: EmailPayload["petition-message"],
  context: WorkerContext
): Promise<EmailLog | undefined> {
  const message = await context.petitions.loadMessage(
    payload.petition_message_id
  );
  if (!message) {
    throw new Error(
      `Petition message not found for id ${payload.petition_message_id}`
    );
  }
  const [petition, sender, access, fields] = await Promise.all([
    context.petitions.loadPetition(message.petition_id),
    context.users.loadUser(message.sender_id),
    context.petitions.loadAccess(message.petition_access_id),
    context.petitions.loadFieldsForPetition(message.petition_id),
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
  const [contact, org, logoUrl] = await Promise.all([
    context.contacts.loadContact(access.contact_id),
    context.organizations.loadOrg(sender.org_id),
    context.organizations.getOrgLogoUrl(sender.org_id),
  ]);
  if (!org) {
    throw new Error(
      `Organization not found for user.org_id ${access.contact_id}`
    );
  }
  if (!contact) {
    throw new Error(
      `Contact not found for petition_access.contact_id ${access.contact_id}`
    );
  }
  const senderName = sender.last_name
    ? `${sender.first_name} ${sender.last_name}`
    : sender.first_name!;
  const { html, text, subject, from } = await buildEmail(
    PetitionMessage,
    {
      name: contact.first_name,
      senderName,
      senderEmail: sender.email,
      subject: message.email_subject,
      body: message.email_body ? JSON.parse(message.email_body) : [],
      fields: fields.map(pick(["id", "title", "position", "type"])),
      deadline: petition.deadline,
      keycode: access.keycode,
      assetsUrl: context.config.misc.assetsUrl,
      parallelUrl: context.config.misc.parallelUrl,
      logoUrl:
        logoUrl ?? `${context.config.misc.assetsUrl}/static/emails/logo.png`,
      logoAlt: logoUrl ? org.name : "Parallel",
    },
    { locale: petition.locale }
  );
  const email = await context.emails.createEmail({
    from: buildFrom(from, context.config.misc.emailFrom),
    to: contact.email,
    subject,
    text,
    html,
    reply_to: sender.email,
    track_opens: true,
    created_from: `PetitionMessage:${payload.petition_message_id}`,
  });

  await context.petitions.processPetitionMessage(
    payload.petition_message_id,
    email.id
  );

  return email;
}
