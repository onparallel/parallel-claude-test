import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("petition", (t) => {
    t.enum("recipient_locale", ["en", "es"], {
      enumName: "contact_locale",
      useNative: true,
    }).nullable();
  });

  await knex.schema.alterTable("user_data", (t) => {
    t.enum("preferred_locale", ["en", "es"], {
      enumName: "user_locale",
      useNative: true,
    }).nullable();
  });

  await knex.raw(/* sql */ `
    comment on column petition.locale is '@deprecated';
    comment on column user_data.details is '@deprecated details->preferredLocale';
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("petition", (t) => {
    t.dropColumn("recipient_locale");
  });

  await knex.schema.alterTable("user_data", (t) => {
    t.dropColumn("preferred_locale");
  });

  await knex.raw(/* sql */ `
    drop type user_locale;
    drop type contact_locale;

    comment on column petition.locale is null;
    comment on column user_data.details is null;
  `);
}
