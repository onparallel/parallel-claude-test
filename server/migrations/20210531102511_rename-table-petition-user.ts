import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.renameTable("petition_user", "petition_permission");

  await knex.schema.alterTable("petition_permission", (t) => {
    t.renameColumn("permission_type", "type");
  });

  await knex.raw(/* sql */ `
    -- rename petition_user_permission_type enum
    alter type petition_user_permission_type rename to petition_permission_type;
    alter table petition_permission alter column "type" type petition_permission_type using "type"::varchar::petition_permission_type;

    -- rename constraints
    alter table "petition_permission" rename constraint "petition_user__user_type_owner" to "petition_permission__user_type_owner";
    alter table "petition_permission" rename constraint "petition_user_pkey" to "petition_permission_pkey";
    alter table "petition_permission" rename constraint "petition_user_from_user_group_id_foreign" to "petition_permission_from_user_group_id_foreign";
    alter table "petition_permission" rename constraint "petition_user_petition_id_foreign" to "petition_permission_petition_id_foreign";
    alter table "petition_permission" rename constraint "petition_user_user_group_id_foreign" to "petition_permission_user_group_id_foreign";
    alter table "petition_permission" rename constraint "petition_user_user_id_foreign" to "petition_permission_user_id_foreign";

    -- rename indexes
    alter index "petition_user_id_seq" rename to "petition_permission_id_seq";
    alter index "petition_user__from_user_group_id__petition_id__user_id" rename to "petition_permission__from_user_group_id__petition_id__user_id";
    alter index "petition_user__owner" rename to "petition_permission__owner";
    alter index "petition_user__petition_id" rename to "petition_permission__petition_id";
    alter index "petition_user__petition_id__user_id" rename to "petition_permission__petition_id__user_id";
    alter index "petition_user__user_group_id__petition_id" rename to "petition_permission__user_group_id__petition_id";
    alter index "petition_user__user_id__petition_id" rename to "petition_permission__user_id__petition_id";
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.renameTable("petition_permission", "petition_user");
  await knex.schema.alterTable("petition_user", (t) => {
    t.renameColumn("type", "permission_type");
  });

  await knex.raw(/* sql */ `
    -- rename petition_user_permission_type enum
    alter type "petition_permission_type" rename to "petition_user_permission_type";
    alter table "petition_user" alter column "permission_type" type petition_user_permission_type using "permission_type"::varchar::petition_user_permission_type;

    -- rename constraints
    alter table "petition_user" rename constraint "petition_permission__user_type_owner" to "petition_user__user_type_owner";
    alter table "petition_user" rename constraint "petition_permission_pkey" to "petition_user_pkey";
    alter table "petition_user" rename constraint "petition_permission_from_user_group_id_foreign" to "petition_user_from_user_group_id_foreign";
    alter table "petition_user" rename constraint "petition_permission_petition_id_foreign" to "petition_user_petition_id_foreign";
    alter table "petition_user" rename constraint "petition_permission_user_group_id_foreign" to "petition_user_user_group_id_foreign";
    alter table "petition_user" rename constraint "petition_permission_user_id_foreign" to "petition_user_user_id_foreign";

    -- rename indexes
    alter index "petition_permission_id_seq" rename to "petition_user_id_seq";
    alter index "petition_permission__from_user_group_id__petition_id__user_id" rename to "petition_user__from_user_group_id__petition_id__user_id";
    alter index "petition_permission__owner" rename to "petition_user__owner";
    alter index "petition_permission__petition_id" rename to "petition_user__petition_id";
    alter index "petition_permission__petition_id__user_id" rename to "petition_user__petition_id__user_id";
    alter index "petition_permission__user_group_id__petition_id" rename to "petition_user__user_group_id__petition_id";
    alter index "petition_permission__user_id__petition_id" rename to "petition_user__user_id__petition_id";
  `);
}
