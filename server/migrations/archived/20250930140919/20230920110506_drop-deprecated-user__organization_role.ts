import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("user", (t) => {
    t.dropColumn("organization_role");
  });

  await knex.raw(/* sql */ `
    drop type user_organization_role;
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `
    create type user_organization_role as enum (
      'COLLABORATOR',
      'NORMAL',
      'ADMIN',
      'OWNER'
    );
  `);

  await knex.schema.alterTable("user", (t) => {
    t.specificType("organization_role", "user_organization_role").notNullable().defaultTo("NORMAL");
  });

  await knex.raw(/* sql */ `
    comment on column "user"."organization_role" is '@deprecated';  
  `);
}
