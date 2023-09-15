import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("petition", (t) => {
    t.timestamp("last_activity_at").nullable().defaultTo(null);
    t.timestamp("last_recipient_activity_at").nullable().defaultTo(null);
  });

  // update petition columns with latest event dates
  await knex.raw(/* sql */ `
    with last_petition_events as (
      select petition_id, max(created_at) last_activity_at
      from petition_event
      where type in (
        'PETITION_CREATED',
        'ACCESS_ACTIVATED',
        'ACCESS_OPENED',
        'REPLY_CREATED',
        'REPLY_UPDATED',
        'REPLY_DELETED',
        'ACCESS_DELEGATED',
        'PETITION_COMPLETED',
        'COMMENT_PUBLISHED',
        'REPLY_STATUS_CHANGED',
        'SIGNATURE_STARTED',
        'SIGNATURE_OPENED',
        'SIGNATURE_COMPLETED',
        'SIGNATURE_CANCELLED',
        'REMINDER_SENT',
        'PETITION_CLOSED_NOTIFIED',
        'PETITION_CLOSED',
        'PETITION_REOPENED',
        'RECIPIENT_SIGNED',
        'REMINDERS_OPT_OUT'
      )
      group by petition_id
    ),
    last_recipient_events as (
      select petition_id, max(created_at) last_recipient_activity_at
      from petition_event
      where type in (
        'ACCESS_OPENED',
        'ACCESS_DELEGATED',
        'SIGNATURE_OPENED',
        'SIGNATURE_COMPLETED',
        'RECIPIENT_SIGNED',
        'REMINDERS_OPT_OUT',
        'PETITION_CLOSED'
      )
      or (
        type in (
          'REPLY_CREATED',
          'REPLY_UPDATED',
          'REPLY_DELETED',
          'PETITION_COMPLETED'
        )
        and data->>'petition_access_id' is not null
      )
      or (
        type = 'COMMENT_PUBLISHED'
        and exists (
            select id from petition_field_comment
            where id = (data->>'petition_field_comment_id')::int
            and petition_access_id is not null
        )
      )
      or (
        type = 'SIGNATURE_CANCELLED'
        and "data"->>'cancel_reason' = 'DECLINED_BY_SIGNER'
      )
      group by petition_id
    )
    update petition
    set 
      last_activity_at = lpe.last_activity_at,
      last_recipient_activity_at = lre.last_recipient_activity_at
    from last_petition_events lpe 
    left join last_recipient_events lre on lpe.petition_id = lre.petition_id 
    where id = lpe.petition_id;
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("petition", (t) => {
    t.dropColumns("last_activity_at", "last_recipient_activity_at");
  });
}
