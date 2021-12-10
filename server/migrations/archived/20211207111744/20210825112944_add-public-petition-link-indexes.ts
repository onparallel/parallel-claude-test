import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `
    -- search public links by template_id
    create index "public_petition_link__template_id" on "public_petition_link" ("template_id");
    -- search link users by public_petition_link_id
    create index "public_petition_link_user__public_petition_link_id" on "public_petition_link_user" ("public_petition_link_id") where "deleted_at" is null;
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `
    drop index "public_petition_link__template_id";
    drop index "public_petition_link_user__public_petition_link_id";
  `);
}
