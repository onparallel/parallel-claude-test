import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("user_petition_event_log", (t) => {
    t.bigIncrements("id");
    t.integer("user_id").references("user.id");
    t.integer("petition_event_id").references("petition_event.id");
    t.unique(["user_id", "petition_event_id"], {
      indexName: "user_petition_event_log__user_id__petition_event_id",
    });
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable("user_petition_event_log");
}
