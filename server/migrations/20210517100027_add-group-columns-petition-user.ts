import { Knex } from "knex";
import {
  addPetitionEvent,
  removePetitionEvent,
} from "./helpers/petitionEvents";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("petition_user", (t) => {
    t.integer("user_group_id").nullable().references("user_group.id");
    t.integer("from_user_group_id").nullable().references("user_group.id");
    t.integer("user_id").nullable().alter();
  });

  await addPetitionEvent(knex, "GROUP_PERMISSION_ADDED");
  await addPetitionEvent(knex, "GROUP_PERMISSION_EDITED");
  await addPetitionEvent(knex, "GROUP_PERMISSION_REMOVED");

  await knex.raw(/* sql */ `
    drop index "petition_user__user_id__petition_id";
    drop index "user_group__org_id__name";

    -- useful for the "loadPetitionsForUser" query
    create index "petition_user__user_id__petition_id"
    on "petition_user" (user_id, petition_id) where deleted_at is null and user_group_id is null;

    -- unique directly assigned users per petition
    -- useful to obtain the directly assigned users on a petition
    create unique index "petition_user__petition_id__user_id" 
    on "petition_user" (petition_id, user_id) where deleted_at is null and from_user_group_id is null and user_group_id is null;
    
    -- unique group assigned users per petition
    create unique index "petition_user__petition_id__user_id__from_user_group_id" 
    on "petition_user" (petition_id, user_id, from_user_group_id) where deleted_at is null and user_id is not null and from_user_group_id is not null;
    
    -- unique groups per petition
    create unique index "petition_user__petition_id__user_group_id" 
    on "petition_user" (petition_id, user_group_id) where deleted_at is null and user_group_id is not null;

    -- unique members per group
    create unique index "user_group_member__user_group_id__user_id" 
    on "user_group_member" ("user_group_id", "user_id") where deleted_at is null;

    -- petition owner must be directly assigned
    alter table "petition_user" add constraint "petition_user__user_type_owner"
    check (
      ("permission_type" = 'OWNER' and "user_group_id" is null and "from_user_group_id" is null and "user_id" is not null)
      or ("permission_type" != 'OWNER')
    );
`);
}

export async function down(knex: Knex): Promise<void> {
  await knex
    .from("petition_user")
    .whereNotNull("user_group_id")
    .orWhereNotNull("from_user_group_id")
    .delete();

  await knex.raw(/* sql */ `
    alter table "petition_user" drop constraint "petition_user__user_type_owner";
    drop index "user_group_member__user_group_id__user_id";
    drop index "petition_user__petition_id__user_group_id";
    drop index "petition_user__petition_id__user_id__from_user_group_id";
    drop index "petition_user__petition_id__user_id";
    drop index "petition_user__user_id__petition_id";
    
    create unique index "petition_user__user_id__petition_id" 
      on "petition_user" ("user_id", "petition_id") 
      where deleted_at is null;

    create unique index "user_group__org_id__name" on "user_group" ("org_id", "name") where "deleted_at" is null;

  `);

  await removePetitionEvent(knex, "GROUP_PERMISSION_ADDED");
  await removePetitionEvent(knex, "GROUP_PERMISSION_EDITED");
  await removePetitionEvent(knex, "GROUP_PERMISSION_REMOVED");

  await knex.schema.alterTable("petition_user", (t) => {
    t.dropColumn("user_group_id");
    t.dropColumn("from_user_group_id");
    t.integer("user_id").notNullable().alter();
  });
}
