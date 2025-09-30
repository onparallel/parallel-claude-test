import type { Knex } from "knex";
import { addFeatureFlag, removeFeatureFlag } from "./helpers/featureFlags";

export async function up(knex: Knex): Promise<void> {
  await addFeatureFlag(knex, "PDF_EXPORT_V2");
  await knex.raw(/* sql */ `
    update organization_theme
    set data = data || jsonb_build_object('doubleColumn', false, 'columnGap', 10)
    where type = 'PDF_DOCUMENT';
  `);
}

export async function down(knex: Knex): Promise<void> {
  await removeFeatureFlag(knex, "PDF_EXPORT_V2");
  await knex.raw(/* sql */ `
    update organization_theme
    set data = data - 'doubleColumn' - 'columnGap'
    where type = 'PDF_DOCUMENT';
  `);
}
