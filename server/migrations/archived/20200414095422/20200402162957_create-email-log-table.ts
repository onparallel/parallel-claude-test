import * as Knex from "knex";

export async function up(knex: Knex): Promise<any> {
  return knex.schema.createTable("email_log", (t) => {
    t.increments("id");
    t.text("to").notNullable();
    t.text("from").notNullable();
    t.text("subject").notNullable();
    t.text("text").notNullable();
    t.text("html").notNullable();
    t.timestamp("created_at")
      .notNullable()
      .defaultTo(knex.raw("CURRENT_TIMESTAMP"));
    t.string("created_from").notNullable();
    t.timestamp("sent_at").defaultTo(null);
    t.text("response").defaultTo(null);
  });
}

export async function down(knex: Knex): Promise<any> {
  return knex.schema.dropTable("email_log");
}
