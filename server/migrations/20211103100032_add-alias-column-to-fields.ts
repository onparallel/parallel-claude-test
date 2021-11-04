import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("petition_field", (t) => {
    t.string("alias", 100).nullable();
  });
  await knex.raw(/* sql */ `
    CREATE UNIQUE INDEX petition_field__petition_id__alias__unqiue ON petition_field ("petition_id", "alias") WHERE "deleted_at" IS NULL;
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw("drop index petition_field__petition_id__alias__unqiue");
  await knex.schema.alterTable("petition_field", (t) => {
    t.dropColumn("alias");
  });
}
