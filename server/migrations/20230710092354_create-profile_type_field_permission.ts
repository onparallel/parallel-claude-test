import { Knex } from "knex";
import { timestamps } from "./helpers/timestamps";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable("profile_type_field_permission_override", (t) => {
    t.increments("id");
    t.integer("profile_type_field_id").notNullable().references("profile_type_field.id");
    t.specificType("permission", "profile_type_field_permission").notNullable();
    t.integer("user_id").nullable().references("user.id");
    t.integer("user_group_id").nullable().references("user_group.id");
    timestamps(t);
  }).raw(/* sql */ `
    create unique index "ptf_permission_override__profile_type_field_id__user_id"
      on "profile_type_field_permission_override" (profile_type_field_id, user_id) where deleted_at is null;

    create unique index "ptf_permission_override__profile_type_field_id__user_group_id"
      on "profile_type_field_permission_override" (profile_type_field_id, user_group_id) where deleted_at is null;

    alter table "profile_type_field_permission_override" add constraint "ptf_permission_override__user_or_user_group" check (
      (user_id is null)::int + (user_group_id is null)::int = 1
    );
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable("profile_type_field_permission_override");
}
