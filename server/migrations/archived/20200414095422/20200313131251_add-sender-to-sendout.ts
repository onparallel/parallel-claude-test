import { Knex } from "knex";
import { timestamps } from "../../helpers/timestamps";

export async function up(knex: Knex): Promise<any> {
  return knex.schema
    .raw(
      `alter table "petition_field_reply" drop constraint "petition_field_reply_petition_access_id_foreign"`
    )
    .raw(
      `alter table "petition_event_log" drop constraint "petition_event_log_petition_access_id_foreign"`
    )
    .raw(`alter table "petition_sendout" rename to "petition_sendout_old"`)
    .createTable("petition_sendout", (t) => {
      t.increments("id");
      t.integer("petition_id").notNullable();
      t.integer("contact_id").notNullable();
      t.integer("sender_id").notNullable();
      t.string("keycode").notNullable();
      timestamps(t);

      t.unique(["keycode"]);
      t.foreign("petition_id").references("petition.id");
    })
    .raw(
      `
      insert into petition_sendout
        select ps.id, ps.petition_id, ps.contact_id, p.owner_id as sender_id,
            ps.keycode, ps.created_at, ps.created_by, ps.updated_at, ps.updated_by,
            ps.deleted_at, ps.deleted_by
          from petition_sendout_old as ps
          join petition as p on p.id = ps.petition_id;
    `
    )
    .raw(
      `
      select setval('petition_sendout_id_seq', max("id")) from "petition_sendout"
    `
    )
    .alterTable("petition_field_reply", (t) => {
      t.foreign("petition_sendout_id").references("petition_sendout.id");
    })
    .alterTable("petition_event_log", (t) => {
      t.foreign("petition_sendout_id").references("petition_sendout.id");
    })
    .dropTable("petition_sendout_old");
}

export async function down(knex: Knex): Promise<any> {}
