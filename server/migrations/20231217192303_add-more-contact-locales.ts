import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.raw(/* sql */ `
    alter type contact_locale add value 'ca';
    alter type contact_locale add value 'it';
    alter type contact_locale add value 'pt';
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `
    alter type contact_locale rename to contact_locale_old;
    create type contact_locale as enum ('en', 'es');

    update petition set recipient_locale = 'en' where recipient_locale in ('ca', 'it', 'pt');

    alter table petition alter column "recipient_locale" type contact_locale using "recipient_locale"::varchar::contact_locale;
    drop type contact_locale_old;
  `);
}
