import { inject, injectable } from "inversify";
import { ContactRepository } from "../../../db/repositories/ContactRepository";
import { EmailLogRepository } from "../../../db/repositories/EmailLogRepository";
import { FeatureFlagRepository } from "../../../db/repositories/FeatureFlagRepository";
import { PetitionRepository } from "../../../db/repositories/PetitionRepository";
import { UserRepository } from "../../../db/repositories/UserRepository";
import { buildEmail } from "../../../emails/buildEmail";
import AccessDelegatedEmail from "../../../emails/emails/recipient/AccessDelegatedEmail";
import { buildFrom } from "../../../emails/utils/buildFrom";
import {
  IOrganizationLayoutService,
  ORGANIZATION_LAYOUT_SERVICE,
} from "../../../services/OrganizationLayoutService";
import { fullName } from "../../../util/fullName";
import { renderTextToHtml } from "../../../util/slate/render";
import { EmailBuilder } from "../EmailSenderQueue";

interface PetitionAccessDelegatedEmailPayload {
  petition_id: number;
  new_access_id: number;
  original_access_id: number;
  message_body: string;
}

@injectable()
export class PetitionAccessDelegatedEmailBuilder
  implements EmailBuilder<PetitionAccessDelegatedEmailPayload>
{
  constructor(
    @inject(ORGANIZATION_LAYOUT_SERVICE) private layouts: IOrganizationLayoutService,
    @inject(PetitionRepository) private petitions: PetitionRepository,
    @inject(ContactRepository) private contacts: ContactRepository,
    @inject(UserRepository) private users: UserRepository,
    @inject(FeatureFlagRepository) private featureFlags: FeatureFlagRepository,
    @inject(EmailLogRepository) private emailLogs: EmailLogRepository,
  ) {}

  async build(payload: PetitionAccessDelegatedEmailPayload) {
    const [petition, newAccess, originalAccess] = await Promise.all([
      this.petitions.loadPetition(payload.petition_id),
      this.petitions.loadAccess(payload.new_access_id),
      this.petitions.loadAccess(payload.original_access_id),
    ]);
    if (!petition) {
      return []; // if the petition was deleted, return without throwing error
    }
    if (!newAccess) {
      throw new Error(`Petition access with id ${payload.new_access_id} not found`);
    }
    if (!originalAccess) {
      throw new Error(`Petition access with id ${payload.original_access_id} not found`);
    }

    const [contact, delegator, petitionOwnerData, originalMessage] = await Promise.all([
      newAccess.contact_id ? this.contacts.loadContact(newAccess.contact_id) : null,
      originalAccess.contact_id ? this.contacts.loadContact(originalAccess.contact_id) : null,
      this.users.loadUserDataByUserId(originalAccess.granter_id),
      this.petitions.loadOriginalMessageByPetitionAccess(
        payload.original_access_id,
        payload.petition_id,
      ),
    ]);

    if (!contact) {
      throw new Error(
        `Contact ${newAccess.contact_id} not found for petition_access with id ${newAccess.id}`,
      );
    }
    if (!delegator) {
      throw new Error(
        `Contact ${originalAccess.contact_id} not found for petition_access with id ${originalAccess.id}`,
      );
    }
    if (!petitionOwnerData) {
      throw new Error(`UserData for User:${originalAccess.granter_id} not found`);
    }

    const orgId = petition.org_id;
    const hasRemoveWhyWeUseParallel = await this.featureFlags.orgHasFeatureFlag(
      orgId,
      "REMOVE_WHY_WE_USE_PARALLEL",
    );
    const { emailFrom, ...layoutProps } = await this.layouts.getLayoutProps(orgId);

    const { html, text, subject, from } = await buildEmail(
      AccessDelegatedEmail,
      {
        senderName: fullName(delegator.first_name, delegator.last_name)!,
        senderEmail: delegator.email,
        petitionOwnerFullName: fullName(petitionOwnerData.first_name, petitionOwnerData.last_name)!,
        petitionOwnerEmail: petitionOwnerData.email,
        deadline: petition.deadline,
        bodyHtml: renderTextToHtml(payload.message_body),
        bodyPlainText: payload.message_body,
        emailSubject: originalMessage?.email_subject ?? null,
        keycode: newAccess.keycode,
        removeWhyWeUseParallel: hasRemoveWhyWeUseParallel,
        ...layoutProps,
      },
      { locale: petition.recipient_locale },
    );

    const email = await this.emailLogs.createEmail({
      from: buildFrom(from, emailFrom),
      to: contact.email,
      subject,
      text,
      html,
      reply_to: delegator.email,
      track_opens: true,
      created_from: `PetitionAccess:${payload.original_access_id}`,
    });

    return [email];
  }
}
