import { Knex } from "knex";

export async function addAiCompletionLogType(knex: Knex, name: string) {
  await knex.schema.raw(/* sql */ `
    alter type "ai_completion_log_type" add value '${name}';
  `);
}

export async function removeAiCompletionLogType(knex: Knex, name: string) {
  const { rows } = await knex.raw<{
    rows: { log_type: string }[];
  }>(/* sql */ `
    select unnest(enum_range(null::ai_completion_log_type)) as log_type;
  `);

  await knex.raw(/* sql */ `
    alter type ai_completion_log_type rename to ai_completion_log_type_old;
    create type ai_completion_log_type as enum (${rows
      .map((r) => r.log_type)
      .filter((f) => f !== name)
      .map((f) => `'${f}'`)
      .join(",")});

    delete from "ai_completion_log" where "type" = '${name}';
    alter table "ai_completion_log" alter column "type" type ai_completion_log_type using "type"::varchar::ai_completion_log_type;
    drop type ai_completion_log_type_old;
  `);
}
