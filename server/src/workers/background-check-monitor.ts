import { isDefined, pick } from "remeda";
import { ProfileFieldValue } from "../db/__types";
import { createCronWorker } from "./helpers/createCronWorker";
import {
  isNotifiableEntityDifference,
  isNotifiableSearchDifference,
  requiresRefresh,
} from "./helpers/monitoringUtils";

createCronWorker("background-check-monitor", async (ctx) => {
  const now = new Date();
  const organizations = await ctx.organizations.getOrganizationsWithFeatureFlag("BACKGROUND_CHECK");

  for (const org of organizations) {
    const valuesForRefresh =
      await ctx.profiles.getBackgroundCheckProfileFieldValuesForRefreshByOrgId(
        org.id,
        requiresRefresh(now),
      );

    const profileFieldValuesForNotification: Pick<
      ProfileFieldValue,
      "profile_id" | "profile_type_field_id"
    >[] = [];

    for (const value of valuesForRefresh) {
      if (isDefined(value.content.entity)) {
        ctx.logger.info(
          `[Organization:${org.id}][Profile:${value.profile_id}][ProfileFieldValue:${value.id}] Updating entity details`,
        );
        const newDetails = await ctx.backgroundCheck.entityProfileDetails(value.content.entity.id);
        const {
          currentValues: [currentValue],
          previousValues: [previousValue],
        } = await ctx.profiles.updateProfileFieldValue(
          value.profile_id,
          [
            {
              profileTypeFieldId: value.profile_type_field_id,
              type: "BACKGROUND_CHECK",
              content: {
                ...value.content,
                entity: newDetails,
              },
            },
          ],
          null,
        );

        const profile = (await ctx.profiles.loadProfile(value.profile_id))!;
        const profileTypeField = await ctx.profiles.loadProfileTypeField(
          value.profile_type_field_id,
        );
        await ctx.profiles.createProfileUpdatedEvents(
          value.profile_id,
          [
            {
              org_id: profile.org_id,
              profile_id: profile.id,
              type: "PROFILE_FIELD_VALUE_UPDATED",
              data: {
                user_id: null,
                current_profile_field_value_id: currentValue?.id ?? null,
                previous_profile_field_value_id: previousValue?.id ?? null,
                profile_type_field_id: value.profile_type_field_id,
                alias: profileTypeField?.alias ?? null,
              },
            },
          ],
          null,
        );

        if (isNotifiableEntityDifference(value.content.entity, newDetails)) {
          ctx.logger.info(
            `[Organization:${org.id}][Profile:${value.profile_id}][ProfileFieldValue:${value.id}] Entity details have changed`,
          );
          profileFieldValuesForNotification.push(
            pick(value, ["profile_id", "profile_type_field_id"]),
          );
        } else {
          ctx.logger.info(
            `[Organization:${org.id}][Profile:${value.profile_id}][ProfileFieldValue:${value.id}] Entity details have not changed`,
          );
        }
      } else if (isDefined(value.content.query) && isDefined(value.content.search)) {
        ctx.logger.info(
          `[Organization:${org.id}][Profile:${value.profile_id}][ProfileFieldValue:${value.id}] Updating search results`,
        );
        const newSearch = await ctx.backgroundCheck.entitySearch(value.content.query);

        const {
          currentValues: [currentValue],
          previousValues: [previousValue],
        } = await ctx.profiles.updateProfileFieldValue(
          value.profile_id,
          [
            {
              profileTypeFieldId: value.profile_type_field_id,
              type: "BACKGROUND_CHECK",
              content: {
                ...value.content,
                search: newSearch,
              },
            },
          ],
          null,
        );

        const profile = (await ctx.profiles.loadProfile(value.profile_id))!;
        const profileTypeField = await ctx.profiles.loadProfileTypeField(
          value.profile_type_field_id,
        );
        await ctx.profiles.createProfileUpdatedEvents(
          value.profile_id,
          [
            {
              org_id: profile.org_id,
              profile_id: profile.id,
              type: "PROFILE_FIELD_VALUE_UPDATED",
              data: {
                user_id: null,
                current_profile_field_value_id: currentValue?.id ?? null,
                previous_profile_field_value_id: previousValue?.id ?? null,
                profile_type_field_id: value.profile_type_field_id,
                alias: profileTypeField?.alias ?? null,
              },
            },
          ],
          null,
        );

        if (isNotifiableSearchDifference(value.content.search, newSearch)) {
          ctx.logger.info(
            `[Organization:${org.id}][Profile:${value.profile_id}][ProfileFieldValue:${value.id}] Search results have changed`,
          );
          profileFieldValuesForNotification.push(
            pick(value, ["profile_id", "profile_type_field_id"]),
          );
        } else {
          ctx.logger.info(
            `[Organization:${org.id}][Profile:${value.profile_id}][ProfileFieldValue:${value.id}] Search results have not changed`,
          );
        }
      }
    }

    const profileFieldValuesByUserId = await ctx.profiles.getSubscribedUsersWithReadPermissions(
      profileFieldValuesForNotification,
    );

    for (const [userId, profileFieldValues] of Object.entries(profileFieldValuesByUserId)) {
      if (profileFieldValues.length > 0) {
        ctx.logger.info(
          `[Organization:${org.id}] Sending email to User:${userId} with ${profileFieldValues.length} changes...`,
        );

        await ctx.emails.sendBackgroundCheckMonitoringChangesEmail(
          parseInt(userId),
          profileFieldValues,
        );
      }
    }
  }
});
