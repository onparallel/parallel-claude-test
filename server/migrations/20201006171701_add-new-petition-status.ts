import * as Knex from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.raw(
    /* sql */ `alter type "petition_status" add value 'REVIEWED';`
  );
}

export async function down(knex: Knex): Promise<void> {}
