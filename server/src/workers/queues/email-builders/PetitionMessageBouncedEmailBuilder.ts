import { inject, injectable } from "inversify";
import { ContactRepository } from "../../../db/repositories/ContactRepository";
import { EmailLogRepository } from "../../../db/repositories/EmailLogRepository";
import { PetitionRepository } from "../../../db/repositories/PetitionRepository";
import { UserRepository } from "../../../db/repositories/UserRepository";
import { buildEmail } from "../../../emails/buildEmail";
import MessageBouncedEmail from "../../../emails/emails/app/MessageBouncedEmail";
import { buildFrom } from "../../../emails/utils/buildFrom";
import {
  IOrganizationLayoutService,
  ORGANIZATION_LAYOUT_SERVICE,
} from "../../../services/OrganizationLayoutService";
import { fullName } from "../../../util/fullName";
import { toGlobalId } from "../../../util/globalId";
import { renderSlateToHtml, renderSlateToText } from "../../../util/slate/render";
import { EmailBuilder } from "../EmailSenderQueue";

interface PetitionMessageBouncedEmailPayload {
  petition_message_id: number;
}

@injectable()
export class PetitionMessageBouncedEmailBuilder
  implements EmailBuilder<PetitionMessageBouncedEmailPayload>
{
  constructor(
    @inject(ORGANIZATION_LAYOUT_SERVICE) private layouts: IOrganizationLayoutService,
    @inject(PetitionRepository) private petitions: PetitionRepository,
    @inject(UserRepository) private users: UserRepository,
    @inject(ContactRepository) private contacts: ContactRepository,
    @inject(EmailLogRepository) private emailLogs: EmailLogRepository,
  ) {}

  async build(payload: PetitionMessageBouncedEmailPayload) {
    const message = await this.petitions.loadMessage(payload.petition_message_id);
    if (!message) {
      throw new Error(`PetitionMessage:${payload.petition_message_id} not found.`);
    }
    const [petition, senderData, access] = await Promise.all([
      this.petitions.loadPetition(message.petition_id),
      this.users.loadUserDataByUserId(message.sender_id),
      this.petitions.loadAccess(message.petition_access_id),
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

    const { emailFrom, ...layoutProps } = await this.layouts.getLayoutProps(petition.org_id);

    const bodyJson = message.email_body ? JSON.parse(message.email_body) : [];
    const { html, text, subject, from } = await buildEmail(
      MessageBouncedEmail,
      {
        contactFullName: fullName(contact.first_name, contact.last_name)!,
        senderName: fullName(senderData.first_name, senderData.last_name)!,
        petitionId: toGlobalId("Petition", petition.id),
        petitionName: petition.name,
        bodyHtml: renderSlateToHtml(bodyJson),
        bodyPlainText: renderSlateToText(bodyJson),
        contactEmail: contact.email,
        ...layoutProps,
      },
      { locale: senderData.preferred_locale },
    );

    const email = await this.emailLogs.createEmail({
      from: buildFrom(from, emailFrom),
      to: senderData.email,
      subject,
      text,
      html,
      created_from: `EmailLog:${message.email_log_id}`,
    });

    return [email];
  }
}
