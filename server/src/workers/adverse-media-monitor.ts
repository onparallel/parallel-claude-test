import { inject, injectable } from "inversify";
import pMap from "p-map";
import { OrganizationRepository } from "../db/repositories/OrganizationRepository";
import { ProfileRepository } from "../db/repositories/ProfileRepository";
import {
  ADVERSE_MEDIA_SEARCH_SERVICE,
  AdverseMediaSearchContent,
  IAdverseMediaSearchService,
} from "../services/AdverseMediaSearchService";
import { ILogger, LOGGER } from "../services/Logger";
import { createCronWorker, CronWorker } from "./helpers/createCronWorker";
import { requiresRefresh } from "./helpers/monitoringUtils";
import { RateLimitGuard } from "./helpers/RateLimitGuard";

@injectable()
export class AdverseMediaMonitorCronWorker extends CronWorker<"adverse-media-monitor"> {
  constructor(
    @inject(OrganizationRepository) private organizations: OrganizationRepository,
    @inject(ProfileRepository) private profiles: ProfileRepository,
    @inject(ADVERSE_MEDIA_SEARCH_SERVICE) private adverseMedia: IAdverseMediaSearchService,
    @inject(LOGGER) private logger: ILogger,
  ) {
    super();
  }

  async handler() {
    // we have to be super careful to not overload the API with automatic search requests
    const guard = new RateLimitGuard(2);

    const now = new Date();
    const organizations = await this.organizations.getOrganizationsWithFeatureFlag([
      "PROFILES",
      "ADVERSE_MEDIA_SEARCH",
    ]);

    for (const org of organizations) {
      const valuesForRefresh = await this.profiles.getProfileFieldValuesForRefreshByOrgId(
        org.id,
        "ADVERSE_MEDIA_SEARCH",
        requiresRefresh(now),
      );

      await pMap(
        valuesForRefresh.filter((v) => !v.has_draft), // exclude values with drafts to ensure same behavior as before.
        async (value) => {
          await guard.waitUntilAllowed();
          const content = value.content as AdverseMediaSearchContent;
          const searchResponse = await this.adverseMedia.searchArticles(content.search, {
            excludeArticles: [
              ...content.dismissed_articles,
              ...content.irrelevant_articles,
              ...content.relevant_articles,
            ].map((a) => a.id),
          });

          if (searchResponse.totalCount === 0) {
            return;
          }

          this.logger.info(
            `${JSON.stringify(content.search)}; Found ${searchResponse.totalCount} new articles`,
          );

          const events = await this.profiles.updateProfileFieldValues(
            [
              {
                profileId: value.profile_id,
                profileTypeFieldId: value.profile_type_field_id,
                type: "ADVERSE_MEDIA_SEARCH",
                content: this.adverseMedia.buildAdverseMediaSearchContent(
                  content.search,
                  searchResponse,
                  content,
                ),
                pendingReview: true,
              },
            ],
            org.id,
            { source: "PARALLEL_MONITORING" },
          );
          await this.profiles.createProfileUpdatedEvents(events, org.id, {
            source: "PARALLEL_MONITORING",
          });
        },
        { concurrency: 10 },
      );
    }
  }
}

createCronWorker("adverse-media-monitor", AdverseMediaMonitorCronWorker);
