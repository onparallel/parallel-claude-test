import { createCronWorker } from "./helpers/createCronWorker";

createCronWorker("organization-limits", async (context) => {
  const expiredLimits = await context.organizations.getOrganizationExpiredUsageLimitsAndDetails();

  for (const limit of expiredLimits) {
    // use end_date of previous period as start_date of new period
    const [{ period_end_date: newPeriodStartDate }] =
      await context.organizations.updateUsageLimitAsExpired(limit.id);
    await context.organizations.createOrganizationUsageLimit(limit.org_id, {
      limit_name: limit.limit_name,
      limit: limit.usage_details[limit.limit_name].limit,
      period: limit.usage_details[limit.limit_name].period,
      period_start_date: newPeriodStartDate ?? undefined,
    });
  }
});
