import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `
    comment on column profile_type_process.latest_petition_id is '@deprecated';  
  `);

  await knex.schema.alterTable("petition_profile", (t) => {
    t.integer("profile_type_process_id").nullable().references("profile_type_process.id");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `
    comment on column profile_type_process.latest_petition_id is null;  
  `);

  await knex.schema.alterTable("petition_profile", (t) => {
    t.dropColumn("profile_type_process_id");
  });
}
