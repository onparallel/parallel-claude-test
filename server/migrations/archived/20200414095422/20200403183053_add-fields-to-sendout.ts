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
  return knex.schema
    .alterTable("petition_sendout", (t) => {
      columns.forEach((column) => t.renameColumn(column, `_${column}`));
    })
    .alterTable("petition_sendout", (t) => {
      t.string("email_subject");
      t.text("email_body");
      t.string("locale", 10); //.notNullable();
      t.timestamp("deadline");
      t.timestamp("scheduled_at");
      t.text("schedule_data");
      t.boolean("active"); //.notNullable();
      t.integer("email_log_id");
      timestamps(t);

      t.foreign("email_log_id").references("email_log.id");
    })
    .raw(
      /* sql */ `
      update petition_sendout as ps set
        email_subject = p.email_subject,
        email_body = p.email_body,
        locale = p.locale,
        deadline = p.deadline,
        active = true,
        ${columns.map((column) => `${column} = ps._${column}`).join(", ")}
      from petition as p
        where ps.petition_id = p.id
    `
    )
    .raw(
      /* sql */ `
      alter table "petition_sendout" alter column "locale" set not null;
      alter table "petition_sendout" alter column "active" set not null;
    `
    )
    .alterTable("petition_sendout", (t) => {
      t.dropColumns(...columns.map((column) => `_${column}`));
    });
}

export async function down(knex: Knex): Promise<any> {
  return knex.schema.alterTable("petition_sendout", (t) => {
    t.dropColumn("email_subject");
    t.dropColumn("email_body");
    t.dropColumn("locale");
    t.dropColumn("deadline");
    t.dropColumn("scheduled_at");
    t.dropColumn("schedule_data");
    t.dropColumn("active");
    t.dropColumn("email_log_id");
  });
}
