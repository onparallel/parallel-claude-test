import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `
    update organization_theme
    set "data" = jsonb_set(
        jsonb_set(
            jsonb_set(
                "data",
                '{legalText, ca}',
                '[{"type": "paragraph", "children": [{"text": "Declaro que les dades i la documentació facilitades, així com les còpies o fotocòpies enviades, reproduïxen fidelment els documents originals i la informació actual d''identificació.", "italic": true}]}]',
                true
            ),
            '{legalText, it}',
            '[{"type": "paragraph", "children": [{"text": "Dichiaro che i dati e la documentazione forniti, così come le copie o le fotocopie inviate, riproducono fedelmente i documenti originali e le attuali informazioni di identificazione.", "italic": true}]}]',
            true
        ),
        '{legalText, pt}',
        '[{"type": "paragraph", "children": [{"text": "Declaro que os dados e a documentação fornecidos, bem como as cópias ou fotocòpias enviadas, reproduzem fielmente os documentos originais e a informação atual de identificação.", "italic": true}]}]',
        true
    )
    where "type" = 'PDF_DOCUMENT'
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `
    update organization_theme
    set "data" = jsonb_strip_nulls(
        jsonb_set(
            jsonb_set(
                jsonb_set(
                    "data",
                    '{legalText, ca}', 
                    'null', 
                    true
                ),
                '{legalText, it}', 
                'null', 
                true
            ),
            '{legalText, pt}', 
            'null', 
            true
        )
    )
    where "type" = 'PDF_DOCUMENT'
  `);
}
