import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `
    update petition_list_view 
    set "data" = data - 'tags' || jsonb_build_object('tagsFilters',
      case when "data"->'tags'= '[]'::jsonb then '{"filters":[{"operator":"IS_EMPTY","value":[]}],"operator":"AND"}'::jsonb
      when "data"->'tags' = 'null'::jsonb then 'null'::jsonb
      else jsonb_build_object(
        'filters', jsonb_build_array(
          jsonb_build_object(
            'operator', 'CONTAINS',
            'value', "data"->'tags'
          )
        ),
        'operator', 'AND'
      )
      end
    );
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `
    update petition_list_view set "data" = "data" - 'tagsFilters' || '{"tags": null}'::jsonb;
  `);
}
