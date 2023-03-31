import { Knex } from "knex";
import { timestamps } from "./helpers/timestamps";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("profile_type", (t) => {
    t.increments("id");
    t.integer("org_id").notNullable().references("organization.id");
    t.jsonb("name").notNullable().defaultTo(knex.raw("'{}'::jsonb"));
    t.text("profile_name_pattern");
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
    t.integer("user_id").notNullable().references("user.id");
    t.timestamp("expires_at").nullable().defaultTo(null);
    t.boolean("is_current").notNullable();
    t.integer("version").notNullable();
    t.timestamp("created_at").notNullable().defaultTo(knex.raw("CURRENT_TIMESTAMP"));
    t.string("created_by");
    t.timestamp("anonymized_at").nullable();
    t.timestamp("replaced_at").nullable();
    t.unique(["profile_id", "profile_type_field_id", "version"]);
  });
  await knex.raw(/* sql */ `
    alter table profile_field_value add constraint profile_field_value__not_is_current__replaced_at 
    check ((is_current and replaced_at is null) or (not is_current and replaced_at is not null));

    create index profile_field_value__p_id__ptf_id on profile_field_value (profile_id, profile_type_field_id);
    create unique index profile_field_value__current_value on profile_field_value (profile_id, profile_type_field_id)
    where is_current = true; 

    create index profile_field_value__not_current__not_anonymized on profile_field_value (id)
    where replaced_at is not null and anonymized_at is null;
  `);

  await knex.schema.createTable("profile_event", (t) => {
    t.increments("id");
    t.integer("org_id").notNullable().references("organization.id");
    t.integer("profile_id").notNullable().references("profile.id");
    t.enum(
      "type",
      [
        "PROFILE_CREATED",
        "PROFILE_UPDATED",
        "PROFILE_DELETED",
        "PROFILE_FIELD_VALUE_UPDATED",
        "PROFILE_FIELD_VALUE_DELETED",
      ],
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
  await knex.schema.dropTable("profile_event");
  await knex.schema.dropTable("profile_field_value");
  await knex.schema.dropTable("profile");
  await knex.schema.dropTable("profile_type_field");
  await knex.schema.dropTable("profile_type");

  await knex.raw(/* sql */ `
    drop type "profile_type_field_type";
    drop type "profile_event_type";
  `);
}
