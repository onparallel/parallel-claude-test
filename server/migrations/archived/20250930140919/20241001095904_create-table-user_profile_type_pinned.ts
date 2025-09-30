import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("user_profile_type_pinned", (t) => {
    t.increments("id");
    t.integer("user_id").notNullable().references("user.id");
    t.integer("profile_type_id").notNullable().references("profile_type.id");
  });

  await knex.raw(/* sql */ `
    create unique index user_profile_type_pinned__user_id__profile_type_id on user_profile_type_pinned(user_id, profile_type_id);
  `);

  // every user has by default the INDIVIDUAL and LEGAL_ENTITY profile types pinned
  await knex.raw(/* sql */ `
    insert into user_profile_type_pinned (user_id, profile_type_id)
    select u.id as user_id, pt.id as profile_type_id
    from "user" u
    join profile_type pt on u.org_id = pt.org_id
    where pt.standard_type in ('INDIVIDUAL', 'LEGAL_ENTITY')
    and pt.deleted_at is null
    and pt.archived_at is null
    and pt.standard_type is not null
    and u.status = 'ACTIVE'
    and u.deleted_at is null;
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable("user_profile_type_pinned");
}
