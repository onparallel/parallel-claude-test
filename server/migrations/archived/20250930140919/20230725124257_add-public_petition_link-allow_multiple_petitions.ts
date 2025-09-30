import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("public_petition_link", (t) => {
    t.boolean("allow_multiple_petitions").notNullable().defaultTo(false);
  });

  await knex.from("public_petition_link").update({
    allow_multiple_petitions: true,
  } as any);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("public_petition_link", (t) => {
    t.dropColumn("allow_multiple_petitions");
  });
}
