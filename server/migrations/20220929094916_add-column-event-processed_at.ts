import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("petition_event", (t) => {
    t.timestamp("processed_at").nullable();
  });
  await knex.schema.alterTable("system_event", (t) => {
    t.timestamp("processed_at").nullable();
  });

  await knex.raw(/* sql */ `
    create index petition_event__processed_at on petition_event (id) where processed_at is null;
    create index system_event__processed_at on system_event (id) where processed_at is null;
  `);

  await knex.raw(/* sql */ `
    update petition_event set processed_at = created_at;
    update system_event set processed_at = created_at;  
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("petition_event", (t) => {
    t.dropColumn("processed_at");
  });
  await knex.schema.alterTable("system_event", (t) => {
    t.dropColumn("processed_at");
  });
}
