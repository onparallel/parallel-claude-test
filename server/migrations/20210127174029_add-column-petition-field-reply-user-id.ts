import * as Knex from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("petition_field_reply", (t) => {
    t.integer("user_id").nullable().references("user.id").defaultTo(null);
    t.integer("petition_access_id").nullable().alter();
  }).raw(/* sql */ `
      alter table "petition_field_reply" add constraint "petition_field_reply__petition_access_id__user_id" check 
      (num_nulls(petition_access_id, user_id) = 1)
    `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `
    alter table petition_field_reply drop constraint "petition_field_reply__petition_access_id__user_id"
  `);

  // for avoiding conflict when making column petition_access_id not nullable
  await knex.raw(/* sql */ `
    DELETE from petition_field_reply WHERE petition_access_id is null
  `);

  await knex.schema.alterTable("petition_field_reply", (t) => {
    t.dropColumn("user_id");
    t.integer("petition_access_id").notNullable().alter();
  });
}
