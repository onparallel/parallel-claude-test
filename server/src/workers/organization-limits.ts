import { inject, injectable } from "inversify";
import { IOrgLimitsService, ORG_LIMITS_SERVICE } from "../services/OrgLimitsService";
import { createCronWorker, CronWorker } from "./helpers/createCronWorker";

@injectable()
export class OrganizationLimitsCronWorker extends CronWorker<"organization-limits"> {
  constructor(@inject(ORG_LIMITS_SERVICE) private orgLimits: IOrgLimitsService) {
    super();
  }

  async handler() {
    await this.orgLimits.renewOrganizationUsageLimits("OrganizationLimitsWorker");
  }
}

createCronWorker("organization-limits", OrganizationLimitsCronWorker);
