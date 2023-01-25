import { isDefined } from "remeda";

import { createCronWorker } from "./helpers/createCronWorker";

createCronWorker("organization-limits", async (context) => {
  const expiredLimits = await context.organizations.getOrganizationExpiredUsageLimitsAndDetails();

  for (const limit of expiredLimits) {
    // use end_date of previous period as start_date of new period
    const { period_end_date: newPeriodStartDate, cycle_number: cycleNumber } =
      await context.organizations.updateUsageLimitAsExpired(limit.id);

    const maxCycles = limit.usage_details[limit.limit_name]?.renewal_cycles;

    if (
      isDefined(limit.usage_details[limit.limit_name]) &&
      (!isDefined(maxCycles) || maxCycles > cycleNumber)
    ) {
      await context.organizations.createOrganizationUsageLimit(limit.org_id, {
        limit_name: limit.limit_name,
        limit: limit.usage_details[limit.limit_name]!.limit,
        period: limit.usage_details[limit.limit_name]!.duration,
        period_start_date: newPeriodStartDate ?? undefined,
        cycle_number: cycleNumber + 1,
      });
    } else if (limit.limit_name === "PETITION_SEND") {
      // downgrade PETITION_SEND limits to FREE tier
      await context.tiers.downgradeOrganizationPetitionSendLimit(
        {
          id: limit.org_id,
          usage_details: limit.usage_details,
        },
        "OrganizationLimitsWorker"
      );
    }
  }
});
