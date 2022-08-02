import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `
    update petition_signature_request psr
    set event_logs = coalesce((
        select jsonb_agg(event || jsonb_build_object('document', (event->'document')::jsonb - 'events'))
        from (
    	    select jsonb_array_elements(event_logs) as event from petition_signature_request as psr_updated where psr.id = psr_updated.id
	    ) 
        as signature_logs
    ), '[]'::jsonb);
    `);
}

export async function down(knex: Knex): Promise<void> {}
