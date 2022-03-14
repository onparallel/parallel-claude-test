import { Knex } from "knex";
import { timestamps } from "./helpers/timestamps";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("user_data", (t) => {
    t.increments("id");
    t.string("cognito_id").notNullable();
    t.string("email").notNullable();
    t.string("first_name");
    t.string("last_name");
    t.boolean("is_sso_user").notNullable().defaultTo(false);
    t.string("external_id");
    t.integer("avatar_public_file_id").nullable().references("public_file_upload.id");
    t.jsonb("details").nullable();
    timestamps(t);
  });

  // unique emails on user_data
  await knex.raw(/* sql */ `
    -- useful for 'loadUsersByCognitoId'
    create unique index user_data__cognito_id__unique on "user_data" ("cognito_id") where deleted_at is null;

    -- emails can't repeat. useful for 'loadUserDataByEmail'
    create unique index user_data__email__unique on "user_data" ("email") where deleted_at is null;
  `);

  await knex.schema.alterTable("user", (t) => {
    // make nullable now so we can set the column and later insert values and make it not nullable
    t.integer("user_data_id").nullable().references("user_data.id");

    // make nullable all the non-null columns that were moved to user_data,
    // so we can stop using this now and safely drop later
    t.string("cognito_id").nullable().alter();
    t.string("email").nullable().alter();
    t.boolean("is_sso_user").nullable().alter();

    // onboarding_status is deprecated and will not be used anymore
    t.jsonb("onboarding_status").nullable().alter();
  });

  await knex.raw(/* sql */ `
    -- same user must be unique on each organization
    create unique index "user__org_id__user_data_id" on "user" (org_id, user_data_id) where deleted_at is null;

    -- drop indexes referring to columns that will be dropped
    drop index "user__email";
    drop index "user__org_id__external_id";
  `);

  // populate user_data table
  await knex.raw(/* sql */ `
    insert into user_data (
      cognito_id, email, first_name, last_name, is_sso_user, external_id, avatar_public_file_id, details,
      created_at, created_by, updated_at, updated_by, deleted_at, deleted_by
    ) select cognito_id, email, first_name, last_name, is_sso_user, external_id, avatar_public_file_id, details,
      created_at, created_by, updated_at, updated_by, deleted_at, deleted_by from "user";
  `);

  // update user.user_data_id column
  await knex.raw(/* sql */ `
    update "user" u
    set user_data_id = ud.id
    from user_data ud
    where u.email = ud.email;
  `);

  // make user_data_id not nullable
  await knex.schema.alterTable("user", (t) => {
    t.integer("user_data_id").notNullable().alter();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `
    drop index user__org_id__user_data_id;
    drop index user_data__email__unique;
    drop index user_data__cognito_id__unique;
  `);

  await knex.schema.alterTable("user", (t) => {
    t.dropColumn("user_data_id");

    t.string("cognito_id").notNullable().alter();
    t.string("email").notNullable().alter();
    t.boolean("is_sso_user").notNullable().defaultTo(false).alter();
    t.jsonb("onboarding_status").notNullable().defaultTo(knex.raw("'{}'::jsonb")).alter();
  });

  await knex.raw(/* sql */ `
    create unique index "user__email" on "user" (email) where deleted_at is null;
    create unique index "user__org_id__external_id" on "user" (org_id, external_id) where deleted_at is null;
  `);

  await knex.schema.dropTable("user_data");
}
