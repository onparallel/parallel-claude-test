import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("petition_list_view", (t) => {
    t.enum("type", ["ALL", "CUSTOM"], { useNative: true, enumName: "petition_list_view_type" })
      .notNullable()
      .defaultTo("CUSTOM");
  });

  await knex.raw(/* sql */ `
    -- increase all view's positions in 1, so new "ALL" view can be inserted at position 0
    update petition_list_view set position = position + 1 where deleted_at is null;

    insert into petition_list_view (user_id, name, data, position, is_default, type)
    select 
      u.id,
      (case ud.preferred_locale when 'es' then 'Todo' else 'All' end),
      jsonb_build_object(
        'fromTemplateId', null,
        'path', '/',
        'search', null,
        'searchIn', 'EVERYWHERE',
        'sharedWith', null,
        'signature', null,
        'status', null,
        'tagsFilters', null,
        'sort', null
      ),
      0,
      false,
      'ALL'
    FROM "user" u left join user_data ud on ud.id = u.user_data_id where u.deleted_at is null and ud.deleted_at is null;  
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `
    delete from petition_list_view where type = 'ALL';    
  `);

  await knex.schema.alterTable("petition_list_view", (t) => {
    t.dropColumn("type");
  });

  await knex.raw(/* sql */ `
    drop type petition_list_view_type;
  `);
}
