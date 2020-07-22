import * as Knex from "knex";

export async function up(knex: Knex): Promise<any> {
  await knex.schema
    .alterTable("petition_field_reply", (t) => {
      t.dropColumn("petition_sendout_id");
    })
    .alterTable("petition_reminder", (t) => {
      t.dropColumn("petition_sendout_id");
    })
    .dropTable("petition_sendout")
    .raw(/* sql */ `drop type petition_sendout_status;`);
}

export async function down(knex: Knex): Promise<any> {}
