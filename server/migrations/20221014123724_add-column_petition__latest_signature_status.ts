import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("petition", (t) => {
    t.string("latest_signature_status").nullable();
  }).raw(/* sql */ `
    with latest_signatures as (
        select distinct on (petition_id) petition_id, status::text, cancel_reason from petition_signature_request psr order by petition_id ,created_at desc
    )
    update petition p set latest_signature_status = (
        case ls.cancel_reason 
            when 'CANCELLED_BY_USER' then 'CANCELLED_BY_USER'
            else ls.status
        end)
    from latest_signatures ls where p.id = ls.petition_id;
    `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("petition", (t) => {
    t.dropColumn("latest_signature_status");
  });
}
