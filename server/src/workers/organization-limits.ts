import { createCronWorker } from "./helpers/createCronWorker";

createCronWorker("organization-limits", async (context) => {
  await context.orgLimits.renewOrganizationUsageLimits("OrganizationLimitsWorker");
});
