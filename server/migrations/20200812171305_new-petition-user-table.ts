import { Knex } from "knex";
import { timestamps } from "./helpers/timestamps";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("petition_user", (t) => {
    t.increments("id");
    t.integer("petition_id").notNullable().references("petition.id");
    t.integer("user_id").notNullable().references("user.id");
    t.enum("permission_type", ["OWNER", "WRITE", "READ"], {
      useNative: true,
      enumName: "petition_user_permission_type",
    })
      .notNullable()
      .defaultTo("OWNER");
    t.boolean("is_subscribed").notNullable().defaultTo(true);
    timestamps(t);
  });

  // only one owner per petition
  await knex.raw(/* sql */ `
    create unique index "petition_user__owner" 
    on "petition_user" ("petition_id") 
    where permission_type = 'OWNER' and deleted_at is null
  `);

  await knex.raw(/* sql */ `
    create unique index "petition_user__user_id__petition_id" 
    on "petition_user" ("user_id", "petition_id") 
    where deleted_at is null;
  `);

  await knex.raw(/* sql */ `
    create index "petition_user__petition_id" 
    on "petition_user" ("petition_id") 
    where deleted_at is null;
  `);

  // move petition.owner_id to petition_user.user_id
  await knex.raw(/* sql */ `
    insert into petition_user (petition_id, user_id, created_at, created_by, updated_at, updated_by, deleted_at, deleted_by)
	    (select id, owner_id, created_at, created_by, created_at, created_by, deleted_at, deleted_by from petition)
  `);

  // delete petition.owner_id field
  await knex.schema.alterTable("petition", (t) => {
    t.dropColumn("owner_id");
  });
}

export async function down(knex: Knex): Promise<void> {
  // add petition.owner_id field
  await knex.schema.alterTable("petition", (t) => {
    t.integer("owner_id").references("user.id").nullable();
  });

  // repopulate petition.owner_id field
  await knex.raw(
    /* sql */ `UPDATE petition SET owner_id = REGEXP_REPLACE(created_by, 'User:(\\d+)$', '\\1')::int WHERE id > 0`
  );

  await knex.raw(
    /* sql */ `ALTER TABLE petition ALTER COLUMN owner_id SET NOT NULL`
  );

  await knex.schema.dropTable("petition_user");
  await knex.raw("DROP type petition_user_permission_type");
}
