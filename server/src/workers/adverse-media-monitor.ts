import pMap from "p-map";
import { AdverseMediaSearchContent } from "../services/AdverseMediaSearchService";
import { createCronWorker } from "./helpers/createCronWorker";
import { requiresRefresh } from "./helpers/monitoringUtils";

createCronWorker("adverse-media-monitor", async (ctx) => {
  const now = new Date();
  const organizations =
    await ctx.organizations.getOrganizationsWithFeatureFlag("ADVERSE_MEDIA_SEARCH");

  for (const org of organizations) {
    const valuesForRefresh = await ctx.profiles.getProfileFieldValuesForRefreshByOrgId(
      org.id,
      "ADVERSE_MEDIA_SEARCH",
      requiresRefresh(now),
    );

    await pMap(
      valuesForRefresh,
      async (value) => {
        const content = value.content as AdverseMediaSearchContent;
        const searchResponse = await ctx.adverseMedia.searchArticles(content.search, {
          excludeArticles: [
            ...content.dismissed_articles,
            ...content.irrelevant_articles,
            ...content.relevant_articles,
          ].map((a) => a.id),
        });

        if (searchResponse.totalCount === 0) {
          return;
        }

        ctx.logger.info(
          `${JSON.stringify(content.search)}; Found ${searchResponse.totalCount} new articles`,
        );

        await ctx.profiles.updateProfileFieldValues(
          [
            {
              profileId: value.profile_id,
              profileTypeFieldId: value.profile_type_field_id,
              type: "ADVERSE_MEDIA_SEARCH",
              content: ctx.adverseMedia.buildAdverseMediaSearchContent(
                content.search,
                searchResponse,
                content,
              ),
              pendingReview: true,
            },
          ],
          null,
          org.id,
        );
      },
      // we have a RateLimitGuard on the search endpoint with 200 req/second, and assume each search request will take approx 2 seconds
      { concurrency: 200 },
    );
  }
});
