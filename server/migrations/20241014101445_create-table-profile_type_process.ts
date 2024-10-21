import type { Knex } from "knex";
import { timestamps } from "./helpers/timestamps";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("profile_type_process", (t) => {
    t.increments("id");
    t.integer("profile_type_id").notNullable().references("profile_type.id");
    t.jsonb("process_name")
      .notNullable()
      .defaultTo(knex.raw(/* sql */ `jsonb_build_object('en', '')`));
    t.integer("position").notNullable();
    t.integer("latest_petition_id").nullable().references("petition.id");
    timestamps(t);
  });

  await knex.raw(/* sql */ `
    -- position must be an integer between 0 and 2
    alter table profile_type_process add constraint profile_type_process_position_check check (position >= 0 AND position <= 2);

    -- deferred unique constraint on profile_type_id and position
    alter table profile_type_process
      add constraint "profile_type_process__profile_type_id__position" exclude (
        profile_type_id with =,
        position with =
      ) where (deleted_at is null) deferrable initially deferred;
  `);

  await knex.schema.createTable("profile_type_process_template", (t) => {
    t.increments("id");
    t.integer("profile_type_process_id").notNullable().references("profile_type_process.id");
    t.integer("template_id").notNullable().references("petition.id");
    timestamps(t, { updated: false, deleted: false });
  });

  await knex.raw(/* sql */ `
    -- unique (profile_type_process_id, template_id)
    create unique index profile_type_process_template__profile_type_process_id__template_id on profile_type_process_template (profile_type_process_id, template_id);
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable("profile_type_process_template");
  await knex.schema.dropTable("profile_type_process");
}
