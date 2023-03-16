import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("petition", (t) => {
    t.dropColumn("locale");
  });

  await knex.raw(/* sql */ `
    update user_data set "details" = "details" - 'preferredLocale' where "details"->'preferredLocale' is not null;
    comment on column user_data.details is null;
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("petition", (t) => {
    t.string("locale").nullable();
  });

  await knex.raw(/* sql */ `
    comment on column petition.locale is '@deprecated';
    comment on column user_data.details is '@deprecated details->preferredLocale';
  `);
}
