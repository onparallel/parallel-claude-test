import { Knex } from "knex";

export async function up(knex: Knex): Promise<any> {
  await knex.schema.alterTable("petition_field", (t) => {
    t.boolean("is_fixed").notNullable().defaultTo(false);
  });
}

export async function down(knex: Knex): Promise<any> {
  await knex.schema.alterTable("petition_field", (t) => {
    t.dropColumn("is_fixed");
  });
}
