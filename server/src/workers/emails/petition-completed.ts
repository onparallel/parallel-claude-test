import { isDefined } from "remeda";
import { WorkerContext } from "../../context";
import { PetitionSignatureConfigSigner } from "../../db/repositories/PetitionRepository";
import { Contact, EmailLog, PetitionAccess } from "../../db/__types";
import { buildEmail } from "../../emails/buildEmail";
import PetitionCompleted from "../../emails/components/PetitionCompleted";
import { buildFrom } from "../../emails/utils/buildFrom";
import { fullName } from "../../util/fullName";
import { toGlobalId } from "../../util/globalId";
import { Maybe } from "../../util/types";
import { getLayoutProps } from "../helpers/getLayoutProps";

export async function petitionCompleted(
  payload: {
    petition_id: number;
    petition_access_id?: number;
    signer?: PetitionSignatureConfigSigner;
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
    contact = await context.contacts.loadContact(access.contact_id);
  } else if (payload.signer) {
    // if payload.signer_contact_id is set, the petition has been completed and signed by the contact
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
    throw new Error(`Petition not found for id ${petitionId}`);
  }

  if (!permissions || permissions.length === 0) {
    return;
  }

  const { emailFrom, ...layoutProps } = await getLayoutProps(petition.org_id, context);

  const emails: EmailLog[] = [];

  const subscribedUserIds = permissions.filter((p) => p.is_subscribed).map((p) => p.user_id!);
  const subscribedUsers = (await context.users.loadUser(subscribedUserIds)).filter(isDefined);
  for (const user of subscribedUsers) {
    const { html, text, subject, from } = await buildEmail(
      PetitionCompleted,
      {
        isSigned: !!payload.signer,
        userName: user.first_name,
        petitionId: toGlobalId("Petition", petitionId),
        petitionName: petition.name,
        contactName: fullName(contact.first_name, contact.last_name),
        contactEmail: contact.email!,
        ...layoutProps,
      },
      { locale: petition.locale }
    );
    emails.push(
      await context.emailLogs.createEmail({
        from: buildFrom(from, emailFrom),
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
