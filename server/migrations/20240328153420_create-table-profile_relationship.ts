import type { Knex } from "knex";
import { addProfileEvent, removeProfileEvent } from "./helpers/profileEvents";
import { timestamps } from "./helpers/timestamps";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("profile_relationship_type", (t) => {
    t.increments("id");
    t.integer("org_id").notNullable().references("organization.id");
    t.jsonb("left_right_name").notNullable().defaultTo(knex.raw("'{}'::jsonb"));
    t.jsonb("right_left_name").nullable();
    t.boolean("is_reciprocal").notNullable().defaultTo(false);
    t.string("alias").nullable().defaultTo(null);

    timestamps(t);
  });

  await knex.schema.createTable("profile_relationship_type_allowed_profile_type", (t) => {
    t.increments("id");
    t.integer("org_id").notNullable().references("organization.id");
    t.integer("profile_relationship_type_id")
      .notNullable()
      .references("profile_relationship_type.id");
    t.integer("allowed_profile_type_id").notNullable().references("profile_type.id");
    t.enum("direction", ["LEFT_RIGHT", "RIGHT_LEFT"], {
      useNative: true,
      enumName: "profile_relationship_type_direction",
    }).notNullable();

    timestamps(t);
  });

  await knex.schema.createTable("profile_relationship", (t) => {
    t.increments("id");
    t.integer("org_id").notNullable().references("organization.id");
    t.integer("left_side_profile_id").notNullable().references("profile.id");
    t.integer("profile_relationship_type_id")
      .notNullable()
      .references("profile_relationship_type.id");
    t.integer("right_side_profile_id").notNullable().references("profile.id");

    t.integer("created_by_user_id").notNullable().references("user.id");
    t.timestamp("created_at").notNullable().defaultTo(knex.raw("CURRENT_TIMESTAMP"));

    t.timestamp("removed_at").nullable();
    t.integer("removed_by_user_id").nullable().references("user.id");

    timestamps(t, { created: false, updated: false, deleted: true });
  });

  await knex.raw(/* sql */ `
    create unique index profile_relationship_type_allowed_profile_type_unique
    on  profile_relationship_type_allowed_profile_type (org_id, profile_relationship_type_id, direction, allowed_profile_type_id)
    where deleted_at is null;

    create unique index profile_relationship_type__org_id__alias
    on profile_relationship_type (org_id, alias) where deleted_at is null;

    alter table profile_relationship
    add constraint left_side_profile_id_not_equal_right_side_profile_id
    check (left_side_profile_id <> right_side_profile_id);

    create unique index profile_relationship__avoid_duplicates
    on profile_relationship (org_id, left_side_profile_id, profile_relationship_type_id, right_side_profile_id) where deleted_at is null and removed_at is null;

  `);

  await addProfileEvent(knex, "PROFILE_RELATIONSHIP_CREATED");
  await addProfileEvent(knex, "PROFILE_RELATIONSHIP_REMOVED");
}

export async function down(knex: Knex): Promise<void> {
  await removeProfileEvent(knex, "PROFILE_RELATIONSHIP_CREATED");
  await removeProfileEvent(knex, "PROFILE_RELATIONSHIP_REMOVED");

  await knex.schema.dropTable("profile_relationship");
  await knex.schema.dropTable("profile_relationship_type_allowed_profile_type");
  await knex.schema.dropTable("profile_relationship_type");
  await knex.raw(/* sql */ `
    drop type profile_relationship_type_direction;
  `);
}
