import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `
        update petition_field set options = 
            options || jsonb_build_object(
                'legacy', false, -- keeping 'false' so it can be rolled back if needed
                'requests', jsonb_build_array(
                    jsonb_build_object(
                        'model', jsonb_build_object(
                            'type', 'AEAT_IRPF_DATOS_FISCALES'
                        )
                    )
                )
            ) 
        where type = 'ES_TAX_DOCUMENTS' and ("options"->>'legacy')::boolean = true;
    `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `
        update petition_field 
        set options = 
        options - 'requests' || jsonb_build_object('legacy', true)
        where ("options"->>'legacy')::boolean = false;
    `);
}
