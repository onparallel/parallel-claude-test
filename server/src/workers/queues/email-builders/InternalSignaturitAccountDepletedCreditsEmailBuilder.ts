import { inject, injectable } from "inversify";
import { Config, CONFIG } from "../../../config";
import { EmailLog } from "../../../db/__types";
import { EmailLogRepository } from "../../../db/repositories/EmailLogRepository";
import { OrganizationRepository } from "../../../db/repositories/OrganizationRepository";
import { PetitionRepository } from "../../../db/repositories/PetitionRepository";
import { UserRepository } from "../../../db/repositories/UserRepository";
import { buildEmail } from "../../../emails/buildEmail";
import InternalSignaturitAccountDepletedCredits from "../../../emails/emails/app/InternalSignaturitAccountDepletedCredits";
import { buildFrom } from "../../../emails/utils/buildFrom";
import { defaultBrandTheme } from "../../../util/BrandTheme";
import { toGlobalId } from "../../../util/globalId";
import { EmailBuilder } from "../EmailSenderQueue";

interface InternalSignaturitAccountDepletedCreditsEmailPayload {
  orgId: number;
  apiKeyHint: string;
  petitionId: number;
}

@injectable()
export class InternalSignaturitAccountDepletedCreditsEmailBuilder
  implements EmailBuilder<InternalSignaturitAccountDepletedCreditsEmailPayload>
{
  constructor(
    @inject(CONFIG) private config: Config,
    @inject(OrganizationRepository) private organizations: OrganizationRepository,
    @inject(PetitionRepository) private petitions: PetitionRepository,
    @inject(UserRepository) private users: UserRepository,
    @inject(EmailLogRepository) private emailLogs: EmailLogRepository,
  ) {}

  async build(payload: InternalSignaturitAccountDepletedCreditsEmailPayload) {
    const org = await this.organizations.loadOrg(payload.orgId);
    const user = await this.petitions.loadPetitionOwner(payload.petitionId);
    const userData = await this.users.loadUserData(user!.user_data_id);

    const { html, text, subject, from } = await buildEmail(
      InternalSignaturitAccountDepletedCredits,
      {
        assetsUrl: this.config.misc.assetsUrl,
        parallelUrl: this.config.misc.parallelUrl,
        logoUrl: `${this.config.misc.assetsUrl}/static/emails/logo.png`,
        logoAlt: "Parallel",
        apiKeyHint: payload.apiKeyHint,
        organizationName: org!.name,
        petitionGID: toGlobalId("Petition", payload.petitionId),
        userEmail: userData!.email,
        theme: defaultBrandTheme,
      },
      { locale: "es" },
    );

    const emails: EmailLog[] = [];
    for (const to of ["alex@onparallel.com", "derek@onparallel.com", "support@onparallel.com"]) {
      const email = await this.emailLogs.createEmail({
        from: buildFrom(from, this.config.misc.emailFrom),
        to,
        subject,
        text,
        html,
        created_from: `Petition:${payload.petitionId}`,
      });

      emails.push(email);
    }

    return emails;
  }
}
