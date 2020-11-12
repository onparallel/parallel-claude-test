import * as Knex from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.raw(/* sql */ `
    alter type "petition_event_type" add value 'SIGNATURE_STARTED';
    alter type "petition_event_type" add value 'SIGNATURE_COMPLETED';
    alter type "petition_event_type" add value 'SIGNATURE_CANCELLED';
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `
      alter type petition_event_type rename to petition_event_type_old;
      create type petition_event_type as enum (
        'PETITION_CREATED',
        'PETITION_COMPLETED',
        'ACCESS_ACTIVATED',
        'ACCESS_DEACTIVATED',
        'ACCESS_OPENED',
        'MESSAGE_SCHEDULED',
        'MESSAGE_CANCELLED',
        'MESSAGE_SENT',
        'REMINDER_SENT',
        'REPLY_CREATED',
        'REPLY_DELETED',
        'COMMENT_PUBLISHED',
        'COMMENT_DELETED',
        'USER_PERMISSION_ADDED',
        'USER_PERMISSION_REMOVED',
        'USER_PERMISSION_EDITED',
        'OWNERSHIP_TRANSFERRED',
        'PETITION_CLOSED',
        'PETITION_CLOSED_NOTIFIED',
        'PETITION_REOPENED'
      );
      alter table petition_event alter column "type" type petition_event_type using "type"::varchar::petition_event_type;
      drop type petition_event_type_old;
    `);
}
