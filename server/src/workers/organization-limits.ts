import { createCronWorker } from "./helpers/createCronWorker";

createCronWorker("organization-limits", async (context) => {
  const expiredLimits = await context.organizations.getOrganizationExpiredUsageLimitsAndDetails();

  for (const limit of expiredLimits) {
    await context.organizations.updateUsageLimitAsExpired(limit.id);
    await context.organizations.createOrganizationUsageLimit(limit.org_id, {
      limit_name: limit.limit_name,
      limit: limit.usage_details[limit.limit_name].limit,
      period: limit.usage_details[limit.limit_name].period,
    });
  }
});
