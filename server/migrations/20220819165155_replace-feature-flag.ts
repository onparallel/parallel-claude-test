import { Knex } from "knex";
import { addFeatureFlag, removeFeatureFlag } from "./helpers/featureFlags";

export async function up(knex: Knex): Promise<void> {
  await addFeatureFlag(knex, "TEMPLATE_REPLIES_PREVIEW_URL", false);

  await knex.raw(/* sql */ `
    update feature_flag set default_value = (select default_value from feature_flag where name = 'TEMPLATE_REPLIES_RECIPIENT_URL')
    where name = 'TEMPLATE_REPLIES_PREVIEW_URL';

    with overrides as (select * from feature_flag_override where "feature_flag_name" = 'TEMPLATE_REPLIES_RECIPIENT_URL')
    insert into feature_flag_override (feature_flag_name, org_id, user_id, value) 
    select 'TEMPLATE_REPLIES_PREVIEW_URL', o.org_id, o.user_id, o.value from overrides o;
`);
}

export async function down(knex: Knex): Promise<void> {
  await removeFeatureFlag(knex, "TEMPLATE_REPLIES_PREVIEW_URL");
}
