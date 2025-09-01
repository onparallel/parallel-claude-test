import { inject, injectable } from "inversify";
import { isNonNullish } from "remeda";
import { Contact, EmailLog, PetitionAccess } from "../../../db/__types";
import { ContactRepository } from "../../../db/repositories/ContactRepository";
import { EmailLogRepository } from "../../../db/repositories/EmailLogRepository";
import {
  PetitionRepository,
  PetitionSignatureConfigSigner,
} from "../../../db/repositories/PetitionRepository";
import { UserRepository } from "../../../db/repositories/UserRepository";
import { buildEmail } from "../../../emails/buildEmail";
import PetitionCompleted from "../../../emails/emails/app/PetitionCompleted";
import { buildFrom } from "../../../emails/utils/buildFrom";
import {
  IOrganizationLayoutService,
  ORGANIZATION_LAYOUT_SERVICE,
} from "../../../services/OrganizationLayoutService";
import { fullName } from "../../../util/fullName";
import { toGlobalId } from "../../../util/globalId";
import { Maybe } from "../../../util/types";
import { EmailBuilder } from "../EmailSenderQueue";

interface PetitionCompletedEmailPayload {
  petition_id: number;
  petition_access_id?: number;
  signer?: PetitionSignatureConfigSigner;
  completed_by: string;
}

@injectable()
export class PetitionCompletedEmailBuilder implements EmailBuilder<PetitionCompletedEmailPayload> {
  constructor(
    @inject(ORGANIZATION_LAYOUT_SERVICE)
    private layouts: IOrganizationLayoutService,
    @inject(PetitionRepository) private petitions: PetitionRepository,
    @inject(ContactRepository) private contacts: ContactRepository,
    @inject(UserRepository) private users: UserRepository,
    @inject(EmailLogRepository) private emailLogs: EmailLogRepository,
  ) {}

  async build(payload: PetitionCompletedEmailPayload) {
    let access: Maybe<PetitionAccess> = null;
    let contact: Maybe<Partial<Contact>> = null;

    if (!payload.petition_access_id && !payload.signer) {
      throw new Error(`Required param not found ${JSON.stringify(payload)}`);
    }
    if (payload.petition_access_id) {
      // if payload.petition_access_id is set, the petition has been completed and doesn't require signature
      access = await this.petitions.loadAccess(payload.petition_access_id);
      if (!access) {
        throw new Error(`Access not found for id ${payload.petition_access_id}`);
      }
      contact = access.contact_id ? await this.contacts.loadContact(access.contact_id) : null;
    } else if (payload.signer) {
      // if payload.signer is set, the petition has been completed and signed
      contact = {
        first_name: payload.signer.firstName,
        last_name: payload.signer.lastName,
        email: payload.signer.email!,
      };
    }

    if (!contact) {
      throw new Error(`Contact not found for contact_id ${access?.contact_id}`);
    }
    const petitionId = payload.petition_id;
    const [petition, permissions] = await Promise.all([
      this.petitions.loadPetition(petitionId),
      this.petitions.loadEffectivePermissions(petitionId),
    ]);

    if (!petition) {
      return []; // if the petition was deleted, return without throwing error
    }

    if (!permissions || permissions.length === 0) {
      return [];
    }

    const { emailFrom, ...layoutProps } = await this.layouts.getLayoutProps(petition.org_id);

    const emails: EmailLog[] = [];

    const subscribedUserIds = permissions.filter((p) => p.is_subscribed).map((p) => p.user_id!);
    const subscribedUsersData = (await this.users.loadUserDataByUserId(subscribedUserIds)).filter(
      isNonNullish,
    );

    const isSigned = isNonNullish(payload.signer);
    const isManualStartSignature =
      !isSigned &&
      !!petition.signature_config?.isEnabled &&
      petition.signature_config.review === true;

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
        { locale: userData.preferred_locale },
      );
      emails.push(
        await this.emailLogs.createEmail({
          from: buildFrom(from, emailFrom),
          to: userData!.email,
          subject,
          text,
          html,
          created_from: payload.completed_by,
        }),
      );
    }

    return emails;
  }
}
