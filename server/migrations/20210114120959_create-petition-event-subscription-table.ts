import { Knex } from "knex";
import { timestamps } from "./helpers/timestamps";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("petition_event_subscription", (t) => {
    t.increments("id");
    t.integer("user_id").notNullable().references("user.id");
    t.integer("petition_id").notNullable().references("petition.id");
    t.string("endpoint").notNullable();
    timestamps(t);

    t.index(["petition_id"], "petition_event_subscription__petition_id");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable("petition_event_subscription");
}
