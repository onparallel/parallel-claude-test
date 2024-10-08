import type { Knex } from "knex";
import { addFeatureFlag, removeFeatureFlag } from "./helpers/featureFlags";

export async function up(knex: Knex): Promise<void> {
  await addFeatureFlag(knex, "SHOW_CONTACTS_BUTTON");

  await knex.raw(/* sql */ `
    -- enable FF for every active organization
    insert into feature_flag_override (feature_flag_name, org_id, value)
    select 'SHOW_CONTACTS_BUTTON'::feature_flag_name, "id", true 
    from organization o where o.status = 'ACTIVE' and o.deleted_at is null;
  `);
}

export async function down(knex: Knex): Promise<void> {
  await removeFeatureFlag(knex, "SHOW_CONTACTS_BUTTON");
}
