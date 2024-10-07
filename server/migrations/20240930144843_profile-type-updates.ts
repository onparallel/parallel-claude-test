import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("profile_type", (t) => {
    t.jsonb("name_plural")
      .notNullable()
      .defaultTo(knex.raw(/* sql */ `jsonb_build_object('en', '')`));
    t.string("icon").notNullable().defaultTo("DATABASE");
  });

  await knex.raw(/* sql */ `
    update profile_type
    set
        "name" = jsonb_build_object('en', 'Individual', 'es', 'Persona'),
        "name_plural" = jsonb_build_object('en', 'Individuals', 'es', 'Personas'),  
        "icon" = 'PERSON'
    where standard_type = 'INDIVIDUAL';

    update profile_type
    set
        "name" = jsonb_build_object('en', 'Company', 'es', 'Compañía'),
        "name_plural" = jsonb_build_object('en', 'Companies', 'es', 'Compañías'),  
        "icon" = 'BUILDING'
    where standard_type = 'LEGAL_ENTITY';

    update profile_type
    set
        "name" = jsonb_build_object('en', 'Contract', 'es', 'Contrato'),
        "name_plural" = jsonb_build_object('en', 'Contracts', 'es', 'Contratos'),  
        "icon" = 'DOCUMENT'
    where standard_type = 'CONTRACT';
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("profile_type", (t) => {
    t.dropColumn("name_plural");
    t.dropColumn("icon");
  });

  await knex.raw(/* sql */ `
    update profile_type
    set
      "name" = jsonb_build_object('en', 'Individual', 'es', 'Persona física')
    where standard_type = 'INDIVIDUAL';

    update profile_type
    set
      "name" = jsonb_build_object('en', 'Legal entity', 'es', 'Persona jurídica')
    where standard_type = 'LEGAL_ENTITY';

    update profile_type
    set
      "name" = jsonb_build_object('en', 'Contract', 'es', 'Contrato')
    where standard_type = 'CONTRACT';
`);
}
