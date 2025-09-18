import { isNonNullish } from "remeda";
import { assert } from "ts-essentials";
import { WorkerContext } from "../context";
import { ProfileFieldValue } from "../db/__types";
import { BackgroundCheckContent } from "../services/BackgroundCheckService";
import { createCronWorker } from "./helpers/createCronWorker";
import { requiresRefresh } from "./helpers/monitoringUtils";

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
      if (isNonNullish(value.content.entity)) {
        // we are monitoring an entity details
        const pendingReview = await refreshEntityDetails(value, org.id, ctx);
        if (pendingReview) {
          profileFieldValuesForNotification.push(value);
        }
      } else {
        // we are monitoring a search
        const pendingReview = await refreshSearch(value, org.id, ctx);

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
async function refreshEntityDetails(value: ProfileFieldValue, orgId: number, ctx: WorkerContext) {
  const content = value.content as BackgroundCheckContent;
  assert(isNonNullish(content.entity), "Entity is required");

  try {
    const newDetails = await ctx.backgroundCheck.entityProfileDetails(content.entity.id);

    const newContent = {
      ...content,
      entity: newDetails,
    } as BackgroundCheckContent;

    const contentsAreEqual = ctx.petitionsHelper.contentsAreEqual(
      { type: "BACKGROUND_CHECK", content },
      { type: "BACKGROUND_CHECK", content: newContent },
    );
    const differences = ctx.backgroundCheck.extractRelevantDifferences(content, newContent);

    if (contentsAreEqual || !differences.entity) {
      // no changes or no relevant differences since last execution, no need to update the value
      // create an event to keep track that the monitor has run and there are no changes
      await ctx.profiles.createEvent({
        type: "PROFILE_FIELD_VALUE_MONITORED",
        data: {
          profile_type_field_id: value.profile_type_field_id,
        },
        profile_id: value.profile_id,
        org_id: orgId,
      });

      return false;
    }

    await ctx.profiles.updateProfileFieldValues(
      [
        {
          profileId: value.profile_id,
          profileTypeFieldId: value.profile_type_field_id,
          type: "BACKGROUND_CHECK",
          content: newContent,
          pendingReview: true,
          // a value could have multiple changes before it is marked as reviewed, so we need to keep them all to correctly show every difference since last reviewed version.
          reviewReason: [...(value.review_reason ?? []), { reviewedAt: new Date(), differences }],
        },
      ],
      null,
      orgId,
      "PARALLEL_MONITORING",
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
            profileId: value.profile_id,
            profileTypeFieldId: value.profile_type_field_id,
            type: "BACKGROUND_CHECK",
            content: newContent,
          },
        ],
        null,
        orgId,
        "PARALLEL_MONITORING",
      );

      return false;
    }

    throw error;
  }
}

/**
 * @returns `true` if some relevant property has been updated on the value.
 */

async function refreshSearch(value: ProfileFieldValue, orgId: number, ctx: WorkerContext) {
  const content = value.content as BackgroundCheckContent;
  const newSearch = await ctx.backgroundCheck.entitySearch(content.query, orgId);
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

  const differences = ctx.backgroundCheck.extractRelevantDifferences(content, newContent);

  if (contentsAreEqual || !differences.search) {
    await ctx.profiles.createEvent({
      type: "PROFILE_FIELD_VALUE_MONITORED",
      data: {
        profile_type_field_id: value.profile_type_field_id,
      },
      profile_id: value.profile_id,
      org_id: orgId,
    });

    return false;
  }

  // any difference in search means search items have changed, so we need to mark it for review
  await ctx.profiles.updateProfileFieldValues(
    [
      {
        profileId: value.profile_id,
        profileTypeFieldId: value.profile_type_field_id,
        type: "BACKGROUND_CHECK",
        content: newContent,
        pendingReview: true,
        // a value could have multiple changes before it is marked as reviewed, so we need to keep them all to correctly show every difference since last reviewed version.
        reviewReason: [...(value.review_reason ?? []), { reviewedAt: new Date(), differences }],
      },
    ],
    null,
    orgId,
    "PARALLEL_MONITORING",
  );

  return true;
}
