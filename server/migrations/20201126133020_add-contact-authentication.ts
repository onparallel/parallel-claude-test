import * as Knex from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("contact_authentication", (t) => {
    t.increments("id");
    t.integer("contact_id").notNullable().references("contact.id");
    t.string("cookie_value_hash").notNullable();
    t.jsonb("access_log").notNullable().defaultTo("[]");
    t.index(
      ["contact_id", "cookie_value_hash"],
      "contact_authentication__contact_id__contact_value_hash"
    );
  });
  await knex.schema.createTable("contact_authentication_request", (t) => {
    t.increments("id");
    t.integer("petition_access_id")
      .notNullable()
      .references("petition_access.id");
    t.string("token_hash").notNullable();
    t.string("code", 6).notNullable();
    t.integer("remaining_attempts").notNullable();
    t.integer("email_log_id").references("email_log.id");
    t.string("ip");
    t.string("user_agent");
    t.timestamp("expires_at").notNullable();
    t.unique(
      ["petition_access_id", "token_hash"],
      "contact_authentication_request__petition_access_id__token_hash"
    );
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable("contact_authentication");
  await knex.schema.dropTable("contact_authentication_request");
}
