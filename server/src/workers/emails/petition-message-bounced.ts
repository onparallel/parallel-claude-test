import { WorkerContext } from "../../context";
import { buildEmail } from "../../emails/buildEmail";
import MessageBouncedEmail from "../../emails/emails/MessageBouncedEmail";
import { buildFrom } from "../../emails/utils/buildFrom";
import { fullName } from "../../util/fullName";
import { toGlobalId } from "../../util/globalId";
import { toHtml, toPlainText } from "../../util/slate";
import { getLayoutProps } from "../helpers/getLayoutProps";

export async function petitionMessageBounced(
  payload: { petition_message_id: number },
  context: WorkerContext
) {
  const message = await context.petitions.loadMessage(payload.petition_message_id);
  if (!message) {
    throw new Error(`PetitionMessage:${payload.petition_message_id} not found.`);
  }
  const [petition, sender, senderData, access] = await Promise.all([
    context.petitions.loadPetition(message.petition_id),
    context.users.loadUser(message.sender_id),
    context.users.loadUserDataByUserId(message.sender_id),
    context.petitions.loadAccess(message.petition_access_id),
  ]);
  if (!petition) {
    return; // if the petition was deleted, return without throwing error
  }
  if (!sender) {
    throw new Error(`User not found for petition_message.sender_id ${message.sender_id}`);
  }
  if (!senderData) {
    throw new Error(`UserData not found for User:${message.sender_id}`);
  }
  if (!access) {
    throw new Error(
      `Petition access not found for petition_message.petition_access_id ${message.petition_access_id}`
    );
  }
  const contact = await context.contacts.loadContact(access.contact_id);
  if (!contact) {
    throw new Error(`Contact not found for petition_access.contact_id ${access.contact_id}`);
  }

  const { emailFrom, ...layoutProps } = await getLayoutProps(sender.org_id, context);

  const renderContext = { contact, user: senderData, petition };
  const bodyJson = message.email_body ? JSON.parse(message.email_body) : [];
  const { html, text, subject, from } = await buildEmail(
    MessageBouncedEmail,
    {
      contactFullName: fullName(contact.first_name, contact.last_name)!,
      senderName: fullName(senderData.first_name, senderData.last_name)!,
      petitionId: toGlobalId("Petition", petition.id),
      petitionName: petition.name,
      bodyHtml: toHtml(bodyJson, renderContext),
      bodyPlainText: toPlainText(bodyJson, renderContext),
      contactEmail: contact.email,
      ...layoutProps,
    },
    { locale: petition.locale }
  );

  return await context.emailLogs.createEmail({
    from: buildFrom(from, emailFrom),
    to: senderData.email,
    subject,
    text,
    html,
    created_from: `EmailLog:${message.email_log_id}`,
  });
}
