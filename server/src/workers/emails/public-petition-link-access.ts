import { WorkerContext } from "../../context";
import { buildEmail } from "../../emails/buildEmail";
import PublicPetitionLinkAccess from "../../emails/emails/PublicPetitionLinkAccess";
import { buildFrom } from "../../emails/utils/buildFrom";
import { fullName } from "../../util/fullName";
import { getLayoutProps } from "../helpers/getLayoutProps";

export async function publicPetitionLinkAccess(
  payload: { petition_message_id: number },
  context: WorkerContext
) {
  const message = await context.petitions.loadMessage(payload.petition_message_id);
  if (!message) {
    throw new Error(`PetitionMessage:${payload.petition_message_id} not found`);
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
  if (!petition.from_public_petition_link_id) {
    throw new Error(
      `Petition:${message.petition_id} should have defined property 'from_public_petition_link_id'`
    );
  }
  if (!sender) {
    throw new Error(`User:${message.sender_id} not found`);
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

  const organization = await context.organizations.loadOrg(petition.org_id);
  const hasRemoveWhyWeUseParallel = await context.featureFlags.orgHasFeatureFlag(
    organization!.id,
    "REMOVE_WHY_WE_USE_PARALLEL"
  );
  const hasRemoveParallelBranding = await context.featureFlags.orgHasFeatureFlag(
    organization!.id,
    "REMOVE_PARALLEL_BRANDING"
  );

  const { emailFrom, ...layoutProps } = await getLayoutProps(sender.org_id, context);
  const { html, text, subject, from } = await buildEmail(
    PublicPetitionLinkAccess,
    {
      name: contact.first_name,
      fullName: fullName(contact.first_name, contact.last_name),
      senderName: fullName(senderData.first_name, senderData.last_name)!,
      emailSubject: petition.email_subject,
      petitionTitle: publicPetitionLink.title,
      keycode: access.keycode,
      tone: organization!.preferred_tone,
      theme: organization!.brand_theme,
      removeWhyWeUseParallel: hasRemoveWhyWeUseParallel,
      removeParallelBranding: hasRemoveParallelBranding,
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
    reply_to: senderData.email,
    track_opens: true,
    created_from: `PetitionMessage:${payload.petition_message_id}`,
  });

  await context.petitions.processPetitionMessage(payload.petition_message_id, email.id);

  return email;
}
