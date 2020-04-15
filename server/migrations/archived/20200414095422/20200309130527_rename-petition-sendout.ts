import * as Knex from "knex";

export async function up(knex: Knex): Promise<any> {
  return knex.schema
    .alterTable("petition_field_reply", (t) => {
      t.renameColumn("petition_access_id", "petition_sendout_id");
    })
    .alterTable("petition_event_log", (t) => {
      t.renameColumn("petition_access_id", "petition_sendout_id");
    })
    .renameTable("petition_access", "petition_sendout");
}

export async function down(knex: Knex): Promise<any> {
  return knex.schema
    .alterTable("petition_field_reply", (t) => {
      t.renameColumn("petition_sendout_id", "petition_access_id");
    })
    .alterTable("petition_event_log", (t) => {
      t.renameColumn("petition_sendout_id", "petition_access_id");
    })
    .renameTable("petition_access", "petition_sendout");
}
