import { WorkerContext } from "../../context";
import { buildEmail } from "../../emails/buildEmail";
import PetitionMessage from "../../emails/components/PetitionMessage";
import { buildFrom } from "../../emails/utils/buildFrom";
import { fullName } from "../../util/fullName";
import { toHtml, toPlainText } from "../../util/slate";
import { getLayoutProps } from "../helpers/getLayoutProps";

export async function petitionMessage(
  payload: { petition_message_id: number },
  context: WorkerContext
) {
  const message = await context.petitions.loadMessage(payload.petition_message_id);
  if (!message) {
    throw new Error(`Petition message not found for id ${payload.petition_message_id}`);
  }
  const [petition, sender, access] = await Promise.all([
    context.petitions.loadPetition(message.petition_id),
    context.users.loadUser(message.sender_id),
    context.petitions.loadAccess(message.petition_access_id),
  ]);
  if (!petition) {
    return; // if the petition was deleted, return without throwing error
  }
  if (!sender) {
    throw new Error(`User not found for petition_message.sender_id ${message.sender_id}`);
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
  const bodyJson = message.email_body ? JSON.parse(message.email_body) : [];
  const renderContext = { contact, user: sender, petition };

  const organization = await context.organizations.loadOrg(petition.org_id);
  const hasRemoveWhyWeUseParallel = await context.featureFlags.orgHasFeatureFlag(
    organization!.id,
    "REMOVE_WHY_WE_USE_PARALLEL"
  );

  const { html, text, subject, from } = await buildEmail(
    PetitionMessage,
    {
      senderName: fullName(sender.first_name, sender.last_name)!,
      senderEmail: sender.email,
      subject: message.email_subject,
      bodyHtml: toHtml(bodyJson, renderContext),
      bodyPlainText: toPlainText(bodyJson, renderContext),
      deadline: petition.deadline,
      keycode: access.keycode,
      tone: organization!.preferred_tone,
      removeWhyWeUseParallel: hasRemoveWhyWeUseParallel,
      ...layoutProps,
    },
    { locale: petition.locale }
  );
  const email = await context.emailLogs.createEmail({
    from: buildFrom(from, emailFrom),
    to: contact.email,
    subject,
    text,
    html,
    reply_to: sender.email,
    track_opens: true,
    created_from: `PetitionMessage:${payload.petition_message_id}`,
  });

  await context.petitions.processPetitionMessage(payload.petition_message_id, email.id);

  return email;
}
