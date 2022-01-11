import { Knex } from "knex";
import { Organization } from "../src/db/__types";
import {
  addOrganizationUsageLimit,
  removeOrganizationUsageLimit,
} from "./helpers/organizationLimits";

export async function up(knex: Knex): Promise<void> {
  await addOrganizationUsageLimit(knex, "SIGNATURIT_SHARED_APIKEY");

  const { rows: orgs } = await knex.raw<{ rows: Organization[] }>(
    /* sql */ `update organization o set usage_details = o.usage_details || '{"SIGNATURIT_SHARED_APIKEY":{"limit": 10, "period":"1 year"}}' where deleted_at is null returning *`
  );

  await knex.from("organization_usage_limit").insert(
    orgs.map((r) => ({
      limit: 10,
      used: 0,
      period: "1 year",
      limit_name: "SIGNATURIT_SHARED_APIKEY",
      org_id: r.id,
      period_start_date: new Date(),
    }))
  );
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(
    /* sql */ `update organization o set usage_details = o.usage_details - 'SIGNATURIT_SHARED_APIKEY';`
  );

  await removeOrganizationUsageLimit(knex, "SIGNATURIT_SHARED_APIKEY");
}

export const config = {
  transaction: false,
};
