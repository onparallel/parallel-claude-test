import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("petition_field", (t) => {
    t.boolean("has_comments_enabled").notNullable().defaultTo(true);
  });

  await knex.raw(/* sql */ `
    update petition_field set has_comments_enabled = true where ("options"->>'hasCommentsEnabled')::boolean is null; -- this fixes a bug on DYNAMIC_SELECT field
    update petition_field set has_comments_enabled = ("options"->>'hasCommentsEnabled')::boolean where ("options"->>'hasCommentsEnabled')::boolean is not null;
    update petition_field set options = options - 'hasCommentsEnabled' where ("options"->>'hasCommentsEnabled')::boolean is not null;
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `
    update petition_field set options = "options" || jsonb_build_object('hasCommentsEnabled', "has_comments_enabled");
  `);

  await knex.schema.alterTable("petition_field", (t) => {
    t.dropColumn("has_comments_enabled");
  });
}
