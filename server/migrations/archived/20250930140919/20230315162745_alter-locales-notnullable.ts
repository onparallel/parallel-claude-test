import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("petition", (t) => {
    t.enum("recipient_locale", ["en", "es"], {
      enumName: "contact_locale",
      useNative: true,
      existingType: true,
    })
      .notNullable()
      .alter();
  });

  await knex.schema.alterTable("user_data", (t) => {
    t.enum("preferred_locale", ["en", "es"], {
      enumName: "user_locale",
      useNative: true,
      existingType: true,
    })
      .notNullable()
      .alter();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("petition", (t) => {
    t.enum("recipient_locale", ["en", "es"], {
      enumName: "contact_locale",
      useNative: true,
      existingType: true,
    })
      .nullable()
      .alter();
  });

  await knex.schema.alterTable("user_data", (t) => {
    t.enum("preferred_locale", ["en", "es"], {
      enumName: "user_locale",
      useNative: true,
      existingType: true,
    })
      .nullable()
      .alter();
  });
}
