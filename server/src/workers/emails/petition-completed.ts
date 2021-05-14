import { pick, zip } from "remeda";
import { WorkerContext } from "../../context";
import { Contact, EmailLog, PetitionAccess } from "../../db/__types";
import { buildEmail } from "../../emails/buildEmail";
import PetitionCompleted from "../../emails/components/PetitionCompleted";
import { buildFrom } from "../../emails/utils/buildFrom";
import { evaluateFieldVisibility } from "../../util/fieldVisibility";
import { fullName } from "../../util/fullName";
import { toGlobalId } from "../../util/globalId";
import { isDefined } from "../../util/remedaExtensions";
import { Maybe } from "../../util/types";
import { getLayoutProps } from "../helpers/getLayoutProps";

export async function petitionCompleted(
  payload: {
    petition_id: number;
    petition_access_id?: number;
    signer_contact_id?: number;
  },
  context: WorkerContext
) {
  let access: Maybe<PetitionAccess> = null;
  let contact: Maybe<Contact> = null;
  if (!payload.petition_access_id && !payload.signer_contact_id) {
    throw new Error(`Required param not found ${JSON.stringify(payload)}`);
  }
  if (payload.petition_access_id) {
    // if payload.petition_access_id is set, the petition has been completed and doesn't require signature
    access = await context.petitions.loadAccess(payload.petition_access_id);
    if (!access) {
      throw new Error(`Access not found for id ${payload.petition_access_id}`);
    }
    contact = await context.contacts.loadContact(access.contact_id);
  } else if (payload.signer_contact_id) {
    // if payload.signer_contact_id is set, the petition has been completed and signed by the contact
    contact = await context.contacts.loadContact(payload.signer_contact_id);
  }

  if (!contact) {
    throw new Error(
      `Contact not found for contact_id ${
        access?.contact_id ?? payload.signer_contact_id
      }`
    );
  }
  const petitionId = payload.petition_id;
  const [petition, permissions, fields] = await Promise.all([
    context.petitions.loadPetition(petitionId),
    context.petitions.loadEffectivePermissions(petitionId),
    context.petitions.loadFieldsForPetition(petitionId),
  ]);

  if (!petition) {
    throw new Error(`Petition not found for id ${petitionId}`);
  }

  if (!permissions || permissions.length === 0) {
    return;
  }

  const layoutProps = await getLayoutProps(petition.org_id, context);

  const fieldIds = fields.map((f) => f.id);
  const fieldReplies = await context.petitions.loadRepliesForField(fieldIds);
  const repliesByFieldId = Object.fromEntries(
    fieldIds.map((id, index) => [id, fieldReplies[index]])
  );
  const fieldsWithReplies = fields.map((f) => ({
    ...f,
    replies: repliesByFieldId[f.id],
  }));

  const visibleFields = zip(
    fieldsWithReplies,
    evaluateFieldVisibility(fieldsWithReplies)
  )
    .filter(([, isVisible]) => isVisible)
    .map(([field]) => field);

  const emails: EmailLog[] = [];

  const subscribedUserIds = permissions
    .filter((p) => p.is_subscribed)
    .map((p) => p.user_id!);
  const subscribedUsers = (
    await context.users.loadUser(subscribedUserIds)
  ).filter(isDefined);
  for (const user of subscribedUsers) {
    const { html, text, subject, from } = await buildEmail(
      PetitionCompleted,
      {
        isSigned: Boolean(payload.signer_contact_id ?? false),
        name: user.first_name,
        petitionId: toGlobalId("Petition", petitionId),
        petitionName: petition.name,
        contactNameOrEmail:
          fullName(contact.first_name, contact.last_name) || contact.email,
        fields: visibleFields.map(pick(["id", "title", "position", "type"])),
        ...layoutProps,
      },
      { locale: petition.locale }
    );
    emails.push(
      await context.emailLogs.createEmail({
        from: buildFrom(from, context.config.misc.emailFrom),
        to: user!.email,
        subject,
        text,
        html,
        created_from: `PetitionAccess:${payload.petition_access_id}`,
      })
    );
  }
  return emails;
}
