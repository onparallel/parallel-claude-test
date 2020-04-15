import * as Knex from "knex";

export async function up(knex: Knex): Promise<any> {
  return knex.schema.createTable("petition_reminder", (t) => {
    t.increments("id");
    t.integer("petition_sendout_id").notNullable();
    t.integer("email_log_id");
    t.enum("type", ["MANUAL", "AUTOMATIC"], {
      useNative: true,
      enumName: "petition_reminder_type",
    }).notNullable();
    t.timestamp("created_at")
      .notNullable()
      .defaultTo(knex.raw("CURRENT_TIMESTAMP"));
    t.string("created_by");

    t.foreign("petition_sendout_id").references("petition_sendout.id");
    t.foreign("email_log_id").references("email_log.id");
  });
}

export async function down(knex: Knex): Promise<any> {
  return knex.schema
    .dropTable("petition_reminder")
    .raw("DROP TYPE petition_reminder_type");
}
