import { Knex } from "knex";
import { timestamps } from "./helpers/timestamps";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("event_subscription_signature_key", (t) => {
    t.increments("id");
    t.integer("event_subscription_id").notNullable().references("petition_event_subscription.id");
    t.text("public_key").notNullable();
    t.text("private_key").notNullable();
    timestamps(t, { updated: false });
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable("event_subscription_signature_key");
}
