import { WorkerContext } from "../../context";
import { buildEmail } from "../../emails/buildEmail";
import ProfilesExpiringPropertiesEmail from "../../emails/emails/ProfilesExpiringPropertiesEmail";
import { buildFrom } from "../../emails/utils/buildFrom";
import { LocalizableUserText } from "../../graphql";

export interface ExpiringProperty {
  profileId: string;
  profileName: string;
  profileTypeFieldId: string;
  profileTypeFieldName: LocalizableUserText;
  expiryDate: string;
  isExpired: boolean;
}

export async function profilesExpiringProperties(
  payload: {
    userId: number;
    organizationName: string;
    properties: {
      items: ExpiringProperty[];
      totalCount: number;
    };
  },
  context: WorkerContext
) {
  const user = await context.users.loadUser(payload.userId);
  if (!user || user.status !== "ACTIVE") {
    throw new Error(`User:${payload.userId} not found or not active`);
  }
  const userData = (await context.users.loadUserData(user.user_data_id))!;

  const { emailFrom, ...layoutProps } = await context.layouts.getLayoutProps(user.org_id);

  const { html, text, subject, from } = await buildEmail(
    ProfilesExpiringPropertiesEmail,
    {
      organizationName: payload.organizationName,
      properties: payload.properties,
      ...layoutProps,
    },
    { locale: userData.preferred_locale }
  );

  return await context.emailLogs.createEmail({
    from: buildFrom(from, emailFrom),
    to: userData.email,
    subject,
    text,
    html,
    created_from: `ProfilesExpiringProperties:${user.id}`,
  });
}
