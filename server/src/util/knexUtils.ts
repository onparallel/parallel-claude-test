import Knex from "knex";

export async function deleteAllData(knex: Knex) {
  return await knex.raw(`
    do
    $$
    declare
      l_stmt text;
    begin
      select 'truncate ' || string_agg(format('%I.%I', schemaname, tablename), ',')
        into l_stmt
      from pg_tables
      where schemaname in ('public') and tablename not in ('migrations', 'migrations_lock');
    
      execute l_stmt;
    end;
    $$
  `);
}
