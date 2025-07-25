import { isNonNullish, pick } from "remeda";
import { assert } from "ts-essentials";
import { WorkerContext } from "../../context";
import { buildEmail } from "../../emails/buildEmail";
import BackgroundCheckMonitoringChanges from "../../emails/emails/app/BackgroundCheckMonitoringChanges";
import { buildFrom } from "../../emails/utils/buildFrom";
import { BackgroundCheckContent } from "../../services/BackgroundCheckService";
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

  const profileFieldValues = await context.profiles.loadProfileFieldValueWithDraft(
    payload.profileFieldValues,
  );

  const userData = (await context.users.loadUserData(user.user_data_id))!;

  const { emailFrom, ...layoutProps } = await context.layouts.getLayoutProps(user.org_id);

  const { html, text, subject, from } = await buildEmail(
    BackgroundCheckMonitoringChanges,
    {
      userName: userData.first_name,
      properties: profileFieldValues
        .filter(({ value, draftValue }) => isNonNullish(value) || isNonNullish(draftValue))
        .map(({ value, draftValue }) => {
          const currentValue = draftValue ?? value;
          assert(isNonNullish(currentValue));

          const content = currentValue.content as BackgroundCheckContent;
          return {
            content: {
              query: pick(content.query, ["name", "date"]),
              entity: content.entity ? pick(content.entity, ["name", "type"]) : undefined,
            },
            profileId: toGlobalId("Profile", currentValue.profile_id),
            profileTypeFieldId: toGlobalId("ProfileTypeField", currentValue.profile_type_field_id),
          };
        }),
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
