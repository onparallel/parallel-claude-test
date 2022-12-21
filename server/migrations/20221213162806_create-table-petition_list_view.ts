import { Knex } from "knex";
import { timestamps } from "./helpers/timestamps";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("petition_list_view", (t) => {
    t.increments("id");
    t.integer("user_id").notNullable().references("user.id");
    t.string("name").notNullable();
    t.jsonb("data").notNullable();
    t.integer("position").notNullable();
    t.boolean("is_default").notNullable().defaultTo(false);
    timestamps(t);
  });

  await knex.raw(/* sql */ `
    -- view positions should not repeat on the same user_id
    alter table petition_list_view
      add constraint "petition_list_view__user_id__position" exclude (
        user_id with =,
        position with =
      ) where (deleted_at is null) deferrable initially deferred;

    -- to query all the user's views
    create index petition_list_view__user_id on "petition_list_view" ("user_id") where deleted_at is null;
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable("petition_list_view");
}
