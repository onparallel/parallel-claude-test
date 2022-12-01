import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("petition_field_comment", (t) => {
    t.jsonb("content_json");
  });
  await knex.raw(/* sql */ `
    do $$
    declare
      cur cursor for select * from petition_field_comment order by id for update;
      row record;
      x text;
    begin
      open cur;
      loop
        fetch cur INTO row;
        exit when not found;
        update petition_field_comment
        set content_json = case
          when anonymized_at is null then
            concat(
              '[',
              array_to_string(array(
                select concat('{"type":"paragraph","children":[{"text":', to_jsonb(unnest(regexp_split_to_array(row.content, '\n'))), '}]}')
              ), ','),
              ']'
            )::jsonb
          else null end
        where current of cur;
      end loop;
    end;
    $$;
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("petition_field_comment", (t) => {
    t.dropColumn("content_json");
  });
}
