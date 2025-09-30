import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("petition", (t) => {
    t.boolean("enable_interaction_with_recipients").notNullable().defaultTo(true);
    t.boolean("enable_review_flow").notNullable().defaultTo(true);
    t.boolean("enable_document_generation").notNullable().defaultTo(true);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("petition", (t) => {
    t.dropColumn("enable_interaction_with_recipients");
    t.dropColumn("enable_review_flow");
    t.dropColumn("enable_document_generation");
  });
}
