import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  // 1. Add new column to track if profile is scheduled for deletion
  await knex.schema.alterTable("profile_field_value", (table) => {
    table.boolean("profile_is_deletion_scheduled").notNullable().defaultTo(false);
  });

  // 2. Backfill existing data for profiles in DELETION_SCHEDULED status
  await knex.raw(/* sql */ `
    UPDATE profile_field_value pfv
    SET profile_is_deletion_scheduled = true
    FROM profile p
    WHERE pfv.profile_id = p.id
      AND p.status = 'DELETION_SCHEDULED'
      AND p.deleted_at IS NULL
      AND pfv.deleted_at IS NULL
  `);

  // 3. Drop existing unique index
  await knex.raw(/* sql */ `
    DROP INDEX IF EXISTS profile_field_value__unique_values_uniq
  `);

  // 4. Create new unique index that excludes rows where profile is scheduled for deletion
  await knex.raw(/* sql */ `
    CREATE UNIQUE INDEX profile_field_value__unique_values_uniq
    ON profile_field_value (profile_type_field_id, (content->>'value'))
    WHERE profile_type_field_is_unique
      AND removed_at IS NULL
      AND deleted_at IS NULL
      AND profile_is_deletion_scheduled = false
  `);
}

export async function down(knex: Knex): Promise<void> {
  // 1. Drop new index
  await knex.raw(/* sql */ `
    DROP INDEX IF EXISTS profile_field_value__unique_values_uniq
  `);

  await knex.raw(/* sql */ `
    update profile_field_value set removed_at = now() where profile_is_deletion_scheduled = true;
  `);

  // 2. Recreate original index (without profile_is_deletion_scheduled condition)
  await knex.raw(/* sql */ `
    CREATE UNIQUE INDEX profile_field_value__unique_values_uniq
    ON profile_field_value (profile_type_field_id, (content->>'value'))
    WHERE profile_type_field_is_unique
      AND removed_at IS NULL
      AND deleted_at IS NULL
  `);

  // 3. Drop the column
  await knex.schema.alterTable("profile_field_value", (table) => {
    table.dropColumn("profile_is_deletion_scheduled");
  });
}
