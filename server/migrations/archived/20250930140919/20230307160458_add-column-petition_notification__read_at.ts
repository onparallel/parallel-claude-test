import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("petition_user_notification", (t) => {
    t.timestamp("read_at").nullable().defaultTo(null);
  });
  await knex.schema.alterTable("petition_contact_notification", (t) => {
    t.timestamp("read_at").nullable().defaultTo(null);
  });

  await knex.raw(/* sql */ `
    -- mark old columns as deprecated
    comment on column petition_user_notification.is_read is '@deprecated';
    comment on column petition_contact_notification.is_read is '@deprecated';
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("petition_user_notification", (t) => {
    t.dropColumn("read_at");
  });
  await knex.schema.alterTable("petition_contact_notification", (t) => {
    t.dropColumn("read_at");
  });

  await knex.raw(/* sql */ `
    comment on column petition_user_notification.is_read is null;
    comment on column petition_contact_notification.is_read is null;
  `);
}
