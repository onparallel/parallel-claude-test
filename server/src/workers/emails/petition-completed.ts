import { isDefined } from "remeda";
import { WorkerContext } from "../../context";
import { PetitionSignatureConfigSigner } from "../../db/repositories/PetitionRepository";
import { Contact, EmailLog, PetitionAccess } from "../../db/__types";
import { buildEmail } from "../../emails/buildEmail";
import PetitionCompleted from "../../emails/emails/PetitionCompleted";
import { buildFrom } from "../../emails/utils/buildFrom";
import { fullName } from "../../util/fullName";
import { toGlobalId } from "../../util/globalId";
import { Maybe } from "../../util/types";

export async function petitionCompleted(
  payload: {
    petition_id: number;
    petition_access_id?: number;
    signer?: PetitionSignatureConfigSigner;
    completed_by: string;
  },
  context: WorkerContext
) {
  let access: Maybe<PetitionAccess> = null;
  let contact: Maybe<Partial<Contact>> = null;

  if (!payload.petition_access_id && !payload.signer) {
    throw new Error(`Required param not found ${JSON.stringify(payload)}`);
  }
  if (payload.petition_access_id) {
    // if payload.petition_access_id is set, the petition has been completed and doesn't require signature
    access = await context.petitions.loadAccess(payload.petition_access_id);
    if (!access) {
      throw new Error(`Access not found for id ${payload.petition_access_id}`);
    }
    contact = access.contact_id ? await context.contacts.loadContact(access.contact_id) : null;
  } else if (payload.signer) {
    // if payload.signer is set, the petition has been completed and signed
    contact = {
      first_name: payload.signer.firstName,
      last_name: payload.signer.lastName,
      email: payload.signer.email,
    };
  }

  if (!contact) {
    throw new Error(`Contact not found for contact_id ${access?.contact_id}`);
  }
  const petitionId = payload.petition_id;
  const [petition, permissions] = await Promise.all([
    context.petitions.loadPetition(petitionId),
    context.petitions.loadEffectivePermissions(petitionId),
  ]);

  if (!petition) {
    return; // if the petition was deleted, return without throwing error
  }

  if (!permissions || permissions.length === 0) {
    return;
  }

  const { emailFrom, ...layoutProps } = await context.layouts.getLayoutProps(petition.org_id);

  const emails: EmailLog[] = [];

  const subscribedUserIds = permissions.filter((p) => p.is_subscribed).map((p) => p.user_id!);
  const subscribedUsersData = (await context.users.loadUserDataByUserId(subscribedUserIds)).filter(
    isDefined
  );

  const isSigned = isDefined(payload.signer);
  const isManualStartSignature = !isSigned && petition.signature_config?.review === true;

  for (const userData of subscribedUsersData) {
    const { html, text, subject, from } = await buildEmail(
      PetitionCompleted,
      {
        isSigned,
        isManualStartSignature,
        userName: userData.first_name,
        petitionId: toGlobalId("Petition", petitionId),
        petitionName: petition.name,
        contactName: fullName(contact.first_name, contact.last_name),
        contactEmail: contact.email!,
        ...layoutProps,
      },
      { locale: userData.preferred_locale }
    );
    emails.push(
      await context.emailLogs.createEmail({
        from: buildFrom(from, emailFrom),
        to: userData!.email,
        subject,
        text,
        html,
        created_from: payload.completed_by,
      })
    );
  }
  return emails;
}
