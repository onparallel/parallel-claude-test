/* eslint-disable @typescript-eslint/naming-convention */
import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("petition_field", (t) => {
    t.dropColumn("validated");
  });

  await knex.schema.alterTable("public_petition_link", (t) => {
    t.dropColumn("owner_id");
  });

  await knex.schema.alterTable("template_default_permission", (t) => {
    t.dropColumn("position");
  });

  await knex.schema.alterTable("petition", (t) => {
    t.dropColumn("reminders_active");
  });

  await knex.schema.alterTable("user", (t) => {
    t.dropColumn("onboarding_status");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("petition_field", (t) => {
    t.boolean("validated").notNullable().defaultTo(false);
  });

  await knex.schema.alterTable("public_petition_link", (t) => {
    t.integer("owner_id").nullable().references("user.id");
  });

  await knex.raw(/* sql */ `
    with tdp_ids as (
      select template_id, user_id from "template_default_permission" where "type" = 'OWNER' and deleted_at is null 
    ) update public_petition_link ppl
      set owner_id = tdp_ids.user_id from tdp_ids where ppl.template_id = tdp_ids.template_id;

    with pp_ids as (
      select petition_id, user_id from "petition_permission" where "type" = 'OWNER' and deleted_at is null
    ) update public_petition_link ppl
      set owner_id = pp_ids.user_id from pp_ids where ppl.template_id = pp_ids.petition_id and owner_id is null;
  `);

  await knex.schema.alterTable("public_petition_link", (t) => {
    t.integer("owner_id").notNullable().alter();
  });

  await knex.schema.alterTable("template_default_permission", (t) => {
    t.integer("position").notNullable().defaultTo(0);
  });

  await knex.schema.alterTable("petition", (t) => {
    t.boolean("reminders_active").notNullable().defaultTo(false);
  });

  await knex.schema.alterTable("user", (t) => {
    t.jsonb("onboarding_status").notNullable().defaultTo(knex.raw("'{}'::jsonb"));
  });
}
