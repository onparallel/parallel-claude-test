import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("petition", (t) => {
    t.jsonb("automatic_numbering_config").nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("petition", (t) => {
    t.dropColumn("automatic_numbering_config");
  });

  await knex.raw(/* sql */ `
    update petition_field
    set options = options - 'showNumbering'
    where type = 'HEADING'
    and deleted_at is null;
  `);
}
