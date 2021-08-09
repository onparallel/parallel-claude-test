import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("system_event", (t) => {
    t.increments("id");
    t.enum("type", ["USER_CREATED", "USER_LOGGED_IN", "EMAIL_BOUNCED"], {
      useNative: true,
      enumName: "system_event_type",
    }).notNullable();
    t.jsonb("data");
    t.timestamp("created_at").notNullable().defaultTo(knex.raw("CURRENT_TIMESTAMP"));
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable("system_event");
  await knex.schema.raw("DROP TYPE system_event_type");
}
