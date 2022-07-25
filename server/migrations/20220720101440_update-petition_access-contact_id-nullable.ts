import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("petition_access", (t) => {
    t.integer("contact_id").nullable().alter();
  });
  await knex.raw(/* sql */ `
  alter table petition_access drop constraint petition_access__petition_id_contact_id;
  create unique index petition_access__petition_id_contact_id on petition_access (petition_id, contact_id) where status = 'ACTIVE';
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.from("petition_access").whereNull("contact_id").delete();
  await knex.schema.alterTable("petition_access", (t) => {
    t.integer("contact_id").notNullable().alter();
  });
  await knex.raw(/* sql */ `
  alter table petition_access drop index petition_access__petition_id_contact_id;
  alter table petition_access add constraint petition_access__petition_id_contact_id unique (petition_id, contact_id);
`);
}
