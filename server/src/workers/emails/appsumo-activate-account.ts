import { WorkerContext } from "../../context";
import { buildEmail } from "../../emails/buildEmail";
import AppSumoActivateAccount from "../../emails/emails/AppSumoActivateAccount";
import { buildFrom } from "../../emails/utils/buildFrom";
import { defaultBrandTheme } from "../../util/BrandTheme";

export async function appSumoActivateAccount(
  payload: { redirectUrl: string; email: string },
  context: WorkerContext
) {
  const { html, text, subject, from } = await buildEmail(
    AppSumoActivateAccount,
    {
      redirectUrl: payload.redirectUrl,
      assetsUrl: context.config.misc.assetsUrl,
      parallelUrl: context.config.misc.parallelUrl,
      logoUrl: `${context.config.misc.assetsUrl}/static/emails/logo.png`,
      logoAlt: "Parallel",
      theme: defaultBrandTheme,
    },
    { locale: "en" }
  );

  return await context.emailLogs.createEmail({
    from: buildFrom(from, context.config.misc.emailFrom),
    to: payload.email,
    subject,
    text,
    html,
    created_from: `AppSumo:${payload.email}`,
  });
}
