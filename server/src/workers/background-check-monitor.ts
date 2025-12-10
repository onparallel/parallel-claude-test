import { inject, injectable } from "inversify";
import { isNonNullish } from "remeda";
import { assert } from "ts-essentials";
import { ProfileFieldValue } from "../db/__types";
import { OrganizationRepository } from "../db/repositories/OrganizationRepository";
import { ProfileRepository } from "../db/repositories/ProfileRepository";
import {
  BACKGROUND_CHECK_SERVICE,
  BackgroundCheckContent,
  IBackgroundCheckService,
} from "../services/BackgroundCheckService";
import { EMAILS, IEmailsService } from "../services/EmailsService";
import {
  PETITIONS_HELPER_SERVICE,
  PetitionsHelperService,
} from "../services/PetitionsHelperService";
import { createCronWorker, CronWorker } from "./helpers/createCronWorker";
import { requiresRefresh } from "./helpers/monitoringUtils";

@injectable()
export class BackgroundCheckMonitorCronWorker extends CronWorker<"background-check-monitor"> {
  constructor(
    @inject(OrganizationRepository) private organizations: OrganizationRepository,
    @inject(ProfileRepository) private profiles: ProfileRepository,
    @inject(BACKGROUND_CHECK_SERVICE) private backgroundCheck: IBackgroundCheckService,
    @inject(PETITIONS_HELPER_SERVICE) private petitionsHelper: PetitionsHelperService,
    @inject(EMAILS) private emails: IEmailsService,
  ) {
    super();
  }

  async handler() {
    const now = new Date();
    const organizations = await this.organizations.getOrganizationsWithFeatureFlag([
      "PROFILES",
      "BACKGROUND_CHECK",
    ]);

    for (const org of organizations) {
      const valuesForRefresh = await this.profiles.getProfileFieldValuesForRefreshByOrgId(
        org.id,
        "BACKGROUND_CHECK",
        requiresRefresh(now),
      );

      const profileFieldValuesForNotification: ProfileFieldValue[] = [];

      for (const value of valuesForRefresh) {
        if (isNonNullish(value.content.entity)) {
          // we are monitoring an entity details
          const pendingReview = await this.refreshEntityDetails(value, org.id);
          if (pendingReview) {
            profileFieldValuesForNotification.push(value);
          }
        } else {
          // we are monitoring a search
          const pendingReview = await this.refreshSearch(value, org.id);

          if (pendingReview) {
            profileFieldValuesForNotification.push(value);
          }
        }
      }

      const profileFieldValuesByUserId = await this.profiles.getSubscribedUsersWithReadPermissions(
        profileFieldValuesForNotification,
      );

      for (const [userId, profileFieldValues] of Object.entries(profileFieldValuesByUserId)) {
        if (profileFieldValues.length > 0) {
          await this.emails.sendBackgroundCheckMonitoringChangesEmail(
            parseInt(userId),
            profileFieldValues,
          );
        }
      }
    }
  }

  /**
   * @returns `true` if some relevant property has been updated on the value.
   */
  private async refreshEntityDetails(value: ProfileFieldValue, orgId: number) {
    const content = value.content as BackgroundCheckContent;
    assert(isNonNullish(content.entity), "Entity is required");

    try {
      const newDetails = await this.backgroundCheck.entityProfileDetails(content.entity.id);

      const newContent = {
        ...content,
        entity: newDetails,
      } as BackgroundCheckContent;

      const contentsAreEqual = this.petitionsHelper.contentsAreEqual(
        { type: "BACKGROUND_CHECK", content },
        { type: "BACKGROUND_CHECK", content: newContent },
      );
      const differences = this.backgroundCheck.extractRelevantDifferences(content, newContent);

      if (contentsAreEqual || !differences.entity) {
        // no changes or no relevant differences since last execution, no need to update the value
        // create an event to keep track that the monitor has run and there are no changes
        await this.profiles.createEvent(
          {
            type: "PROFILE_FIELD_VALUE_MONITORED",
            data: {
              profile_type_field_id: value.profile_type_field_id,
            },
            profile_id: value.profile_id,
            org_id: orgId,
          },
          "PARALLEL_MONITORING",
        );

        return false;
      }

      const events = await this.profiles.updateProfileFieldValues(
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
        orgId,
        { source: "PARALLEL_MONITORING" },
      );

      await this.profiles.createProfileUpdatedEvents(events, orgId, {
        source: "PARALLEL_MONITORING",
      });
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
        const events = await this.profiles.updateProfileFieldValues(
          [
            {
              profileId: value.profile_id,
              profileTypeFieldId: value.profile_type_field_id,
              type: "BACKGROUND_CHECK",
              content: newContent,
            },
          ],
          orgId,
          { source: "PARALLEL_MONITORING" },
        );

        await this.profiles.createProfileUpdatedEvents(events, orgId, {
          source: "PARALLEL_MONITORING",
        });
        return false;
      }

      throw error;
    }
  }

  /**
   * @returns `true` if some relevant property has been updated on the value.
   */

  private async refreshSearch(value: ProfileFieldValue, orgId: number) {
    const content = value.content as BackgroundCheckContent;
    const newSearch = await this.backgroundCheck.entitySearch(content.query, orgId);
    const newContent = {
      ...content,
      search: newSearch,
      // make sure to keep false positives that are still present in the new search and remove the ones that are not
      falsePositives: content.falsePositives?.filter((fp) =>
        newSearch.items.some((item) => item.id === fp.id),
      ),
    } as BackgroundCheckContent;

    const contentsAreEqual = this.petitionsHelper.contentsAreEqual(
      { type: "BACKGROUND_CHECK", content },
      { type: "BACKGROUND_CHECK", content: newContent },
    );

    const differences = this.backgroundCheck.extractRelevantDifferences(content, newContent);

    if (contentsAreEqual || !differences.search) {
      await this.profiles.createEvent(
        {
          type: "PROFILE_FIELD_VALUE_MONITORED",
          data: {
            profile_type_field_id: value.profile_type_field_id,
          },
          profile_id: value.profile_id,
          org_id: orgId,
        },
        "PARALLEL_MONITORING",
      );

      return false;
    }

    // any difference in search means search items have changed, so we need to mark it for review
    const events = await this.profiles.updateProfileFieldValues(
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
      orgId,
      { source: "PARALLEL_MONITORING" },
    );

    await this.profiles.createProfileUpdatedEvents(events, orgId, {
      source: "PARALLEL_MONITORING",
    });
    return true;
  }
}

createCronWorker("background-check-monitor", BackgroundCheckMonitorCronWorker);
