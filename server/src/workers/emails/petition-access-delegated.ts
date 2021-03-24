import { pick } from "remeda";
import { WorkerContext } from "../../context";
import { buildEmail } from "../../emails/buildEmail";
import AccessDelegatedEmail from "../../emails/components/AccessDelegatedEmail";
import { buildFrom } from "../../emails/utils/buildFrom";
import { fullName } from "../../util/fullName";
import { toHtml, toPlainText } from "../../util/slate";

export async function petitionAccessDelegated(
  payload: {
    petition_id: number;
    new_access_id: number;
    original_access_id: number;
    message_body: any;
  },
  context: WorkerContext
) {
  const [petition, fields, newAccess, originalAccess] = await Promise.all([
    context.petitions.loadPetition(payload.petition_id),
    context.petitions.loadFieldsForPetitionWithNullVisibility(
      payload.petition_id
    ),
    context.petitions.loadAccess(payload.new_access_id),
    context.petitions.loadAccess(payload.original_access_id),
  ]);
  if (!petition) {
    throw new Error(`Petition with id ${payload.petition_id} not found`);
  }
  if (!newAccess) {
    throw new Error(
      `Petition access with id ${payload.new_access_id} not found`
    );
  }
  if (!originalAccess) {
    throw new Error(
      `Petition access with id ${payload.original_access_id} not found`
    );
  }

  const [contact, delegator, petitionOwner, org, logoUrl] = await Promise.all([
    context.contacts.loadContact(newAccess.contact_id),
    context.contacts.loadContact(originalAccess.contact_id),
    context.users.loadUser(originalAccess.granter_id),
    context.organizations.loadOrg(petition.org_id),
    context.organizations.getOrgLogoUrl(petition.org_id),
  ]);

  if (!org) {
    throw new Error(
      `Organization ${petition.org_id} not found for petition with id ${petition.id}`
    );
  }
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
  if (!petitionOwner) {
    throw new Error(`User with id ${originalAccess.granter_id} not found`);
  }

  const { html, text, subject, from } = await buildEmail(
    AccessDelegatedEmail,
    {
      fullName: fullName(contact.first_name, contact.last_name),
      senderName: fullName(delegator.first_name, delegator.last_name)!,
      senderEmail: delegator.email,
      petitionOwnerFullName: fullName(
        petitionOwner.first_name,
        petitionOwner.last_name
      )!,
      petitionOwnerEmail: petitionOwner.email,
      fields: fields.map(pick(["id", "title", "position", "type"])),
      bodyHtml: toHtml(payload.message_body),
      bodyPlainText: toPlainText(payload.message_body),
      deadline: petition.deadline,
      keycode: newAccess.keycode,
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
    to: contact.email,
    subject,
    text,
    html,
    reply_to: delegator.email,
    track_opens: true,
    created_from: `PetitionAccess:${payload.original_access_id}`,
  });
}
