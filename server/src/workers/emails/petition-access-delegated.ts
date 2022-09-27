import { WorkerContext } from "../../context";
import { buildEmail } from "../../emails/buildEmail";
import AccessDelegatedEmail from "../../emails/emails/AccessDelegatedEmail";
import { buildFrom } from "../../emails/utils/buildFrom";
import { fullName } from "../../util/fullName";
import { toHtml, toPlainText } from "../../util/slate";
import { getLayoutProps } from "../helpers/getLayoutProps";
import { loadOriginalMessageByPetitionAccess } from "../helpers/loadOriginalMessageByPetitionAccess";

export async function petitionAccessDelegated(
  payload: {
    petition_id: number;
    new_access_id: number;
    original_access_id: number;
    message_body: any;
  },
  context: WorkerContext
) {
  const [petition, newAccess, originalAccess] = await Promise.all([
    context.petitions.loadPetition(payload.petition_id),
    context.petitions.loadAccess(payload.new_access_id),
    context.petitions.loadAccess(payload.original_access_id),
  ]);
  if (!petition) {
    return; // if the petition was deleted, return without throwing error
  }
  if (!newAccess) {
    throw new Error(`Petition access with id ${payload.new_access_id} not found`);
  }
  if (!originalAccess) {
    throw new Error(`Petition access with id ${payload.original_access_id} not found`);
  }

  const [contact, delegator, petitionOwnerData, originalMessage] = await Promise.all([
    newAccess.contact_id ? context.contacts.loadContact(newAccess.contact_id) : null,
    originalAccess.contact_id ? context.contacts.loadContact(originalAccess.contact_id) : null,
    context.users.loadUserDataByUserId(originalAccess.granter_id),
    loadOriginalMessageByPetitionAccess(payload.original_access_id, payload.petition_id, context),
  ]);

  if (!contact) {
    throw new Error(
      `Contact ${newAccess.contact_id} not found for petition_access with id ${newAccess.id}`
    );
  }
  if (!delegator) {
    throw new Error(
      `Contact ${originalAccess.contact_id} not found for petition_access with id ${originalAccess.id}`
    );
  }
  if (!petitionOwnerData) {
    throw new Error(`UserData for User:${originalAccess.granter_id} not found`);
  }

  const orgId = petition.org_id;
  const hasRemoveWhyWeUseParallel = await context.featureFlags.orgHasFeatureFlag(
    orgId,
    "REMOVE_WHY_WE_USE_PARALLEL"
  );
  const { emailFrom, ...layoutProps } = await getLayoutProps(orgId, context);
  const { html, text, subject, from } = await buildEmail(
    AccessDelegatedEmail,
    {
      senderName: fullName(delegator.first_name, delegator.last_name)!,
      senderEmail: delegator.email,
      petitionOwnerFullName: fullName(petitionOwnerData.first_name, petitionOwnerData.last_name)!,
      petitionOwnerEmail: petitionOwnerData.email,
      deadline: petition.deadline,
      bodyHtml: toHtml(payload.message_body),
      bodyPlainText: toPlainText(payload.message_body),
      emailSubject: originalMessage?.email_subject ?? null,
      keycode: newAccess.keycode,
      removeWhyWeUseParallel: hasRemoveWhyWeUseParallel,
      ...layoutProps,
    },
    { locale: petition.locale }
  );

  return await context.emailLogs.createEmail({
    from: buildFrom(from, emailFrom),
    to: contact.email,
    subject,
    text,
    html,
    reply_to: delegator.email,
    track_opens: true,
    created_from: `PetitionAccess:${payload.original_access_id}`,
  });
}
