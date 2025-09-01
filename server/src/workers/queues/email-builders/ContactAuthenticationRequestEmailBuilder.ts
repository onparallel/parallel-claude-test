import { inject, injectable } from "inversify";
import { UAParser } from "ua-parser-js";
import { ContactRepository } from "../../../db/repositories/ContactRepository";
import { EmailLogRepository } from "../../../db/repositories/EmailLogRepository";
import { PetitionRepository } from "../../../db/repositories/PetitionRepository";
import { buildEmail } from "../../../emails/buildEmail";
import ContactAuthenticationRequest from "../../../emails/emails/recipient/ContactAuthenticationRequest";
import { buildFrom } from "../../../emails/utils/buildFrom";
import {
  IOrganizationLayoutService,
  ORGANIZATION_LAYOUT_SERVICE,
} from "../../../services/OrganizationLayoutService";
import { fullName } from "../../../util/fullName";
import { EmailBuilder } from "../EmailSenderQueue";

interface ContactAuthenticationRequestEmailPayload {
  contact_authentication_request_id: number;
  is_contact_verification: boolean;
}

@injectable()
export class ContactAuthenticationRequestEmailBuilder
  implements EmailBuilder<ContactAuthenticationRequestEmailPayload>
{
  constructor(
    @inject(ORGANIZATION_LAYOUT_SERVICE) private layouts: IOrganizationLayoutService,
    @inject(ContactRepository) private contacts: ContactRepository,
    @inject(PetitionRepository) private petitions: PetitionRepository,
    @inject(EmailLogRepository) private emailLogs: EmailLogRepository,
  ) {}

  async build(payload: ContactAuthenticationRequestEmailPayload) {
    const request = await this.contacts.loadContactAuthenticationRequest(
      payload.contact_authentication_request_id,
    );

    if (!request) {
      throw new Error(
        `Contact authentication request not found for id ${payload.contact_authentication_request_id}`,
      );
    }
    const access = await this.petitions.loadAccess(request.petition_access_id);
    if (!access) {
      throw new Error(
        `Petition access not found for contact_authentication_request.petition_access_id ${request.petition_access_id}`,
      );
    }
    const [contact, petition] = await Promise.all([
      access.contact_id ? this.contacts.loadContact(access.contact_id) : null,
      this.petitions.loadPetition(access.petition_id),
    ]);

    if (!petition) {
      throw new Error(`Petition not found for petition_access.petition_id ${access.petition_id}`);
    }
    const ua = request.user_agent ? new UAParser(request.user_agent) : null;

    const { emailFrom, ...layoutProps } = await this.layouts.getLayoutProps(petition.org_id);

    const { html, text, subject, from } = await buildEmail(
      ContactAuthenticationRequest,
      {
        name: contact ? contact.first_name : request.contact_first_name!,
        fullName: contact
          ? fullName(contact.first_name, contact.last_name)
          : fullName(request.contact_first_name, request.contact_last_name),
        code: request.code,
        browserName: ua?.getBrowser()?.name ?? "Unknown",
        osName: ua?.getOS()?.name ?? "Unknown",
        isContactVerification: payload.is_contact_verification,
        ...layoutProps,
      },
      { locale: petition.recipient_locale },
    );
    const email = await this.emailLogs.createEmail({
      from: buildFrom(from, emailFrom),
      to: contact ? contact.email : request.contact_email!,
      subject,
      text,
      html,
      created_from: `ContactAuthenticationRequest:${payload.contact_authentication_request_id}`,
    });

    await this.contacts.processContactAuthenticationRequest(
      payload.contact_authentication_request_id,
      email.id,
    );

    return [email];
  }
}
