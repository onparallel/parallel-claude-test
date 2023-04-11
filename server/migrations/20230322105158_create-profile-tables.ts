import { Knex } from "knex";
import { timestamps } from "./helpers/timestamps";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("profile_type", (t) => {
    t.increments("id");
    t.integer("org_id").notNullable().references("organization.id");
    t.jsonb("name").notNullable().defaultTo(knex.raw("'{}'::jsonb"));
    t.jsonb("profile_name_pattern").defaultTo(knex.raw("'[]'::jsonb"));
    timestamps(t);
  });
  await knex.raw(/* sql */ `
    create index "profile_type__org_id" on profile_type (org_id) where deleted_at is null; 
  `);

  await knex.schema.createTable("profile_type_field", (t) => {
    t.increments("id");
    t.integer("profile_type_id").notNullable().references("profile_type.id");
    t.integer("position").notNullable();
    t.jsonb("name").notNullable().defaultTo(knex.raw("'{}'::jsonb"));
    t.enum("type", ["TEXT", "SHORT_TEXT", "FILE", "DATE", "PHONE", "NUMBER"], {
      enumName: "profile_type_field_type",
      useNative: true,
    }).notNullable();
    t.jsonb("options").notNullable().defaultTo(knex.raw("'{}'::jsonb"));
    t.string("alias").nullable();
    t.boolean("is_expirable").notNullable().defaultTo(false);
    t.enum("permission", ["HIDDEN", "READ", "WRITE"], {
      enumName: "profile_type_field_permission",
      useNative: true,
    })
      .notNullable()
      .defaultTo("WRITE");
    t.specificType("expiry_alert_ahead_time", "interval").nullable().defaultTo(null);
    timestamps(t);
  });
  await knex.raw(/* sql */ `
      alter table "profile_type_field" add constraint "profile_type_field__expiry_time" check (
        (is_expirable is true) or (is_expirable is false and expiry_alert_ahead_time is null)
      );

      -- positions should not repeat on the same profile_type_id
      alter table profile_type_field
      add constraint "profile_type_field__profile_type_id__position" exclude (
        profile_type_id with =,
        position with =
      ) where (deleted_at is null) deferrable initially deferred;

      create unique index "profile_type_field__profile_type_id__alias__unique" on profile_type_field (profile_type_id, alias) where deleted_at is null;

      create index "profile_type_field__profile_type_id" on profile_type_field (profile_type_id) where deleted_at is null;
    `);

  await knex.schema.createTable("profile", (t) => {
    t.increments("id");
    t.integer("org_id").notNullable();
    t.integer("profile_type_id").notNullable();
    t.string("name").notNullable();
    t.foreign(["org_id", "profile_type_id"]).references(["profile_type.org_id", "profile_type.id"]);
    timestamps(t);
  });
  await knex.raw(/* sql */ `
    create index "profile__org_id" on profile_type (org_id) where deleted_at is null; 
  `);

  await knex.schema.createTable("profile_field_value", (t) => {
    t.increments("id");
    t.integer("profile_id").notNullable().references("profile.id");
    t.integer("profile_type_field_id").notNullable().references("profile_type_field.id");
    t.jsonb("content").notNullable().defaultTo(knex.raw("'{}'::jsonb"));
    t.timestamp("expires_at").nullable().defaultTo(null);

    t.integer("created_by_user_id").notNullable().references("user.id");
    t.timestamp("created_at").notNullable().defaultTo(knex.raw("CURRENT_TIMESTAMP"));

    t.timestamp("removed_at").nullable();
    t.integer("removed_by_user_id").nullable().references("user.id");
    t.timestamp("anonymized_at").nullable();

    timestamps(t, { created: false, updated: false, deleted: true });
  });

  await knex.raw(/* sql */ `
    alter table profile_field_value add constraint profile_field_value__removed
    check ((removed_at is null and removed_by_user_id is null) or (removed_at is not null and removed_by_user_id is not null));

    create index profile_field_value__p_id__ptf_id on profile_field_value (profile_id, profile_type_field_id) where deleted_at is null;
    create index profile_field_value__ptf_id on profile_field_value (profile_type_field_id) where deleted_at is null;
    create unique index profile_field_value__current_value on profile_field_value (profile_id, profile_type_field_id)
    where removed_at is null and deleted_at is null; 

    create index profile_field_value__not_anonymized on profile_field_value (id)
    where anonymized_at is null and (removed_at is not null or deleted_at is not null);
  `);

  await knex.schema.createTable("profile_field_file", (t) => {
    t.increments("id");
    t.integer("profile_id").notNullable().references("profile.id");
    t.integer("profile_type_field_id").notNullable().references("profile_type_field.id");
    t.integer("file_upload_id").notNullable().references("file_upload.id");
    t.timestamp("expires_at").nullable().defaultTo(null);

    t.timestamp("created_at").notNullable().defaultTo(knex.raw("CURRENT_TIMESTAMP"));
    t.integer("created_by_user_id").notNullable().references("user.id");

    t.timestamp("removed_at").nullable();
    t.integer("removed_by_user_id").nullable().references("user.id");
    t.timestamp("anonymized_at").nullable();

    timestamps(t, { created: false, updated: false, deleted: true });
  });

  await knex.raw(/* sql */ `
    alter table profile_field_file add constraint profile_field_file__removed
    check ((removed_at is null and removed_by_user_id is null) or (removed_at is not null and removed_by_user_id is not null));
  
    create index profile_field_file__p_id__ptf_id on profile_field_file (profile_id, profile_type_field_id) where deleted_at is null;
    create index profile_field_file__ptf_id on profile_field_file (profile_type_field_id) where deleted_at is null;
    create index profile_field_file__not_anonymized on profile_field_file (id)
    where anonymized_at is null and (removed_at is not null or deleted_at is not null);
  `);

  await knex.schema.createTable("profile_event", (t) => {
    t.increments("id");
    t.integer("org_id").notNullable().references("organization.id");
    t.integer("profile_id").notNullable().references("profile.id");
    t.enum(
      "type",
      ["PROFILE_CREATED", "PROFILE_FIELD_VALUE_UPDATED", "PROFILE_FIELD_VALUE_DELETED"],
      {
        enumName: "profile_event_type",
        useNative: true,
      }
    ).notNullable();
    t.jsonb("data").notNullable().defaultTo(knex.raw("'{}'::jsonb"));
    t.timestamp("created_at").notNullable().defaultTo(knex.raw("CURRENT_TIMESTAMP"));
    t.timestamp("processed_at").nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("profile_event");
  await knex.schema.dropTableIfExists("profile_field_file");
  await knex.schema.dropTableIfExists("profile_field_value");
  await knex.schema.dropTableIfExists("profile");
  await knex.schema.dropTableIfExists("profile_type_field");
  await knex.schema.dropTableIfExists("profile_type");

  await knex.raw(/* sql */ `
    drop type if exists "profile_type_field_permission";
    drop type if exists "profile_type_field_type";
    drop type if exists "profile_event_type";
  `);
}
