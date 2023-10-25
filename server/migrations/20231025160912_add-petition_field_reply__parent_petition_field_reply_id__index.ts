import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `
    create index "petition_field_reply__parent_petition_field_reply_id" 
      on petition_field_reply (parent_petition_field_reply_id) 
      where deleted_at is null 
      and parent_petition_field_reply_id is not null;
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `
    drop index "petition_field_reply__parent_petition_field_reply_id";
  `);
}
