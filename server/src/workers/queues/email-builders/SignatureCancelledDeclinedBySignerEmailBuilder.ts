import { inject, injectable } from "inversify";
import { EmailLogRepository } from "../../../db/repositories/EmailLogRepository";
import { IntegrationRepository } from "../../../db/repositories/IntegrationRepository";
import { PetitionRepository } from "../../../db/repositories/PetitionRepository";
import { UserRepository } from "../../../db/repositories/UserRepository";
import { buildEmail } from "../../../emails/buildEmail";
import SignatureCancelledDeclinedBySignerEmail from "../../../emails/emails/app/SignatureCancelledDeclinedBySignerEmail";
import { buildFrom } from "../../../emails/utils/buildFrom";
import {
  IOrganizationLayoutService,
  ORGANIZATION_LAYOUT_SERVICE,
} from "../../../services/OrganizationLayoutService";
import { fullName } from "../../../util/fullName";
import { toGlobalId } from "../../../util/globalId";
import { EmailBuilder } from "../EmailSenderQueue";

interface SignatureCancelledDeclinedBySignerEmailPayload {
  petition_signature_request_id: number;
}

@injectable()
export class SignatureCancelledDeclinedBySignerEmailBuilder
  implements EmailBuilder<SignatureCancelledDeclinedBySignerEmailPayload>
{
  constructor(
    @inject(ORGANIZATION_LAYOUT_SERVICE) private layouts: IOrganizationLayoutService,
    @inject(PetitionRepository) private petitions: PetitionRepository,
    @inject(UserRepository) private users: UserRepository,
    @inject(IntegrationRepository) private integrations: IntegrationRepository,
    @inject(EmailLogRepository) private emailLogs: EmailLogRepository,
  ) {}

  async build(payload: SignatureCancelledDeclinedBySignerEmailPayload) {
    const signatureRequest = await this.petitions.loadPetitionSignatureById(
      payload.petition_signature_request_id,
    );

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

    const canceller = signatureRequest.cancel_data.canceller;
    if (!canceller || !canceller.email || !canceller.firstName) {
      throw new Error(`Expected canceller info on PetitionSignatureRequest:${signatureRequest.id}`);
    }

    const signerEmail = canceller.email as string;
    const signerName = fullName(canceller.firstName, canceller.lastName);

    const emails = [];
    for (const user of users) {
      const userData = await this.users.loadUserData(user.user_data_id);
      if (!userData) {
        throw new Error(`UserData:${user.user_data_id} not found for User:${user.id}`);
      }
      const { emailFrom, ...layoutProps } = await this.layouts.getLayoutProps(petition.org_id);

      const { html, text, subject, from } = await buildEmail(
        SignatureCancelledDeclinedBySignerEmail,
        {
          petitionId: toGlobalId("Petition", petition.id),
          petitionName: petition.name,
          userName: userData.first_name,
          signatureProvider: signatureIntegration!.name,
          signerEmail,
          signerName,
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
