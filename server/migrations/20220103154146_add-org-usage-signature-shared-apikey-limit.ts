import { Knex } from "knex";
import {
  addOrganizationUsageLimit,
  removeOrganizationUsageLimit,
} from "./helpers/organizationLimits";

export async function up(knex: Knex): Promise<void> {
  await addOrganizationUsageLimit(knex, "SIGNATURIT_SHARED_APIKEY");
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
