import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("petition_field", (t) => {
    t.integer("from_petition_field_id").nullable().references("petition_field.id");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("petition_field", (t) => {
    t.dropColumn("from_petition_field_id");
  });
}
