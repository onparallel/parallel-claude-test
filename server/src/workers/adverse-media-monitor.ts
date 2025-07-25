import pMap from "p-map";
import { AdverseMediaSearchContent } from "../services/AdverseMediaSearchService";
import { createCronWorker } from "./helpers/createCronWorker";
import { requiresRefresh } from "./helpers/monitoringUtils";
import { RateLimitGuard } from "./helpers/RateLimitGuard";

createCronWorker("adverse-media-monitor", async (ctx) => {
  // we have to be super careful to not overload the API with automatic search requests
  const guard = new RateLimitGuard(2);

  const now = new Date();
  const organizations = await ctx.organizations.getOrganizationsWithFeatureFlag([
    "PROFILES",
    "ADVERSE_MEDIA_SEARCH",
  ]);

  for (const org of organizations) {
    const valuesForRefresh = await ctx.profiles.getProfileFieldValuesForRefreshByOrgId(
      org.id,
      "ADVERSE_MEDIA_SEARCH",
      requiresRefresh(now),
    );

    await pMap(
      valuesForRefresh.filter((v) => !v.has_draft), // exclude values with drafts to ensure same behavior as before.
      async (value) => {
        await guard.waitUntilAllowed();
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
      { concurrency: 10 },
    );
  }
});
