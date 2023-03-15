import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `
    update "petition" set "recipient_locale" = "locale"::contact_locale where "recipient_locale" is null;

    update "user_data" set "preferred_locale" = coalesce(("details"->>'preferredLocale')::user_locale, 'en') where "preferred_locale" is null;
  `);
}

export async function down(knex: Knex): Promise<void> {}
