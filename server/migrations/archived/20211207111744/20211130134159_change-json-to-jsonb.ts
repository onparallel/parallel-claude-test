import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema
    .alterTable("petition_field", (t) => {
      t.jsonb("options").alter();
    })
    .alterTable("petition_field_reply", (t) => {
      t.jsonb("content").notNullable().alter();
    });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema
    .alterTable("petition_field", (t) => {
      t.json("options").alter();
    })
    .alterTable("petition_field_reply", (t) => {
      t.json("content").notNullable().alter();
    });
}
