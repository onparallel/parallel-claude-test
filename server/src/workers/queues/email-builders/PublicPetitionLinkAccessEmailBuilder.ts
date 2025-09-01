import { inject, injectable } from "inversify";
import { ContactRepository } from "../../../db/repositories/ContactRepository";
import { EmailLogRepository } from "../../../db/repositories/EmailLogRepository";
import { FeatureFlagRepository } from "../../../db/repositories/FeatureFlagRepository";
import { PetitionRepository } from "../../../db/repositories/PetitionRepository";
import { UserRepository } from "../../../db/repositories/UserRepository";
import { buildEmail } from "../../../emails/buildEmail";
import PublicPetitionLinkAccess from "../../../emails/emails/recipient/PublicPetitionLinkAccess";
import { buildFrom } from "../../../emails/utils/buildFrom";
import {
  IOrganizationLayoutService,
  ORGANIZATION_LAYOUT_SERVICE,
} from "../../../services/OrganizationLayoutService";
import {
  IPetitionMessageContextService,
  PETITION_MESSAGE_CONTEXT_SERVICE,
} from "../../../services/PetitionMessageContextService";
import { fullName } from "../../../util/fullName";
import { renderTextWithPlaceholders } from "../../../util/slate/placeholders";
import { renderSlateToHtml, renderSlateToText } from "../../../util/slate/render";
import { EmailBuilder } from "../EmailSenderQueue";

interface PublicPetitionLinkAccessEmailPayload {
  petition_message_id: number;
}

@injectable()
export class PublicPetitionLinkAccessEmailBuilder
  implements EmailBuilder<PublicPetitionLinkAccessEmailPayload>
{
  constructor(
    @inject(ORGANIZATION_LAYOUT_SERVICE) private layouts: IOrganizationLayoutService,
    @inject(PETITION_MESSAGE_CONTEXT_SERVICE)
    private petitionMessageContext: IPetitionMessageContextService,
    @inject(PetitionRepository) private petitions: PetitionRepository,
    @inject(UserRepository) private users: UserRepository,
    @inject(ContactRepository) private contacts: ContactRepository,
    @inject(FeatureFlagRepository) private featureFlags: FeatureFlagRepository,
    @inject(EmailLogRepository) private emailLogs: EmailLogRepository,
  ) {}

  async build(payload: PublicPetitionLinkAccessEmailPayload) {
    const message = await this.petitions.loadMessage(payload.petition_message_id);
    if (!message) {
      throw new Error(`PetitionMessage:${payload.petition_message_id} not found`);
    }
    const [petition, senderData, access] = await Promise.all([
      this.petitions.loadPetition(message.petition_id),
      this.users.loadUserDataByUserId(message.sender_id),
      this.petitions.loadAccess(message.petition_access_id),
    ]);
    if (!petition) {
      return []; // if the petition was deleted, return without throwing error
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
      access.contact_id ? this.contacts.loadContact(access.contact_id) : null,
      this.petitions.loadPublicPetitionLink(petition.from_public_petition_link_id),
    ]);
    if (!contact) {
      throw new Error(`Contact:${access.contact_id}`);
    }
    if (!publicPetitionLink) {
      throw new Error(`PublicPetitionLink:${petition.from_public_petition_link_id} not found`);
    }

    const orgId = petition.org_id;
    const hasRemoveWhyWeUseParallel = await this.featureFlags.orgHasFeatureFlag(
      orgId,
      "REMOVE_WHY_WE_USE_PARALLEL",
    );

    const bodyJson = message.email_body ? JSON.parse(message.email_body) : [];

    const { emailFrom, ...layoutProps } = await this.layouts.getLayoutProps(orgId);

    const getValues = await this.petitionMessageContext.fetchPlaceholderValues(
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
    const email = await this.emailLogs.createEmail({
      from: buildFrom(from, emailFrom),
      to: contact.email,
      subject,
      text,
      html,
      reply_to: senderData.email,
      track_opens: true,
      created_from: `PetitionMessage:${payload.petition_message_id}`,
    });

    await this.petitions.processPetitionMessage(payload.petition_message_id, email.id);

    return [email];
  }
}
