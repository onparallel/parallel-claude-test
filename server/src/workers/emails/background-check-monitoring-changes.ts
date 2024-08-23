import { isNonNullish, pick } from "remeda";
import { WorkerContext } from "../../context";
import { buildEmail } from "../../emails/buildEmail";
import BackgroundCheckMonitoringChanges from "../../emails/emails/app/BackgroundCheckMonitoringChanges";
import { buildFrom } from "../../emails/utils/buildFrom";
import { toGlobalId } from "../../util/globalId";

export async function backgroundCheckMonitoringChanges(
  payload: {
    userId: number;
    profileFieldValues: { profileId: number; profileTypeFieldId: number }[];
  },
  context: WorkerContext,
) {
  const user = await context.users.loadUser(payload.userId);
  if (!user) {
    throw new Error(`User:${payload.userId} not found`);
  }
  if (user.status !== "ACTIVE") {
    // inactive users can still be subscribed to profiles
    return;
  }

  const profileFieldValues = (
    await context.profiles.loadProfileFieldValue(payload.profileFieldValues)
  ).filter(isNonNullish);

  const userData = (await context.users.loadUserData(user.user_data_id))!;

  const { emailFrom, ...layoutProps } = await context.layouts.getLayoutProps(user.org_id);

  const { html, text, subject, from } = await buildEmail(
    BackgroundCheckMonitoringChanges,
    {
      userName: userData.first_name,
      properties: profileFieldValues.map((pfv) => ({
        content: {
          query: pfv.content.query ? pick(pfv.content.query, ["name", "date"]) : undefined,
          entity: pfv.content.entity ? pick(pfv.content.entity, ["name", "type"]) : undefined,
        },
        profileId: toGlobalId("Profile", pfv.profile_id),
        profileTypeFieldId: toGlobalId("ProfileTypeField", pfv.profile_type_field_id),
      })),
      ...layoutProps,
      logoUrl: `${layoutProps.assetsUrl}/static/emails/logo-bg-check.png`,
      logoAlt: "Parallel - Background Check",
    },
    { locale: userData.preferred_locale },
  );

  return await context.emailLogs.createEmail({
    from: buildFrom(from, emailFrom),
    to: userData.email,
    subject,
    text,
    html,
    created_from: `BackgroundCheckMonitoringChanges:${user.id}`,
  });
}
