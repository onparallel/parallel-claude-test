import { WorkerContext } from "../../context";
import { buildEmail } from "../../emails/buildEmail";
import Invitation from "../../emails/emails/Invitation";
import { buildFrom } from "../../emails/utils/buildFrom";
import { defaultBrandTheme } from "../../util/BrandTheme";

export async function invitation(
  payload: {
    user_cognito_id: string;
    org_name: string;
    org_user: string;
    locale: string;
    is_new_user: boolean;
  },
  context: WorkerContext
) {
  const [user] = await context.users.loadUsersByCognitoId(payload.user_cognito_id);
  if (!user) {
    throw new Error(`User with cognito_id ${payload.user_cognito_id} not found`);
  }
  const userData = (await context.users.loadUserDataByUserId(user.id))!;

  const { html, text, subject, from } = await buildEmail(
    Invitation,
    {
      userName: userData.first_name!,
      organizationName: payload.org_name,
      organizationUser: payload.org_user,
      isNewUser: payload.is_new_user,
      logoAlt: "Parallel",
      assetsUrl: context.config.misc.assetsUrl,
      logoUrl: `${context.config.misc.assetsUrl}/static/emails/logo.png`,
      parallelUrl: context.config.misc.parallelUrl,
      theme: defaultBrandTheme,
    },
    { locale: payload.locale }
  );
  return await context.emailLogs.createEmail({
    from: buildFrom(from, context.config.misc.emailFrom),
    to: userData.email,
    subject,
    text,
    html,
    created_from: `UserInvite:${payload.user_cognito_id}`,
  });
}
