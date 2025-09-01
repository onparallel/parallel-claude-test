import { inject, injectable } from "inversify";
import { EmailLogRepository } from "../../../db/repositories/EmailLogRepository";
import { IntegrationRepository } from "../../../db/repositories/IntegrationRepository";
import { OrganizationRepository } from "../../../db/repositories/OrganizationRepository";
import { PetitionRepository } from "../../../db/repositories/PetitionRepository";
import { UserRepository } from "../../../db/repositories/UserRepository";
import { buildEmail } from "../../../emails/buildEmail";
import SignatureCancelledNoCreditsLeftEmail from "../../../emails/emails/app/SignatureCancelledNoCreditsLeftEmail";
import { buildFrom } from "../../../emails/utils/buildFrom";
import {
  IOrganizationLayoutService,
  ORGANIZATION_LAYOUT_SERVICE,
} from "../../../services/OrganizationLayoutService";
import { fullName } from "../../../util/fullName";
import { EmailBuilder } from "../EmailSenderQueue";

interface SignatureCancelledNoCreditsLeftEmailPayload {
  petition_signature_request_id: number;
}

@injectable()
export class SignatureCancelledNoCreditsLeftEmailBuilder
  implements EmailBuilder<SignatureCancelledNoCreditsLeftEmailPayload>
{
  constructor(
    @inject(ORGANIZATION_LAYOUT_SERVICE) private layouts: IOrganizationLayoutService,
    @inject(PetitionRepository) private petitions: PetitionRepository,
    @inject(OrganizationRepository) private organizations: OrganizationRepository,
    @inject(UserRepository) private users: UserRepository,
    @inject(IntegrationRepository) private integrations: IntegrationRepository,
    @inject(EmailLogRepository) private emailLogs: EmailLogRepository,
  ) {}

  async build(payload: SignatureCancelledNoCreditsLeftEmailPayload) {
    const [signatureRequest, parallelOrg] = await Promise.all([
      this.petitions.loadPetitionSignatureById(payload.petition_signature_request_id),
      this.organizations.loadRootOrganization(),
    ]);
    if (!signatureRequest) {
      return [];
    }

    const petition = await this.petitions.loadPetition(signatureRequest.petition_id);
    if (!petition) {
      return [];
    }

    const users = (await this.petitions.loadUsersOnPetition(petition.id)).filter(
      (u) => u.is_subscribed,
    );

    const signatureIntegration = await this.integrations.loadIntegration(
      signatureRequest.signature_config.orgIntegrationId,
    );

    const orgOwner = (await this.organizations.loadOrgOwner(petition.org_id))!;
    const orgOwnerData = await this.users.loadUserData(orgOwner.user_data_id);
    if (!orgOwnerData) {
      throw new Error(`UserData:${orgOwner.user_data_id} not found for User:${orgOwner.id}`);
    }

    const emails = [];
    for (const user of users) {
      const userData = await this.users.loadUserData(user.user_data_id);
      if (!userData) {
        throw new Error(`UserData:${user.user_data_id} not found for User:${user.id}`);
      }
      const { emailFrom, ...layoutProps } = await this.layouts.getLayoutProps(parallelOrg.id);

      const { html, text, subject, from } = await buildEmail(
        SignatureCancelledNoCreditsLeftEmail,
        {
          orgContactEmail: orgOwnerData.email,
          orgContactName: fullName(orgOwnerData.first_name, orgOwnerData.last_name),
          senderName: userData.first_name!,
          petitionName: petition.name,
          signatureProvider: signatureIntegration!.name,
          ...layoutProps,
        },
        { locale: userData.preferred_locale },
      );

      emails.push(
        await this.emailLogs.createEmail({
          from: buildFrom(from, emailFrom),
          to: userData.email,
          subject,
          text,
          html,
          created_from: `Petition:${petition.id}`,
        }),
      );
    }

    return emails;
  }
}
