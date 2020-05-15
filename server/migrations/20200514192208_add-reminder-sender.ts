import * as Knex from "knex";

export async function up(knex: Knex): Promise<any> {
  await knex.schema.alterTable("petition_reminder", (t) => {
    t.integer("sender_id").references("user.id");
  });
  // Backfill petition_reminder sender_id
  await knex.raw(/* sql */ `
    update petition_reminder
      set sender_id = replace(created_by, 'User:', '')::int
      where type = 'MANUAL';
  `);
}

export async function down(knex: Knex): Promise<any> {
  await knex.schema.alterTable("petition_reminder", (t) => {
    t.dropColumn("sender_id");
  });
}
