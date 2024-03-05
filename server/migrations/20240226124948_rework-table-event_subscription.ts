import type { Knex } from "knex";
import { timestamps } from "./helpers/timestamps";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("event_subscription", (t) => {
    t.increments("id");
    t.enum("type", ["PETITION", "PROFILE"], {
      useNative: true,
      enumName: "event_subscription_type",
    }).notNullable();
    t.integer("user_id").notNullable().references("user.id");
    t.string("name").nullable();
    t.string("endpoint").notNullable();
    t.jsonb("event_types").nullable();
    t.boolean("is_enabled").notNullable().defaultTo(true);
    t.boolean("is_failing").notNullable().defaultTo(false);
    t.integer("from_template_id").nullable().references("petition.id");
    t.specificType("from_template_field_ids", "int[]");
    t.integer("from_profile_type_id").nullable().references("profile_type.id");
    t.specificType("from_profile_type_field_ids", "int[]");
    t.jsonb("error_log").notNullable().defaultTo("[]");
    timestamps(t);
  });

  await knex.raw(/* sql */ `
    -- add constraint checks to ensure correct filters when type is PETITION or PROFILE
    alter table "event_subscription" add constraint "event_subscription__petition_or_profile__check" check (
      ("type" = 'PETITION' and "from_profile_type_id" is null and "from_profile_type_field_ids" is null)
      or
      ("type" = 'PROFILE' and "from_template_id" is null and "from_template_field_ids" is null)
    );

    -- copy every row in petition_event_subscription into event_subscription
    insert into event_subscription (id, type, user_id, name, endpoint, event_types, is_enabled, is_failing, from_template_id, from_template_field_ids, error_log, created_at, created_by, updated_at, updated_by, deleted_at, deleted_by)
    select id, 'PETITION', user_id, name, endpoint, event_types, is_enabled, is_failing, from_template_id, from_template_field_ids, error_log, created_at, created_by, updated_at, updated_by, deleted_at, deleted_by
    from petition_event_subscription;

    -- set the pk sequence to the max id of petition_event_subscription, this way there will be no conflicts when inserting new rows
    SELECT SETVAL(pg_get_serial_sequence('event_subscription', 'id'), (SELECT MAX(id) FROM petition_event_subscription));

    -- alter event_subscription_signature_key table foreign key to point to new table
    alter table "event_subscription_signature_key" 
      drop constraint "event_subscription_signature_key_event_subscription_id_foreign";
    alter table "event_subscription_signature_key" 
      add constraint "event_subscription_signature_key_event_subscription_id_foreign" 
      foreign key ("event_subscription_id") references "event_subscription"("id");
  `);

  await knex.schema.alterTable("profile_event", (t) => {
    t.string("processed_by").nullable();
  });

  await knex.schema.createTable("user_profile_event_log", (t) => {
    t.bigIncrements("id");
    t.integer("user_id").references("user.id");
    t.integer("profile_event_id").references("profile_event.id");
    t.unique(["user_id", "profile_event_id"], {
      indexName: "user_profile_event_log__user_id__profile_event_id",
    });
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable("user_profile_event_log");
  await knex.schema.alterTable("profile_event", (t) => {
    t.dropColumn("processed_by");
  });

  await knex.raw(/* sql */ `
  -- alter event_subscription_signature_key table foreign key to point to old table
    alter table "event_subscription_signature_key" 
      drop constraint "event_subscription_signature_key_event_subscription_id_foreign";
    alter table "event_subscription_signature_key"
      add constraint "event_subscription_signature_key_event_subscription_id_foreign" 
      foreign key ("event_subscription_id") references "petition_event_subscription"("id");
  `);

  await knex.schema.dropTable("event_subscription");
  await knex.schema.raw(/* sql */ `
    drop type "event_subscription_type";
  `);
}
