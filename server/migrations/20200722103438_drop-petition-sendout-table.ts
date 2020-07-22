import * as Knex from "knex";

export async function up(knex: Knex): Promise<any> {
  await knex.schema
    .dropTable("petition_sendout")
    .raw(/* sql */ `drop type petition_sendout_status;`);
}

export async function down(knex: Knex): Promise<any> {}
