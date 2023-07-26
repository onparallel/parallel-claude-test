import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("profile", (t) => {
    t.enum("status", ["OPEN", "CLOSED", "DELETION_SCHEDULED"], {
      useNative: true,
      enumName: "profile_status",
    })
      .notNullable()
      .defaultTo("OPEN");
    t.datetime("closed_at").nullable();
    t.datetime("deletion_scheduled_at").nullable();
  }).raw(/* sql */ `
    alter table "profile" 
    add constraint "profile__status__closed_at__deletion_scheduled_at__check" 
    check (
      (status = 'OPEN' and closed_at is null and deletion_scheduled_at is null) 
    or 
      (status = 'CLOSED' and closed_at is not null and deletion_scheduled_at is null)
    or
      (status = 'DELETION_SCHEDULED' and deletion_scheduled_at is not null)
    );
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("profile", (t) => {
    t.dropColumns("status", "closed_at", "deletion_scheduled_at");
  }).raw(/* sql */ `
      drop type profile_status;
    `);
}
