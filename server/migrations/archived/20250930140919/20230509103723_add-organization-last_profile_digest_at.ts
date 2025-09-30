import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("organization", (t) => {
    t.timestamp("last_profile_digest_at").nullable();
  }).raw(/* sql */ `
    create index profile_subscription__user_id on profile_subscription (user_id) where deleted_at is null;
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("organization", (t) => {
    t.dropColumn("last_profile_digest_at");
  }).raw(/*sql*/ `
    drop index profile_subscription__user_id;
  `);
}
