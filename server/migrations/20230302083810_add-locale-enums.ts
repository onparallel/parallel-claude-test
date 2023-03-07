import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("petition", (t) => {
    t.enum("recipient_locale", ["en", "es"], {
      useNative: true,
      enumName: "contact_locale",
    }).nullable();
  });

  await knex.raw(/* sql */ `
    update "petition" set "recipient_locale" = "locale"::contact_locale
  `);

  await knex.schema.alterTable("petition", (t) => {
    t.enum("recipient_locale", ["en", "es"], {
      useNative: true,
      enumName: "contact_locale",
      existingType: true,
    })
      .notNullable()
      .alter();
  });

  await knex.schema.alterTable("user_data", (t) => {
    t.enum("preferred_locale", ["en", "es"], {
      useNative: true,
      enumName: "user_locale",
    }).nullable();
  });

  await knex.raw(/* sql */ `
    update "user_data" set "preferred_locale" = coalesce(("details"->>'preferredLocale')::user_locale, 'en')
  `);

  await knex.schema.alterTable("user_data", (t) => {
    t.enum("preferred_locale", ["en", "es"], {
      useNative: true,
      enumName: "user_locale",
      existingType: true,
    })
      .notNullable()
      .alter();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema
    .alterTable("petition", (t) => {
      t.dropColumn("recipient_locale");
    })
    .raw(/* sql */ `drop type "contact_locale"`);

  await knex.schema
    .alterTable("user_data", (t) => {
      t.dropColumn("preferred_locale");
    })
    .raw(/* sql */ `drop type "user_locale"`);
}
