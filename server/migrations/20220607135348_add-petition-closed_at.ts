import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("petition", (t) => {
    t.timestamp("closed_at").nullable().defaultTo(null);
  });

  await knex.raw(/* sql */ `
    with events_ranked as (
      select *, rank() over (partition by petition_id order by created_at desc) as _rank
      from petition_event where type = 'PETITION_CLOSED'
    ) update petition p 
    set closed_at = er.created_at
    from events_ranked er 
    where er._rank = 1
    and p.status = 'CLOSED'
    and er.petition_id = p.id;
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("petition", (t) => {
    t.dropColumn("closed_at");
  });
}
