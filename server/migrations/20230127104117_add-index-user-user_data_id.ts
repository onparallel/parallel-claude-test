import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `
    -- index for loadUsersByCognitoId
    create index user__user_data_id on "user" ("user_data_id") where deleted_at is null;
`);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `
    drop index user__user_data_id;
`);
}
