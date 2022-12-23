import { Knex } from "knex";
import { timestamps } from "./helpers/timestamps";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("petition_list_view", (t) => {
    t.increments("id");
    t.integer("user_id").notNullable().references("user.id");
    t.string("name").notNullable();
    t.jsonb("data").notNullable();
    t.integer("position").notNullable();
    t.boolean("is_default").notNullable().defaultTo(false);
    timestamps(t);
  });

  await knex.raw(/* sql */ `
    -- view positions should not repeat on the same user_id
    alter table petition_list_view
      add constraint "petition_list_view__user_id__position" exclude (
        user_id with =,
        position with =
      ) where (deleted_at is null) deferrable initially deferred;

    -- to query all the user's views
    create index petition_list_view__user_id on "petition_list_view" ("user_id") where deleted_at is null;
  `);

  await knex.raw(/* sql */ `
    insert into petition_list_view(user_id, name, position, data, is_default, created_by, updated_by)
    select
      u.id as user_id,
      case
        when ud.details->>'preferredLocale' = 'es' then t.name_es
        when ud.details->>'preferredLocale' = 'en' then t.name_en
        when u.org_id in (11,130,180,209,215,218,221,265,297) then t.name_es
        else t.name_en
      end,
      t.position,
      t.data,
      false as is_default,
      'User:' || u.id as created_by,
      'User:' || u.id as updated_by
    from "user" u
    join user_data ud on u.user_data_id = ud.id
    join (values
      ('Ongoing', 'En curso', 0, '{"path": "/", "sort": null, "tags": null, "search": null, "status": ["COMPLETED", "PENDING"], "searchIn": "EVERYWHERE", "signature": null, "sharedWith": null, "fromTemplateId": null}'::jsonb),
      ('Closed', 'Cerrados', 1, '{"path": "/", "sort": null, "tags": null, "search": null, "status": ["CLOSED"], "searchIn": "EVERYWHERE", "signature": null, "sharedWith": null, "fromTemplateId": null}'::jsonb),
      ('Draft', 'Borradores', 2, '{"path": "/", "sort": null, "tags": null, "search": null, "status": ["DRAFT"], "searchIn": "EVERYWHERE", "signature": null, "sharedWith": null, "fromTemplateId": null}'::jsonb)
    ) as t(name_en, name_es, position, data) on 1 = 1;
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable("petition_list_view");
}
