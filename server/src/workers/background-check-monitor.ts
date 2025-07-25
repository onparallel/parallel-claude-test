import { isNonNullish } from "remeda";
import { assert } from "ts-essentials";
import { WorkerContext } from "../context";
import { ProfileFieldValue } from "../db/__types";
import { BackgroundCheckContent } from "../services/BackgroundCheckService";
import { createCronWorker } from "./helpers/createCronWorker";
import { isRelevantEntityDifference, requiresRefresh } from "./helpers/monitoringUtils";

createCronWorker("background-check-monitor", async (ctx) => {
  const now = new Date();
  const organizations = await ctx.organizations.getOrganizationsWithFeatureFlag([
    "PROFILES",
    "BACKGROUND_CHECK",
  ]);

  for (const org of organizations) {
    const valuesForRefresh = await ctx.profiles.getProfileFieldValuesForRefreshByOrgId(
      org.id,
      "BACKGROUND_CHECK",
      requiresRefresh(now),
    );

    const profileFieldValuesForNotification: ProfileFieldValue[] = [];

    for (const value of valuesForRefresh) {
      const content = value.content as BackgroundCheckContent;
      if (isNonNullish(content.entity)) {
        // we are monitoring an entity details
        const pendingReview = await refreshEntityDetails(
          value.profile_id,
          value.profile_type_field_id,
          content,
          org.id,
          ctx,
        );

        if (pendingReview) {
          profileFieldValuesForNotification.push(value);
        }
      } else if (isNonNullish(content.query) && isNonNullish(content.search)) {
        // we are monitoring a search
        const pendingReview = await refreshSearch(
          value.profile_id,
          value.profile_type_field_id,
          content,
          org.id,
          ctx,
        );

        if (pendingReview) {
          profileFieldValuesForNotification.push(value);
        }
      }
    }

    const profileFieldValuesByUserId = await ctx.profiles.getSubscribedUsersWithReadPermissions(
      profileFieldValuesForNotification,
    );

    for (const [userId, profileFieldValues] of Object.entries(profileFieldValuesByUserId)) {
      if (profileFieldValues.length > 0) {
        await ctx.emails.sendBackgroundCheckMonitoringChangesEmail(
          parseInt(userId),
          profileFieldValues,
        );
      }
    }
  }
});

/**
 * @returns `true` if some relevant property has been updated on the value.
 */
async function refreshEntityDetails(
  profileId: number,
  profileTypeFieldId: number,
  content: BackgroundCheckContent,
  orgId: number,
  ctx: WorkerContext,
) {
  assert(isNonNullish(content.entity), "Entity is required");

  try {
    const newDetails = await ctx.backgroundCheck.entityProfileDetails(content.entity.id);

    const newContent = {
      ...content,
      entity: newDetails,
    } as BackgroundCheckContent;

    if (
      ctx.petitionsHelper.contentsAreEqual(
        { type: "BACKGROUND_CHECK", content },
        { type: "BACKGROUND_CHECK", content: newContent },
      )
    ) {
      // no changes, no need to update the value
      // create an event to keep track that the monitor has run and there are no changes
      await ctx.profiles.createEvent({
        type: "PROFILE_FIELD_VALUE_MONITORED",
        data: {
          profile_type_field_id: profileTypeFieldId,
        },
        profile_id: profileId,
        org_id: orgId,
      });
      return false;
    }

    const isRelevantDifference = isRelevantEntityDifference(content.entity, newDetails);
    if (!isRelevantDifference) {
      // if difference is not important, we will leave the value as it is
      await ctx.profiles.createEvent({
        type: "PROFILE_FIELD_VALUE_MONITORED",
        data: {
          profile_type_field_id: profileTypeFieldId,
        },
        profile_id: profileId,
        org_id: orgId,
      });
      return false;
    }

    await ctx.profiles.updateProfileFieldValues(
      [
        {
          profileId,
          profileTypeFieldId,
          type: "BACKGROUND_CHECK",
          content: newContent,
          pendingReview: true,
        },
      ],
      null,
      orgId,
    );

    return true;
  } catch (error) {
    // if entity is missing, remove it from the value so it returns to the search.
    if (error instanceof Error && error.message === "PROFILE_NOT_FOUND") {
      const newSearchItems = content.search.items.filter((i) => i.id !== content.entity!.id);
      const newContent = {
        ...content,
        search: {
          createdAt: content.search.createdAt,
          totalCount: newSearchItems.length,
          items: newSearchItems,
        },
        entity: null,
        falsePositives: content.falsePositives?.filter((fp) => fp.id !== content.entity!.id),
      } as BackgroundCheckContent;

      // no need to check if contents are equal: we are updating from a match to a search
      await ctx.profiles.updateProfileFieldValues(
        [
          {
            profileId,
            profileTypeFieldId,
            type: "BACKGROUND_CHECK",
            content: newContent,
          },
        ],
        null,
        orgId,
      );

      return false;
    } else {
      throw error;
    }
  }
}

/**
 * @returns `true` if some relevant property has been updated on the value.
 */
async function refreshSearch(
  profileId: number,
  profileTypeFieldId: number,
  content: BackgroundCheckContent,
  orgId: number,
  ctx: WorkerContext,
) {
  const newSearch = await ctx.backgroundCheck.entitySearch(content.query);

  const newContent = {
    ...content,
    search: newSearch,
    // make sure to keep false positives that are still present in the new search and remove the ones that are not
    falsePositives: content.falsePositives?.filter((fp) =>
      newSearch.items.some((item) => item.id === fp.id),
    ),
  } as BackgroundCheckContent;

  const contentsAreEqual = ctx.petitionsHelper.contentsAreEqual(
    { type: "BACKGROUND_CHECK", content },
    { type: "BACKGROUND_CHECK", content: newContent },
  );

  if (contentsAreEqual) {
    await ctx.profiles.createEvent({
      type: "PROFILE_FIELD_VALUE_MONITORED",
      data: {
        profile_type_field_id: profileTypeFieldId,
      },
      profile_id: profileId,
      org_id: orgId,
    });
  } else {
    // any difference in search means search items have changed, so we need to mark it for review
    await ctx.profiles.updateProfileFieldValues(
      [
        {
          profileId,
          profileTypeFieldId,
          type: "BACKGROUND_CHECK",
          content: newContent,
          pendingReview: true,
        },
      ],
      null,
      orgId,
    );
  }

  return contentsAreEqual ? false : true;
}
