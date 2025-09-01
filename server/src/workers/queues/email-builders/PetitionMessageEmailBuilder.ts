import { inject, injectable } from "inversify";
import { isNonNullish } from "remeda";
import { ContactRepository } from "../../../db/repositories/ContactRepository";
import { EmailLogRepository } from "../../../db/repositories/EmailLogRepository";
import { FeatureFlagRepository } from "../../../db/repositories/FeatureFlagRepository";
import { PetitionRepository } from "../../../db/repositories/PetitionRepository";
import { UserRepository } from "../../../db/repositories/UserRepository";
import { buildEmail } from "../../../emails/buildEmail";
import PetitionMessage from "../../../emails/emails/recipient/PetitionMessage";
import { buildFrom } from "../../../emails/utils/buildFrom";
import {
  IOrganizationLayoutService,
  ORGANIZATION_LAYOUT_SERVICE,
} from "../../../services/OrganizationLayoutService";
import { fullName } from "../../../util/fullName";
import { renderSlateToHtml, renderSlateToText } from "../../../util/slate/render";
import { EmailBuilder } from "../EmailSenderQueue";

interface PetitionMessageEmailPayload {
  petition_message_id: number;
}

@injectable()
export class PetitionMessageEmailBuilder implements EmailBuilder<PetitionMessageEmailPayload> {
  constructor(
    @inject(ORGANIZATION_LAYOUT_SERVICE) private layouts: IOrganizationLayoutService,
    @inject(PetitionRepository) private petitions: PetitionRepository,
    @inject(UserRepository) private users: UserRepository,
    @inject(ContactRepository) private contacts: ContactRepository,
    @inject(FeatureFlagRepository) private featureFlags: FeatureFlagRepository,
    @inject(EmailLogRepository) private emailLogs: EmailLogRepository,
  ) {}

  async build(payload: PetitionMessageEmailPayload) {
    const message = await this.petitions.loadMessage(payload.petition_message_id);
    if (!message) {
      throw new Error(`Parallel message not found for id ${payload.petition_message_id}`);
    }

    const [petition, senderData, access, accesses] = await Promise.all([
      this.petitions.loadPetition(message.petition_id),
      this.users.loadUserDataByUserId(message.sender_id),
      this.petitions.loadAccess(message.petition_access_id),
      this.petitions.loadAccessesForPetition(message.petition_id),
    ]);
    if (!petition) {
      return []; // if the petition was deleted, return without throwing error
    }
    if (!senderData) {
      throw new Error(`UserData not found for User:${message.sender_id}`);
    }
    if (!access) {
      throw new Error(
        `Petition access not found for petition_message.petition_access_id ${message.petition_access_id}`,
      );
    }
    const contact = access.contact_id ? await this.contacts.loadContact(access.contact_id) : null;
    if (!contact) {
      throw new Error(`Contact not found for petition_access.contact_id ${access.contact_id}`);
    }

    const orgId = petition.org_id;

    const { emailFrom, ...layoutProps } = await this.layouts.getLayoutProps(orgId);
    const bodyJson = message.email_body ? JSON.parse(message.email_body) : [];

    const hasRemoveWhyWeUseParallel = await this.featureFlags.orgHasFeatureFlag(
      orgId,
      "REMOVE_WHY_WE_USE_PARALLEL",
    );

    const contactIds = accesses
      .filter((a) => a.status === "ACTIVE")
      .map((a) => a.contact_id)
      .filter(isNonNullish)
      .filter((cId) => cId !== access.contact_id);

    const recipients = contactIds.length
      ? (await this.contacts.loadContact(contactIds)).filter(isNonNullish).map((r) => ({
          name: fullName(r.first_name, r.last_name),
          email: r.email,
        }))
      : null;

    const { html, text, subject, from } = await buildEmail(
      PetitionMessage,
      {
        senderName: fullName(senderData.first_name, senderData.last_name)!,
        senderEmail: senderData.email,
        subject: message.email_subject ?? null,
        bodyHtml: renderSlateToHtml(bodyJson),
        bodyPlainText: renderSlateToText(bodyJson),
        deadline: petition.deadline,
        keycode: access.keycode,
        recipients,
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
