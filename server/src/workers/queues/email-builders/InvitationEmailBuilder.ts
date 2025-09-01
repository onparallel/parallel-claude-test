import { inject, injectable } from "inversify";
import { Config, CONFIG } from "../../../config";
import { UserLocale } from "../../../db/__types";
import { EmailLogRepository } from "../../../db/repositories/EmailLogRepository";
import { UserRepository } from "../../../db/repositories/UserRepository";
import { buildEmail } from "../../../emails/buildEmail";
import Invitation from "../../../emails/emails/app/Invitation";
import { buildFrom } from "../../../emails/utils/buildFrom";
import { defaultBrandTheme } from "../../../util/BrandTheme";
import { EmailBuilder } from "../EmailSenderQueue";

interface InvitationEmailPayload {
  user_cognito_id: string;
  org_name: string;
  org_user: string;
  locale: UserLocale;
  is_new_user: boolean;
}

@injectable()
export class InvitationEmailBuilder implements EmailBuilder<InvitationEmailPayload> {
  constructor(
    @inject(CONFIG) private config: Config,
    @inject(UserRepository) private users: UserRepository,
    @inject(EmailLogRepository) private emailLogs: EmailLogRepository,
  ) {}

  async build(payload: InvitationEmailPayload) {
    const [user] = await this.users.loadUsersByCognitoId(payload.user_cognito_id);
    if (!user) {
      throw new Error(`User with cognito_id ${payload.user_cognito_id} not found`);
    }
    const userData = (await this.users.loadUserDataByUserId(user.id))!;

    const { html, text, subject, from } = await buildEmail(
      Invitation,
      {
        userName: userData.first_name!,
        organizationName: payload.org_name,
        organizationUser: payload.org_user,
        isNewUser: payload.is_new_user,
        logoAlt: "Parallel",
        assetsUrl: this.config.misc.assetsUrl,
        logoUrl: `${this.config.misc.assetsUrl}/static/emails/logo.png`,
        parallelUrl: this.config.misc.parallelUrl,
        theme: defaultBrandTheme,
      },
      { locale: payload.locale },
    );
    const email = await this.emailLogs.createEmail({
      from: buildFrom(from, this.config.misc.emailFrom),
      to: userData.email,
      subject,
      text,
      html,
      created_from: `UserInvite:${payload.user_cognito_id}`,
    });

    return [email];
  }
}
