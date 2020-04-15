import * as Knex from "knex";
import { timestamps } from "../../helpers/timestamps";

export async function up(knex: Knex): Promise<any> {
  const columns = [
    "created_at",
    "created_by",
    "updated_at",
    "updated_by",
    "deleted_at",
    "deleted_by",
  ];
  const settings = [
    "reminders_offset",
    "reminders_time",
    "reminders_timezone",
    "reminders_weekdays_only",
  ];
  return knex.schema
    .alterTable("petition", (t) => {
      columns.forEach((column) => t.renameColumn(column, `_${column}`));
    })
    .alterTable("petition", (t) => {
      t.boolean("reminders_active").notNullable().defaultTo(false);
      t.integer("reminders_offset");
      t.string("reminders_time", 5);
      t.string("reminders_timezone");
      t.boolean("reminders_weekdays_only");
      timestamps(t);
    })
    .raw(
      /* sql */ `
      update petition as p set
        ${columns.map((column) => `${column} = p._${column}`).join(", ")}
    `
    )
    .raw(
      /* sql */ `
      alter table petition add constraint petition_reminders_check check (
        (reminders_active and ${settings
          .map((s) => `${s} is not null`)
          .join(" and ")}) or (not reminders_active and ${settings
        .map((s) => `${s} is null`)
        .join(" and ")})
      )`
    )
    .alterTable("petition", (t) => {
      t.dropColumns(...columns.map((column) => `_${column}`));
    })

    .alterTable("petition_sendout", (t) => {
      columns.forEach((column) => t.renameColumn(column, `_${column}`));
    })
    .alterTable("petition_sendout", (t) => {
      t.dropColumn("reminder_settings");
      t.boolean("reminders_active").notNullable().defaultTo(false);
      t.integer("reminders_offset");
      t.string("reminders_time", 5);
      t.string("reminders_timezone");
      t.boolean("reminders_weekdays_only");
      timestamps(t);
    })
    .raw(
      /* sql */ `
      update petition_sendout as ps set
        ${columns.map((column) => `${column} = ps._${column}`).join(", ")}
    `
    )
    .raw(
      /* sql */ `
      alter table petition_sendout add constraint petition_sendout_reminders_check check (
        (reminders_active and ${settings
          .map((s) => `${s} is not null`)
          .join(" and ")}) or (not reminders_active and ${settings
        .map((s) => `${s} is null`)
        .join(" and ")})
      )`
    )
    .alterTable("petition_sendout", (t) => {
      t.dropColumns(...columns.map((column) => `_${column}`));
    });
}

export async function down(knex: Knex): Promise<any> {}
