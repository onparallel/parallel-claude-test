import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("petition", (t) => {
    t.timestamp("closed_at").nullable().defaultTo(null);
  });

  await knex.raw(/* sql */ `
    update petition p
    set closed_at = pe.created_at
    from petition_event pe 
    where p.id = pe.petition_id 
    and pe.type = 'PETITION_CLOSED' and p.status = 'CLOSED';
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("petition", (t) => {
    t.dropColumn("closed_at");
  });
}
