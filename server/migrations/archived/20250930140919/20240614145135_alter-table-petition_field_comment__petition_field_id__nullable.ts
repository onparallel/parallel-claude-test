import type { Knex } from "knex";
import { PetitionEvent, PetitionFieldComment } from "../src/db/__types";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("petition_field_comment", (t) => {
    t.integer("petition_field_id").nullable().alter();
  });

  await knex.raw(/* sql */ `
    -- add missing "where deleted_at is null" to index
    create index petition_field_comment__petition_id__petition_field_id 
      on petition_field_comment (petition_id, petition_field_id) 
      where deleted_at is null;

    drop index pfc__petition_id__petition_field_id;
  `);
}

export async function down(knex: Knex): Promise<void> {
  const { rows: comments } = await knex.raw<{ rows: PetitionFieldComment[] }>(/* sql */ `
    select * from petition_field_comment where petition_field_id is null
  `);

  if (comments.length > 0) {
    const commentIds = comments.map((c) => c.id).join(",");

    const { rows: events } = await knex.raw<{ rows: PetitionEvent[] }>(/* sql */ `
    select * from petition_event where type = 'COMMENT_PUBLISHED' or type = 'COMMENT_DELETED'
      and (data->>'petition_field_comment_id')::int in (${commentIds})
  `);

    await knex.raw(/* sql */ `
    delete from petition_user_notification where type = 'COMMENT_CREATED'
      and (data->>'petition_field_comment_id')::int in (${commentIds});

    delete from petition_contact_notification where type = 'COMMENT_CREATED'
      and (data->>'petition_field_comment_id')::int in (${commentIds});

    delete from user_petition_event_log where petition_event_id in (${events.map((e) => e.id).join(",")});

    delete from petition_event where id in (${events.map((e) => e.id).join(",")});

    delete from petition_field_comment where petition_field_id is null;
  `);
  }

  await knex.schema.alterTable("petition_field_comment", (t) => {
    t.integer("petition_field_id").notNullable().alter();
  });

  await knex.raw(/* sql */ `
    create index pfc__petition_id__petition_field_id 
      on petition_field_comment (petition_id, petition_field_id);

    drop index petition_field_comment__petition_id__petition_field_id;
  `);
}
