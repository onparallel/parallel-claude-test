import { inject, injectable } from "inversify";
import { Config, CONFIG } from "../../../config";
import { EmailLogRepository } from "../../../db/repositories/EmailLogRepository";
import { buildEmail } from "../../../emails/buildEmail";
import AppSumoActivateAccount from "../../../emails/emails/app/AppSumoActivateAccount";
import { buildFrom } from "../../../emails/utils/buildFrom";
import { defaultBrandTheme } from "../../../util/BrandTheme";
import { EmailBuilder } from "../EmailSenderQueue";

interface AppsumoActivateAccountEmailPayload {
  redirectUrl: string;
  email: string;
}

@injectable()
export class AppsumoActivateAccountEmailBuilder
  implements EmailBuilder<AppsumoActivateAccountEmailPayload>
{
  constructor(
    @inject(CONFIG) private config: Config,
    @inject(EmailLogRepository) private emailLogs: EmailLogRepository,
  ) {}

  async build(payload: AppsumoActivateAccountEmailPayload) {
    const { html, text, subject, from } = await buildEmail(
      AppSumoActivateAccount,
      {
        redirectUrl: payload.redirectUrl,
        assetsUrl: this.config.misc.assetsUrl,
        parallelUrl: this.config.misc.parallelUrl,
        logoUrl: `${this.config.misc.assetsUrl}/static/emails/logo.png`,
        logoAlt: "Parallel",
        theme: defaultBrandTheme,
      },
      { locale: "en" },
    );

    const email = await this.emailLogs.createEmail({
      from: buildFrom(from, this.config.misc.emailFrom),
      to: payload.email,
      subject,
      text,
      html,
      created_from: `AppSumo:${payload.email}`,
    });

    return [email];
  }
}
