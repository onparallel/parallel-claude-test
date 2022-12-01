import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.raw(/* sql */ `
    alter type task_name add value 'EXPORT_EXCEL';
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.from("task").where("name", "EXPORT_EXCEL").delete();

  await knex.raw(/* sql */ `
    alter type task_name rename to task_name_old;
    create type task_name as enum ('PRINT_PDF', 'EXPORT_REPLIES');
    
    alter table task alter column "name" type task_name using "name"::varchar::task_name;
    drop type task_name_old;
  `);
}
