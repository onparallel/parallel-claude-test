import { WorkerContext } from "../../context";
import { buildEmail } from "../../emails/buildEmail";
import PublicPetitionLinkAccess from "../../emails/emails/recipient/PublicPetitionLinkAccess";
import { buildFrom } from "../../emails/utils/buildFrom";
import { fullName } from "../../util/fullName";
import { renderTextWithPlaceholders } from "../../util/slate/placeholders";
import { renderSlateToHtml, renderSlateToText } from "../../util/slate/render";

export async function publicPetitionLinkAccess(
  payload: { petition_message_id: number },
  context: WorkerContext,
) {
  const message = await context.petitions.loadMessage(payload.petition_message_id);
  if (!message) {
    throw new Error(`PetitionMessage:${payload.petition_message_id} not found`);
  }
  const [petition, senderData, access] = await Promise.all([
    context.petitions.loadPetition(message.petition_id),
    context.users.loadUserDataByUserId(message.sender_id),
    context.petitions.loadAccess(message.petition_access_id),
  ]);
  if (!petition) {
    return; // if the petition was deleted, return without throwing error
  }
  if (!petition.from_public_petition_link_id) {
    throw new Error(
      `Petition:${message.petition_id} should have defined property 'from_public_petition_link_id'`,
    );
  }
  if (!senderData) {
    throw new Error(`UserData not found for User:${message.sender_id}`);
  }
  if (!access) {
    throw new Error(`PetitionAccess:${message.petition_access_id} not found`);
  }
  const [contact, publicPetitionLink] = await Promise.all([
    access.contact_id ? context.contacts.loadContact(access.contact_id) : null,
    context.petitions.loadPublicPetitionLink(petition.from_public_petition_link_id),
  ]);
  if (!contact) {
    throw new Error(`Contact:${access.contact_id}`);
  }
  if (!publicPetitionLink) {
    throw new Error(`PublicPetitionLink:${petition.from_public_petition_link_id} not found`);
  }

  const orgId = petition.org_id;
  const hasRemoveWhyWeUseParallel = await context.featureFlags.orgHasFeatureFlag(
    orgId,
    "REMOVE_WHY_WE_USE_PARALLEL",
  );

  const bodyJson = message.email_body ? JSON.parse(message.email_body) : [];

  const { emailFrom, ...layoutProps } = await context.layouts.getLayoutProps(orgId);

  const getValues = await context.petitionMessageContext.fetchPlaceholderValues(
    {
      petitionId: message.petition_id,
      contactId: access.contact_id,
      userId: message.sender_id,
      petitionAccessId: access.id,
    },
    { publicContext: true },
  );
  const { html, text, subject, from } = await buildEmail(
    PublicPetitionLinkAccess,
    {
      name: contact.first_name,
      fullName: fullName(contact.first_name, contact.last_name),
      senderName: fullName(senderData.first_name, senderData.last_name)!,
      emailSubject: petition.email_subject
        ? renderTextWithPlaceholders(petition.email_subject, getValues)
        : null,
      petitionTitle: publicPetitionLink.title,
      keycode: access.keycode,
      bodyHtml: renderSlateToHtml(bodyJson),
      bodyPlainText: renderSlateToText(bodyJson),
      removeWhyWeUseParallel: hasRemoveWhyWeUseParallel,
      ...layoutProps,
    },
    { locale: petition.recipient_locale },
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
