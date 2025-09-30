import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("profile_type", (t) => {
    t.integer("archived_by_user_id").nullable().references("user.id");
    t.timestamp("archived_at").nullable();
  });

  await knex.raw(/* sql */ `
    update "profile_type" p
    set
    archived_at = p.deleted_at,
    archived_by_user_id = split_part(p.deleted_by, ':', 2)::int
    where deleted_at is not null;
  `);

  await knex.raw(/* sql */ `
        alter table profile_type add constraint profile_type__deleted_at__null_archived_at check (
            (deleted_at is null) or (deleted_at is not null and archived_at is not null)
        )
    `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `
    alter table profile_type drop constraint "profile_type__deleted_at__null_archived_at"
  `);

  await knex.schema.alterTable("profile_type", (t) => {
    t.dropColumn("archived_at");
    t.dropColumn("archived_by_user_id");
  });
}
