import { addMonths, addYears } from "date-fns";
import { OrganizationUsageLimit } from "../db/__types";
import { createCronWorker } from "./helpers/createCronWorker";

function isCurrentUsageLimitExpired(usagePeriod: OrganizationUsageLimit) {
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
    const currentUsageLimits = await context.organizations.loadOrganizationCurrentUsageLimit(
      org.id
    );

    const petitionSendUsageLimit = currentUsageLimits.find((p) => p.limit_name === "PETITION_SEND");

    if (!petitionSendUsageLimit) {
      // if the organization does not have a current period, create one using today as start date
      await context.organizations.createOrganizationUsageLimit(org.id, {
        limit_name: "PETITION_SEND",
        limit: org.usage_details.PETITION_SEND.limit,
        period: org.usage_details.PETITION_SEND.period,
      });
    } else {
      if (isCurrentUsageLimitExpired(petitionSendUsageLimit)) {
        await context.organizations.updateUsageLimitAsExpired(petitionSendUsageLimit.id);
        await context.organizations.createOrganizationUsageLimit(org.id, {
          limit_name: "PETITION_SEND",
          limit: org.usage_details.PETITION_SEND.limit,
          period: org.usage_details.PETITION_SEND.period,
        });
      }
    }
  }
});
