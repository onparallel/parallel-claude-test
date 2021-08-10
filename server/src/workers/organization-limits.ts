import { addMonths, addYears } from "date-fns";
import { OrganizationUsageLimit } from "../db/__types";
import { createCronWorker } from "./helpers/createCronWorker";

function isCurrentUsagePeriodExpired(usagePeriod: OrganizationUsageLimit) {
  switch (usagePeriod.period) {
    case "month":
      return addMonths(usagePeriod.period_start_date, 1) < new Date();
    case "year":
      return addYears(usagePeriod.period_start_date, 1) < new Date();
    default:
      return false;
  }
}

createCronWorker("organization-limits", async (context) => {
  const orgUsageDetails = await context.organizations.getOrganizationUsageDetails();

  for (const org of orgUsageDetails) {
    const currentOrgPeriod = await context.organizations.loadOrganizationCurrentUsagePeriod(org.id);

    if (!currentOrgPeriod) {
      // if the organization does not have a current period, create one using today as start date
      await context.organizations.createUsagePeriod(org.id, {
        limit_name: "PETITION_SEND",
        limit: org.usage_details.PETITION_SEND.limit,
        period: org.usage_details.PETITION_SEND.period,
      });
    } else {
      if (isCurrentUsagePeriodExpired(currentOrgPeriod)) {
        await context.organizations.updateUsagePeriodAsExpired(currentOrgPeriod.id);
        await context.organizations.createUsagePeriod(org.id, {
          limit_name: "PETITION_SEND",
          limit: org.usage_details.PETITION_SEND.limit,
          period: org.usage_details.PETITION_SEND.period,
        });
      }
    }
  }
});
