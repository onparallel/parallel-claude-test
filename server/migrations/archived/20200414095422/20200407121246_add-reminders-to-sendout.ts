import * as Knex from "knex";
import { timestamps } from "../../helpers/timestamps";

export async function up(knex: Knex): Promise<any> {
  const columns = [
    "scheduled_at",
    "schedule_data",
    "active",
    "email_log_id",
    "created_at",
    "created_by",
    "updated_at",
    "updated_by",
    "deleted_at",
    "deleted_by",
  ];
  return knex.schema
    .alterTable("petition_sendout", (t) => {
      columns.forEach((column) => t.renameColumn(column, `_${column}`));

      t.dropForeign(["email_log_id"]);
    })
    .alterTable("petition_sendout", (t) => {
      t.enum(
        "status",
        ["SCHEDULED", "CANCELLED", "PROCESSING", "ACTIVE", "INACTIVE"],
        { useNative: true, enumName: "petition_sendout_status" }
      ); //.notNullable();
      t.timestamp("scheduled_at");
      t.integer("email_log_id");
      t.timestamp("next_reminder_at");
      t.json("reminder_settings");
      timestamps(t);

      t.foreign("email_log_id").references("email_log.id");
    })
    .raw(
      /* sql */ `
      update petition_sendout as ps set
        status = 'ACTIVE',
        ${columns
          .filter((column) => !["schedule_data", "active"].includes(column))
          .map((column) => `${column} = ps._${column}`)
          .join(", ")}
    `
    )
    .raw(
      /* sql */ `
      alter table "petition_sendout" alter column "status" set not null;
    `
    )
    .alterTable("petition_sendout", (t) => {
      t.dropColumns(...columns.map((column) => `_${column}`));
    });
}

export async function down(knex: Knex): Promise<any> {}
