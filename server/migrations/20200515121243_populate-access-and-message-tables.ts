import { Knex } from "knex";
import { groupBy, sortBy, pick, indexBy } from "remeda";

type Maybe<T> = T | null;

interface PetitionSendout {
  id: number;
  petition_id: number;
  contact_id: number;
  sender_id: number;
  keycode: string;
  email_subject: Maybe<string>;
  email_body: Maybe<string>;
  status: "SCHEDULED" | "CANCELLED" | "PROCESSING" | "ACTIVE" | "INACTIVE";
  scheduled_at: Maybe<Date>;
  email_log_id: Maybe<number>;
  next_reminder_at: Maybe<Date>;
  reminders_active: boolean;
  reminders_offset: Maybe<number>;
  reminders_time: Maybe<string>;
  reminders_timezone: Maybe<string>;
  reminders_weekdays_only: Maybe<boolean>;
  reminders_left: number;
  created_at: Date;
  created_by: Maybe<string>;
  updated_at: Date;
  updated_by: Maybe<string>;
  deleted_at: Maybe<Date>;
  deleted_by: Maybe<string>;
}

interface PetitionAccess {
  id: number;
  petition_id: number;
  granter_id: number;
  contact_id: number;
  keycode: string;
  status: "ACTIVE" | "INACTIVE";
  next_reminder_at: Maybe<Date>;
  reminders_active: boolean;
  reminders_config: Maybe<any>;
  reminders_left: number;
  created_at: Date;
  created_by: Maybe<string>;
  updated_at: Date;
  updated_by: Maybe<string>;
}

interface PetitionMessage {
  id: number;
  petition_id: number;
  petition_access_id: number;
  sender_id: number;
  email_subject: Maybe<string>;
  email_body: Maybe<string>;
  status: "SCHEDULED" | "CANCELLED" | "PROCESSING" | "PROCESSED";
  scheduled_at: Maybe<Date>;
  email_log_id: Maybe<number>;
  created_at: Date;
  created_by: Maybe<string>;
}

interface PetitionReminder {
  id: number;
  petition_sendout_id: number;
  email_log_id: Maybe<number>;
  type: "MANUAL" | "AUTOMATIC";
  status: "PROCESSING" | "PROCESSED";
  created_at: Date;
  created_by: Maybe<string>;
  sender_id: Maybe<number>;
  petition_access_id: Maybe<number>;
}

export async function up(knex: Knex): Promise<any> {
  const sendouts = await knex<PetitionSendout>("petition_sendout").orderBy(
    "id"
  );
  if (sendouts.length > 0) {
    const groups = groupBy(sendouts, (s) => `${s.petition_id},${s.contact_id}`);
    // create accesses
    const _accesses: Omit<PetitionAccess, "id">[] = Object.values(groups)
      .map(sortBy((s) => s.created_at))
      .map((group) => {
        const first = group[0];
        const last = group[group.length - 1];
        return {
          petition_id: first.petition_id,
          contact_id: first.contact_id,
          granter_id: last.sender_id,
          status: "ACTIVE",
          reminders_left: 0,
          reminders_active: false,
          reminders_config: null,
          next_reminder_at: null,
          ...pick(first, [
            "created_at",
            "created_by",
            "updated_at",
            "updated_by",
          ]),
          ...pick(last, ["keycode"]),
        };
      });

    const accesses = await knex<PetitionAccess>("petition_access").insert(
      _accesses,
      "*"
    );

    const indexed = indexBy(
      accesses,
      (a) => `${a.petition_id},${a.contact_id}`
    );

    const _messages: Omit<PetitionMessage, "id">[] = sendouts.map((s) => {
      const access = indexed[`${s.petition_id},${s.contact_id}`];
      return {
        petition_access_id: access.id,
        status:
          s.status === "SCHEDULED"
            ? "SCHEDULED"
            : s.status === "CANCELLED"
            ? "CANCELLED"
            : "PROCESSED",
        ...pick(s, [
          "petition_id",
          "sender_id",
          "email_log_id",
          "email_subject",
          "email_body",
          "scheduled_at",
          "created_at",
          "created_by",
        ]),
      };
    });
    await knex<PetitionMessage>("petition_message").insert(_messages);
    await knex.raw(/* sql */ `
    update petition_reminder as pr
      set
        petition_access_id = map.petition_access_id,
        created_by = case pr.type
            when 'AUTOMATIC' then concat('PetitionAccess:', map.petition_access_id)
            else pr.created_by
          end
    from (values
      ${sendouts
        .map((s) => {
          const access = indexed[`${s.petition_id},${s.contact_id}`];
          return `(${s.id}, ${access.id})`;
        })
        .join(",")}
    ) as map(petition_sendout_id, petition_access_id)
    where
      pr.petition_sendout_id = map.petition_sendout_id
  `);
    await knex.raw(/* sql */ `
    update petition_field_reply as pfr
      set
        petition_access_id = map.petition_access_id
    from (values
      ${sendouts
        .map((s) => {
          const access = indexed[`${s.petition_id},${s.contact_id}`];
          return `(${s.id}, ${access.id})`;
        })
        .join(",")}
    ) as map(petition_sendout_id, petition_access_id)
    where
      pfr.petition_sendout_id = map.petition_sendout_id
  `);
  }
  // ...
  await knex.raw(/* sql */ `
    alter table petition_reminder
      alter column petition_access_id set not null;
  `);
  await knex.raw(/* sql */ `
    alter table petition_field_reply
      alter column petition_access_id set not null;
  `);
}

export async function down(knex: Knex): Promise<any> {
  await knex.raw(/* sql */ `
    alter table petition_reminder
      alter column petition_access_id drop not null;
  `);
  await knex.raw(/* sql */ `
    alter table petition_field_reply
      alter column petition_access_id drop not null;
  `);
  await knex.raw(/* sql */ `
    update petition_reminder
      set
        created_by = concat('PetitionSendout:', petition_sendout_id)
      where type = 'AUTOMATIC'
  `);
  await knex<PetitionReminder>("petition_reminder").update(
    "petition_access_id",
    null
  );
  await knex<PetitionReminder>("petition_field_reply").update(
    "petition_access_id",
    null
  );
  await knex("petition_message").delete();
  await knex("petition_access").delete();
}
