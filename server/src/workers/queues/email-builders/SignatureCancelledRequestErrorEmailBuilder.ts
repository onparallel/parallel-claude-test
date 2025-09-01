import { inject, injectable } from "inversify";
import { isNonNullish } from "remeda";
import { EmailLogRepository } from "../../../db/repositories/EmailLogRepository";
import { PetitionRepository } from "../../../db/repositories/PetitionRepository";
import { UserRepository } from "../../../db/repositories/UserRepository";
import { buildEmail } from "../../../emails/buildEmail";
import SignatureCancelledRequestErrorEmail from "../../../emails/emails/app/SignatureCancelledRequestErrorEmail";
import { buildFrom } from "../../../emails/utils/buildFrom";
import {
  IOrganizationLayoutService,
  ORGANIZATION_LAYOUT_SERVICE,
} from "../../../services/OrganizationLayoutService";
import { fullName } from "../../../util/fullName";
import { toGlobalId } from "../../../util/globalId";
import { EmailBuilder } from "../EmailSenderQueue";

interface SignatureCancelledRequestErrorEmailPayload {
  petition_signature_request_id: number;
}

@injectable()
export class SignatureCancelledRequestErrorEmailBuilder
  implements EmailBuilder<SignatureCancelledRequestErrorEmailPayload>
{
  constructor(
    @inject(ORGANIZATION_LAYOUT_SERVICE) private layouts: IOrganizationLayoutService,
    @inject(PetitionRepository) private petitions: PetitionRepository,
    @inject(UserRepository) private users: UserRepository,
    @inject(EmailLogRepository) private emailLogs: EmailLogRepository,
  ) {}

  async build(payload: SignatureCancelledRequestErrorEmailPayload) {
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

    const emails = [];
    for (const user of users) {
      const userData = await this.users.loadUserData(user.user_data_id);
      if (!userData) {
        throw new Error(`UserData:${user.user_data_id} not found for User:${user.id}`);
      }
      const { emailFrom, ...layoutProps } = await this.layouts.getLayoutProps(petition.org_id);

      const { html, text, subject, from } = await buildEmail(
        SignatureCancelledRequestErrorEmail,
        {
          petitionId: toGlobalId("Petition", petition.id),
          petitionName: petition.name,
          userName: userData.first_name,
          signers: signatureRequest.signature_config.signersInfo
            .filter((s) => isNonNullish(s.email)) // do not include signers with embedded signature image, as those people did not receive the request
            .map((s) => ({
              email: s.email!,
              name: fullName(s.firstName, s.lastName),
            })),
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
