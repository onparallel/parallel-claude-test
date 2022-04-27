import { Knex } from "knex";

export async function addTaskName(knex: Knex, name: string) {
  await knex.schema.raw(/* sql */ `
    alter type "task_name" add value '${name}';
  `);
}

export async function removeTaskName(knex: Knex, name: string) {
  const { rows } = await knex.raw<{
    rows: { task_name: string }[];
  }>(/* sql */ `
    select unnest(enum_range(null::task_name)) as task_name;
  `);

  await knex.raw(/* sql */ `
    alter type task_name rename to task_name_old;
    create type task_name as enum (${rows
      .map((r) => r.task_name)
      .filter((f) => f !== name)
      .map((f) => `'${f}'`)
      .join(",")});

    delete from "task" where "name" = '${name}';
    alter table "task" alter column "name" type task_name using "name"::varchar::task_name;
    drop type task_name_old;
  `);
}
