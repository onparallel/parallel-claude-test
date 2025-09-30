import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `
        DROP INDEX petition_user_notification__user_id__created_at__is_read;
        DROP INDEX petition_user_notification__user_id_created_at;

        CREATE INDEX petition_user_notification__user_id__is_read ON petition_user_notification USING btree (user_id) INCLUDE (type) WHERE (is_read = false);
        CREATE INDEX petition_user_notification__user_id ON petition_user_notification USING btree (user_id) INCLUDE (type);
    `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `
        DROP INDEX petition_user_notification__user_id__is_read;
        DROP INDEX petition_user_notification__user_id;

        CREATE INDEX petition_user_notification__user_id__created_at__is_read ON petition_user_notification USING btree (user_id, created_at) INCLUDE (type) WHERE (is_read = false);
        CREATE INDEX petition_user_notification__user_id_created_at ON petition_user_notification USING btree (user_id, created_at) INCLUDE (type);
    `);
}
