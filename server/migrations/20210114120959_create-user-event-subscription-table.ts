import * as Knex from "knex";
import { timestamps } from "./helpers/timestamps";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("user_event_subscription", (t) => {
    t.increments("id");
    t.integer("user_id").notNullable().references("user.id");
    t.integer("petition_id").notNullable().references("petition.id");
    t.specificType("petition_event", "petition_event_type").notNullable();
    t.string("endpoint").notNullable();
    timestamps(t);

    t.unique(
      ["petition_id", "petition_event"],
      "user_event_subscription__petition_id__petition_event"
    );

    t.index(["user_id"], "user_event_subscription__user_id");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable("user_event_subscription");
}
