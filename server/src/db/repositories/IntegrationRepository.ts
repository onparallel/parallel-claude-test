import DataLoader from "dataloader";
import { inject, injectable } from "inversify";
import Knex from "knex";
import { groupBy } from "remeda";
import { fromDataLoader } from "../../util/fromDataLoader";
import { BaseRepository } from "../helpers/BaseRepository";
import { KNEX } from "../knex";
import { OrgIntegration } from "../__types";

@injectable()
export class IntegrationRepository extends BaseRepository {
  constructor(@inject(KNEX) knex: Knex) {
    super(knex);
  }

  readonly loadEnabledIntegrationsForOrgId = fromDataLoader(
    new DataLoader<number, OrgIntegration[]>(async (orgIds) => {
      const rows = await this.from("org_integration")
        .whereIn("org_id", orgIds)
        .where("is_enabled", true)
        .returning("*");
      const byOrgId = groupBy(rows, (r) => r.org_id);
      return orgIds.map((orgId) => byOrgId[orgId] ?? []);
    })
  );
}
