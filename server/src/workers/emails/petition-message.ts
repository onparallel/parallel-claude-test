import { isDefined } from "remeda";
import { WorkerContext } from "../../context";
import { buildEmail } from "../../emails/buildEmail";
import PetitionMessage from "../../emails/emails/PetitionMessage";
import { buildFrom } from "../../emails/utils/buildFrom";
import { fullName } from "../../util/fullName";
import { renderSlateToHtml, renderSlateToText } from "../../util/slate/render";

export async function petitionMessage(
  payload: { petition_message_id: number },
  context: WorkerContext
) {
  const message = await context.petitions.loadMessage(payload.petition_message_id);
  if (!message) {
    throw new Error(`Parallel message not found for id ${payload.petition_message_id}`);
  }

  const [petition, senderData, access, accesses] = await Promise.all([
    context.readonlyPetitions.loadPetition(message.petition_id),
    context.users.loadUserDataByUserId(message.sender_id),
    context.readonlyPetitions.loadAccess(message.petition_access_id),
    context.readonlyPetitions.loadAccessesForPetition(message.petition_id),
  ]);
  if (!petition) {
    return; // if the petition was deleted, return without throwing error
  }
  if (!senderData) {
    throw new Error(`UserData not found for User:${message.sender_id}`);
  }
  if (!access) {
    throw new Error(
      `Petition access not found for petition_message.petition_access_id ${message.petition_access_id}`
    );
  }
  const contact = access.contact_id ? await context.contacts.loadContact(access.contact_id) : null;
  if (!contact) {
    throw new Error(`Contact not found for petition_access.contact_id ${access.contact_id}`);
  }

  const orgId = petition.org_id;

  const { emailFrom, ...layoutProps } = await context.layouts.getLayoutProps(orgId);
  const bodyJson = message.email_body ? JSON.parse(message.email_body) : [];

  const hasRemoveWhyWeUseParallel = await context.featureFlags.orgHasFeatureFlag(
    orgId,
    "REMOVE_WHY_WE_USE_PARALLEL"
  );

  const contactIds = accesses
    .filter((a) => a.id !== access.id)
    .map((a) => a.contact_id)
    .filter(isDefined);

  const recipients = contactIds.length
    ? (await context.contacts.loadContact(contactIds)).filter(isDefined).map((r) => ({
        name: fullName(r.first_name, r.last_name),
        email: r.email,
      }))
    : null;

  const { html, text, subject, from } = await buildEmail(
    PetitionMessage,
    {
      senderName: fullName(senderData.first_name, senderData.last_name)!,
      senderEmail: senderData.email,
      subject: message.email_subject ?? null,
      bodyHtml: renderSlateToHtml(bodyJson),
      bodyPlainText: renderSlateToText(bodyJson),
      deadline: petition.deadline,
      keycode: access.keycode,
      recipients,
      removeWhyWeUseParallel: hasRemoveWhyWeUseParallel,
      ...layoutProps,
    },
    { locale: petition.recipient_locale }
  );
  const email = await context.emailLogs.createEmail({
    from: buildFrom(from, emailFrom),
    to: contact.email,
    subject,
    text,
    html,
    reply_to: senderData.email,
    track_opens: true,
    created_from: `PetitionMessage:${payload.petition_message_id}`,
  });

  await context.petitions.processPetitionMessage(payload.petition_message_id, email.id);

  return email;
}
