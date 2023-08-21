import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("public_petition_link", (t) => {
    t.string("petition_name_pattern").nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("public_petition_link", (t) => {
    t.dropColumn("petition_name_pattern");
  });
}
