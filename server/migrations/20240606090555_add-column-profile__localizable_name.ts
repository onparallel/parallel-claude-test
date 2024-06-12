import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("profile", (t) => {
    t.jsonb("localizable_name")
      .notNullable()
      .defaultTo(knex.raw(/* sql */ `jsonb_build_object('en', '')`));
  });

  await knex.raw(/* sql */ `
    update profile set localizable_name = jsonb_build_object('en', "name");
  `);

  await knex.raw(/* sql */ `
    comment on column profile.name is '@deprecated';
`);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("profile", (t) => {
    t.dropColumn("localizable_name");
  });

  await knex.raw(/* sql */ `
  comment on column profile.name is null;
`);
}

export const config = {
  transaction: false,
};
